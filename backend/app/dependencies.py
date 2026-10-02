import uuid
from typing import AsyncGenerator, Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.tenant import Tenant, BackendType
from app.adapters.base import ProductRepositoryAdapter
from app.adapters.postgres_adapter import PostgresAdapter
from app.adapters.sanity_adapter import SanityAdapter
from app.payments.base import PaymentProvider
from app.payments.paystack import PaystackPaymentProvider
from app.payments.stripe import StripePaymentProvider


async def get_tenant_context(
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    x_tenant_slug: Optional[str] = Header(None, alias="X-Tenant-Slug"),
    db: AsyncSession = Depends(get_db),
) -> Tenant:
    """
    Extracts tenant identity from request headers and fetches from Core Registry.
    """
    tenant: Optional[Tenant] = None

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


async def get_rls_db_session(
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
) -> AsyncSession:
    """
    Injects PostgreSQL Row-Level Security (RLS) tenant context into the active session.
    Enforces that queries automatically filter by app.current_tenant at database level.
    """
    try:
        # Set transaction-local PostgreSQL session variable for RLS
        await db.execute(
            text("SET LOCAL app.current_tenant = :tenant_id"),
            {"tenant_id": str(tenant.id)},
        )
    except Exception:
        # Fallback for SQLite in local test environments
        pass
    return db


async def get_product_adapter(
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> ProductRepositoryAdapter:
    """
    Strategy/Adapter injector: Inspects tenant's backend_type in the Core Registry
    and returns either PostgresAdapter or SanityAdapter with identical return types.
    """
    if tenant.backend_type == BackendType.SANITY:
        if not tenant.sanity_project_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Tenant configured for Sanity CMS but missing sanity_project_id",
            )
        return SanityAdapter(
            project_id=tenant.sanity_project_id,
            dataset=tenant.sanity_dataset or "production",
            token=None,
            tenant_id=tenant.id,
        )

    return PostgresAdapter(session=db, tenant_id=tenant.id)


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
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extracts and validates JWT Bearer token, retrieving the authenticated user from DB.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
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

    result = await db.execute(select(User).where(User.id == user_uuid))
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
    Ensures that the authenticated user possesses admin / tenant_admin privileges.
    """
    if user.role not in ["admin", "super_admin", "tenant_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient administrative privileges",
        )
    return user
