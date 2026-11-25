import uuid

from pydantic import BaseModel, ConfigDict, Field


class SplitDetails(BaseModel):
    """Breakdown of total order amount, platform fee, and tenant payout."""

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
    subaccount_code: str | None = None
    currency: str = "USD"


class CheckoutSessionCreate(BaseModel):
    """Payload to initialize a checkout session for an order."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "order_id": "18492048-e230-4131-b841-382947192301",
                "gateway": "stripe",
                "callback_url": "https://cakes-by-bode.kiyostores.space/orders/confirmation",
            }
        }
    )

    order_id: uuid.UUID
    gateway: str | None = Field(default=None, description="paystack or stripe")
    callback_url: str


class CheckoutSessionResponse(BaseModel):
    """Response containing checkout redirect URL, reference, and split details."""

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
    split_details: SplitDetails | None = None


class PaystackBank(BaseModel):
    """Paystack bank directory entry."""

    name: str
    code: str
    slug: str | None = None
    id: int | None = None


class ResolveAccountRequest(BaseModel):
    """Request payload to resolve a bank account number."""

    account_number: str
    bank_code: str


class ResolveAccountResponse(BaseModel):
    """Resolved bank account holder details."""

    account_number: str
    account_name: str
    bank_id: int | None = None


class CreateSubaccountRequest(BaseModel):
    """Request payload to create a Paystack subaccount."""

    bank_code: str
    account_number: str
    business_name: str | None = None


class CreateSubaccountResponse(BaseModel):
    """Created Paystack subaccount details."""

    subaccount_code: str
    business_name: str
    settlement_bank: str
    account_number: str
    percentage_charge: float = 2.5


class StripeOnboardRequest(BaseModel):
    """Request payload to initiate Stripe Connect onboarding."""

    return_url: str | None = None
    refresh_url: str | None = None


class StripeOnboardResponse(BaseModel):
    """Stripe Connect onboarding link response."""

    account_id: str
    onboarding_url: str
