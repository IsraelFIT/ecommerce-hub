import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.tenant import BackendType


class BrandingConfig(BaseModel):
    """Storefront branding, theme, and page content configuration."""

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
                "logoUrl": "https://cdn.kiyostores.space/logos/cakes-by-bode.png",
                "tagline": "Handcrafted artisanal pastries and custom bakes",
                "storeHeadline": "Official Online Store",
                "announcementText": "Free standard shipping on all domestic orders over $75 ✨",
            }
        },
    )

    primaryColor: str = Field(default="#059669", description="Primary brand hex color")
    secondaryColor: str | None = Field(
        default="#ec4899", description="Secondary brand hex color"
    )
    accentColor: str = Field(default="#ec4899", description="Accent brand hex color")
    landingPageType: str = Field(
        default="default",
        description="Storefront landing page mode: 'default' or 'custom'",
    )
    customLandingPageStatus: str | None = Field(
        default="none",
        description="Request status: 'none', 'pending', 'in_progress', 'completed'",
    )
    logoUrl: str | None = Field(default=None, description="URL to tenant logo image")
    tagline: str | None = Field(
        default="Welcome to our store", description="Store tagline"
    )
    storeHeadline: str | None = Field(
        default=None, description="Store headline on live site"
    )
    announcementText: str | None = Field(
        default=None, description="Announcement banner text"
    )
    bannerUrl: str | None = Field(default=None, description="Banner image URL")
    pickupLocationName: str | None = Field(
        default=None, description="Pickup location title"
    )
    pickupAddress: str | None = Field(
        default=None, description="Pickup location street address"
    )
    pickupHours: str | None = Field(default=None, description="Pickup operating hours")
    deliveryFee: float | None = Field(
        default=45.0, description="Standard delivery fee amount"
    )
    deliveryInstruction: str | None = Field(
        default=None, description="Custom delivery instructions/terms"
    )
    pickupInstruction: str | None = Field(
        default=None, description="Custom pickup instructions/terms"
    )
    settlementBank: str | None = Field(default=None, description="Bank settlement code")
    settlementBankName: str | None = Field(
        default=None, description="Bank settlement name"
    )
    settlementAccount: str | None = Field(
        default=None, description="NUBAN settlement account number"
    )
    settlementAccountName: str | None = Field(
        default=None, description="Verified account holder name"
    )

    # Hero & Background images
    heroBackgroundUrl: str | None = Field(
        default=None, description="Hero background image URL"
    )
    aboutBackgroundUrl: str | None = Field(
        default=None, description="About section background image URL"
    )
    contactBackgroundUrl: str | None = Field(
        default=None, description="Contact section background image URL"
    )

    # About Content
    aboutBadge: str | None = Field(default=None, description="About section top badge")
    aboutTitle: str | None = Field(default=None, description="About section main title")
    aboutDescription: str | None = Field(
        default=None, description="About section main description / story"
    )
    aboutSecondaryDescription: str | None = Field(
        default=None, description="About section secondary story paragraph"
    )
    aboutMission: str | None = Field(
        default=None, description="About mission statement"
    )
    aboutImageUrl: str | None = Field(
        default=None, description="About showcase card image URL"
    )
    aboutCardBadge: str | None = Field(default=None, description="Showcase card badge")
    aboutCardTitle: str | None = Field(default=None, description="Showcase card title")
    aboutCardDescription: str | None = Field(
        default=None, description="Showcase card description"
    )
    aboutFeature1Title: str | None = Field(default=None, description="Feature 1 Title")
    aboutFeature1Desc: str | None = Field(
        default=None, description="Feature 1 Description"
    )
    aboutFeature2Title: str | None = Field(default=None, description="Feature 2 Title")
    aboutFeature2Desc: str | None = Field(
        default=None, description="Feature 2 Description"
    )
    aboutFeature3Title: str | None = Field(default=None, description="Feature 3 Title")
    aboutFeature3Desc: str | None = Field(
        default=None, description="Feature 3 Description"
    )

    # Contact Content
    contactBadge: str | None = Field(
        default=None, description="Contact section top badge"
    )
    contactHeading: str | None = Field(
        default=None, description="Contact section heading"
    )
    contactSubheading: str | None = Field(
        default=None, description="Contact section description / subheading"
    )
    contactEmail: str | None = Field(default=None, description="Contact support email")
    contactPhone: str | None = Field(default=None, description="Contact support phone")
    contactAddress: str | None = Field(
        default=None, description="Store contact physical address"
    )
    contactHours: str | None = Field(
        default=None, description="Store contact operating hours"
    )
    contactButtonText: str | None = Field(
        default=None, description="Contact section button text"
    )
    contactButtonLink: str | None = Field(
        default=None, description="Contact section button target link"
    )

    # Banner Content
    bannerBadge: str | None = Field(default=None, description="Banner top badge")
    bannerHeadline: str | None = Field(default=None, description="Banner main headline")
    bannerDescription: str | None = Field(
        default=None, description="Banner description"
    )
    bannerButtonText: str | None = Field(
        default=None, description="Banner button label"
    )
    bannerButtonLink: str | None = Field(
        default=None, description="Banner button target URL"
    )

    # Stats Strip (Pick up to 4 stats: satisfaction, orders, products, custom)
    statsConfig: list[dict[str, Any]] | None = Field(
        default=None,
        description="List of up to 4 configured stats [{id, type, label, value, enabled}]",
    )


