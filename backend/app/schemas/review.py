import uuid
from typing import Optional, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    product_id: Optional[uuid.UUID] = Field(None, description="Optional product being reviewed")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    title: Optional[str] = Field(None, max_length=255, description="Review headline")
    comment: str = Field(..., min_length=2, description="Review feedback/comment")
    customer_name: str = Field(default="Verified Buyer", max_length=100, description="Reviewer name")
    customer_email: Optional[str] = Field(None, max_length=255, description="Reviewer email")


class ReviewUpdateStatus(BaseModel):
    status: str = Field(..., description="Status: 'approved', 'pending', or 'rejected'")


class ReviewResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    product_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
    product_name: Optional[str] = None
    rating: int
    title: Optional[str] = None
    comment: str
    customer_name: str
    customer_email: Optional[str] = None
    customer_avatar_url: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewStatsResponse(BaseModel):
    average_rating: float
    total_reviews: int
    rating_breakdown: Dict[int, int]
