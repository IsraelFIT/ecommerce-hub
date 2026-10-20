import re
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field, model_validator, field_validator


class ProductClass(str, Enum):
    PHYSICAL = "physical"
    DIGITAL = "digital"
    SERVICE = "service"


class ProductVariantBase(BaseModel):
    sku: str = Field(..., max_length=100, description="Unique variant SKU")
    price: float = Field(..., gt=0, description="Variant price")
    compare_at_price: Optional[float] = Field(default=None, description="Original/compare price")
    track_inventory: bool = Field(default=True, description="Whether to track stock inventory")
    stock_quantity: int = Field(default=0, ge=0, description="Stock inventory quantity")
    options: Dict[str, Any] = Field(
        default_factory=dict,
        description="Variant options key-values e.g. {'Size': 'XL', 'Color': 'Red'} or {'Color': ['Blue', 'Green']}",
    )


class ProductVariantCreate(ProductVariantBase):
    pass


class ProductVariantUpdate(BaseModel):
    id: Optional[uuid.UUID] = None
    sku: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    compare_at_price: Optional[float] = None
    track_inventory: Optional[bool] = None
    stock_quantity: Optional[int] = Field(default=None, ge=0)
    options: Optional[Dict[str, Any]] = None


class ProductVariantResponse(ProductVariantBase):
    id: uuid.UUID
    product_id: Optional[uuid.UUID] = None
    tenant_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    slug: str = Field(..., min_length=1, max_length=255, description="Product URL slug")
    description: Optional[str] = Field(default=None, description="Detailed product description")
    product_class: ProductClass = Field(default=ProductClass.PHYSICAL, description="Product class (physical, digital, service)")
    specifications: Dict[str, Any] = Field(default_factory=dict, description="Dynamic JSONB metadata e.g. {'brand': 'Sony'}")
    filters: Dict[str, List[str]] = Field(default_factory=dict, description="Selected filter values e.g. {'dietary': ['Vegan']}")
    category_id: Optional[uuid.UUID] = None
    category: Optional[str] = Field(default="General", description="Category name alias")
    images: List[str] = Field(default_factory=list, max_length=5, description="Product image URLs (max 5)")
    availability: Optional[str] = Field(default="available", description="Product availability: 'available' or 'preorder'")
    is_published: bool = Field(default=True, description="Publish status")

    @field_validator("images")
    @classmethod
    def validate_max_images(cls, v: Optional[List[str]]) -> List[str]:
        if v and len(v) > 5:
            raise ValueError("A maximum of 5 images can be uploaded per product")
        return v or []


class ProductCreate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None  # Backwards compatibility alias
    slug: Optional[str] = None
    description: Optional[str] = None
    product_class: ProductClass = ProductClass.PHYSICAL
    specifications: Dict[str, Any] = Field(default_factory=dict)
    filters: Dict[str, List[str]] = Field(default_factory=dict)
    category_id: Optional[uuid.UUID] = None
    category: Optional[str] = "General"
    images: List[str] = Field(default_factory=list, max_length=5, description="Product image URLs (max 5)")
    availability: Optional[str] = "available"
    is_published: bool = True
    variants: List[ProductVariantCreate] = Field(default_factory=list)

    @field_validator("images")
    @classmethod
    def validate_create_images(cls, v: Optional[List[str]]) -> List[str]:
        if v and len(v) > 5:
            raise ValueError("A maximum of 5 images can be uploaded per product")
        return v or []

    # Legacy fallback fields
    sku: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    inventory_count: Optional[int] = None

    @model_validator(mode="after")
    def validate_name_and_slug(self) -> "ProductCreate":
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
    name: Optional[str] = None
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    product_class: Optional[ProductClass] = None
    specifications: Optional[Dict[str, Any]] = None
    filters: Optional[Dict[str, List[str]]] = None
    category_id: Optional[uuid.UUID] = None
    category: Optional[str] = None
    images: Optional[List[str]] = Field(default=None, max_length=5, description="Product image URLs (max 5)")
    availability: Optional[str] = None
    is_published: Optional[bool] = None
    variants: Optional[List[ProductVariantUpdate]] = None

    @field_validator("images")
    @classmethod
    def validate_update_images(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None and len(v) > 5:
            raise ValueError("A maximum of 5 images can be uploaded per product")
        return v

    # Legacy flat fields
    sku: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    inventory_count: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class ProductResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    title: Optional[str] = None  # Backwards compatibility alias
    slug: str
    description: Optional[str] = None
    product_class: ProductClass
    specifications: Dict[str, Any] = Field(default_factory=dict)
    filters: Dict[str, List[str]] = Field(default_factory=dict)
    category_id: Optional[uuid.UUID] = None
    category: Optional[str] = None
    images: List[str] = Field(default_factory=list, max_length=5, description="Product image URLs (max 5)")
    availability: Optional[str] = "available"
    is_published: bool = True
    variants: List[ProductVariantResponse] = Field(default_factory=list)

    # Computed legacy fields
    sku: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = "NGN"
    inventory_count: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Ratings and Likes
    average_rating: Optional[float] = 0.0
    reviews_count: Optional[int] = 0
    is_liked: Optional[bool] = False
    likes_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class ProductVariantSummaryResponse(BaseModel):
    id: uuid.UUID
    sku: Optional[str] = None
    price: float
    track_inventory: bool = True
    stock_quantity: int = 0

    model_config = ConfigDict(from_attributes=True)


class ProductMenuSummaryResponse(BaseModel):
    id: uuid.UUID
    tenant_id: Optional[uuid.UUID] = None
    name: str
    description: Optional[str] = None
    product_class: ProductClass = ProductClass.PHYSICAL
    category: Optional[str] = None
    images: List[str] = Field(default_factory=list, description="Primary product image URL (max 1)")
    price: Optional[float] = None
    currency: Optional[str] = "NGN"
    inventory_count: Optional[int] = None

    # Ratings and Likes
    average_rating: Optional[float] = 0.0
    reviews_count: Optional[int] = 0
    is_liked: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


class ProductSummaryResponse(BaseModel):
    id: uuid.UUID
    tenant_id: Optional[uuid.UUID] = None
    name: str
    slug: str
    description: Optional[str] = None
    product_class: ProductClass = ProductClass.PHYSICAL
    category: Optional[str] = None
    images: List[str] = Field(default_factory=list, description="Product image URLs")
    availability: Optional[str] = "available"
    is_published: bool = True
    filters: Dict[str, List[str]] = Field(default_factory=dict)
    price: Optional[float] = None
    currency: Optional[str] = "NGN"
    inventory_count: Optional[int] = None

    # Ratings and Likes
    average_rating: Optional[float] = 0.0
    reviews_count: Optional[int] = 0
    is_liked: Optional[bool] = False
    likes_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