class TenantBase(BaseModel):
    """Shared tenant fields and configuration."""

    name: str = Field(
        ..., min_length=2, max_length=255, description="Tenant organization name"
    )
    slug: str = Field(
        ...,
        min_length=2,
        max_length=100,
        pattern="^[a-z0-9-]+$",
        description="Unique subdomain slug",
    )
    category: str | None = Field(
        default="General",
        max_length=100,
        description="Business vertical / store category",
    )
    country: str = Field(
        default="Nigeria",
        max_length=100,
        description="Country / Primary Operating Market",
    )
    currency: str = Field(
        default="NGN",
        max_length=10,
        description="Default operational currency code (e.g. NGN, USD, GBP, EUR)",
    )
    custom_domain: str | None = Field(default=None, max_length=255)
    backend_type: BackendType = Field(default=BackendType.POSTGRES)
    sanity_dataset: str | None = Field(default=None, max_length=100)
    sanity_project_id: str | None = Field(default=None, max_length=100)
    default_gateway: str = Field(default="paystack")

    # Physical and pickup address fields
    store_address: str | None = Field(
        default=None, max_length=500, description="Store physical street address"
    )
    store_phone: str | None = Field(
        default=None, max_length=50, description="Store contact phone"
    )
    store_email: str | None = Field(
        default=None, max_length=255, description="Store contact email"
    )
    pickup_location_name: str | None = Field(
        default=None, max_length=255, description="Name/title of store pickup venue"
    )
    pickup_address: str | None = Field(
        default=None,
        max_length=500,
        description="Full street address for order collection",
    )
    pickup_hours: str | None = Field(
        default=None,
        max_length=255,
        description="Weekly hours available for order collection",
    )

    # Fulfillment & Delivery Rules
    delivery_fee: float | None = Field(
        default=45.0, description="Standard delivery fee amount"
    )
    delivery_instruction: str | None = Field(
        default=None, description="Custom delivery terms/instructions"
    )
    pickup_instruction: str | None = Field(
        default=None, description="Custom pickup terms/instructions"
    )
    paystack_subaccount_code: str | None = Field(
        default=None, description="Paystack automated subaccount code (ACCT_xxxx)"
    )
    stripe_account_id: str | None = Field(
        default=None, description="Stripe connected express account ID (acct_xxxx)"
    )

    branding_config: BrandingConfig = Field(default_factory=BrandingConfig)


class TenantCreate(TenantBase):
    """Payload to provision a new tenant."""

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
                    "logoUrl": "https://cdn.kiyostores.space/logos/cakes-by-bode.png",
                    "tagline": "Handcrafted artisanal pastries and custom bakes",
                },
                "paystack_subaccount_code": "ACCT_983210948",
                "stripe_account_id": "acct_1NZX84920481",
                "sanity_dataset": "production",
                "sanity_project_id": "prj_948201",
            }
        }
    )


class TenantUpdate(BaseModel):
    """Partial update payload for an existing tenant."""

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
                    "logoUrl": "https://cdn.kiyostores.space/logos/new-logo.png",
                    "tagline": "Luxury artisanal bakes and wedding cakes",
                },
            }
        },
    )

    name: str | None = None
    category: str | None = None
    country: str | None = None
    currency: str | None = None
    custom_domain: str | None = None
    backend_type: BackendType | None = None
    sanity_dataset: str | None = None
    sanity_project_id: str | None = None
    default_gateway: str | None = None
    branding_config: BrandingConfig | None = None
    paystack_subaccount_code: str | None = None
    stripe_account_id: str | None = None
    store_address: str | None = None
    store_phone: str | None = None
    store_email: str | None = None
    pickup_location_name: str | None = None
    pickup_address: str | None = None
    pickup_hours: str | None = None
    delivery_fee: float | None = None
    delivery_instruction: str | None = None
    pickup_instruction: str | None = None


class TenantResponse(TenantBase):
    """Serialized tenant response with metrics."""

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
                    "logoUrl": "https://cdn.kiyostores.space/logos/cakes-by-bode.png",
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
    product_count: int | None = 0
    orders_count: int | None = 0
    total_volume: float | None = 0.0
    status: str | None = "Active"
