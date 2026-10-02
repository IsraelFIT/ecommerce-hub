import logging
from typing import Dict, Any
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from app.database import AsyncSessionLocal
from app.models.webhook import ProcessedWebhook
from app.models.order import Order, OrderStatus

logger = logging.getLogger("webhook_worker")


async def process_webhook_event_task(
    event_id: str,
    gateway: str,
    event_type: str,
    payload: Dict[str, Any],
    parsed_data: Dict[str, Any],
    session_factory=None,
):
    """
    Background worker that executes idempotent webhook processing.
    Ensures that the event_id is inserted into the processed_webhooks table.
    If already processed, IntegrityError is caught and execution aborts immediately.
    """
    factory = session_factory or AsyncSessionLocal
    async with factory() as session:

        # Step 1: Idempotency check via unique event_id insertion
        try:
            webhook_record = ProcessedWebhook(
                event_id=event_id,
                gateway=gateway,
                event_type=event_type,
                payload=payload,
            )
            session.add(webhook_record)
            await session.commit()
            logger.info(f"Recorded new webhook event [{event_id}] from {gateway}")
        except IntegrityError:
            await session.rollback()
            logger.warning(
                f"Idempotency guard: Webhook event [{event_id}] already processed. Skipping duplicate execution."
            )
            return

        # Step 2: Handle fulfillment based on parsed payment status
        reference = parsed_data.get("reference")
        status = parsed_data.get("status")

        if reference and status == "paid":
            try:
                # Update matching order status to PAID
                query = (
                    update(Order)
                    .where(Order.gateway_reference == reference)
                    .values(
                        status=OrderStatus.PAID,
                        metadata_json={
                            "paid_event_id": event_id,
                            "paid_gateway": gateway,
                            "raw_event_type": event_type,
                        },
                    )
                )
                await session.execute(query)
                await session.commit()
                logger.info(f"Successfully marked order with reference [{reference}] as PAID")
            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to update order for webhook [{event_id}]: {str(e)}")
