"""Pydantic schemas for products, variants, and catalog responses."""

import re
import uuid
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ProductClass(str, Enum):
    """Supported product fulfillment classes."""

    PHYSICAL = "physical"
    DIGITAL = "digital"
    SERVICE = "service"


class ProductVariantBase(BaseModel):
    """Base fields for a product SKU variant."""

    sku: str = Field(..., max_length=100, description="Unique variant SKU")
    price: float = Field(..., gt=0, description="Variant price")
    compare_at_price: float | None = Field(default=None, description="Original/compare price")
    track_inventory: bool = Field(default=True, description="Whether to track stock inventory")
    stock_quantity: int = Field(default=0, ge=0, description="Stock inventory quantity")
    options: dict[str, Any] = Field(
        default_factory=dict,
        description="Variant options key-values e.g. {'Size': 'XL', 'Color': 'Red'} or {'Color': ['Blue', 'Green']}",
    )


class ProductVariantCreate(ProductVariantBase):
    """Payload for creating a product variant."""


class ProductVariantUpdate(BaseModel):
    """Partial update payload for a product variant."""

    id: uuid.UUID | None = None
    sku: str | None = None
    price: float | None = Field(default=None, gt=0)
    compare_at_price: float | None = None
    track_inventory: bool | None = None
    stock_quantity: int | None = Field(default=None, ge=0)
    options: dict[str, Any] | None = None


class ProductVariantResponse(ProductVariantBase):
    """Serialized product variant response."""

    id: uuid.UUID
    product_id: uuid.UUID | None = None
    tenant_id: uuid.UUID | None = None

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    """Shared product attributes."""

    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    slug: str = Field(..., min_length=1, max_length=255, description="Product URL slug")
    description: str | None = Field(default=None, description="Detailed product description")
    product_class: ProductClass = Field(
        default=ProductClass.PHYSICAL, description="Product class (physical, digital, service)"
    )
    specifications: dict[str, Any] = Field(
        default_factory=dict, description="Dynamic JSONB metadata e.g. {'brand': 'Sony'}"
    )
    filters: dict[str, list[str]] = Field(
        default_factory=dict, description="Selected filter values e.g. {'dietary': ['Vegan']}"
    )
    category_id: uuid.UUID | None = None
    category: str | None = Field(default="General", description="Category name alias")
    images: list[str] = Field(
        default_factory=list, max_length=5, description="Product image URLs (max 5)"
    )
    availability: str | None = Field(
        default="available", description="Product availability: 'available' or 'preorder'"
    )
    is_published: bool = Field(default=True, description="Publish status")
    is_featured: bool = Field(
        default=False, description="Whether product is featured in storefront collection"
    )

    @field_validator("images")
    @classmethod
    def validate_max_images(cls, v: list[str] | None) -> list[str]:
        """Ensure a product does not exceed 5 image URLs."""
        if v and len(v) > 5:
            raise ValueError("A maximum of 5 images can be uploaded per product")
        return v or []


class ProductCreate(BaseModel):
    """Payload for creating a new product."""

    name: str | None = None
    title: str | None = None  # Backwards compatibility alias
    slug: str | None = None
    description: str | None = None
    product_class: ProductClass = ProductClass.PHYSICAL
    specifications: dict[str, Any] = Field(default_factory=dict)
    filters: dict[str, list[str]] = Field(default_factory=dict)
    category_id: uuid.UUID | None = None
    category: str | None = "General"
    images: list[str] = Field(
        default_factory=list, max_length=5, description="Product image URLs (max 5)"
    )
    availability: str | None = "available"
    is_published: bool = True
    is_featured: bool = False
    variants: list[ProductVariantCreate] = Field(default_factory=list)

    @field_validator("images")
    @classmethod
    def validate_create_images(cls, v: list[str] | None) -> list[str]:
        """Ensure a newly created product does not exceed 5 image URLs."""
        if v and len(v) > 5:
            raise ValueError("A maximum of 5 images can be uploaded per product")
        return v or []

    # Legacy fallback fields
    sku: str | None = None
    price: float | None = None
    currency: str | None = None
    inventory_count: int | None = None

    @model_validator(mode="after")
    def validate_name_and_slug(self) -> "ProductCreate":
        """Normalize product name/title, generate slug if missing, and ensure default variant."""
        resolved_name = self.name or self.title or "Untitled Product"
        self.name = resolved_name
        self.title = resolved_name

        if not self.slug or not self.slug.strip():
            clean_title = re.sub(r"[^a-zA-Z0-9\s-]", "", resolved_name).strip().lower()
            self.slug = re.sub(r"[\s-]+", "-", clean_title) or f"product-{uuid.uuid4().hex[:8]}"
        else:
            self.slug = self.slug.strip().lower()

        # If no variants provided, create default variant from legacy flat fields
        if not self.variants:
            default_sku = self.sku or f"SKU-{uuid.uuid4().hex[:6].upper()}"
            default_price = self.price if (self.price is not None and self.price > 0) else 100.0
            default_stock = self.inventory_count if self.inventory_count is not None else 0
            is_physical = self.product_class == ProductClass.PHYSICAL
            self.variants = [
                ProductVariantCreate(
                    sku=default_sku,
                    price=default_price,
                    track_inventory=is_physical,
                    stock_quantity=default_stock if is_physical else 0,
                    options={},
                )
            ]

        return self


