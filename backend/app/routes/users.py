import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.order import Order, OrderStatus
from app.dependencies import get_current_user, get_current_super_admin
from app.schemas.response import success_response, PaginationMeta, ApiResponse, ErrorResponse

router = APIRouter(
    prefix="/users",
    tags=["Platform Users & Tenant Admins Management"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        403: {"model": ErrorResponse, "description": "Forbidden - Platform Super Admin Required"},
        404: {"model": ErrorResponse, "description": "User Not Found"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
    },
)


class UpdateUserRolePayload(BaseModel):
    role: str


class UpdateUserStatusPayload(BaseModel):
    is_active: bool


@router.get(
    "/core/directory",
    summary="List all users across platform with role and store associations (Super Admin)",
)
async def list_core_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    tenant_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_super_admin),
) -> Dict[str, Any]:
    query = (
        select(User, Tenant)
        .join(Tenant, User.tenant_id == Tenant.id, isouter=True)
        .where(User.is_deleted == False)
    )

    if role and role.lower() != "all":
        query = query.where(User.role == role.lower())

    if tenant_id and tenant_id.lower() != "all":
        try:
            t_uuid = uuid.UUID(tenant_id)
            query = query.where(User.tenant_id == t_uuid)
        except ValueError:
            query = query.where(Tenant.slug == tenant_id.lower())

    if search:
        s_term = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(User.first_name).ilike(s_term),
                func.lower(User.last_name).ilike(s_term),
                func.lower(User.email).ilike(s_term),
                func.lower(User.phone_number).ilike(s_term),
                func.lower(Tenant.name).ilike(s_term),
                func.lower(Tenant.slug).ilike(s_term),
            )
        )

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    # Paginate
    offset = (page - 1) * per_page
    query = query.order_by(desc(User.created_at)).offset(offset).limit(per_page)
    results = await db.execute(query)
    rows = results.all()

    # Pre-aggregate order stats for these users if any
    user_emails = [u.email.lower() for u, _ in rows if u.email]
    order_stats_map = {}
    if user_emails:
        orders_stmt = (
            select(
                func.lower(Order.customer_email).label("email"),
                func.count(Order.id).label("order_count"),
                func.sum(Order.total_amount).label("total_spent"),
            )
            .where(func.lower(Order.customer_email).in_(user_emails), Order.is_deleted == False)
            .group_by(func.lower(Order.customer_email))
        )
        o_res = await db.execute(orders_stmt)
        for r in o_res.all():
            order_stats_map[r.email] = {
                "orders_count": int(r.order_count or 0),
                "total_spent": float(r.total_spent or 0.0),
            }

    items = []
    for user_obj, tenant_obj in rows:
        stats = order_stats_map.get(user_obj.email.lower(), {})
        items.append({
            "id": str(user_obj.id),
            "first_name": user_obj.first_name,
            "last_name": user_obj.last_name,
            "full_name": f"{user_obj.first_name} {user_obj.last_name}".strip(),
            "email": user_obj.email,
            "phone_number": user_obj.phone_number,
            "avatar_url": getattr(user_obj, "avatar_url", None),
            "gender": getattr(user_obj, "gender", None),
            "role": user_obj.role,
            "is_active": user_obj.is_active,
            "is_verified": user_obj.is_verified,
            "tenant_id": str(tenant_obj.id) if tenant_obj else None,
            "tenant_name": tenant_obj.name if tenant_obj else None,
            "tenant_slug": tenant_obj.slug if tenant_obj else None,
            "created_at": user_obj.created_at.isoformat() if user_obj.created_at else None,
            "orders_count": stats.get("orders_count", 0),
            "total_spent": stats.get("total_spent", 0.0),
        })

    last_page = max(1, (total + per_page - 1) // per_page)
    pagination = PaginationMeta(
        current_page=page,
        last_page=last_page,
        per_page=per_page,
        total=total,
    )

    return success_response(
        data={"items": items},
        pagination=pagination,
        message="Users directory retrieved successfully",
    )


@router.get(
    "/core/{user_id}",
    summary="Get tenant admin details and their associated customers (Super Admin)",
)
async def get_core_user_detail(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_super_admin),
) -> Dict[str, Any]:
    # 1. Fetch User
    stmt = (
        select(User, Tenant)
        .join(Tenant, User.tenant_id == Tenant.id, isouter=True)
        .where(User.id == user_id, User.is_deleted == False)
    )
    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    target_user, tenant = row

    # 2. Build tenant info and customer table if tenant exists
    customers_list = []
    total_revenue = 0.0
    total_orders = 0

    if tenant:
        # Aggregated customer metrics from Orders for this tenant
        orders_stmt = (
            select(
                Order.customer_email,
                Order.customer_name,
                func.count(Order.id).label("order_count"),
                func.sum(Order.total_amount).label("total_spent"),
                func.max(Order.created_at).label("last_order_at"),
            )
            .where(Order.tenant_id == tenant.id, Order.is_deleted == False)
            .group_by(Order.customer_email, Order.customer_name)
            .order_by(desc("order_count"))
        )
        orders_res = await db.execute(orders_stmt)
        order_customers = orders_res.all()

        seen_emails = set()
        customer_emails = [r.customer_email.lower() for r in order_customers if r.customer_email]

        # Match registered customer users
        user_matches = {}
        if customer_emails:
            c_users_res = await db.execute(
                select(User).where(func.lower(User.email).in_(customer_emails))
            )
            for cu in c_users_res.scalars().all():
                user_matches[cu.email.lower()] = cu

        for r in order_customers:
            em = r.customer_email.lower()
            seen_emails.add(em)
            cu = user_matches.get(em)
            c_spent = float(r.total_spent or 0.0)
            c_orders = int(r.order_count or 0)
            total_revenue += c_spent
            total_orders += c_orders

            name_parts = (r.customer_name or "Store Customer").split(" ", 1)
            first_name = name_parts[0] if name_parts else "Customer"
            last_name = name_parts[1] if len(name_parts) > 1 else ""

            customers_list.append({
                "id": str(cu.id) if cu else f"cust-{abs(hash(em)) % 10000000}",
                "first_name": cu.first_name if cu else first_name,
                "last_name": cu.last_name if cu else last_name,
                "full_name": cu.full_name if (cu and hasattr(cu, "full_name")) else r.customer_name,
                "email": r.customer_email,
                "phone_number": getattr(cu, "phone_number", None) if cu else None,
                "avatar_url": getattr(cu, "avatar_url", None) if cu else None,
                "orders_count": c_orders,
                "total_spent": c_spent,
                "last_order_at": r.last_order_at.isoformat() if r.last_order_at else None,
                "is_registered": cu is not None,
                "is_active": cu.is_active if cu else True,
                "created_at": r.last_order_at.isoformat() if r.last_order_at else None,
            })

        # Also add registered tenant customers who haven't ordered yet
        extra_users_res = await db.execute(
            select(User).where(
                User.tenant_id == tenant.id,
                User.role.in_(["customer", "user"]),
                User.is_deleted == False,
            )
        )
        for eu in extra_users_res.scalars().all():
            if eu.email.lower() not in seen_emails:
                seen_emails.add(eu.email.lower())
                customers_list.append({
                    "id": str(eu.id),
                    "first_name": eu.first_name,
                    "last_name": eu.last_name,
                    "full_name": f"{eu.first_name} {eu.last_name}".strip(),
                    "email": eu.email,
                    "phone_number": eu.phone_number,
                    "avatar_url": getattr(eu, "avatar_url", None),
                    "orders_count": 0,
                    "total_spent": 0.0,
                    "last_order_at": None,
                    "is_registered": True,
                    "is_active": eu.is_active,
                    "created_at": eu.created_at.isoformat() if eu.created_at else None,
                })

    avg_order_value = (total_revenue / total_orders) if total_orders > 0 else 0.0

    user_data = {
        "id": str(target_user.id),
        "first_name": target_user.first_name,
        "last_name": target_user.last_name,
        "full_name": f"{target_user.first_name} {target_user.last_name}".strip(),
        "email": target_user.email,
        "phone_number": target_user.phone_number,
        "avatar_url": getattr(target_user, "avatar_url", None),
        "gender": getattr(target_user, "gender", None),
        "role": target_user.role,
        "is_active": target_user.is_active,
        "is_verified": target_user.is_verified,
        "created_at": target_user.created_at.isoformat() if target_user.created_at else None,
        "tenant": {
            "id": str(tenant.id) if tenant else None,
            "name": tenant.name if tenant else None,
            "slug": tenant.slug if tenant else None,
            "currency": tenant.currency if tenant else "NGN",
            "country": tenant.country if tenant else "Nigeria",
            "custom_domain": tenant.custom_domain if tenant else None,
            "branding_config": tenant.branding_config if tenant else {},
        } if tenant else None,
        "stats": {
            "total_customers": len(customers_list),
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "avg_order_value": avg_order_value,
            "currency": tenant.currency if tenant else "NGN",
        },
        "customers": customers_list,
    }

    return success_response(
        data=user_data,
        message="User detail and tenant customer records retrieved successfully",
    )


