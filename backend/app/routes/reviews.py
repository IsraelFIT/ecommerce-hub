import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy import select, func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_tenant_context, get_current_tenant_admin
from app.models.tenant import Tenant
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.review import (
    ReviewCreate,
    ReviewUpdateStatus,
    ReviewResponse,
    ReviewStatsResponse,
)
from app.schemas.response import (
    success_response,
    PaginationMeta,
    ApiResponse,
    PaginatedData,
    ErrorResponse,
)

from app.core.security import decode_access_token

router = APIRouter(
    prefix="/reviews",
    tags=["Reviews & Ratings"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        404: {"model": ErrorResponse, "description": "Not Found"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
    },
)


async def resolve_tenant_flexible(
    tenant_slug: Optional[str] = Query(None),
    x_tenant_slug: Optional[str] = Header(None, alias="X-Tenant-Slug"),
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_db),
) -> Tenant:
    slug = tenant_slug or x_tenant_slug
    if slug:
        res = await db.execute(select(Tenant).where(Tenant.slug == slug.lower()))
        t = res.scalar_one_or_none()
        if t:
            return t
    if x_tenant_id:
        try:
            t_uuid = uuid.UUID(x_tenant_id)
            res = await db.execute(select(Tenant).where(Tenant.id == t_uuid))
            t = res.scalar_one_or_none()
            if t:
                return t
        except ValueError:
            pass
    return await get_tenant_context(
        x_tenant_id=x_tenant_id,
        x_tenant_slug=x_tenant_slug,
        authorization=authorization,
        db=db,
    )


