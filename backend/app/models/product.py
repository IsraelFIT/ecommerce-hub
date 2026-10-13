import uuid
import enum
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Text, Numeric, Integer, ForeignKey, JSON, Boolean, Enum as SqlEnum
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class ProductClass(str, enum.Enum):
    PHYSICAL = "physical"  # Requires shipping & inventory
    DIGITAL = "digital"    # Requires download links
    SERVICE = "service"    # Requires scheduling


class Category(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "categories"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )

    products: Mapped[List["Product"]] = relationship("Product", back_populates="category")


class ProductFilter(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "product_filters"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "Dietary", "Occasion", "Meal Time"
    slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # e.g. "dietary", "occasion"
    filter_type: Mapped[str] = mapped_column(String(50), default="checkbox", nullable=False)  # "checkbox", "pills", "radio"
    options: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)  # e.g. ["Gluten Free", "Vegan", "Nut Free"]
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class Product(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "products"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    product_class: Mapped[ProductClass] = mapped_column(
        SqlEnum(
            ProductClass,
            values_callable=lambda obj: [e.value for e in obj],
            native_enum=False,
            length=50,
        ),
        default=ProductClass.PHYSICAL,
        nullable=False,
    )
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Dynamic JSONB metadata: {"author": "Tolkien"} or {"brand": "Sony", "resolution": "4K"}
    specifications: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    # Selected filter values: {"dietary": ["Vegan", "Gluten Free"], "occasion": ["Birthday"]}
    filters: Mapped[Dict[str, List[str]]] = mapped_column(JSON, default=dict, nullable=False)
    images: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)

    # Legacy category name fallback
    category_name: Mapped[Optional[str]] = mapped_column(String(100), default="General", nullable=True)
    currency: Mapped[Optional[str]] = mapped_column(String(10), default="NGN", nullable=True)

    # Relationships
    variants: Mapped[List["ProductVariant"]] = relationship(
        "ProductVariant",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="products", lazy="selectin")
    tenant = relationship("Tenant", back_populates="products")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan", lazy="selectin")
    likes = relationship("ProductLike", back_populates="product", cascade="all, delete-orphan", lazy="selectin")

    @property
    def category_str(self) -> str:
        if self.category:
            return self.category.name
        return self.category_name or "General"


class ProductVariant(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "product_variants"

    product_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    sku: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    compare_at_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)

    track_inventory: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Dynamic Variant Options: {"size": "XL", "color": "Red"} or {"color": ["Blue", "Green"]}
    options: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="variants")
