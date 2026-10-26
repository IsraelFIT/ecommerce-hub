import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_tenant_context
from app.core.security import decode_access_token
from app.models.tenant import Tenant
from app.models.product import Product
from app.models.like import ProductLike
from app.schemas.like import LikeToggleRequest, LikeToggleResponse, LikeStatusResponse
from app.schemas.response import success_response, ApiResponse, ErrorResponse

router = APIRouter(
    prefix="/likes",
    tags=["Product Likes & Wishlist"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        404: {"model": ErrorResponse, "description": "Not Found"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
    },
)


def _extract_user_id(
    authorization: Optional[str] = None, request: Optional[Request] = None
) -> Optional[uuid.UUID]:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()
    elif request:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split("Bearer ")[1].strip()
        else:
            token = request.cookies.get("auth_session") or request.cookies.get(
                "auth_token"
            )

    if token:
        payload = decode_access_token(token)
        if payload and payload.get("sub"):
            try:
                return uuid.UUID(payload["sub"])
            except ValueError:
                return None
    return None


@router.post(
    "/toggle",
    response_model=ApiResponse[LikeToggleResponse],
    summary="Toggle like/wishlist state for a product",
)
async def toggle_like(
    request: Request,
    payload: LikeToggleRequest,
    tenant: Tenant = Depends(get_tenant_context),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    user_id = _extract_user_id(authorization, request)
    session_id = payload.session_id or request.headers.get("x-session-id")

    # Check existing like with row lock
    if user_id:
        existing_query = (
            select(ProductLike)
            .where(
                ProductLike.tenant_id == tenant.id,
                ProductLike.product_id == payload.product_id,
                ProductLike.user_id == user_id,
            )
            .with_for_update()
        )
    elif session_id:
        existing_query = (
            select(ProductLike)
            .where(
                ProductLike.tenant_id == tenant.id,
                ProductLike.product_id == payload.product_id,
                ProductLike.session_id == session_id,
            )
            .with_for_update()
        )
    else:
        existing_query = None

    existing = None
    if existing_query is not None:
        result = await db.execute(existing_query)
        existing = result.scalar_one_or_none()

    if existing:
        # Unlike
        await db.delete(existing)
        await db.commit()
        is_liked = False
    else:
        # Like
        if not user_id and not session_id:
            session_id = str(uuid.uuid4())

        new_like = ProductLike(
            tenant_id=tenant.id,
            product_id=payload.product_id,
            user_id=user_id,
            session_id=session_id,
        )
        db.add(new_like)
        try:
            await db.commit()
            is_liked = True
        except Exception:
            await db.rollback()
            is_liked = True

    # Count total likes on this product
    count_res = await db.execute(
        select(func.count(ProductLike.id)).where(
            ProductLike.product_id == payload.product_id
        )
    )
    total_likes = count_res.scalar() or 0

    return success_response(
        data={
            "product_id": str(payload.product_id),
            "liked": is_liked,
            "total_likes": total_likes,
        },
        message="Wishlist updated" if is_liked else "Removed from wishlist",
    )


@router.get(
    "/status/{product_id}",
    response_model=ApiResponse[LikeStatusResponse],
    summary="Check if a product is liked by current user/session",
)
async def get_like_status(
    request: Request,
    product_id: uuid.UUID,
    session_id: Optional[str] = None,
    tenant: Tenant = Depends(get_tenant_context),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    user_id = _extract_user_id(authorization, request)
    active_session_id = session_id or request.headers.get("x-session-id")

    user_cond = (
        ProductLike.user_id == user_id
        if user_id
        else (ProductLike.session_id == active_session_id if active_session_id else False)
    )

    likes_stmt = select(
        func.count(ProductLike.id).label("total_likes"),
        func.bool_or(user_cond).label("is_liked"),
    ).where(ProductLike.product_id == product_id)

    count_res = await db.execute(likes_stmt)
    row = count_res.first()
    total_likes = int(row.total_likes or 0) if row else 0
    is_liked = bool(row.is_liked) if (row and row.is_liked is not None) else False

    return success_response(
        data={
            "product_id": str(product_id),
            "liked": is_liked,
            "total_likes": total_likes,
        },
        message="Like status retrieved",
    )
