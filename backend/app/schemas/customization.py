import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CustomLandingPageRequestCreate(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "tenant_id": "948a3f81-e230-4131-b841-382947192301",
                "details": "We need a bespoke editorial look with a full-width video banner, custom lookbook section, and interactive recipe builder.",
                "primary_color": "#059669",
                "secondary_color": "#ec4899",
                "store_headline": "Artisanal Haute Couture Bakes",
                "contact_email": "admin@jazzcakes.com",
                "inspiration_urls": ["https://dribbble.com/example"],
            }
        },
    )

    tenant_id: Optional[uuid.UUID] = None
    tenant_slug: Optional[str] = None
    details: Optional[str] = Field(default=None, max_length=2000, description="Design specifications, custom layout requests, or notes")
    primary_color: Optional[str] = Field(default=None, max_length=50)
    secondary_color: Optional[str] = Field(default=None, max_length=50)
    store_headline: Optional[str] = Field(default=None, max_length=255)
    contact_email: Optional[str] = Field(default=None, max_length=255)
    inspiration_urls: Optional[List[str]] = Field(default=None)


class CustomizationRequestUpdate(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "status": "in_progress",
                "admin_notes": "Assigned to Senior Frontend Designer. Wireframes pending client review.",
            }
        },
    )

    status: Optional[str] = Field(default=None, description="pending, in_review, in_progress, completed, rejected")
    admin_notes: Optional[str] = Field(default=None, max_length=2000)


class CustomizationRequestResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "a98240f9-1a0c-4e31-8294-7192301948a3",
                "tenant_id": "948a3f81-e230-4131-b841-382947192301",
                "tenant_name": "Jazz Cakes Ltd",
                "tenant_slug": "jazz-cakes-ltd",
                "requested_by_email": "admin@jazzcakes.com",
                "request_type": "custom_landing_page",
                "status": "pending",
                "title": "Custom Landing Page Request",
                "details": "We need a bespoke editorial look with video background.",
                "primary_color": "#059669",
                "secondary_color": "#ec4899",
                "store_headline": "Artisanal Haute Couture Bakes",
                "admin_notes": None,
                "created_at": "2026-10-05T12:00:00Z",
                "updated_at": "2026-10-05T12:00:00Z",
            }
        },
    )

    id: uuid.UUID
    tenant_id: uuid.UUID
    tenant_name: str
    tenant_slug: str
    requested_by_email: Optional[str] = None
    request_type: str
    status: str
    title: str
    details: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    store_headline: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class TenantBrandingSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: uuid.UUID
    name: str
    slug: str
    category: str
    country: str
    currency: str
    custom_domain: Optional[str] = None
    primary_color: str
    secondary_color: str
    landing_page_type: str  # "default" or "custom"
    has_custom_request: bool
    custom_request_status: Optional[str] = None
    logo_url: Optional[str] = None
    store_headline: Optional[str] = None
    announcement_text: Optional[str] = None
    is_active: bool
    updated_at: datetime
