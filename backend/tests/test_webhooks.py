import pytest
import json
import hmac
import hashlib
from httpx import AsyncClient
from app.services.webhook_worker import process_webhook_event_task


@pytest.mark.asyncio
async def test_paystack_webhook_signature_and_acknowledgement(client: AsyncClient):
    payload = {
        "event": "charge.success",
        "data": {
            "id": 998811,
            "reference": "ECH-ACME-TESTREF123",
            "amount": 25000,
            "status": "success",
            "metadata": {"order_id": "test-order-uuid"},
        },
    }
    raw_body = json.dumps(payload).encode("utf-8")

    from app.config import settings
    secret = settings.PAYSTACK_WEBHOOK_SECRET or "whsec_placeholder"
    expected_sig = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha512).hexdigest()

    # Send valid payload with valid HMAC signature
    response = await client.post(
        "/api/webhooks/paystack",
        content=raw_body,
        headers={
            "Content-Type": "application/json",
            "x-paystack-signature": expected_sig,
        },
    )

    # Must acknowledge immediately with 200 OK
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["data"]["received"] is True


from tests.conftest import TestAsyncSessionLocal

@pytest.mark.asyncio
async def test_webhook_idempotency_worker(db_session):
    # Test worker inserting unique event_id
    event_id = "evt_unique_1001"
    payload = {"event": "charge.success", "data": {"reference": "REF123"}}
    parsed_data = {"reference": "REF123", "status": "paid"}

    # First call should succeed
    await process_webhook_event_task(
        event_id=event_id,
        gateway="paystack",
        event_type="charge.success",
        payload=payload,
        parsed_data=parsed_data,
        session_factory=TestAsyncSessionLocal,
    )

    # Second call with the same event_id should be safely caught by the idempotency guard
    await process_webhook_event_task(
        event_id=event_id,
        gateway="paystack",
        event_type="charge.success",
        payload=payload,
        parsed_data=parsed_data,
        session_factory=TestAsyncSessionLocal,
    )
