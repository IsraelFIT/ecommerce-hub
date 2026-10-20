import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.models.review import Review
from app.models.order import Order, OrderStatus
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse
from app.schemas.response import success_response, PaginationMeta, ApiResponse, PaginatedData, ErrorResponse
from app.services.provisioning import provision_new_tenant

router = APIRouter(
    prefix="/tenants",
    tags=["Tenants"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        404: {"model": ErrorResponse, "description": "Tenant Not Found"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
    },
)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[TenantResponse],
    summary="Provision a new tenant store",
    description="Provisions a new store and registers it in the Core Registry with dedicated database/CMS configurations.",
)
async def create_tenant(
    tenant_in: TenantCreate,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    existing_slug = await db.execute(
        select(Tenant).where(Tenant.slug == tenant_in.slug.lower())
    )
    if existing_slug.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Storefront subdomain '{tenant_in.slug}' is already taken.",
        )

    tenant = await provision_new_tenant(db, tenant_in)
    return success_response(
        data=TenantResponse.model_validate(tenant).model_dump(mode="json"),
        message="Store provisioned successfully",
    )


@router.get(
    "/by-slug/{slug}",
    response_model=ApiResponse[TenantResponse],
    summary="Resolve tenant storefront configuration by subdomain slug",
    description="Retrieves tenant branding, theme tokens and payment routing config by slug (called by Edge proxy / storefront).",
)
async def get_tenant_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    result = await db.execute(
        select(Tenant).where(Tenant.slug == slug.lower())
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant '{slug}' not found or does not exist",
        )
    return success_response(
        data=TenantResponse.model_validate(tenant).model_dump(mode="json"),
        message="Tenant details retrieved successfully",
    )


@router.patch(
    "/by-slug/{slug}",
    response_model=ApiResponse[TenantResponse],
    summary="Update tenant store settings by slug",
)
async def update_tenant_by_slug(
    slug: str,
    tenant_update: TenantUpdate,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    result = await db.execute(
        select(Tenant).where(Tenant.slug == slug.lower(), Tenant.is_deleted == False)
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant '{slug}' not found or does not exist",
        )

    update_dict = tenant_update.model_dump(exclude_unset=True)
    if "branding_config" in update_dict and update_dict["branding_config"]:
        update_dict["branding_config"] = tenant_update.branding_config.model_dump()

    for key, value in update_dict.items():
        setattr(tenant, key, value)

    await db.commit()
    await db.refresh(tenant)
    return success_response(
        data=TenantResponse.model_validate(tenant).model_dump(mode="json"),
        message="Tenant settings updated successfully",
    )


@router.get(
    "/{tenant_id}",
    response_model=ApiResponse[TenantResponse],
    summary="Get tenant by UUID",
)
async def get_tenant(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id, Tenant.is_deleted == False)
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found or does not exist",
        )
    return success_response(
        data=TenantResponse.model_validate(tenant).model_dump(mode="json"),
        message="Tenant details retrieved successfully",
    )


@router.patch(
    "/{tenant_id}",
    response_model=ApiResponse[TenantResponse],
    summary="Update tenant store settings",
)
async def update_tenant(
    tenant_id: uuid.UUID,
    tenant_update: TenantUpdate,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id, Tenant.is_deleted == False)
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found or does not exist",
        )

    update_dict = tenant_update.model_dump(exclude_unset=True)
    if "branding_config" in update_dict and update_dict["branding_config"]:
        update_dict["branding_config"] = tenant_update.branding_config.model_dump()

    for key, value in update_dict.items():
        setattr(tenant, key, value)

    await db.commit()
    await db.refresh(tenant)
    return success_response(
        data=TenantResponse.model_validate(tenant).model_dump(mode="json"),
        message="Tenant settings updated successfully",
    )