@router.patch(
    "/core/{user_id}/role",
    summary="Update user role (e.g. promote tenant_admin to hub_admin) (Super Admin)",
)
async def update_user_role(
    user_id: uuid.UUID,
    payload: UpdateUserRolePayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_super_admin),
) -> Dict[str, Any]:
    valid_roles = ["super_admin", "hub_admin", "tenant_admin", "admin", "customer", "user"]
    new_role = payload.role.strip().lower()
    if new_role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{payload.role}'. Must be one of: {', '.join(valid_roles)}",
        )

    stmt = select(User).where(User.id == user_id, User.is_deleted == False).with_for_update()
    res = await db.execute(stmt)
    target_user = res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    old_role = target_user.role
    target_user.role = new_role
    await db.commit()
    await db.refresh(target_user)

    return success_response(
        data={
            "id": str(target_user.id),
            "email": target_user.email,
            "old_role": old_role,
            "new_role": target_user.role,
            "role": target_user.role,
        },
        message=f"User role successfully updated from '{old_role}' to '{target_user.role}'",
    )


@router.patch(
    "/core/{user_id}/status",
    summary="Activate or deactivate user account (Super Admin)",
)
async def update_user_status(
    user_id: uuid.UUID,
    payload: UpdateUserStatusPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_super_admin),
) -> Dict[str, Any]:
    stmt = select(User).where(User.id == user_id, User.is_deleted == False).with_for_update()
    res = await db.execute(stmt)
    target_user = res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    target_user.is_active = payload.is_active
    await db.commit()
    await db.refresh(target_user)

    status_str = "activated" if target_user.is_active else "deactivated"
    return success_response(
        data={
            "id": str(target_user.id),
            "email": target_user.email,
            "is_active": target_user.is_active,
        },
        message=f"User account successfully {status_str}",
    )
