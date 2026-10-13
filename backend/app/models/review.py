import uuid
from typing import Optional
from sqlalchemy import String, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class Review(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "reviews"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 5
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(100), default="Verified Buyer", nullable=False)
    customer_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="approved", nullable=False)  # approved, pending, rejected

    tenant = relationship("Tenant", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
