import uuid
from typing import List, Dict, Any, Optional, Union
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

    product_id: Union[uuid.UUID, str]
    title: Optional[str] = None
    quantity: int = Field(..., gt=0)
    unit_price: Optional[float] = None
    image: Optional[str] = None
    options: Optional[Dict[str, Any]] = None


class OrderCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "5223232f-9c0c-4847-ae88-a64ccc9dff7d",
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

    user_id: Optional[uuid.UUID] = None
    customer_email: EmailStr
    customer_name: str = Field(..., min_length=2)
    items: List[OrderItem] = Field(..., min_length=1)
    payment_gateway: str = Field(default="paystack")
    currency: Optional[str] = None
    delivery_fee: Optional[float] = 0.0
    fulfillment_type: Optional[str] = "pickup"
    delivery_address: Optional[Dict[str, Any]] = None
    fulfillment_date: Optional[str] = None
    fulfillment_time: Optional[str] = None
    gift_message: Optional[str] = None


class OrderResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "18492048-e230-4131-b841-382947192301",
                "tenant_id": "948a3f81-e230-4131-b841-382947192301",
                "user_id": "5223232f-9c0c-4847-ae88-a64ccc9dff7d",
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
    user_id: Optional[uuid.UUID] = None
    customer_email: str
    customer_name: str
    customer_avatar_url: Optional[str] = None
    total_amount: float
    platform_fee: float
    tenant_payout_amount: float
    currency: str
    status: OrderStatus
    payment_gateway: str
    gateway_reference: str
    items: List[Dict[str, Any]]
    metadata_json: Dict[str, Any]
    subtotal: Optional[float] = None
    delivery_fee: Optional[float] = None
    tax_rate: Optional[float] = None
    tax_title: Optional[str] = None
    tax_amount: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class OrderCalculateRequest(BaseModel):
    items: List[OrderItem] = Field(..., min_length=1)
    fulfillment_type: Optional[str] = "pickup"
    currency: Optional[str] = None


class OrderCalculateResponse(BaseModel):
    items: List[Dict[str, Any]]
    subtotal: float
    delivery_fee: float
    tax_rate: float
    tax_title: str
    tax_amount: float
    total_amount: float
    currency: str


class OrderStatusUpdate(BaseModel):
    status: str
    tracking_notes: Optional[str] = None


class OrderCancelRequest(BaseModel):
    reason: Optional[str] = None
    customer_email: Optional[str] = None

