import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class CartItemSchema(BaseModel):
    id: str = Field(..., description="Product ID")
    name: str = Field(..., description="Product Title / Name")
    price: float = Field(..., ge=0, description="Unit Price")
    image: Optional[str] = Field(default=None, description="Product Image URL")
    description: Optional[str] = Field(default=None, description="Product Description")
    quantity: int = Field(default=1, ge=1, description="Quantity")
    options: Optional[Dict[str, Any]] = Field(default=None, description="Dynamic variant options / subfields")
    stock_quantity: Optional[int] = Field(default=None, description="Available stock quantity")
    track_inventory: Optional[bool] = Field(default=None, description="Whether stock inventory is tracked")
    product_id: Optional[str] = Field(default=None, description="Parent Product ID if variant")

    model_config = {"extra": "allow"}


class CartSyncRequest(BaseModel):
    items: List[CartItemSchema] = Field(default_factory=list)


class CartMergeRequest(BaseModel):
    items: List[CartItemSchema] = Field(default_factory=list)


class CartResponse(BaseModel):
    items: List[Dict[str, Any]] = Field(default_factory=list)
    tenant_id: Optional[uuid.UUID] = None
    tenant_slug: Optional[str] = None
    updated_at: Optional[datetime] = None
