import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Product title")
    slug: str = Field(..., min_length=1, max_length=255, description="Product URL slug")
    description: Optional[str] = Field(default=None, description="Detailed product description")
    price: float = Field(..., gt=0, description="Unit price")
    currency: str = Field(default="USD", max_length=3, description="Currency code (e.g. USD, NGN)")
    inventory_count: int = Field(default=0, ge=0, description="Available stock quantity")
    images: List[str] = Field(default_factory=list, description="Product image URLs")
    is_published: bool = Field(default=True, description="Publish status")


class ProductCreate(ProductBase):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Valrhona Triple Dark Chocolate Cake",
                "slug": "valrhona-triple-chocolate",
                "description": "Rich 70% dark chocolate sponge layered with silky ganache",
                "price": 140.0,
                "currency": "USD",
                "inventory_count": 25,
                "images": ["https://cdn.ecommerce-hub.com/img/cake_valrhona.jpg"],
                "is_published": True,
            }
        }
    )


class ProductUpdate(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "title": "Valrhona Triple Dark Chocolate Cake (Deluxe)",
                "price": 155.0,
                "inventory_count": 30,
                "is_published": True,
            }
        },
    )

    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    currency: Optional[str] = None
    inventory_count: Optional[int] = Field(default=None, ge=0)
    images: Optional[List[str]] = None
    is_published: Optional[bool] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "948a3f81-e230-4131-b841-382947192301",
                "tenant_id": "948a3f81-e230-4131-b841-382947192301",
                "title": "Valrhona Triple Dark Chocolate Cake",
                "slug": "valrhona-triple-chocolate",
                "description": "Rich 70% dark chocolate sponge layered with silky ganache",
                "price": 140.0,
                "currency": "USD",
                "inventory_count": 25,
                "images": ["https://cdn.ecommerce-hub.com/img/cake_valrhona.jpg"],
                "is_published": True,
                "created_at": "2026-09-23T10:15:30Z",
                "updated_at": "2026-09-23T10:15:30Z",
            }
        },
    )

    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
