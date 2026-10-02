from typing import Dict, Any, Optional
from pydantic import BaseModel, ConfigDict


class WebhookResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "received": True,
                "message": "Webhook acknowledged for asynchronous processing",
            }
        }
    )

    received: bool = True
    message: str = "Webhook acknowledged for asynchronous processing"


class GenericWebhookEvent(BaseModel):
    model_config = ConfigDict(
        extra="allow",
        json_schema_extra={
            "example": {
                "event": "charge.success",
                "data": {
                    "id": 9832104,
                    "reference": "ECH-CAKES-BY-BODE-A9B2C3",
                    "amount": 14000,
                    "currency": "USD",
                    "status": "success",
                },
            }
        },
    )

    event: str
    data: Dict[str, Any]
