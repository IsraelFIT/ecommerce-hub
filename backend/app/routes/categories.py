import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_tenant_context, get_rls_db_session
from app.models.tenant import Tenant
from app.models.product import Category, Product
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.schemas.response import success_response, ApiResponse, ErrorResponse

router = APIRouter(
    prefix="/categories",
    tags=["Product Categories"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        404: {"model": ErrorResponse, "description": "Category Not Found"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
    },
)


@router.get(
    "",
    response_model=ApiResponse[List[CategoryResponse]],
    summary="List all categories for the active tenant",
)
@router.get(
    "/",
    response_model=ApiResponse[List[CategoryResponse]],
    summary="List all categories for the active tenant",
)
async def list_categories(
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    # Query categories and product counts
    subq = (
        select(Product.category_id, func.count(Product.id).label("prod_count"))
        .where(Product.tenant_id == tenant.id)
        .group_by(Product.category_id)
        .subquery()
    )

    query = (
        select(Category, func.coalesce(subq.c.prod_count, 0).label("product_count"))
        .outerjoin(subq, Category.id == subq.c.category_id)
        .where(Category.tenant_id == tenant.id)
        .order_by(Category.display_order.asc(), Category.name.asc())
    )

    result = await db.execute(query)
    rows = result.all()

    items: List[CategoryResponse] = []
    for cat, prod_count in rows:
        items.append(
            CategoryResponse(
                id=cat.id,
                tenant_id=cat.tenant_id,
                name=cat.name,
                slug=cat.slug,
                description=cat.description,
                icon=cat.icon,
                display_order=cat.display_order,
                parent_id=cat.parent_id,
                product_count=prod_count,
                created_at=cat.created_at,
                updated_at=cat.updated_at,
            )
        )

    return success_response(
        data=items,
        message="Categories retrieved successfully",
    )


@router.get(
    "/{category_id}",
    response_model=ApiResponse[CategoryResponse],
    summary="Get category by UUID",
)
async def get_category(
    category_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    query = select(Category).where(
        Category.id == category_id, Category.tenant_id == tenant.id
    )
    result = await db.execute(query)
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    # Count products
    p_count_res = await db.execute(
        select(func.count(Product.id)).where(
            Product.category_id == cat.id, Product.tenant_id == tenant.id
        )
    )
    product_count = p_count_res.scalar_one() or 0

    return success_response(
        data=CategoryResponse(
            id=cat.id,
            tenant_id=cat.tenant_id,
            name=cat.name,
            slug=cat.slug,
            description=cat.description,
            icon=cat.icon,
            display_order=cat.display_order,
            parent_id=cat.parent_id,
            product_count=product_count,
            created_at=cat.created_at,
            updated_at=cat.updated_at,
        ),
        message="Category retrieved successfully",
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[CategoryResponse],
    summary="Create a new product category for tenant",
)
@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[CategoryResponse],
    summary="Create a new product category for tenant",
)
async def create_category(
    category_in: CategoryCreate,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    # Check if slug exists in this tenant, if so append random suffix
    existing_query = select(Category).where(
        Category.tenant_id == tenant.id, Category.slug == category_in.slug
    )
    res = await db.execute(existing_query)
    slug = category_in.slug
    if res.scalar_one_or_none():
        slug = f"{slug}-{uuid.uuid4().hex[:4]}"

    category = Category(
        tenant_id=tenant.id,
        name=category_in.name.strip(),
        slug=slug,
        description=category_in.description,
        icon=category_in.icon,
        display_order=category_in.display_order,
        parent_id=category_in.parent_id,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)

    return success_response(
        data=CategoryResponse(
            id=category.id,
            tenant_id=category.tenant_id,
            name=category.name,
            slug=category.slug,
            description=category.description,
            icon=category.icon,
            display_order=category.display_order,
            parent_id=category.parent_id,
            product_count=0,
            created_at=category.created_at,
            updated_at=category.updated_at,
        ),
        message="Category created successfully",
    )


@router.patch(
    "/{category_id}",
    response_model=ApiResponse[CategoryResponse],
    summary="Update an existing category",
)
@router.put(
    "/{category_id}",
    response_model=ApiResponse[CategoryResponse],
    summary="Update an existing category (PUT alias)",
)
async def update_category(
    category_id: uuid.UUID,
    category_in: CategoryUpdate,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    query = select(Category).where(
        Category.id == category_id, Category.tenant_id == tenant.id
    )
    result = await db.execute(query)
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    update_data = category_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(category, key) and value is not None:
            setattr(category, key, value)

    await db.commit()
    await db.refresh(category)

    p_count_res = await db.execute(
        select(func.count(Product.id)).where(
            Product.category_id == category.id, Product.tenant_id == tenant.id
        )
    )
    product_count = p_count_res.scalar_one() or 0

    return success_response(
        data=CategoryResponse(
            id=category.id,
            tenant_id=category.tenant_id,
            name=category.name,
            slug=category.slug,
            description=category.description,
            icon=category.icon,
            display_order=category.display_order,
            parent_id=category.parent_id,
            product_count=product_count,
            created_at=category.created_at,
            updated_at=category.updated_at,
        ),
        message="Category updated successfully",
    )


@router.delete(
    "/{category_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Delete a category",
)
async def delete_category(
    category_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    query = select(Category).where(
        Category.id == category_id, Category.tenant_id == tenant.id
    )
    result = await db.execute(query)
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    await db.delete(category)
    await db.commit()

    return success_response(
        data={},
        message="Category deleted successfully",
    )
