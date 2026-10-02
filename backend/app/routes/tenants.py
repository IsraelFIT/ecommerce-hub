import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse
from app.schemas.response import success_response, PaginationMeta, ApiResponse, PaginatedData, ErrorResponse
from app.services.provisioning import provision_new_tenant

router = APIRouter(
    prefix="/tenants",
    tags=["Tenants"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        404: {"model": ErrorResponse, "description": "Tenant Not Found"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
    },
)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[TenantResponse],
    summary="Provision a new tenant store",
    description="Provisions a new store and registers it in the Core Registry with dedicated database/CMS configurations.",
)
async def create_tenant(
    tenant_in: TenantCreate,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    existing_slug = await db.execute(
        select(Tenant).where(Tenant.slug == tenant_in.slug.lower())
    )
    if existing_slug.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Storefront subdomain '{tenant_in.slug}' is already taken.",
        )

    tenant = await provision_new_tenant(db, tenant_in)
    return success_response(
        data=TenantResponse.model_validate(tenant).model_dump(mode="json"),
        message="Store provisioned successfully",
    )


@router.get(
    "/by-slug/{slug}",
    response_model=ApiResponse[TenantResponse],
    summary="Resolve tenant storefront configuration by subdomain slug",
    description="Retrieves tenant branding, theme tokens and payment routing config by slug (called by Edge proxy / storefront).",
)
async def get_tenant_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    result = await db.execute(
        select(Tenant).where(Tenant.slug == slug.lower())
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant '{slug}' not found or does not exist",
        )
    return success_response(
        data=TenantResponse.model_validate(tenant).model_dump(mode="json"),
        message="Tenant details retrieved successfully",
    )


@router.get(
    "/{tenant_id}",
    response_model=ApiResponse[TenantResponse],
    summary="Get tenant by UUID",
)
async def get_tenant(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found or does not exist",
        )
    return success_response(
        data=TenantResponse.model_validate(tenant).model_dump(mode="json"),
        message="Tenant details retrieved successfully",
    )


@router.patch(
    "/{tenant_id}",
    response_model=ApiResponse[TenantResponse],
    summary="Update tenant store settings",
)
async def update_tenant(
    tenant_id: uuid.UUID,
    tenant_update: TenantUpdate,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found or does not exist",
        )

    update_dict = tenant_update.model_dump(exclude_unset=True)
    if "branding_config" in update_dict and update_dict["branding_config"]:
        update_dict["branding_config"] = tenant_update.branding_config.model_dump()

    for key, value in update_dict.items():
        setattr(tenant, key, value)

    await db.commit()
    await db.refresh(tenant)
    return success_response(
        data=TenantResponse.model_validate(tenant).model_dump(mode="json"),
        message="Tenant settings updated successfully",
    )


@router.get(
    "/",
    response_model=ApiResponse[PaginatedData[TenantResponse]],
    summary="List all platform tenants (Super-admin)",
)
async def list_tenants(
    page: int = 1,
    per_page: int = 15,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    offset = (page - 1) * per_page

    total_query = await db.execute(select(func.count(Tenant.id)))
    total = total_query.scalar() or 0

    result = await db.execute(select(Tenant).offset(offset).limit(per_page))
    tenants = result.scalars().all()

    last_page = max(1, (total + per_page - 1) // per_page)
    pagination = PaginationMeta(
        current_page=page,
        last_page=last_page,
        per_page=per_page,
        total=total,
    )

    items = [TenantResponse.model_validate(t).model_dump(mode="json") for t in tenants]
    return success_response(
        data={"items": items},
        pagination=pagination,
        message="Tenants retrieved successfully",
    )
