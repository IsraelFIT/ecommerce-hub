import uuid
import secrets
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_tenant_context, get_rls_db_session
from app.models.tenant import Tenant
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse
from app.schemas.response import success_response, PaginationMeta, ApiResponse, PaginatedData, ErrorResponse

router = APIRouter(
    prefix="/orders",
    tags=["Orders (RLS Isolated)"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        404: {"model": ErrorResponse, "description": "Order Not Found"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
    },
)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrderResponse],
    summary="Create order and calculate subaccount split fees",
    description="Creates an order for the tenant and automatically calculates 2.5% platform fee and tenant payout.",
)
@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrderResponse],
    include_in_schema=False,
)
async def create_order(
    order_in: OrderCreate,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    subtotal = sum(item.unit_price * item.quantity for item in order_in.items)
    delivery_fee = (
        float(order_in.delivery_fee or 0.0)
        if order_in.fulfillment_type == "delivery"
        else 0.0
    )
    total_amount = round(subtotal + delivery_fee, 2)
    platform_fee = round(total_amount * (settings.PLATFORM_FEE_PERCENTAGE / 100.0), 2)
    tenant_payout = round(total_amount - platform_fee, 2)

    resolved_currency = (order_in.currency or tenant.currency or "NGN").upper()
    gateway_ref = f"ECH-{tenant.slug.upper()}-{secrets.token_hex(6).upper()}"

    # Auto-resolve user_id if customer_email matches an existing user
    user_id = order_in.user_id
    if not user_id and order_in.customer_email:
        user_res = await db.execute(
            select(User.id).where(User.email == order_in.customer_email.strip().lower())
        )
        user_id = user_res.scalar_one_or_none()

    order = Order(
        tenant_id=tenant.id,
        user_id=user_id,
        customer_email=order_in.customer_email.strip().lower(),
        customer_name=order_in.customer_name,
        total_amount=total_amount,
        platform_fee=platform_fee,
        tenant_payout_amount=tenant_payout,
        currency=resolved_currency,
        status=OrderStatus.PENDING,
        payment_gateway=order_in.payment_gateway,
        gateway_reference=gateway_ref,
        items=[item.model_dump(mode="json", exclude_none=True) for item in order_in.items],
        metadata_json={
            "tenant_slug": tenant.slug,
            "subaccount_used": tenant.paystack_subaccount_code or tenant.stripe_account_id,
            "fulfillment_type": order_in.fulfillment_type,
            "delivery_fee": delivery_fee,
            "delivery_address": order_in.delivery_address,
            "fulfillment_date": order_in.fulfillment_date,
            "fulfillment_time": order_in.fulfillment_time,
            "gift_message": order_in.gift_message,
        },
    )

    db.add(order)
    await db.commit()
    await db.refresh(order)
    return success_response(
        data=OrderResponse.model_validate(order).model_dump(mode="json"),
        message="Order created successfully",
    )


@router.get(
    "",
    response_model=ApiResponse[PaginatedData[OrderResponse]],
    summary="List orders isolated by PostgreSQL RLS",
    description="Retrieves orders filtered strictly at database level by PostgreSQL RLS for the tenant.",
)
@router.get(
    "/",
    response_model=ApiResponse[PaginatedData[OrderResponse]],
    include_in_schema=False,
)
async def list_orders(
    page: int = 1,
    per_page: int = 15,
    customer_email: Optional[str] = None,
    user_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    offset = (page - 1) * per_page

    query_count = select(func.count(Order.id)).where(Order.is_deleted == False)
    query_items = (
        select(Order)
        .where(Order.is_deleted == False)
        .options(selectinload(Order.user))
        .order_by(Order.created_at.desc())
    )

    if user_id and customer_email:
        condition = or_(
            Order.user_id == user_id,
            Order.customer_email == customer_email.strip().lower(),
        )
        query_count = query_count.where(condition)
        query_items = query_items.where(condition)
    elif user_id:
        query_count = query_count.where(Order.user_id == user_id)
        query_items = query_items.where(Order.user_id == user_id)
    elif customer_email:
        query_count = query_count.where(Order.customer_email == customer_email.strip().lower())
        query_items = query_items.where(Order.customer_email == customer_email.strip().lower())

    total_query = await db.execute(query_count)
    total = total_query.scalar() or 0

    result = await db.execute(query_items.offset(offset).limit(per_page))
    orders = result.scalars().all()

    # Fallback lookup for guest/unlinked orders with matching customer_email
    emails_to_lookup = [
        o.customer_email.strip().lower()
        for o in orders
        if not o.user and o.customer_email
    ]
    email_user_map = {}
    if emails_to_lookup:
        eu_res = await db.execute(
            select(User).where(func.lower(User.email).in_(emails_to_lookup))
        )
        for eu in eu_res.scalars().all():
            email_user_map[eu.email.lower()] = eu

    last_page = max(1, (total + per_page - 1) // per_page)
    pagination = PaginationMeta(
        current_page=page,
        last_page=last_page,
        per_page=per_page,
        total=total,
    )

    items = []
    for o in orders:
        resp = OrderResponse.model_validate(o)
        if o.user and getattr(o.user, "avatar_url", None):
            resp.customer_avatar_url = o.user.avatar_url
        elif o.customer_email and o.customer_email.strip().lower() in email_user_map:
            resp.customer_avatar_url = getattr(email_user_map[o.customer_email.strip().lower()], "avatar_url", None)
        items.append(resp.model_dump(mode="json"))

    return success_response(
        data={"items": items},
        pagination=pagination,
        message="Orders retrieved successfully",
    )


@router.get(
    "/{order_identifier}",
    response_model=ApiResponse[OrderResponse],
    summary="Get order details by UUID or gateway reference",
)
async def get_order(
    order_identifier: str,
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    try:
        order_uuid = uuid.UUID(order_identifier)
        query = select(Order).where(Order.id == order_uuid, Order.is_deleted == False)
    except ValueError:
        query = select(Order).where(
            Order.gateway_reference == order_identifier, Order.is_deleted == False
        )

    result = await db.execute(query.options(selectinload(Order.user)))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_identifier}' not found in tenant store",
        )
    resp = OrderResponse.model_validate(order)
    if order.user and getattr(order.user, "avatar_url", None):
        resp.customer_avatar_url = order.user.avatar_url
    elif order.customer_email:
        cu_res = await db.execute(
            select(User).where(func.lower(User.email) == order.customer_email.strip().lower())
        )
        cu = cu_res.scalar_one_or_none()
        if cu and getattr(cu, "avatar_url", None):
            resp.customer_avatar_url = cu.avatar_url

    return success_response(
        data=resp.model_dump(mode="json"),
        message="Order details retrieved successfully",
    )


@router.delete(
    "/{order_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Soft-delete order",
)
async def delete_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.is_deleted == False)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found in tenant store",
        )
    order.is_deleted = True
    order.deleted_at = func.now()
    await db.commit()
    return success_response(
        data={"id": str(order_id)},
        message="Order deleted successfully",
    )