@router.get(
    "",
    response_model=ApiResponse[PaginatedData[ReviewResponse]],
    summary="List reviews for tenant or product",
)
@router.get(
    "/",
    response_model=ApiResponse[PaginatedData[ReviewResponse]],
    summary="List reviews for tenant or product (slash alias)",
)
async def list_reviews(
    product_id: Optional[uuid.UUID] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    rating: Optional[int] = Query(None),
    page: int = 1,
    per_page: int = 20,
    tenant: Tenant = Depends(resolve_tenant_flexible),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    offset = (page - 1) * per_page
    query = (
        select(Review, Product, User)
        .outerjoin(Product, Review.product_id == Product.id)
        .outerjoin(
            User,
            or_(
                Review.user_id == User.id,
                func.lower(Review.customer_email) == func.lower(User.email),
            ),
        )
        .where(Review.tenant_id == tenant.id, Review.is_deleted == False)
    )

    if product_id:
        query = query.where(Review.product_id == product_id)

    if status_filter and status_filter.lower() != "all":
        query = query.where(Review.status == status_filter.lower())

    if rating is not None and rating > 0:
        query = query.where(Review.rating == rating)

    if search and search.strip():
        s = f"%{search.strip()}%"
        query = query.where(
            or_(
                Review.comment.ilike(s),
                Review.customer_name.ilike(s),
                Review.customer_email.ilike(s),
                Review.title.ilike(s),
            )
        )

    # Count total
    count_query = select(func.count(Review.id)).where(Review.tenant_id == tenant.id, Review.is_deleted == False)
    if product_id:
        count_query = count_query.where(Review.product_id == product_id)
    if status_filter and status_filter.lower() != "all":
        count_query = count_query.where(Review.status == status_filter.lower())
    if rating is not None and rating > 0:
        count_query = count_query.where(Review.rating == rating)
    if search and search.strip():
        s = f"%{search.strip()}%"
        count_query = count_query.where(
            or_(
                Review.comment.ilike(s),
                Review.customer_name.ilike(s),
                Review.customer_email.ilike(s),
                Review.title.ilike(s),
            )
        )

    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    query = query.order_by(desc(Review.created_at)).offset(offset).limit(per_page)
    result = await db.execute(query)
    rows = result.all()

    items = []
    for r, prod, u in rows:
        resp = ReviewResponse.model_validate(r)
        if prod:
            resp.product_name = prod.name or prod.title
        elif r.product:
            resp.product_name = r.product.name or r.product.title
        
        # Populate avatar
        if u and getattr(u, "avatar_url", None):
            resp.customer_avatar_url = u.avatar_url
        elif r.user and getattr(r.user, "avatar_url", None):
            resp.customer_avatar_url = r.user.avatar_url

        items.append(resp.model_dump(mode="json"))

    last_page = max(1, (total + per_page - 1) // per_page)
    pagination = PaginationMeta(
        current_page=page,
        last_page=last_page,
        per_page=per_page,
        total=total,
    )

    return success_response(
        data={"items": items},
        pagination=pagination,
        message="Reviews retrieved successfully",
    )


@router.get(
    "/stats",
    response_model=ApiResponse[ReviewStatsResponse],
    summary="Get rating statistics",
)
async def get_review_stats(
    product_id: Optional[uuid.UUID] = None,
    tenant: Tenant = Depends(resolve_tenant_flexible),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    base_cond = [Review.tenant_id == tenant.id, Review.status == "approved"]
    if product_id:
        base_cond.append(Review.product_id == product_id)

    # Calculate average and total count
    avg_query = select(func.avg(Review.rating), func.count(Review.id)).where(*base_cond)
    avg_res = await db.execute(avg_query)
    avg_val, count_val = avg_res.first() or (0.0, 0)

    average_rating = round(float(avg_val or 0.0), 1)
    total_reviews = int(count_val or 0)

    # Breakdown by star rating
    breakdown_query = (
        select(Review.rating, func.count(Review.id))
        .where(*base_cond)
        .group_by(Review.rating)
    )
    breakdown_res = await db.execute(breakdown_query)
    breakdown_map = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r_score, r_count in breakdown_res.all():
        if r_score in breakdown_map:
            breakdown_map[r_score] = int(r_count)

    return success_response(
        data={
            "average_rating": average_rating,
            "total_reviews": total_reviews,
            "rating_breakdown": breakdown_map,
        },
        message="Review statistics retrieved successfully",
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ReviewResponse],
    summary="Submit a customer review",
)
@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ReviewResponse],
    summary="Submit a customer review (slash alias)",
)
async def create_review(
    review_in: ReviewCreate,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    # Verify product if provided
    product_name = None
    if review_in.product_id:
        p_res = await db.execute(
            select(Product).where(Product.id == review_in.product_id, Product.tenant_id == tenant.id)
        )
        product = p_res.scalar_one_or_none()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in this store",
            )
        product_name = product.name or product.title

    new_review = Review(
        tenant_id=tenant.id,
        product_id=review_in.product_id,
        rating=review_in.rating,
        title=review_in.title,
        comment=review_in.comment,
        customer_name=review_in.customer_name or "Verified Buyer",
        customer_email=review_in.customer_email,
        status="approved",
    )
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)

    resp = ReviewResponse.model_validate(new_review)
    resp.product_name = product_name
    return success_response(
        data=resp.model_dump(mode="json"),
        message="Review submitted successfully",
    )


@router.patch(
    "/{review_id}/status",
    response_model=ApiResponse[ReviewResponse],
    summary="Update review moderation status",
)
async def update_review_status(
    review_id: uuid.UUID,
    payload: ReviewUpdateStatus,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin),
) -> Dict[str, Any]:
    result = await db.execute(
        select(Review)
        .where(Review.id == review_id, Review.tenant_id == tenant.id)
        .options(selectinload(Review.product))
        .with_for_update()
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    review.status = payload.status
    await db.commit()
    await db.refresh(review)

    resp = ReviewResponse.model_validate(review)
    if review.product:
        resp.product_name = review.product.name or review.product.title

    return success_response(
        data=resp.model_dump(mode="json"),
        message=f"Review status updated to {payload.status}",
    )


@router.delete(
    "/{review_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Delete a review",
)
async def delete_review(
    review_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin),
) -> Dict[str, Any]:
    result = await db.execute(
        select(Review)
        .where(
            Review.id == review_id,
            Review.tenant_id == tenant.id,
            Review.is_deleted == False,
        )
        .with_for_update()
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    review.is_deleted = True
    review.deleted_at = func.now()
    await db.commit()

    return success_response(
        data={"deleted_id": str(review_id)},
        message="Review deleted successfully",
    )
