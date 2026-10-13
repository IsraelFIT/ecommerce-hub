import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class CustomizationRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "customization_requests"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tenant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    tenant_slug: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    requested_by_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Request Category & Status
    request_type: Mapped[str] = mapped_column(
        String(100), default="custom_landing_page", nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(50), default="pending", nullable=False, index=True
    )  # pending, in_review, in_progress, completed, rejected

    title: Mapped[str] = mapped_column(
        String(255), default="Custom Landing Page Request", nullable=False
    )
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Captured brand design snapshots at time of request
    primary_color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    secondary_color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    store_headline: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Super Admin Notes / Internal Review
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
