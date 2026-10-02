import uuid
from typing import List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.order import OrderStatus


class OrderItem(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "product_id": "948a3f81-e230-4131-b841-382947192301",
                "title": "Valrhona Triple Dark Chocolate Cake",
                "quantity": 1,
                "unit_price": 140.0,
            }
        }
    )

    product_id: uuid.UUID
    title: str
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)


class OrderCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "customer_email": "jane@example.com",
                "customer_name": "Jane Doe",
                "items": [
                    {
                        "product_id": "948a3f81-e230-4131-b841-382947192301",
                        "title": "Valrhona Triple Dark Chocolate Cake",
                        "quantity": 1,
                        "unit_price": 140.0,
                    }
                ],
                "payment_gateway": "stripe",
            }
        }
    )

    customer_email: EmailStr
    customer_name: str = Field(..., min_length=2)
    items: List[OrderItem] = Field(..., min_length=1)
    payment_gateway: str = Field(default="paystack")


class OrderResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "18492048-e230-4131-b841-382947192301",
                "tenant_id": "948a3f81-e230-4131-b841-382947192301",
                "customer_email": "jane@example.com",
                "customer_name": "Jane Doe",
                "total_amount": 140.0,
                "platform_fee": 3.5,
                "tenant_payout_amount": 136.5,
                "currency": "USD",
                "status": "pending",
                "payment_gateway": "stripe",
                "gateway_reference": "ECH-CAKES-BY-BODE-A9B2C3",
                "items": [
                    {
                        "product_id": "948a3f81-e230-4131-b841-382947192301",
                        "title": "Valrhona Triple Dark Chocolate Cake",
                        "quantity": 1,
                        "unit_price": 140.0,
                    }
                ],
                "metadata_json": {
                    "tenant_slug": "cakes-by-bode",
                    "subaccount_used": "acct_1NZX84920481",
                },
                "created_at": "2026-09-23T10:15:30Z",
                "updated_at": "2026-09-23T10:15:30Z",
            }
        },
    )

    id: uuid.UUID
    tenant_id: uuid.UUID
    customer_email: str
    customer_name: str
    total_amount: float
    platform_fee: float
    tenant_payout_amount: float
    currency: str
    status: OrderStatus
    payment_gateway: str
    gateway_reference: str
    items: List[Dict[str, Any]]
    metadata_json: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
