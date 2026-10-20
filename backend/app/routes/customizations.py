import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.models.customization_request import CustomizationRequest
from app.dependencies import get_current_user, get_current_super_admin
from app.schemas.customization import (
    CustomLandingPageRequestCreate,
    CustomizationRequestUpdate,
    CustomizationRequestResponse,
    TenantBrandingSummary,
)
from app.schemas.response import (
    success_response,
    PaginationMeta,
    ApiResponse,
    PaginatedData,
    ErrorResponse,
)

router = APIRouter(
    prefix="/customizations",
    tags=["Storefront Customizations & Bespoke Landing Page Requests"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        404: {"model": ErrorResponse, "description": "Resource Not Found"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
    },
)


@router.post(
    "/landing-page-request",
    response_model=ApiResponse[CustomizationRequestResponse],
    summary="Submit or update a customized landing page design request",
    description="Allows a tenant admin to request a bespoke custom landing page design from platform engineers.",
)
async def submit_landing_page_request(
    payload: CustomLandingPageRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    # 1. Resolve Tenant
    tenant = None
    if payload.tenant_id:
        t_res = await db.execute(select(Tenant).where(Tenant.id == payload.tenant_id))
        tenant = t_res.scalar_one_or_none()
    elif payload.tenant_slug:
        t_res = await db.execute(
            select(Tenant).where(Tenant.slug == payload.tenant_slug.lower())
        )
        tenant = t_res.scalar_one_or_none()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant could not be found to submit customization request.",
        )

    if current_user.role != "super_admin":
        if current_user.role not in ["admin", "tenant_admin"] or current_user.tenant_id != tenant.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have administrative access to this tenant store.",
            )

    # 2. Check for existing pending/in_progress request for this tenant
    req_query = await db.execute(
        select(CustomizationRequest)
        .where(
            CustomizationRequest.tenant_id == tenant.id,
            CustomizationRequest.request_type == "custom_landing_page",
        )
        .order_by(desc(CustomizationRequest.created_at))
    )
    existing_request = req_query.scalars().first()

    primary_col = payload.primary_color or tenant.branding_config.get(
        "primaryColor", "#059669"
    )
    secondary_col = payload.secondary_color or tenant.branding_config.get(
        "secondaryColor",
        tenant.branding_config.get("accentColor", "#ec4899"),
    )
    headline = payload.store_headline or tenant.branding_config.get(
        "storeHeadline", f"Official Online Store for {tenant.name}"
    )

    if existing_request and existing_request.status in ["pending", "in_review", "in_progress"]:
        # Update existing open request
        existing_request.details = payload.details or existing_request.details
        existing_request.primary_color = primary_col
        existing_request.secondary_color = secondary_col
        existing_request.store_headline = headline
        if payload.contact_email:
            existing_request.requested_by_email = payload.contact_email
        cust_req = existing_request
    else:
        # Create brand new customization request
        cust_req = CustomizationRequest(
            tenant_id=tenant.id,
            tenant_name=tenant.name,
            tenant_slug=tenant.slug,
            requested_by_email=payload.contact_email,
            request_type="custom_landing_page",
            status="pending",
            title=f"Custom Landing Page - {tenant.name}",
            details=payload.details or "Bespoke storefront design requested from tenant branding panel.",
            primary_color=primary_col,
            secondary_color=secondary_col,
            store_headline=headline,
        )
        db.add(cust_req)

    # 3. Update Tenant Branding Config
    cfg = dict(tenant.branding_config or {})
    cfg["landingPageType"] = "custom"
    cfg["customLandingPageStatus"] = cust_req.status
    if payload.primary_color:
        cfg["primaryColor"] = payload.primary_color
    if payload.secondary_color:
        cfg["secondaryColor"] = payload.secondary_color
        cfg["accentColor"] = payload.secondary_color
    if payload.store_headline:
        cfg["storeHeadline"] = payload.store_headline
    tenant.branding_config = cfg

    await db.commit()
    await db.refresh(cust_req)
    await db.refresh(tenant)

    return success_response(
        data=CustomizationRequestResponse.model_validate(cust_req).model_dump(
            mode="json"
        ),
        message="Custom landing page request submitted successfully to platform administrators",
    )


@router.post(
    "/set-landing-page-type",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Toggle tenant landing page between 'default' and 'custom'",
)
async def set_landing_page_type(
    tenant_slug: str = Query(..., description="Tenant subdomain slug"),
    landing_page_type: str = Query(
        "default", pattern="^(default|custom)$", description="Landing page mode"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    t_res = await db.execute(
        select(Tenant).where(Tenant.slug == tenant_slug.lower())
    )
    tenant = t_res.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found"
        )

    if current_user.role != "super_admin":
        if current_user.role not in ["admin", "tenant_admin"] or current_user.tenant_id != tenant.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have administrative access to this tenant store.",
            )

    cfg = dict(tenant.branding_config or {})
    cfg["landingPageType"] = landing_page_type
    tenant.branding_config = cfg

    await db.commit()
    await db.refresh(tenant)

    return success_response(
        data={
            "tenant_slug": tenant.slug,
            "landing_page_type": landing_page_type,
            "branding_config": tenant.branding_config,
        },
        message=f"Storefront layout switched to {landing_page_type} mode successfully",
    )


