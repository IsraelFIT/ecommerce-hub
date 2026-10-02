from abc import ABC, abstractmethod
from typing import Dict, Any
from app.models.tenant import Tenant
from app.models.order import Order
from app.schemas.payment import CheckoutSessionResponse, SplitDetails


class PaymentProvider(ABC):
    """
    Abstract Base Class for pluggable payment gateway providers.
    Enforces automatic subaccount routing & gateway-level fee splitting.
    """

    @abstractmethod
    def calculate_split(self, order: Order, tenant: Tenant) -> SplitDetails:
        """Calculates platform commission and tenant payout amounts."""
        pass

    @abstractmethod
    async def create_checkout_session(
        self,
        order: Order,
        tenant: Tenant,
        callback_url: str,
    ) -> CheckoutSessionResponse:
        """Initializes a split payment session with the gateway."""
        pass

    @abstractmethod
    async def verify_webhook_signature(
        self,
        raw_body: bytes,
        signature_header: str,
    ) -> bool:
        """Validates the raw HMAC signature from the webhook request."""
        pass

    @abstractmethod
    async def parse_webhook_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Extracts normalized order reference and payment status from the webhook payload."""
        pass
