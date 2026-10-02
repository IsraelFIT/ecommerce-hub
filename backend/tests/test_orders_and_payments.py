import pytest
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_order_creation_and_split_calculation(client: AsyncClient, sample_tenant):
    headers = {"X-Tenant-Slug": sample_tenant.slug}

    order_payload = {
        "customer_email": "buyer@example.com",
        "customer_name": "Jane Buyer",
        "payment_gateway": "paystack",
        "items": [
            {
                "product_id": str(uuid.uuid4()),
                "title": "Minimalist Backpack",
                "quantity": 2,
                "unit_price": 100.0,
            }
        ],
    }

    # Create Order
    res = await client.post("/api/orders/", json=order_payload, headers=headers)
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "success"
    order_data = body["data"]
    assert order_data["total_amount"] == 200.0
    # 2.5% platform fee = 5.0, tenant payout = 195.0
    assert order_data["platform_fee"] == 5.0
    assert order_data["tenant_payout_amount"] == 195.0
    assert order_data["status"] == "pending"

    # List orders for tenant
    list_res = await client.get("/api/orders/", headers=headers)
    assert list_res.status_code == 200
    list_body = list_res.json()
    assert list_body["status"] == "success"
    assert "items" in list_body["data"]
    assert len(list_body["data"]["items"]) >= 1

    # Create Checkout Session
    checkout_payload = {
        "order_id": order_data["id"],
        "gateway": "paystack",
        "callback_url": "https://acme.ecommerce-hub.com/checkout/callback",
    }
    checkout_res = await client.post(
        "/api/payments/checkout-session",
        json=checkout_payload,
        headers=headers,
    )
    assert checkout_res.status_code == 200
    checkout_body = checkout_res.json()
    assert checkout_body["status"] == "success"
    session_data = checkout_body["data"]
    assert "checkout_url" in session_data
    assert session_data["split_details"]["total_amount"] == 200.0
    assert session_data["split_details"]["subaccount_code"] == sample_tenant.paystack_subaccount_code
