import uuid
from typing import Optional, List
from sqlalchemy import String, Text, Numeric, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class Product(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "products"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    inventory_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    images: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    is_published: Mapped[bool] = mapped_column(default=True, nullable=False)

    tenant = relationship("Tenant", back_populates="products")
