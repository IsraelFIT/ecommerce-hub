import enum
from typing import Optional, Dict, Any
from sqlalchemy import String, Enum, JSON, Boolean, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin


class BackendType(str, enum.Enum):
    POSTGRES = "postgres"
    SANITY = "sanity"


class Tenant(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    custom_domain: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Interchangeable data layer configuration
    backend_type: Mapped[BackendType] = mapped_column(
        Enum(BackendType, native_enum=False, length=50),
        default=BackendType.POSTGRES,
        nullable=False,
    )
    sanity_dataset: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sanity_project_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Pluggable Payment Gateways Subaccount Identifiers
    paystack_subaccount_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    stripe_account_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    default_gateway: Mapped[str] = mapped_column(String(50), default="paystack", nullable=False)

    # Category & Dynamic Storefront Branding
    category: Mapped[str] = mapped_column(String(100), default="General", nullable=False)
    country: Mapped[str] = mapped_column(String(100), default="Nigeria", nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="NGN", nullable=False)

    # Store physical address & pickup location details
    store_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    store_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    store_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    pickup_location_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    pickup_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    pickup_hours: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Fulfillment & Delivery Rules
    delivery_fee: Mapped[Optional[float]] = mapped_column(Float, default=45.0, nullable=True)
    delivery_instruction: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pickup_instruction: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    branding_config: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=lambda: {
            "primaryColor": "#6366f1",
            "accentColor": "#ec4899",
            "logoUrl": None,
            "tagline": "Welcome to our store",
        },
        nullable=False,
    )

    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="tenant", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="tenant", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="tenant", cascade="all, delete-orphan")
    likes = relationship("ProductLike", back_populates="tenant", cascade="all, delete-orphan")
