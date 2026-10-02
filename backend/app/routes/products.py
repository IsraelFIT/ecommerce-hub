import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_product_adapter
from app.adapters.base import ProductRepositoryAdapter
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
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


@router.get(
    "/",
    response_model=ApiResponse[PaginatedData[ProductResponse]],
    summary="List products for active tenant (PostgreSQL / Sanity CMS)",
    description="Lists products for the authenticated tenant. Dispatches dynamically to PostgreSQL (with RLS) or Sanity CMS.",
)
async def list_products(
    page: int = 1,
    per_page: int = 15,
    published_only: bool = True,
    adapter: ProductRepositoryAdapter = Depends(get_product_adapter),
) -> Dict[str, Any]:
    skip = (page - 1) * per_page
    products = await adapter.list_products(skip=skip, limit=per_page, published_only=published_only)
    items = [p.model_dump(mode="json") if hasattr(p, "model_dump") else p for p in products]

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
    adapter: ProductRepositoryAdapter = Depends(get_product_adapter),
) -> Dict[str, Any]:
    product = await adapter.get_by_slug(slug)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or does not exist",
        )
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
    adapter: ProductRepositoryAdapter = Depends(get_product_adapter),
) -> Dict[str, Any]:
    product = await adapter.get_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or does not exist",
        )
    return success_response(
        data=product.model_dump(mode="json") if hasattr(product, "model_dump") else product,
        message="Product details retrieved successfully",
    )


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[ProductResponse],
    summary="Create a new product in tenant catalog",
)
async def create_product(
    product_in: ProductCreate,
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
async def update_product(
    product_id: uuid.UUID,
    product_in: ProductUpdate,
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
