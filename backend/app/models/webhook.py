from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy import String, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.base import UUIDPrimaryKeyMixin


class ProcessedWebhook(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "processed_webhooks"

    event_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    gateway: Mapped[str] = mapped_column(String(50), nullable=False)
    event_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    processed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
