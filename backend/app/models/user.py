import uuid
from typing import Optional, List
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    role: Mapped[str] = mapped_column(String(50), default="tenant_admin", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    consent_to_terms: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Optional multi-tenant ownership link
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    otps = relationship("PasswordResetOTP", back_populates="user", cascade="all, delete-orphan")
