import re
import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Category display name")
    slug: Optional[str] = Field(default=None, max_length=100, description="URL slug")
    description: Optional[str] = Field(default=None, description="Category description / subtitle")
    icon: Optional[str] = Field(default=None, description="Icon identifier or emoji")
    display_order: int = Field(default=0, description="Order for display sorting")
    parent_id: Optional[uuid.UUID] = Field(default=None, description="Parent category UUID for nested categories")


class CategoryCreate(CategoryBase):
    @model_validator(mode="after")
    def validate_slug(self) -> "CategoryCreate":
        if not self.slug or not self.slug.strip():
            clean = re.sub(r"[^a-zA-Z0-9\s-]", "", self.name).strip().lower()
            self.slug = re.sub(r"[\s-]+", "-", clean) or f"cat-{uuid.uuid4().hex[:6]}"
        else:
            self.slug = self.slug.strip().lower()
        return self


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: Optional[int] = None
    parent_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


class CategoryResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: int = 0
    parent_id: Optional[uuid.UUID] = None
    product_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
