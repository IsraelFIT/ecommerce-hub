import uuid
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class Bank(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Cached banks list retrieved from Paystack Miscellaneous Bank API.
    Refreshed periodically and stored locally in PostgreSQL for zero-latency queries.
    """
    __tablename__ = "banks"

    paystack_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    longcode: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    gateway: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    pay_with_bank: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    supports_transfer: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    country: Mapped[str] = mapped_column(String(50), default="nigeria", nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String(10), default="NGN", nullable=False)
    bank_type: Mapped[Optional[str]] = mapped_column(String(50), default="nuban", nullable=True)

    __table_args__ = (
        Index("ix_banks_paystack_id", "paystack_id", unique=True),
        Index("ix_banks_country_code", "country", "code"),
    )
