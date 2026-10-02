from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_tenant_context, get_rls_db_session, get_payment_provider
from app.models.tenant import Tenant
from app.models.order import Order
from app.schemas.payment import CheckoutSessionCreate, CheckoutSessionResponse
from app.schemas.response import success_response, ApiResponse, ErrorResponse
from app.payments.base import PaymentProvider

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
    provider: PaymentProvider = Depends(get_payment_provider),
) -> Dict[str, Any]:
    result = await db.execute(select(Order).where(Order.id == payload.order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    session_response = await provider.create_checkout_session(
        order=order,
        tenant=tenant,
        callback_url=payload.callback_url,
    )

    return success_response(
        data=session_response.model_dump(mode="json"),
        message="Checkout session initialized successfully",
    )
