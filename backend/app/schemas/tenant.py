import uuid
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.tenant import BackendType


class BrandingConfig(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        extra="allow",
        json_schema_extra={
            "example": {
                "primaryColor": "#059669",
                "secondaryColor": "#ec4899",
                "accentColor": "#ec4899",
                "landingPageType": "default",
                "customLandingPageStatus": "none",
                "logoUrl": "https://cdn.ecommerce-hub.com/logos/cakes-by-bode.png",
                "tagline": "Handcrafted artisanal pastries and custom bakes",
                "storeHeadline": "Official Online Store",
                "announcementText": "Free standard shipping on all domestic orders over $75 ✨",
            }
        },
    )

    primaryColor: str = Field(default="#059669", description="Primary brand hex color")
    secondaryColor: Optional[str] = Field(default="#ec4899", description="Secondary brand hex color")
    accentColor: str = Field(default="#ec4899", description="Accent brand hex color")
    landingPageType: str = Field(default="default", description="Storefront landing page mode: 'default' or 'custom'")
    customLandingPageStatus: Optional[str] = Field(default="none", description="Request status: 'none', 'pending', 'in_progress', 'completed'")
    logoUrl: Optional[str] = Field(default=None, description="URL to tenant logo image")
    tagline: Optional[str] = Field(default="Welcome to our store", description="Store tagline")
    storeHeadline: Optional[str] = Field(default=None, description="Store headline on live site")
    announcementText: Optional[str] = Field(default=None, description="Announcement banner text")
    bannerUrl: Optional[str] = Field(default=None, description="Banner image URL")


class TenantBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Tenant organization name")
    slug: str = Field(..., min_length=2, max_length=100, pattern="^[a-z0-9-]+$", description="Unique subdomain slug")
    category: Optional[str] = Field(default="General", max_length=100, description="Business vertical / store category")
    country: str = Field(default="Nigeria", max_length=100, description="Country / Primary Operating Market")
    currency: str = Field(default="NGN", max_length=10, description="Default operational currency code (e.g. NGN, USD, GBP, EUR)")
    custom_domain: Optional[str] = Field(default=None, max_length=255)
    backend_type: BackendType = Field(default=BackendType.POSTGRES)
    sanity_dataset: Optional[str] = Field(default=None, max_length=100)
    sanity_project_id: Optional[str] = Field(default=None, max_length=100)
    default_gateway: str = Field(default="paystack")
    branding_config: BrandingConfig = Field(default_factory=BrandingConfig)


class TenantCreate(TenantBase):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Cakes by Bode",
                "slug": "cakes-by-bode",
                "category": "Bakery & Confectionery",
                "country": "Nigeria",
                "currency": "NGN",
                "custom_domain": "shop.cakesbybode.com",
                "backend_type": "postgres",
                "default_gateway": "paystack",
                "branding_config": {
                    "primaryColor": "#6366f1",
                    "accentColor": "#ec4899",
                    "logoUrl": "https://cdn.ecommerce-hub.com/logos/cakes-by-bode.png",
                    "tagline": "Handcrafted artisanal pastries and custom bakes",
                },
                "paystack_subaccount_code": "ACCT_983210948",
                "stripe_account_id": "acct_1NZX84920481",
                "sanity_dataset": "production",
                "sanity_project_id": "prj_948201",
            }
        }
    )

    paystack_subaccount_code: Optional[str] = None
    stripe_account_id: Optional[str] = None


class TenantUpdate(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "name": "Cakes by Bode & Pastries",
                "category": "Bakery & Confectionery",
                "country": "Nigeria",
                "currency": "NGN",
                "custom_domain": "shop.cakesbybode.com",
                "backend_type": "sanity",
                "sanity_project_id": "prj_948201",
                "sanity_dataset": "production-cakes-by-bode",
                "default_gateway": "paystack",
                "branding_config": {
                    "primaryColor": "#4f46e5",
                    "accentColor": "#f43f5e",
                    "logoUrl": "https://cdn.ecommerce-hub.com/logos/new-logo.png",
                    "tagline": "Luxury artisanal bakes and wedding cakes",
                },
            }
        },
    )

    name: Optional[str] = None
    category: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = None
    custom_domain: Optional[str] = None
    backend_type: Optional[BackendType] = None
    sanity_dataset: Optional[str] = None
    sanity_project_id: Optional[str] = None
    default_gateway: Optional[str] = None
    branding_config: Optional[BrandingConfig] = None
    paystack_subaccount_code: Optional[str] = None
    stripe_account_id: Optional[str] = None


class TenantResponse(TenantBase):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "948a3f81-e230-4131-b841-382947192301",
                "name": "Cakes by Bode",
                "slug": "cakes-by-bode",
                "category": "Bakery & Confectionery",
                "custom_domain": "shop.cakesbybode.com",
                "backend_type": "postgres",
                "sanity_dataset": "production-cakes-by-bode",
                "sanity_project_id": "prj_948201",
                "default_gateway": "stripe",
                "branding_config": {
                    "primaryColor": "#6366f1",
                    "accentColor": "#ec4899",
                    "logoUrl": "https://cdn.ecommerce-hub.com/logos/cakes-by-bode.png",
                    "tagline": "Handcrafted artisanal pastries and custom bakes",
                },
                "is_active": True,
                "created_at": "2026-09-23T10:15:30Z",
                "updated_at": "2026-09-23T10:15:30Z",
            }
        },
    )

    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

