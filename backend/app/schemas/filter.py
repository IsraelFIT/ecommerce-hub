import re
import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator


class FilterBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Filter display name e.g. Dietary, Occasion")
    slug: Optional[str] = Field(default=None, max_length=100, description="Unique slug for this filter group")
    filter_type: str = Field(default="checkbox", description="UI filter type: checkbox, pills, or radio")
    options: List[str] = Field(default_factory=list, description="Available selectable options e.g. ['Vegan', 'Gluten Free']")
    is_active: bool = Field(default=True, description="Whether this filter is enabled")
    display_order: int = Field(default=0, description="Display order")


class FilterCreate(FilterBase):
    @model_validator(mode="after")
    def validate_slug(self) -> "FilterCreate":
        if not self.slug or not self.slug.strip():
            clean = re.sub(r"[^a-zA-Z0-9\s-]", "", self.name).strip().lower()
            self.slug = re.sub(r"[\s-]+", "-", clean) or f"filter-{uuid.uuid4().hex[:6]}"
        else:
            self.slug = self.slug.strip().lower()
        return self


class FilterUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    slug: Optional[str] = None
    filter_type: Optional[str] = None
    options: Optional[List[str]] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class FilterResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    slug: str
    filter_type: str = "checkbox"
    options: List[str] = Field(default_factory=list)
    is_active: bool = True
    display_order: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