@router.get(
    "/",
    response_model=ApiResponse[PaginatedData[TenantResponse]],
    summary="List all platform tenants (Super-admin)",
)
async def list_tenants(
    page: int = 1,
    per_page: int = 15,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    offset = (page - 1) * per_page

    total_query = await db.execute(select(func.count(Tenant.id)))
    total = total_query.scalar() or 0

    result = await db.execute(select(Tenant).offset(offset).limit(per_page))
    tenants = result.scalars().all()

    last_page = max(1, (total + per_page - 1) // per_page)
    pagination = PaginationMeta(
        current_page=page,
        last_page=last_page,
        per_page=per_page,
        total=total,
    )

    items = [TenantResponse.model_validate(t).model_dump(mode="json") for t in tenants]
    return success_response(
        data={"items": items},
        pagination=pagination,
        message="Tenants retrieved successfully",
    )


@router.get(
    "/{slug_or_id}/stats",
    summary="Get tenant live statistics for seller profile",
)
async def get_tenant_seller_stats(
    slug_or_id: str,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    tenant = None
    try:
        t_uuid = uuid.UUID(slug_or_id)
        res = await db.execute(select(Tenant).where(Tenant.id == t_uuid))
        tenant = res.scalar_one_or_none()
    except ValueError:
        pass

    if not tenant:
        res = await db.execute(select(Tenant).where(Tenant.slug == slug_or_id.lower()))
        tenant = res.scalar_one_or_none()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    # 1. Rating & Reviews count
    review_query = select(
        func.coalesce(func.avg(Review.rating), 5.0),
        func.count(Review.id),
    ).where(Review.tenant_id == tenant.id, Review.status == "approved")
    r_res = await db.execute(review_query)
    avg_rating, total_reviews = r_res.first() or (5.0, 0)

    # 2. Orders fulfilled
    order_query = select(func.count(Order.id)).where(
        Order.tenant_id == tenant.id,
        Order.status.in_([OrderStatus.FULFILLED, OrderStatus.PAID]),
    )
    o_res = await db.execute(order_query)
    orders_fulfilled = o_res.scalar() or 0

    # 3. Member since year
    member_since = tenant.created_at.year if tenant.created_at else 2024

    return success_response(
        data={
            "rating": round(float(avg_rating or 5.0), 1),
            "review_count": int(total_reviews or 0),
            "orders_fulfilled": int(orders_fulfilled or 0),
            "member_since": member_since,
        },
        message="Seller profile statistics retrieved successfully",
    )


@router.get(
    "/{slug_or_id}/users",
    summary="List all users registered under a tenant",
)
async def list_tenant_users(
    slug_or_id: str,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    tenant = None
    try:
        t_uuid = uuid.UUID(slug_or_id)
        res = await db.execute(select(Tenant).where(Tenant.id == t_uuid))
        tenant = res.scalar_one_or_none()
    except ValueError:
        pass

    if not tenant:
        res = await db.execute(select(Tenant).where(Tenant.slug == slug_or_id.lower()))
        tenant = res.scalar_one_or_none()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    # Fetch users where tenant_id == tenant.id
    user_query = select(User).where(User.tenant_id == tenant.id).order_by(User.created_at.desc())
    user_res = await db.execute(user_query)
    tenant_users = user_res.scalars().all()

    # Also check orders placed by customers under this tenant
    orders_res = await db.execute(
        select(
            Order.customer_email,
            Order.customer_name,
            func.count(Order.id).label("order_count"),
            func.sum(Order.total_amount).label("total_spent"),
            func.max(Order.created_at).label("last_order_at"),
        )
        .where(Order.tenant_id == tenant.id)
        .group_by(Order.customer_email, Order.customer_name)
    )
    order_customer_stats = {
        row.customer_email.lower(): {
            "order_count": int(row.order_count or 0),
            "total_spent": float(row.total_spent or 0.0),
            "last_order_at": row.last_order_at.isoformat() if row.last_order_at else None,
            "name": row.customer_name,
        }
        for row in orders_res.all()
    }

    user_list = []
    seen_emails = set()

    # Fetch registered users matching order customer emails to obtain avatars
    customer_emails = [e for e in order_customer_stats.keys() if e not in seen_emails]
    customer_user_map = {}
    if customer_emails:
        c_users_res = await db.execute(
            select(User).where(func.lower(User.email).in_(customer_emails))
        )
        for cu in c_users_res.scalars().all():
            customer_user_map[cu.email.lower()] = cu

    for u in tenant_users:
        seen_emails.add(u.email.lower())
        c_stats = order_customer_stats.get(u.email.lower(), {})
        user_list.append({
            "id": str(u.id),
            "first_name": u.first_name,
            "last_name": u.last_name,
            "full_name": f"{u.first_name} {u.last_name}".strip(),
            "email": u.email,
            "phone_number": u.phone_number,
            "avatar_url": getattr(u, "avatar_url", None),
            "gender": getattr(u, "gender", None),
            "role": u.role,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "orders_count": c_stats.get("order_count", 0),
            "total_spent": c_stats.get("total_spent", 0.0),
        })

    # Include customers who ordered from this tenant even if not formal tenant_admin
    for email, stats in order_customer_stats.items():
        if email not in seen_emails:
            seen_emails.add(email)
            name_parts = stats["name"].split(" ", 1)
            first_name = name_parts[0] if name_parts else "Customer"
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            matching_cu = customer_user_map.get(email.lower())
            user_list.append({
                "id": str(matching_cu.id) if matching_cu else f"cust-{abs(hash(email)) % 10000000}",
                "first_name": first_name,
                "last_name": last_name,
                "full_name": stats["name"],
                "email": email,
                "phone_number": getattr(matching_cu, "phone_number", None) if matching_cu else None,
                "avatar_url": getattr(matching_cu, "avatar_url", None) if matching_cu else None,
                "gender": getattr(matching_cu, "gender", None) if matching_cu else None,
                "role": "customer",
                "is_active": True,
                "is_verified": True,
                "created_at": stats.get("last_order_at"),
                "orders_count": stats.get("order_count", 0),
                "total_spent": stats.get("total_spent", 0.0),
            })

    total = len(user_list)
    return success_response(
        data={"items": user_list, "total": total},
        message="Tenant users retrieved successfully",
    )
