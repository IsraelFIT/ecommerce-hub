import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy import ForeignKey, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class UserCart(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_carts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    items: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("user_id", "tenant_id", name="uq_user_cart_user_tenant"),
    )

    user = relationship("User", backref="carts")
    tenant = relationship("Tenant")
