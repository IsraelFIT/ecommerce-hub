import logging
from typing import Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select, update, func, or_
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

        # Step 2: Handle fulfillment & audit logging based on parsed payment status
        reference = parsed_data.get("reference")
        status = parsed_data.get("status")

        if reference:
            try:
                # Find matching order by gateway_reference or by scanning payment_attempts
                res = await session.execute(
                    select(Order).where(Order.gateway_reference == reference).with_for_update()
                )
                order = res.scalar_one_or_none()

                if not order:
                    all_res = await session.execute(select(Order).with_for_update())
                    for cand in all_res.scalars().all():
                        cand_attempts = (cand.metadata_json or {}).get("payment_attempts", [])
                        if any(a.get("reference") == reference for a in cand_attempts):
                            order = cand
                            break

                if order:
                    meta = dict(order.metadata_json or {})
                    attempts = list(meta.get("payment_attempts", []))
                    now_iso = datetime.now(timezone.utc).isoformat()

                    if status == "paid" and order.status != OrderStatus.PAID:
                        order.status = OrderStatus.PAID
                        matched = False
                        for a in attempts:
                            if a.get("reference") == reference:
                                a["status"] = "paid"
                                a["paid_at"] = now_iso
                                matched = True
                            elif a.get("status") != "paid":
                                a["status"] = "abandoned"

                        if not matched:
                            attempts.append({
                                "reference": reference,
                                "gateway": gateway,
                                "status": "paid",
                                "paid_at": now_iso,
                            })

                        meta["payment_attempts"] = attempts
                        meta["paid_event_id"] = event_id
                        meta["paid_gateway"] = gateway
                        meta["raw_event_type"] = event_type
                        meta["paid_at"] = now_iso
                        order.gateway_reference = reference
                        order.metadata_json = meta

                        # Mark older unpaid pending orders for this customer as superseded
                        older_res = await session.execute(
                            select(Order).where(
                                Order.tenant_id == order.tenant_id,
                                func.lower(Order.customer_email) == func.lower(order.customer_email),
                                Order.id != order.id,
                                Order.status == OrderStatus.PENDING,
                                Order.is_deleted == False,
                            ).with_for_update()
                        )
                        for older in older_res.scalars().all():
                            older_meta = dict(older.metadata_json or {})
                            older_meta["is_abandoned_superseded"] = True
                            older_meta["superseded_by_order_id"] = str(order.id)
                            older_meta["superseded_at"] = now_iso
                            older.metadata_json = older_meta

                        await session.commit()
                        logger.info(f"Successfully marked order [{order.id}] with reference [{reference}] as PAID via webhook")

                    elif status in ("declined", "failed", "abandoned") and order.status == OrderStatus.PENDING:
                        # Log decline / abandonment in payment_attempts
                        reason = (
                            parsed_data.get("metadata", {}).get("gateway_response")
                            or parsed_data.get("metadata", {}).get("last_payment_error")
                            or payload.get("data", {}).get("gateway_response")
                            or f"Transaction {status}"
                        )
                        matched = False
                        for a in attempts:
                            if a.get("reference") == reference:
                                a["status"] = status
                                a["failed_at"] = now_iso
                                a["gateway_response"] = reason
                                matched = True
                        if not matched:
                            attempts.append({
                                "reference": reference,
                                "gateway": gateway,
                                "status": status,
                                "failed_at": now_iso,
                                "gateway_response": reason,
                            })
                        meta["payment_attempts"] = attempts
                        meta["last_payment_status"] = status
                        order.metadata_json = meta
                        await session.commit()
                        logger.info(f"Successfully logged {status} attempt for order [{order.id}] with reference [{reference}] via webhook")
            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to process payment status update for webhook [{event_id}]: {str(e)}")
