from typing import Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_tenant_context, get_rls_db_session
from app.models.tenant import Tenant
from app.models.order import Order, OrderStatus
from app.schemas.payment import CheckoutSessionCreate, CheckoutSessionResponse
from app.schemas.response import success_response, ApiResponse, ErrorResponse
from app.payments.paystack import PaystackPaymentProvider
from app.payments.stripe import StripePaymentProvider

router = APIRouter(
    prefix="/payments",
    tags=["Payments (Split Subaccounts)"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request / Split Gateway Error"},
        404: {"model": ErrorResponse, "description": "Order Not Found"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
    },
)


@router.post(
    "/checkout-session",
    response_model=ApiResponse[CheckoutSessionResponse],
    summary="Initialize hosted checkout session with subaccount fee split",
    description="Initializes a Stripe Checkout or Paystack Standard redirect checkout session with automated subaccount routing and application fee retention.",
)
async def create_checkout_session(
    payload: CheckoutSessionCreate,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    result = await db.execute(select(Order).where(Order.id == payload.order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    gateway = (payload.gateway or order.payment_gateway or tenant.default_gateway or "paystack").lower()
    active_provider = StripePaymentProvider() if gateway == "stripe" else PaystackPaymentProvider()

    session_response = await active_provider.create_checkout_session(
        order=order,
        tenant=tenant,
        callback_url=payload.callback_url,
    )

    return success_response(
        data=session_response.model_dump(mode="json"),
        message="Checkout session initialized successfully",
    )


@router.get(
    "/verify/{reference}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Verify payment transaction status",
    description="Verifies a payment with Paystack or Stripe, transitioning order status to PAID upon successful authorization.",
)
async def verify_payment(
    reference: str,
    session_id: Optional[str] = None,
    db: AsyncSession = Depends(get_rls_db_session),
    tenant: Tenant = Depends(get_tenant_context),
) -> Dict[str, Any]:
    result = await db.execute(select(Order).where(Order.gateway_reference == reference))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with reference '{reference}' not found",
        )

    if order.status == OrderStatus.PAID:
        return success_response(
            data={
                "status": "paid",
                "order_id": str(order.id),
                "reference": reference,
                "total_amount": float(order.total_amount),
                "currency": order.currency,
                "payment_gateway": order.payment_gateway,
            },
            message="Payment already verified and marked as paid",
        )

    gateway = (order.payment_gateway or tenant.default_gateway or "paystack").lower()
    if gateway == "stripe":
        provider = StripePaymentProvider()
        res = await provider.verify_transaction(reference=reference, session_id=session_id)
    else:
        provider = PaystackPaymentProvider()
        res = await provider.verify_transaction(reference=reference)

    if res.get("status") == "paid":
        order.status = OrderStatus.PAID
        order.metadata_json = {
            **(order.metadata_json or {}),
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "verified_via": "payment_verify_endpoint",
        }
        await db.commit()
        await db.refresh(order)

    return success_response(
        data={
            "status": order.status.value,
            "order_id": str(order.id),
            "reference": reference,
            "total_amount": float(order.total_amount),
            "currency": order.currency,
            "payment_gateway": order.payment_gateway,
        },
        message="Payment verified successfully",
    )
