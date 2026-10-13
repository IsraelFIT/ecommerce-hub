import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class ProductLike(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "product_likes"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)

    tenant = relationship("Tenant", back_populates="likes")
    product = relationship("Product", back_populates="likes")
    user = relationship("User", back_populates="likes")
