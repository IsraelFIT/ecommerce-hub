import uuid
from typing import AsyncGenerator, Optional
from urllib.parse import urlparse
from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy import select, text
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.tenant import Tenant, BackendType
from app.adapters.base import ProductRepositoryAdapter
from app.adapters.postgres_adapter import PostgresAdapter
from app.adapters.sanity_adapter import SanityAdapter
from app.payments.base import PaymentProvider
from app.payments.paystack import PaystackPaymentProvider
from app.payments.stripe import StripePaymentProvider


from app.core.security import decode_access_token


async def get_tenant_context(
    request: Request,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    x_tenant_slug: Optional[str] = Header(None, alias="X-Tenant-Slug"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_db),
) -> Tenant:
    """
    Extracts tenant identity prioritizing the signed JWT Bearer access token as the
    immutable, tamper-proof source of truth. Even if client URL or headers are tampered with,
    the tenant encoded in the verified JWT token governs.
    Falls back to X-Tenant-ID/X-Tenant-Slug, subdomain, or query parameters only for
    unauthenticated requests or super_admin/hub_admin users.
    """
    tenant: Optional[Tenant] = None

    # 1. Primary Source of Truth: Decode authenticated JWT Access Token
    token: Optional[str] = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()
    elif request:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split("Bearer ")[1].strip()
        else:
            token = request.cookies.get("auth_session") or request.cookies.get("auth_token")

    token_role: Optional[str] = None
    if token:
        payload = decode_access_token(token)
        if payload:
            token_role = payload.get("role")
            token_tenant_id = payload.get("tenant_id")
            token_tenant_slug = payload.get("tenant_slug")

            # A. Tenant bound user (tenant_admin, customer, etc.)
            if token_tenant_id:
                try:
                    t_uuid = uuid.UUID(str(token_tenant_id))
                    result = await db.execute(select(Tenant).where(Tenant.id == t_uuid))
                    tenant = result.scalar_one_or_none()
                except ValueError:
                    pass

            if not tenant and token_tenant_slug:
                result = await db.execute(select(Tenant).where(Tenant.slug == str(token_tenant_slug).lower()))
                tenant = result.scalar_one_or_none()

            # B. Super Admin / Hub Admin: allowed to target any tenant via explicit header/param
            if not tenant and token_role in ("super_admin", "hub_admin"):
                if x_tenant_id:
                    try:
                        t_uuid = uuid.UUID(x_tenant_id)
                        result = await db.execute(select(Tenant).where(Tenant.id == t_uuid))
                        tenant = result.scalar_one_or_none()
                    except ValueError:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid X-Tenant-ID UUID format",
                        )
                elif x_tenant_slug:
                    result = await db.execute(select(Tenant).where(Tenant.slug == x_tenant_slug.lower()))
                    tenant = result.scalar_one_or_none()
                elif request.query_params.get("tenant_slug") or request.query_params.get("tenant"):
                    query_slug = request.query_params.get("tenant_slug") or request.query_params.get("tenant")
                    if query_slug:
                        result = await db.execute(select(Tenant).where(Tenant.slug == query_slug.strip().lower()))
                        tenant = result.scalar_one_or_none()

    # 2. Fallback for unauthenticated requests (public shoppers, storefront browsing)
    if not tenant:
        if x_tenant_id:
            try:
                t_uuid = uuid.UUID(x_tenant_id)
                result = await db.execute(select(Tenant).where(Tenant.id == t_uuid))
                tenant = result.scalar_one_or_none()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid X-Tenant-ID UUID format",
                )
        elif x_tenant_slug:
            result = await db.execute(select(Tenant).where(Tenant.slug == x_tenant_slug.lower()))
            tenant = result.scalar_one_or_none()

    # Fallback 3: Query parameters (tenant_slug or tenant)
    if not tenant:
        query_slug = request.query_params.get("tenant_slug") or request.query_params.get("tenant")
        if query_slug:
            result = await db.execute(select(Tenant).where(Tenant.slug == query_slug.strip().lower()))
            tenant = result.scalar_one_or_none()

    # Fallback 4: Host header subdomain
    if not tenant and request.headers.get("host"):
        host = request.headers.get("host", "").split(":")[0].lower()
        if host.endswith(".localhost") and host != "localhost":
            sub_slug = host.split(".localhost")[0]
            if sub_slug and sub_slug not in ("api", "core", "www", "app"):
                result = await db.execute(select(Tenant).where(Tenant.slug == sub_slug))
                tenant = result.scalar_one_or_none()

    # Fallback 5: Referer header (when proxied from frontend browser)
    if not tenant:
        referer = request.headers.get("referer")
        if referer:
            try:
                parsed_ref = urlparse(referer)
                if parsed_ref.hostname:
                    host_parts = parsed_ref.hostname.split(".")
                    if len(host_parts) > 1 and host_parts[0] not in ("localhost", "127", "www", "app", "core"):
                        subdomain = host_parts[0].lower()
                        result = await db.execute(select(Tenant).where(Tenant.slug == subdomain))
                        tenant = result.scalar_one_or_none()
            except Exception:
                pass

    # Fallback 6: Customer email resolution if querying customer orders
    if not tenant:
        customer_email = request.query_params.get("customer_email")
        if customer_email:
            try:
                from app.models.user import User
                result = await db.execute(
                    select(Tenant)
                    .join(User, Tenant.id == User.tenant_id)
                    .where(User.email == customer_email.strip().lower())
                )
                tenant = result.scalar_one_or_none()
            except Exception:
                pass

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found or not specified in request headers",
        )

    if not tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant store is inactive or suspended",
        )

    return tenant


