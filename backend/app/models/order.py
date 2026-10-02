import uuid
import enum
from typing import Dict, Any, List
from sqlalchemy import String, Numeric, Enum, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"


class Order(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "orders"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    customer_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Financial breakdowns for split payments
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    platform_fee: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    tenant_payout_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)

    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, native_enum=False, length=50),
        default=OrderStatus.PENDING,
        nullable=False,
    )
    payment_gateway: Mapped[str] = mapped_column(String(50), nullable=False)
    gateway_reference: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    
    items: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    tenant = relationship("Tenant", back_populates="orders")
