import json
import uuid
from typing import Dict, Any, List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_product_adapter, get_current_tenant_admin
from app.adapters.base import ProductRepositoryAdapter
from app.core.security import decode_access_token
from app.models.user import User
from app.models.review import Review
from app.models.like import ProductLike
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductSummaryResponse,
    ProductMenuSummaryResponse,
)
from app.schemas.response import success_response, PaginationMeta, ApiResponse, PaginatedData, ErrorResponse

router = APIRouter(
    prefix="/products",
    tags=["Products (Interchangeable Data Layer)"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        404: {"model": ErrorResponse, "description": "Product Not Found"},
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


async def enrich_products_metadata(
    products: List[ProductResponse],
    db: AsyncSession,
    user_id: Optional[uuid.UUID] = None,
    session_id: Optional[str] = None,
) -> List[ProductResponse]:
    if not products:
        return []

    product_ids = [p.id for p in products]

    # 1. Fetch ratings & review count in batch
    rating_map: Dict[uuid.UUID, float] = {}
    reviews_count_map: Dict[uuid.UUID, int] = {}
    try:
        rating_stmt = (
            select(
                Review.product_id,
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("reviews_count"),
            )
            .where(Review.product_id.in_(product_ids), Review.status == "approved")
            .group_by(Review.product_id)
        )
        rating_res = await db.execute(rating_stmt)
        for row in rating_res.all():
            pid, avg_r, rev_c = row
            rating_map[pid] = round(float(avg_r or 0.0), 1)
            reviews_count_map[pid] = int(rev_c or 0)
    except Exception:
        pass

    # 2. Fetch liked state for the logged-in user or session in batch
    liked_product_ids = set()
    if user_id or session_id:
        try:
            conditions = [ProductLike.product_id.in_(product_ids)]
            if user_id:
                conditions.append(ProductLike.user_id == user_id)
            elif session_id:
                conditions.append(ProductLike.session_id == session_id)

            likes_res = await db.execute(
                select(ProductLike.product_id).where(*conditions)
            )
            liked_product_ids = set(likes_res.scalars().all())
        except Exception:
            pass

    # 3. Fetch total likes count per product in batch
    likes_count_map: Dict[uuid.UUID, int] = {}
    try:
        likes_count_stmt = (
            select(
                ProductLike.product_id,
                func.count(ProductLike.id).label("likes_count"),
            )
            .where(ProductLike.product_id.in_(product_ids))
            .group_by(ProductLike.product_id)
        )
        likes_count_res = await db.execute(likes_count_stmt)
        likes_count_map = {row[0]: int(row[1]) for row in likes_count_res.all()}
    except Exception:
        pass

    # 4. Attach to each ProductResponse
    for p in products:
        p.average_rating = rating_map.get(p.id, 0.0)
        p.reviews_count = reviews_count_map.get(p.id, 0)
        p.is_liked = p.id in liked_product_ids
        p.likes_count = likes_count_map.get(p.id, 0)

    return products


@router.get(
    "",
    response_model=ApiResponse[PaginatedData[Union[ProductMenuSummaryResponse, ProductSummaryResponse]]],
    summary="List products for active tenant (PostgreSQL / Sanity CMS)",
    description="Lists products for the authenticated tenant. Dispatches dynamically to PostgreSQL (with RLS) or Sanity CMS.",
)
@router.get(
    "/",
    response_model=ApiResponse[PaginatedData[Union[ProductMenuSummaryResponse, ProductSummaryResponse]]],
    summary="List products for active tenant (PostgreSQL / Sanity CMS)",
    description="Lists products for the authenticated tenant. Dispatches dynamically to PostgreSQL (with RLS) or Sanity CMS.",
)
async def list_products(
    request: Request,
    page: int = 1,
    per_page: int = 15,
    published_only: bool = True,
    category: Optional[str] = Query(None, description="Category filter"),
    min_price: Optional[float] = Query(None, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, description="Maximum price filter"),
    rating: Optional[float] = Query(None, description="Minimum average rating filter"),
    availability: Optional[str] = Query(None, description="Availability filter ('available', 'preorder', 'schedule')"),
    product_class: Optional[str] = Query(None, description="Product class filter ('physical', 'digital', 'service')"),
    search: Optional[str] = Query(None, description="Search keyword filter"),
    filters: Optional[str] = Query(None, description="JSON-encoded dynamic filters dictionary"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    adapter: ProductRepositoryAdapter = Depends(get_product_adapter),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    skip = (page - 1) * per_page

    # Parse dynamic filters JSON or query params
    parsed_filters: Dict[str, List[str]] = {}
    if filters:
        try:
            raw = json.loads(filters)
            if isinstance(raw, dict):
                for k, v in raw.items():
                    if isinstance(v, list):
                        parsed_filters[str(k)] = [str(x) for x in v if str(x).strip()]
                    elif v is not None and str(v).strip():
                        parsed_filters[str(k)] = [str(v).strip()]
        except Exception:
            pass

    # Also extract any filter_<slug> from query parameters
    for qk, qv in request.query_params.multi_items():
        if qk.startswith("filter_"):
            slug = qk[len("filter_"):]
            if slug not in parsed_filters:
                parsed_filters[slug] = []
            if qv not in parsed_filters[slug]:
                parsed_filters[slug].append(qv)

    user_id = _extract_user_id(authorization, request)

    # Restrict unpublished/draft items:
    # Only super_admin, or admin/tenant_admin belonging to this active tenant can see unpublished products.
    effective_published_only = published_only
    if not published_only:
        is_authorized_admin = False
        if user_id:
            from app.models.user import User
            user_res = await db.execute(select(User).where(User.id == user_id))
            user = user_res.scalar_one_or_none()
            adapter_tenant_id = getattr(adapter, "tenant_id", None)
            if user:
                if user.role in ("super_admin", "admin"):
                    is_authorized_admin = True
                elif user.role in ("tenant_admin", "hub_admin") and adapter_tenant_id and user.tenant_id == adapter_tenant_id:
                    is_authorized_admin = True
        if not is_authorized_admin:
            effective_published_only = True

    products = await adapter.list_products(
        skip=skip,
        limit=per_page,
        published_only=effective_published_only,
        category=category,
        min_price=min_price,
        max_price=max_price,
        availability=availability,
        search=search,
        filters=parsed_filters or None,
        product_class=product_class,
    )
    
    active_session_id = x_session_id or session_id or request.headers.get("x-session-id")

    enriched_products = await enrich_products_metadata(
        products, db=db, user_id=user_id, session_id=active_session_id
    )

    # Filter by average rating if requested
    if rating is not None and rating > 0:
        enriched_products = [
            p for p in enriched_products if (getattr(p, "average_rating", 0.0) or 0.0) >= rating
        ]

    target_schema = ProductMenuSummaryResponse if effective_published_only else ProductSummaryResponse
    items = [
        target_schema.model_validate(p).model_dump(mode="json")
        if isinstance(p, (ProductResponse, ProductSummaryResponse, ProductMenuSummaryResponse)) or hasattr(p, "model_dump")
        else p
        for p in enriched_products
    ]

    pagination = PaginationMeta(
        current_page=page,
        last_page=1,
        per_page=per_page,
        total=len(items),
    )

    return success_response(
        data={"items": items},
        pagination=pagination,
        message="Products retrieved successfully",
    )


@router.get(
    "/by-slug/{slug}",
    response_model=ApiResponse[ProductResponse],
    summary="Get product by URL slug",
)
async def get_product_by_slug(
    slug: str,
    request: Request,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    adapter: ProductRepositoryAdapter = Depends(get_product_adapter),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    product = await adapter.get_by_slug(slug)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or does not exist",
        )
    user_id = _extract_user_id(authorization, request)
    active_session_id = x_session_id or session_id
    enriched = await enrich_products_metadata([product], db=db, user_id=user_id, session_id=active_session_id)
    product = enriched[0]

    return success_response(
        data=product.model_dump(mode="json") if hasattr(product, "model_dump") else product,
        message="Product details retrieved successfully",
    )


@router.get(
    "/{product_id}",
    response_model=ApiResponse[ProductResponse],
    summary="Get product by UUID",
)
async def get_product(
    product_id: uuid.UUID,
    request: Request,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    adapter: ProductRepositoryAdapter = Depends(get_product_adapter),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    product = await adapter.get_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or does not exist",
        )
    user_id = _extract_user_id(authorization, request)
    active_session_id = x_session_id or session_id
    enriched = await enrich_products_metadata([product], db=db, user_id=user_id, session_id=active_session_id)
    product = enriched[0]

    return success_response(
        data=product.model_dump(mode="json") if hasattr(product, "model_dump") else product,
        message="Product details retrieved successfully",
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ProductResponse],
    summary="Create a new product in tenant catalog",
)
@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ProductResponse],
    summary="Create a new product in tenant catalog",
)
async def create_product(
    product_in: ProductCreate,
    current_user: User = Depends(get_current_tenant_admin),
    adapter: ProductRepositoryAdapter = Depends(get_product_adapter),
) -> Dict[str, Any]:
    product = await adapter.create_product(product_in)
    return success_response(
        data=product.model_dump(mode="json") if hasattr(product, "model_dump") else product,
        message="Product created successfully",
    )


@router.patch(
    "/{product_id}",
    response_model=ApiResponse[ProductResponse],
    summary="Update product in tenant catalog",
)
@router.put(
    "/{product_id}",
    response_model=ApiResponse[ProductResponse],
    summary="Update product in tenant catalog (PUT alias)",
)
async def update_product(
    product_id: uuid.UUID,
    product_in: ProductUpdate,
    current_user: User = Depends(get_current_tenant_admin),
    adapter: ProductRepositoryAdapter = Depends(get_product_adapter),
) -> Dict[str, Any]:
    product = await adapter.update_product(product_id, product_in)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or does not exist",
        )
    return success_response(
        data=product.model_dump(mode="json") if hasattr(product, "model_dump") else product,
        message="Product updated successfully",
    )


@router.delete(
    "/{product_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Delete product from tenant catalog",
)
async def delete_product(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_tenant_admin),
    adapter: ProductRepositoryAdapter = Depends(get_product_adapter),
) -> Dict[str, Any]:
    success = await adapter.delete_product(product_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or does not exist",
        )
    return success_response(
        data={},
        message="Product deleted successfully",
    )
