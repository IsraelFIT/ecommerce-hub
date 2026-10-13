import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_tenant_context, get_rls_db_session
from app.models.tenant import Tenant
from app.models.product import ProductFilter
from app.schemas.filter import FilterCreate, FilterUpdate, FilterResponse
from app.schemas.response import success_response, ApiResponse, ErrorResponse

router = APIRouter(
    prefix="/filters",
    tags=["Product Custom Filters"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        404: {"model": ErrorResponse, "description": "Filter Not Found"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
    },
)


@router.get(
    "",
    response_model=ApiResponse[List[FilterResponse]],
    summary="List all product filters for the active tenant",
)
@router.get(
    "/",
    response_model=ApiResponse[List[FilterResponse]],
    summary="List all product filters for the active tenant",
)
async def list_filters(
    active_only: bool = False,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    query = select(ProductFilter).where(ProductFilter.tenant_id == tenant.id)
    if active_only:
        query = query.where(ProductFilter.is_active == True)
    query = query.order_by(ProductFilter.display_order.asc(), ProductFilter.name.asc())

    result = await db.execute(query)
    filters = result.scalars().all()

    items = [
        FilterResponse(
            id=f.id,
            tenant_id=f.tenant_id,
            name=f.name,
            slug=f.slug,
            filter_type=f.filter_type,
            options=f.options or [],
            is_active=f.is_active,
            display_order=f.display_order,
            created_at=f.created_at,
            updated_at=f.updated_at,
        )
        for f in filters
    ]

    return success_response(
        data=items,
        message="Product filters retrieved successfully",
    )


@router.get(
    "/{filter_id}",
    response_model=ApiResponse[FilterResponse],
    summary="Get filter by UUID",
)
async def get_filter(
    filter_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    query = select(ProductFilter).where(
        ProductFilter.id == filter_id, ProductFilter.tenant_id == tenant.id
    )
    result = await db.execute(query)
    pf = result.scalar_one_or_none()
    if not pf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filter not found",
        )

    return success_response(
        data=FilterResponse(
            id=pf.id,
            tenant_id=pf.tenant_id,
            name=pf.name,
            slug=pf.slug,
            filter_type=pf.filter_type,
            options=pf.options or [],
            is_active=pf.is_active,
            display_order=pf.display_order,
            created_at=pf.created_at,
            updated_at=pf.updated_at,
        ),
        message="Filter retrieved successfully",
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[FilterResponse],
    summary="Create a new custom filter group for tenant products",
)
@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[FilterResponse],
    summary="Create a new custom filter group for tenant products",
)
async def create_filter(
    filter_in: FilterCreate,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    # Check if slug exists in this tenant
    existing_query = select(ProductFilter).where(
        ProductFilter.tenant_id == tenant.id, ProductFilter.slug == filter_in.slug
    )
    res = await db.execute(existing_query)
    slug = filter_in.slug
    if res.scalar_one_or_none():
        slug = f"{slug}-{uuid.uuid4().hex[:4]}"

    # Clean and deduplicate options
    cleaned_options = [opt.strip() for opt in filter_in.options if opt.strip()]

    product_filter = ProductFilter(
        tenant_id=tenant.id,
        name=filter_in.name.strip(),
        slug=slug,
        filter_type=filter_in.filter_type,
        options=cleaned_options,
        is_active=filter_in.is_active,
        display_order=filter_in.display_order,
    )
    db.add(product_filter)
    await db.commit()
    await db.refresh(product_filter)

    return success_response(
        data=FilterResponse(
            id=product_filter.id,
            tenant_id=product_filter.tenant_id,
            name=product_filter.name,
            slug=product_filter.slug,
            filter_type=product_filter.filter_type,
            options=product_filter.options or [],
            is_active=product_filter.is_active,
            display_order=product_filter.display_order,
            created_at=product_filter.created_at,
            updated_at=product_filter.updated_at,
        ),
        message="Filter created successfully",
    )


@router.patch(
    "/{filter_id}",
    response_model=ApiResponse[FilterResponse],
    summary="Update a filter group",
)
@router.put(
    "/{filter_id}",
    response_model=ApiResponse[FilterResponse],
    summary="Update a filter group (PUT alias)",
)
async def update_filter(
    filter_id: uuid.UUID,
    filter_in: FilterUpdate,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    query = select(ProductFilter).where(
        ProductFilter.id == filter_id, ProductFilter.tenant_id == tenant.id
    )
    result = await db.execute(query)
    product_filter = result.scalar_one_or_none()
    if not product_filter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filter not found",
        )

    update_data = filter_in.model_dump(exclude_unset=True)
    if "options" in update_data and update_data["options"] is not None:
        update_data["options"] = [
            opt.strip() for opt in update_data["options"] if str(opt).strip()
        ]

    for key, value in update_data.items():
        if hasattr(product_filter, key) and value is not None:
            setattr(product_filter, key, value)

    await db.commit()
    await db.refresh(product_filter)

    return success_response(
        data=FilterResponse(
            id=product_filter.id,
            tenant_id=product_filter.tenant_id,
            name=product_filter.name,
            slug=product_filter.slug,
            filter_type=product_filter.filter_type,
            options=product_filter.options or [],
            is_active=product_filter.is_active,
            display_order=product_filter.display_order,
            created_at=product_filter.created_at,
            updated_at=product_filter.updated_at,
        ),
        message="Filter updated successfully",
    )


@router.delete(
    "/{filter_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Delete a filter group",
)
async def delete_filter(
    filter_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    query = select(ProductFilter).where(
        ProductFilter.id == filter_id, ProductFilter.tenant_id == tenant.id
    )
    result = await db.execute(query)
    product_filter = result.scalar_one_or_none()
    if not product_filter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filter not found",
        )

    await db.delete(product_filter)
    await db.commit()

    return success_response(
        data={},
        message="Filter deleted successfully",
    )