class ProductUpdate(BaseModel):
    """Partial update payload for an existing product."""

    name: str | None = None
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    product_class: ProductClass | None = None
    specifications: dict[str, Any] | None = None
    filters: dict[str, list[str]] | None = None
    category_id: uuid.UUID | None = None
    category: str | None = None
    images: list[str] | None = Field(
        default=None, max_length=5, description="Product image URLs (max 5)"
    )
    availability: str | None = None
    is_published: bool | None = None
    is_featured: bool | None = None
    variants: list[ProductVariantUpdate] | None = None

    @field_validator("images")
    @classmethod
    def validate_update_images(cls, v: list[str] | None) -> list[str] | None:
        """Ensure updated product images do not exceed 5 URLs."""
        if v is not None and len(v) > 5:
            raise ValueError("A maximum of 5 images can be uploaded per product")
        return v

    # Legacy flat fields
    sku: str | None = None
    price: float | None = None
    currency: str | None = None
    inventory_count: int | None = None

    model_config = ConfigDict(from_attributes=True)


class ProductResponse(BaseModel):
    """Full serialized product response."""

    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    title: str | None = None  # Backwards compatibility alias
    slug: str
    description: str | None = None
    product_class: ProductClass
    specifications: dict[str, Any] = Field(default_factory=dict)
    filters: dict[str, list[str]] = Field(default_factory=dict)
    category_id: uuid.UUID | None = None
    category: str | None = None
    images: list[str] = Field(
        default_factory=list, max_length=5, description="Product image URLs (max 5)"
    )
    availability: str | None = "available"
    is_published: bool = True
    is_featured: bool = False
    variants: list[ProductVariantResponse] = Field(default_factory=list)

    # Computed legacy fields
    sku: str | None = None
    price: float | None = None
    currency: str | None = "NGN"
    inventory_count: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    # Ratings and Likes
    average_rating: float | None = 0.0
    reviews_count: int | None = 0
    is_liked: bool | None = False
    units_sold: int | None = 0
    likes_count: int | None = 0

    model_config = ConfigDict(from_attributes=True)


class ProductVariantSummaryResponse(BaseModel):
    """Lightweight variant summary for catalog listings."""

    id: uuid.UUID
    sku: str | None = None
    price: float
    track_inventory: bool = True
    stock_quantity: int = 0

    model_config = ConfigDict(from_attributes=True)


class ProductMenuSummaryResponse(BaseModel):
    """Storefront menu product summary."""

    id: uuid.UUID
    tenant_id: uuid.UUID | None = None
    name: str
    description: str | None = None
    product_class: ProductClass = ProductClass.PHYSICAL
    category: str | None = None
    images: list[str] = Field(default_factory=list, description="Primary product image URL (max 1)")
    price: float | None = None
    currency: str | None = "NGN"
    inventory_count: int | None = None
    is_featured: bool = False

    # Ratings and Likes
    average_rating: float | None = 0.0
    reviews_count: int | None = 0
    is_liked: bool | None = False
    units_sold: int | None = 0

    model_config = ConfigDict(from_attributes=True)


class ProductSummaryResponse(BaseModel):
    """Admin/catalog product summary."""

    id: uuid.UUID
    tenant_id: uuid.UUID | None = None
    name: str
    slug: str
    description: str | None = None
    product_class: ProductClass = ProductClass.PHYSICAL
    category: str | None = None
    images: list[str] = Field(default_factory=list, description="Product image URLs")
    availability: str | None = "available"
    is_published: bool = True
    is_featured: bool = False
    filters: dict[str, list[str]] = Field(default_factory=dict)
    price: float | None = None
    currency: str | None = "NGN"
    inventory_count: int | None = None

    # Ratings and Likes
    average_rating: float | None = 0.0
    reviews_count: int | None = 0
    is_liked: bool | None = False
    units_sold: int | None = 0
    likes_count: int | None = 0

    model_config = ConfigDict(from_attributes=True)
