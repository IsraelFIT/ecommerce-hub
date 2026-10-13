import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class LikeToggleRequest(BaseModel):
    product_id: uuid.UUID = Field(..., description="Target product ID to like/unlike")
    session_id: Optional[str] = Field(None, description="Guest session identifier")


class LikeToggleResponse(BaseModel):
    product_id: uuid.UUID
    liked: bool
    total_likes: int


class LikeStatusResponse(BaseModel):
    product_id: uuid.UUID
    liked: bool
    total_likes: int


class ProductLikeResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    product_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    session_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
