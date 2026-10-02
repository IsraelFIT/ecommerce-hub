import uuid
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class SplitDetails(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_amount": 140.0,
                "platform_fee": 3.5,
                "tenant_payout": 136.5,
                "subaccount_code": "acct_1NZX84920481",
                "currency": "USD",
            }
        }
    )

    total_amount: float
    platform_fee: float
    tenant_payout: float
    subaccount_code: Optional[str] = None
    currency: str = "USD"


class CheckoutSessionCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "order_id": "18492048-e230-4131-b841-382947192301",
                "gateway": "stripe",
                "callback_url": "https://cakes-by-bode.ecommerce-hub.com/orders/confirmation",
            }
        }
    )

    order_id: uuid.UUID
    gateway: Optional[str] = Field(default=None, description="paystack or stripe")
    callback_url: str


class CheckoutSessionResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4e5",
                "reference": "ECH-CAKES-BY-BODE-A9B2C3",
                "gateway": "stripe",
                "split_details": {
                    "total_amount": 140.0,
                    "platform_fee": 3.5,
                    "tenant_payout": 136.5,
                    "subaccount_code": "acct_1NZX84920481",
                    "currency": "USD",
                },
            }
        }
    )

    checkout_url: str
    reference: str
    gateway: str
    split_details: SplitDetails
