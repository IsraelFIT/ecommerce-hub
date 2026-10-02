import json
from typing import Dict, Any
from fastapi import APIRouter, Request, Header, BackgroundTasks, HTTPException, status
from app.payments.paystack import PaystackPaymentProvider
from app.payments.stripe import StripePaymentProvider
from app.services.webhook_worker import process_webhook_event_task
from app.schemas.response import success_response, ApiResponse, ErrorResponse
from app.schemas.webhook import WebhookResponse

router = APIRouter(
    prefix="/webhooks",
    tags=["Webhooks & Idempotency"],
    responses={
        400: {"model": ErrorResponse, "description": "HMAC Verification / Payload Error"},
    },
)

paystack_provider = PaystackPaymentProvider()
stripe_provider = StripePaymentProvider()


@router.post(
    "/paystack",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Receive Paystack charge events (HMAC SHA512 verified)",
    description="Validates cryptographic HMAC signature on raw body, acknowledges instantly and schedules idempotent background worker.",
)
async def handle_paystack_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_paystack_signature: str = Header(None, alias="x-paystack-signature"),
) -> Dict[str, Any]:
    """
    Paystack webhook receiver.
    CRITICAL: Reads raw request.body() for cryptographic HMAC validation before JSON parsing.
    Dispatches to BackgroundTasks for idempotent processing and immediately returns 200 OK.
    """
    raw_body = await request.body()

    is_valid = await paystack_provider.verify_webhook_signature(
        raw_body=raw_body,
        signature_header=x_paystack_signature or "",
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid HMAC signature",
        )

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        )

    parsed_data = await paystack_provider.parse_webhook_event(payload)
    event_id = parsed_data.get("event_id") or str(payload.get("data", {}).get("id"))
    event_type = payload.get("event", "charge.success")

    # Dispatch to background task for idempotent execution
    background_tasks.add_task(
        process_webhook_event_task,
        event_id=event_id,
        gateway="paystack",
        event_type=event_type,
        payload=payload,
        parsed_data=parsed_data,
    )

    return success_response(
        data={"received": True},
        message="Paystack webhook received and queued for processing",
    )


@router.post(
    "/stripe",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Receive Stripe events (HMAC verified)",
    description="Validates Stripe signature header on raw payload and schedules idempotent background worker.",
)
async def handle_stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    stripe_signature: str = Header(None, alias="stripe-signature"),
) -> Dict[str, Any]:
    """
    Stripe webhook receiver.
    Reads raw bytes for HMAC verification, then triggers idempotent background worker.
    """
    raw_body = await request.body()

    is_valid = await stripe_provider.verify_webhook_signature(
        raw_body=raw_body,
        signature_header=stripe_signature or "",
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe signature",
        )

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        )

    parsed_data = await stripe_provider.parse_webhook_event(payload)
    event_id = payload.get("id", "")
    event_type = payload.get("type", "")

    background_tasks.add_task(
        process_webhook_event_task,
        event_id=event_id,
        gateway="stripe",
        event_type=event_type,
        payload=payload,
        parsed_data=parsed_data,
    )

    return success_response(
        data={"received": True},
        message="Stripe webhook received and queued for processing",
    )