@router.get(
    "/requests",
    response_model=ApiResponse[PaginatedData[CustomizationRequestResponse]],
    summary="List all bespoke customization and landing page requests (Super Admin)",
)
async def list_customization_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_super_admin),
) -> Dict[str, Any]:
    query = select(CustomizationRequest)

    if status_filter and status_filter.lower() != "all":
        query = query.where(CustomizationRequest.status == status_filter.lower())

    if search:
        search_term = f"%{search.strip()}%"
        query = query.where(
            or_(
                CustomizationRequest.tenant_name.ilike(search_term),
                CustomizationRequest.tenant_slug.ilike(search_term),
                CustomizationRequest.requested_by_email.ilike(search_term),
                CustomizationRequest.details.ilike(search_term),
            )
        )

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    # Paginate
    offset = (page - 1) * per_page
    query = query.order_by(desc(CustomizationRequest.created_at)).offset(offset).limit(per_page)
    results = await db.execute(query)
    records = results.scalars().all()

    last_page = max(1, (total + per_page - 1) // per_page)
    pagination = PaginationMeta(
        current_page=page,
        last_page=last_page,
        per_page=per_page,
        total=total,
    )

    items = [
        CustomizationRequestResponse.model_validate(r).model_dump(mode="json")
        for r in records
    ]

    return success_response(
        data={"items": items},
        pagination=pagination,
        message="Customization requests retrieved successfully",
    )


@router.patch(
    "/requests/{request_id}",
    response_model=ApiResponse[CustomizationRequestResponse],
    summary="Update status and admin notes for a customization request (Super Admin)",
)
async def update_customization_request(
    request_id: uuid.UUID,
    payload: CustomizationRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_super_admin),
) -> Dict[str, Any]:
    req_res = await db.execute(
        select(CustomizationRequest).where(CustomizationRequest.id == request_id)
    )
    request_obj = req_res.scalar_one_or_none()

    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customization request not found",
        )

    if payload.status:
        request_obj.status = payload.status

        # Also sync status into the tenant's branding_config
        t_res = await db.execute(
            select(Tenant).where(Tenant.id == request_obj.tenant_id)
        )
        tenant = t_res.scalar_one_or_none()
        if tenant:
            cfg = dict(tenant.branding_config or {})
            cfg["customLandingPageStatus"] = payload.status
            if payload.status == "completed":
                cfg["landingPageType"] = "custom"
            tenant.branding_config = cfg

    if payload.admin_notes is not None:
        request_obj.admin_notes = payload.admin_notes

    await db.commit()
    await db.refresh(request_obj)

    return success_response(
        data=CustomizationRequestResponse.model_validate(request_obj).model_dump(
            mode="json"
        ),
        message="Customization request updated successfully",
    )


@router.get(
    "/tenant-brandings",
    response_model=ApiResponse[PaginatedData[TenantBrandingSummary]],
    summary="Directory of all tenant branding configurations (Super Admin)",
)
async def list_tenant_brandings(
    landing_type: Optional[str] = Query(None, alias="landing_type"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_super_admin),
) -> Dict[str, Any]:
    # 1. Fetch Tenants
    query = select(Tenant)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Tenant.name.ilike(search_term),
                Tenant.slug.ilike(search_term),
                Tenant.category.ilike(search_term),
            )
        )

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    offset = (page - 1) * per_page
    query = query.order_by(desc(Tenant.updated_at)).offset(offset).limit(per_page)
    t_results = await db.execute(query)
    tenants = t_results.scalars().all()

    # 2. Check Customization Requests for these tenants
    tenant_ids = [t.id for t in tenants]
    reqs_res = await db.execute(
        select(CustomizationRequest).where(
            CustomizationRequest.tenant_id.in_(tenant_ids)
        )
    )
    all_reqs = reqs_res.scalars().all()
    reqs_by_tenant = {}
    for r in all_reqs:
        reqs_by_tenant[r.tenant_id] = r

    items = []
    for t in tenants:
        cfg = t.branding_config or {}
        req = reqs_by_tenant.get(t.id)
        
        l_type = cfg.get("landingPageType", "default")
        if landing_type and landing_type.lower() != "all" and l_type != landing_type.lower():
            continue

        items.append(
            TenantBrandingSummary(
                tenant_id=t.id,
                name=t.name,
                slug=t.slug,
                category=t.category,
                country=t.country,
                currency=t.currency,
                custom_domain=t.custom_domain,
                primary_color=cfg.get("primaryColor", "#059669"),
                secondary_color=cfg.get(
                    "secondaryColor", cfg.get("accentColor", "#ec4899")
                ),
                landing_page_type=l_type,
                has_custom_request=req is not None,
                custom_request_status=req.status if req else cfg.get("customLandingPageStatus", "none"),
                logo_url=cfg.get("logoUrl"),
                store_headline=cfg.get("storeHeadline"),
                announcement_text=cfg.get("announcementText"),
                is_active=t.is_active,
                updated_at=t.updated_at,
            ).model_dump(mode="json")
        )

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
        message="Tenant brandings retrieved successfully",
    )


@router.get(
    "/tenant/{slug}/status",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Get tenant's active customization status and details",
)
async def get_tenant_customization_status(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    t_res = await db.execute(select(Tenant).where(Tenant.slug == slug.lower()))
    tenant = t_res.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found"
        )

    if current_user.role != "super_admin":
        if current_user.role not in ["admin", "tenant_admin"] or current_user.tenant_id != tenant.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have administrative access to this tenant store.",
            )

    req_query = await db.execute(
        select(CustomizationRequest)
        .where(
            CustomizationRequest.tenant_id == tenant.id,
            CustomizationRequest.request_type == "custom_landing_page",
        )
        .order_by(desc(CustomizationRequest.created_at))
    )
    latest_request = req_query.scalars().first()

    return success_response(
        data={
            "tenant_id": str(tenant.id),
            "tenant_slug": tenant.slug,
            "tenant_name": tenant.name,
            "branding_config": tenant.branding_config,
            "has_custom_request": latest_request is not None,
            "request": (
                CustomizationRequestResponse.model_validate(latest_request).model_dump(
                    mode="json"
                )
                if latest_request
                else None
            ),
        },
        message="Tenant customization status retrieved",
    )
