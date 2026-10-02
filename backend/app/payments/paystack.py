import hmac
import hashlib
import httpx
from typing import Dict, Any
from app.config import settings
from app.models.tenant import Tenant
from app.models.order import Order
from app.schemas.payment import CheckoutSessionResponse, SplitDetails
from app.payments.base import PaymentProvider


class PaystackPaymentProvider(PaymentProvider):
    """
    Paystack subaccount split-payment strategy provider.
    """

    def __init__(self, secret_key: str = "", webhook_secret: str = ""):
        self.secret_key = secret_key or settings.PAYSTACK_SECRET_KEY or ""
        self.webhook_secret = webhook_secret or settings.PAYSTACK_WEBHOOK_SECRET or self.secret_key
        self.base_url = "https://api.paystack.co"

    def calculate_split(self, order: Order, tenant: Tenant) -> SplitDetails:
        total = float(order.total_amount)
        platform_fee = round(total * (settings.PLATFORM_FEE_PERCENTAGE / 100.0), 2)
        tenant_payout = round(total - platform_fee, 2)

        return SplitDetails(
            total_amount=total,
            platform_fee=platform_fee,
            tenant_payout=tenant_payout,
            subaccount_code=tenant.paystack_subaccount_code,
            currency=order.currency,
        )

    async def create_checkout_session(
        self,
        order: Order,
        tenant: Tenant,
        callback_url: str,
    ) -> CheckoutSessionResponse:
        split = self.calculate_split(order, tenant)
        
        # Paystack expects amounts in lowest currency unit (e.g. kobo/cents * 100)
        amount_kobo = int(split.total_amount * 100)
        platform_fee_kobo = int(split.platform_fee * 100)

        payload: Dict[str, Any] = {
            "email": order.customer_email,
            "amount": amount_kobo,
            "reference": order.gateway_reference,
            "callback_url": callback_url,
            "metadata": {
                "order_id": str(order.id),
                "tenant_id": str(tenant.id),
                "tenant_slug": tenant.slug,
            },
        }

        # Route to tenant subaccount if configured
        if tenant.paystack_subaccount_code:
            payload["subaccount"] = tenant.paystack_subaccount_code
            payload["transaction_charge"] = platform_fee_kobo
            payload["bearer"] = "subaccount"

        if self.secret_key:
            headers = {
                "Authorization": f"Bearer {self.secret_key}",
                "Content-Type": "application/json",
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.base_url}/transaction/initialize",
                    json=payload,
                    headers=headers,
                )
                if res.status_code == 200:
                    data = res.json().get("data", {})
                    return CheckoutSessionResponse(
                        checkout_url=data.get("authorization_url", ""),
                        reference=order.gateway_reference,
                        gateway="paystack",
                        split_details=split,
                    )

        # Mock fallback for sandbox/local testing
        mock_checkout_url = f"https://checkout.paystack.com/{order.gateway_reference}"
        return CheckoutSessionResponse(
            checkout_url=mock_checkout_url,
            reference=order.gateway_reference,
            gateway="paystack",
            split_details=split,
        )

    async def verify_webhook_signature(
        self,
        raw_body: bytes,
        signature_header: str,
    ) -> bool:
        if not self.webhook_secret or not signature_header:
            return True  # Allow in development if not configured
        
        computed_hash = hmac.new(
            self.webhook_secret.encode("utf-8"),
            msg=raw_body,
            digestmod=hashlib.sha512,
        ).hexdigest()

        return hmac.compare_digest(computed_hash, signature_header)

    async def parse_webhook_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        data = payload.get("data", {})
        return {
            "event_id": str(data.get("id", "")),
            "event_type": payload.get("event", ""),
            "reference": data.get("reference", ""),
            "status": "paid" if payload.get("event") == "charge.success" else "failed",
            "amount": float(data.get("amount", 0)) / 100.0,
            "metadata": data.get("metadata", {}),
        }
