import json
import uuid
from typing import Dict, Any, List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_product_adapter, get_current_tenant_admin, get_tenant_context
from app.adapters.base import ProductRepositoryAdapter
from app.core.security import decode_access_token
from app.models.user import User
from app.models.tenant import Tenant
from app.models.review import Review
from app.models.like import ProductLike
from app.models.product import ProductVariant
from app.config import settings
from app.core.redis import (
    cache,
    build_tenant_key,
    invalidate_tenant_products,
    invalidate_tenant_categories,
)
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductSummaryResponse,
    ProductMenuSummaryResponse,
)
from app.schemas.response import success_response, PaginationMeta, ApiResponse, PaginatedData, ErrorResponse
from app.routes.uploads import auto_resolve_image_url

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

    # 2. Fetch liked state and total likes count per product in single aggregated batch
    liked_product_ids = set()
    likes_count_map: Dict[uuid.UUID, int] = {}
    try:
        user_like_cond = (
            ProductLike.user_id == user_id
            if user_id
            else (ProductLike.session_id == session_id if session_id else False)
        )
        likes_count_stmt = (
            select(
                ProductLike.product_id,
                func.count(ProductLike.id).label("likes_count"),
                func.bool_or(user_like_cond).label("is_liked"),
            )
            .where(ProductLike.product_id.in_(product_ids))
            .group_by(ProductLike.product_id)
        )
        likes_count_res = await db.execute(likes_count_stmt)
        for row in likes_count_res.all():
            pid, l_count, is_l = row
            likes_count_map[pid] = int(l_count or 0)
            if is_l:
                liked_product_ids.add(pid)
    except Exception:
        pass

    # 3. Fetch total units sold per product across confirmed/paid orders
    units_sold_map: Dict[uuid.UUID, int] = {}
    try:
        from sqlalchemy import text
        # Resolve all variant IDs belonging to these products so orders containing either product_id or variant_id are counted
        v_res = await db.execute(
            select(ProductVariant.id, ProductVariant.product_id).where(
                ProductVariant.product_id.in_(product_ids)
            )
        )
        id_to_product_map: Dict[str, uuid.UUID] = {str(pid): pid for pid in product_ids}
        for vid, parent_pid in v_res.all():
            id_to_product_map[str(vid)] = parent_pid

        target_ids = list(id_to_product_map.keys())
        sold_stmt = text("""
            SELECT 
                item->>'product_id' AS target_id,
                SUM(COALESCE((item->>'quantity')::int, 1)) AS total_sold
            FROM orders,
            json_array_elements(CASE WHEN json_typeof(items) = 'array' THEN items ELSE '[]'::json END) AS item
            WHERE is_deleted = false
              AND LOWER(status::text) IN ('paid', 'delivered', 'accepted', 'processing', 'shipped', 'fulfilled')
              AND item->>'product_id' = ANY(:target_ids)
            GROUP BY item->>'product_id'
        """)
        sold_res = await db.execute(sold_stmt, {"target_ids": target_ids})
        for row in sold_res.all():
            parent_pid = id_to_product_map.get(str(row[0]))
            if parent_pid:
                units_sold_map[parent_pid] = units_sold_map.get(parent_pid, 0) + int(row[1] or 0)
    except Exception:
        pass

    # 4. Attach to each ProductResponse
    for p in products:
        p.average_rating = rating_map.get(p.id, 0.0)
        p.reviews_count = reviews_count_map.get(p.id, 0)
        p.is_liked = p.id in liked_product_ids
        p.likes_count = likes_count_map.get(p.id, 0)
        spec_sold = (p.specifications or {}).get("units_sold") if hasattr(p, "specifications") else None
        p.units_sold = units_sold_map.get(p.id, int(spec_sold) if spec_sold is not None else 0)

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
    tenant: Tenant = Depends(get_tenant_context),
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

    active_session_id = x_session_id or session_id or request.headers.get("x-session-id")
    is_public = (user_id is None) and (active_session_id is None) and effective_published_only and not parsed_filters

    cache_key = build_tenant_key(
        tenant.slug,
        "products",
        "list",
        f"p{page}_l{per_page}_cat{category or 'all'}_avail{availability or 'all'}_s{search or 'none'}_cls{product_class or 'all'}_min{min_price}_max{max_price}_r{rating}",
    )
    if is_public:
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return success_response(
                data=cached.get("data"),
                pagination=PaginationMeta(**cached["pagination"]) if "pagination" in cached else None,
                message="Products retrieved successfully",
            )

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

    total = await adapter.count_products(
        published_only=effective_published_only,
        category=category,
        min_price=min_price,
        max_price=max_price,
        availability=availability,
        search=search,
        filters=parsed_filters or None,
        product_class=product_class,
    )

    last_page = max(1, (total + per_page - 1) // per_page)
    pagination = PaginationMeta(
        current_page=page,
        last_page=last_page,
        per_page=per_page,
        total=total,
    )

    if is_public:
        await cache.set_json(
            cache_key,
            {
                "data": {"items": items},
                "pagination": pagination.model_dump(mode="json"),
            },
            ttl=settings.CACHE_TTL_PRODUCTS,
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
    tenant: Tenant = Depends(get_tenant_context),
    adapter: ProductRepositoryAdapter = Depends(get_product_adapter),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    user_id = _extract_user_id(authorization, request)
    active_session_id = x_session_id or session_id

    # For anonymous visitors without personalized likes/sessions, serve from cache
    is_public = (user_id is None) and (active_session_id is None)
    cache_key = build_tenant_key(tenant.slug, "product", "slug", slug)
    if is_public:
        cached = await cache.get_json(cache_key)
        if cached:
            return success_response(
                data=cached,
                message="Product details retrieved successfully",
            )

    product = await adapter.get_by_slug(slug)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or does not exist",
        )
    enriched = await enrich_products_metadata([product], db=db, user_id=user_id, session_id=active_session_id)
    product = enriched[0]

    data = product.model_dump(mode="json") if hasattr(product, "model_dump") else product
    if is_public:
        await cache.set_json(cache_key, data, ttl=settings.CACHE_TTL_PRODUCTS)

    return success_response(
        data=data,
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
    tenant: Tenant = Depends(get_tenant_context),
    adapter: ProductRepositoryAdapter = Depends(get_product_adapter),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    user_id = _extract_user_id(authorization, request)
    active_session_id = x_session_id or session_id

    is_public = (user_id is None) and (active_session_id is None)
    cache_key = build_tenant_key(tenant.slug, "product", "id", str(product_id))
    if is_public:
        cached = await cache.get_json(cache_key)
        if cached:
            return success_response(
                data=cached,
                message="Product details retrieved successfully",
            )

    product = await adapter.get_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or does not exist",
        )
    enriched = await enrich_products_metadata([product], db=db, user_id=user_id, session_id=active_session_id)
    product = enriched[0]

    data = product.model_dump(mode="json") if hasattr(product, "model_dump") else product
    if is_public:
        await cache.set_json(cache_key, data, ttl=settings.CACHE_TTL_PRODUCTS)

    return success_response(
        data=data,
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
    tenant: Tenant = Depends(get_tenant_context),
    adapter: ProductRepositoryAdapter = Depends(get_product_adapter),
) -> Dict[str, Any]:
    if product_in.images:
        product_in.images = [await auto_resolve_image_url(img) for img in product_in.images]
    product = await adapter.create_product(product_in)

    # Invalidate cached product listings and category counts for this tenant
    target_slug = current_user.tenant.slug if current_user.tenant else tenant.slug
    await invalidate_tenant_products(target_slug)
    await invalidate_tenant_categories(target_slug)

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
    tenant: Tenant = Depends(get_tenant_context),
    adapter: ProductRepositoryAdapter = Depends(get_product_adapter),
) -> Dict[str, Any]:
    if product_in.images:
        product_in.images = [await auto_resolve_image_url(img) for img in product_in.images]
    product = await adapter.update_product(product_id, product_in)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or does not exist",
        )

    # Invalidate cache for this tenant
    target_slug = current_user.tenant.slug if current_user.tenant else tenant.slug
    await invalidate_tenant_products(target_slug)
    await invalidate_tenant_categories(target_slug)

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
    tenant: Tenant = Depends(get_tenant_context),
    adapter: ProductRepositoryAdapter = Depends(get_product_adapter),
) -> Dict[str, Any]:
    success = await adapter.delete_product(product_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or does not exist",
        )

    # Invalidate cache for this tenant
    target_slug = current_user.tenant.slug if current_user.tenant else tenant.slug
    await invalidate_tenant_products(target_slug)
    await invalidate_tenant_categories(target_slug)

    return success_response(
        data={},
        message="Product deleted successfully",
    )