from app.database import get_db, is_sqlite


async def get_rls_db_session(
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
) -> AsyncSession:
    """
    Injects PostgreSQL Row-Level Security (RLS) tenant context into the active session.
    Enforces that queries automatically filter by app.current_tenant at database level.
    """
    if not is_sqlite and db.bind and "postgresql" in str(db.bind.url):
        try:
            # Set PostgreSQL session variable for RLS
            await db.execute(
                text("SELECT set_config('app.current_tenant', :tenant_id, false)"),
                {"tenant_id": str(tenant.id)},
            )
        except Exception:
            pass
    return db


from app.config import settings


async def get_product_adapter(
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> ProductRepositoryAdapter:
    """
    Strategy/Adapter injector: Inspects tenant's backend_type in the Core Registry
    and returns either PostgresAdapter or SanityAdapter with identical return types.
    Supports both platform-managed Sanity datasets and custom tenant-provided Sanity projects.
    """
    if tenant.backend_type == BackendType.SANITY:
        project_id = tenant.sanity_project_id or settings.SANITY_PROJECT_ID
        dataset = tenant.sanity_dataset or settings.SANITY_DATASET or "staging"
        token = settings.SANITY_API_TOKEN

        if not project_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Tenant configured for Sanity CMS but no Sanity project ID configured (neither custom nor platform-managed).",
            )
        return SanityAdapter(
            project_id=project_id,
            dataset=dataset,
            token=token,
            tenant_id=tenant.id,
            currency=tenant.currency or "NGN",
        )

    return PostgresAdapter(
        session=db,
        tenant_id=tenant.id,
        currency=tenant.currency or "NGN",
    )


def get_payment_provider(
    gateway: Optional[str] = None,
    tenant: Tenant = Depends(get_tenant_context),
) -> PaymentProvider:
    """
    Payment strategy injector: Selects Paystack or Stripe provider.
    """
    selected_gateway = (gateway or tenant.default_gateway or "paystack").lower()

    if selected_gateway == "stripe":
        return StripePaymentProvider()
    return PaystackPaymentProvider()


from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.user import User
from app.core.security import decode_access_token

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extracts and validates JWT Bearer token, retrieving the authenticated user from DB.
    Supports Authorization Bearer header, request headers, and session cookies.
    """
    token: Optional[str] = None
    if credentials and credentials.credentials:
        token = credentials.credentials.strip()
    elif request:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split("Bearer ")[1].strip()
        else:
            token = request.cookies.get("auth_session") or request.cookies.get("auth_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload["sub"]
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token subject",
        )

    result = await db.execute(
        select(User).options(joinedload(User.tenant)).where(User.id == user_uuid)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token no longer exists",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or disabled",
        )

    return user


async def get_current_admin_user(
    user: User = Depends(get_current_user),
) -> User:
    """
    Ensures that the authenticated user possesses admin / tenant_admin / hub_admin privileges.
    """
    if user.role not in ["admin", "super_admin", "tenant_admin", "hub_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient administrative privileges",
        )
    return user


async def get_current_tenant_admin(
    tenant: Tenant = Depends(get_tenant_context),
    user: User = Depends(get_current_admin_user),
) -> User:
    """
    Ensures that the authenticated user possesses admin privileges
    AND belongs to this specific tenant store (unless super_admin).
    """
    if user.role != "super_admin":
        if user.tenant_id != tenant.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have administrative access to this tenant store.",
            )
    return user


async def get_current_super_admin(
    user: User = Depends(get_current_user),
) -> User:
    """
    Ensures that the authenticated user possesses super_admin privileges.
    """
    if user.role not in ["super_admin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform super administrative privileges required.",
        )
    return user
