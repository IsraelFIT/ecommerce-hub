import hmac
import hashlib
import time
from typing import Dict, Any, Optional
import stripe
from fastapi import HTTPException, status
from app.config import settings
from app.models.tenant import Tenant
from app.models.order import Order
from app.schemas.payment import CheckoutSessionResponse, SplitDetails
from app.payments.base import PaymentProvider


class StripePaymentProvider(PaymentProvider):
    """
    Stripe Connect subaccount split-payment strategy provider.
    """

    def __init__(self, secret_key: str = "", webhook_secret: str = ""):
        self.secret_key = secret_key or settings.STRIPE_SECRET_KEY or ""
        self.webhook_secret = webhook_secret or settings.STRIPE_WEBHOOK_SECRET or ""
        if self.secret_key:
            stripe.api_key = self.secret_key

    def calculate_split(self, order: Order, tenant: Tenant) -> SplitDetails:
        total = float(order.total_amount)
        platform_fee = round(total * (settings.PLATFORM_FEE_PERCENTAGE / 100.0), 2)
        tenant_payout = round(total - platform_fee, 2)

        return SplitDetails(
            total_amount=total,
            platform_fee=platform_fee,
            tenant_payout=tenant_payout,
            subaccount_code=tenant.stripe_account_id,
            currency=order.currency,
        )

    async def create_checkout_session(
        self,
        order: Order,
        tenant: Tenant,
        callback_url: str,
    ) -> CheckoutSessionResponse:
        split = self.calculate_split(order, tenant)
        amount_cents = int(split.total_amount * 100)
        platform_fee_cents = int(split.platform_fee * 100)

        if self.secret_key and tenant.stripe_account_id:
            try:
                # Direct Charge: The connected account (tenant admin) is the merchant of record and bears all Stripe processing fees directly.
                # The platform retains the application_fee_amount without paying Stripe card processing fees.
                direct_session_params: Dict[str, Any] = {
                    "payment_method_types": ["card"],
                    "line_items": [
                        {
                            "price_data": {
                                "currency": order.currency.lower(),
                                "unit_amount": amount_cents,
                                "product_data": {
                                    "name": f"Order #{order.gateway_reference}",
                                },
                            },
                            "quantity": 1,
                        }
                    ],
                    "mode": "payment",
                    "payment_intent_data": {
                        "application_fee_amount": platform_fee_cents,
                        "metadata": {
                            "order_id": str(order.id),
                            "tenant_id": str(tenant.id),
                            "tenant_slug": tenant.slug,
                        },
                    },
                    "success_url": f"{callback_url}?session_id={{CHECKOUT_SESSION_ID}}",
                    "cancel_url": f"{callback_url}?status=cancelled",
                    "client_reference_id": order.gateway_reference,
                    "customer_email": order.customer_email,
                }
                session = stripe.checkout.Session.create(
                    **direct_session_params,
                    stripe_account=tenant.stripe_account_id,
                )
                return CheckoutSessionResponse(
                    checkout_url=session.url or "",
                    reference=order.gateway_reference,
                    gateway="stripe",
                    split_details=split,
                )
            except Exception:
                # Fallback to destination charge if direct charge is restricted on tenant account
                try:
                    destination_session_params: Dict[str, Any] = {
                        "payment_method_types": ["card"],
                        "line_items": [
                            {
                                "price_data": {
                                    "currency": order.currency.lower(),
                                    "unit_amount": amount_cents,
                                    "product_data": {
                                        "name": f"Order #{order.gateway_reference}",
                                    },
                                },
                                "quantity": 1,
                            }
                        ],
                        "mode": "payment",
                        "payment_intent_data": {
                            "application_fee_amount": platform_fee_cents,
                            "transfer_data": {
                                "destination": tenant.stripe_account_id,
                            },
                            "metadata": {
                                "order_id": str(order.id),
                                "tenant_id": str(tenant.id),
                                "tenant_slug": tenant.slug,
                            },
                        },
                        "success_url": f"{callback_url}?session_id={{CHECKOUT_SESSION_ID}}",
                        "cancel_url": f"{callback_url}?status=cancelled",
                        "client_reference_id": order.gateway_reference,
                        "customer_email": order.customer_email,
                    }
                    session = stripe.checkout.Session.create(**destination_session_params)
                    return CheckoutSessionResponse(
                        checkout_url=session.url or "",
                        reference=order.gateway_reference,
                        gateway="stripe",
                        split_details=split,
                    )
                except Exception:
                    pass

        # Mock fallback for development
        mock_checkout_url = f"https://checkout.stripe.com/pay/{order.gateway_reference}"
        return CheckoutSessionResponse(
            checkout_url=mock_checkout_url,
            reference=order.gateway_reference,
            gateway="stripe",
            split_details=split,
        )

    async def verify_webhook_signature(
        self,
        raw_body: bytes,
        signature_header: str,
    ) -> bool:
        if not self.webhook_secret or not signature_header:
            return True

        try:
            stripe.Webhook.construct_event(
                payload=raw_body,
                sig_header=signature_header,
                secret=self.webhook_secret,
            )
            return True
        except Exception:
            return False

    async def parse_webhook_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        event_type = payload.get("type", "")
        data_obj = payload.get("data", {}).get("object", {})

        reference = data_obj.get("client_reference_id") or data_obj.get("id", "")
        status = "paid" if event_type in ["checkout.session.completed", "payment_intent.succeeded"] else "pending"

        return {
            "event_id": payload.get("id", ""),
            "event_type": event_type,
            "reference": reference,
            "status": status,
            "amount": float(data_obj.get("amount_total", data_obj.get("amount", 0))) / 100.0,
            "metadata": data_obj.get("metadata", {}),
        }

    async def verify_transaction(self, reference: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Verify Stripe checkout session or payment intent status via API or development fallback.
        """
        if self.secret_key and not self.secret_key.startswith("sk_test_placeholder") and session_id:
            try:
                session = stripe.checkout.Session.retrieve(session_id)
                return {
                    "status": "paid" if session.payment_status == "paid" else "pending",
                    "amount": float(session.amount_total or 0) / 100.0,
                    "gateway": "stripe",
                    "raw": {"id": session.id, "payment_status": session.payment_status},
                }
            except Exception:
                pass
        # Development / sandbox mock verification
        return {"status": "paid", "amount": 0.0, "gateway": "stripe"}

    async def create_express_onboarding_link(
        self,
        tenant: Tenant,
        return_url: str,
        refresh_url: str,
    ) -> Dict[str, Any]:
        """Creates or reuses Stripe Express Connected Account and returns hosted onboarding link."""
        account_id = tenant.stripe_account_id
        is_real_key = bool(self.secret_key and not self.secret_key.startswith("sk_test_placeholder"))
        if is_real_key:
            try:
                if not account_id:
                    account = stripe.Account.create(
                        type="express",
                        capabilities={
                            "card_payments": {"requested": True},
                            "transfers": {"requested": True},
                        },
                        business_profile={"name": tenant.name},
                    )
                    account_id = account.id

                account_link = stripe.AccountLink.create(
                    account=account_id,
                    refresh_url=refresh_url,
                    return_url=return_url,
                    type="account_onboarding",
                )
                return {
                    "account_id": account_id,
                    "onboarding_url": account_link.url,
                }
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stripe Connect error: {str(e)}",
                )

        # Development mock
        mock_id = f"acct_{tenant.slug[:10].replace('-', '')}"
        return {
            "account_id": mock_id,
            "onboarding_url": f"https://connect.stripe.com/express/onboarding/{mock_id}",
        }
