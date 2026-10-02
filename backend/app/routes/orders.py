import uuid
import secrets
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_tenant_context, get_rls_db_session
from app.models.tenant import Tenant
from app.models.order import Order, OrderStatus
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
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrderResponse],
    summary="Create order and calculate subaccount split fees",
    description="Creates an order for the tenant and automatically calculates 2.5% platform fee and tenant payout.",
)
async def create_order(
    order_in: OrderCreate,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    total_amount = sum(item.unit_price * item.quantity for item in order_in.items)
    platform_fee = round(total_amount * (settings.PLATFORM_FEE_PERCENTAGE / 100.0), 2)
    tenant_payout = round(total_amount - platform_fee, 2)

    gateway_ref = f"ECH-{tenant.slug.upper()}-{secrets.token_hex(6).upper()}"

    order = Order(
        tenant_id=tenant.id,
        customer_email=order_in.customer_email,
        customer_name=order_in.customer_name,
        total_amount=total_amount,
        platform_fee=platform_fee,
        tenant_payout_amount=tenant_payout,
        currency="USD",
        status=OrderStatus.PENDING,
        payment_gateway=order_in.payment_gateway,
        gateway_reference=gateway_ref,
        items=[item.model_dump(mode="json") for item in order_in.items],
        metadata_json={
            "tenant_slug": tenant.slug,
            "subaccount_used": tenant.paystack_subaccount_code or tenant.stripe_account_id,
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
    "/",
    response_model=ApiResponse[PaginatedData[OrderResponse]],
    summary="List orders isolated by PostgreSQL RLS",
    description="Retrieves orders filtered strictly at database level by PostgreSQL RLS for the tenant.",
)
async def list_orders(
    page: int = 1,
    per_page: int = 15,
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    offset = (page - 1) * per_page

    total_query = await db.execute(select(func.count(Order.id)))
    total = total_query.scalar() or 0

    result = await db.execute(
        select(Order).order_by(Order.created_at.desc()).offset(offset).limit(per_page)
    )
    orders = result.scalars().all()

    last_page = max(1, (total + per_page - 1) // per_page)
    pagination = PaginationMeta(
        current_page=page,
        last_page=last_page,
        per_page=per_page,
        total=total,
    )

    items = [OrderResponse.model_validate(o).model_dump(mode="json") for o in orders]
    return success_response(
        data={"items": items},
        pagination=pagination,
        message="Orders retrieved successfully",
    )


@router.get(
    "/{order_id}",
    response_model=ApiResponse[OrderResponse],
    summary="Get order details by UUID",
)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found in tenant store",
        )
    return success_response(
        data=OrderResponse.model_validate(order).model_dump(mode="json"),
        message="Order details retrieved successfully",
    )
