import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.tenant import Tenant
from app.models.user import User
from app.models.cart import UserCart
from app.schemas.cart import CartSyncRequest, CartMergeRequest, CartResponse
from app.schemas.response import success_response, ApiResponse, ErrorResponse

router = APIRouter(
    prefix="/cart",
    tags=["Cart (Persistent User State)"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Tenant Not Found"},
    },
)


async def _resolve_tenant(
    tenant_slug: str,
    db: AsyncSession,
    current_user: Optional[User] = None,
    request: Optional[Request] = None,
) -> Optional[Tenant]:
    reserved = {
        "general",
        "store",
        "none",
        "cart",
        "checkout",
        "menu",
        "orders",
        "profile",
        "null",
        "undefined",
    }

    # 1. Try explicit tenant_slug from path if not reserved
    if tenant_slug and tenant_slug.strip().lower() not in reserved:
        res = await db.execute(
            select(Tenant).where(func.lower(Tenant.slug) == tenant_slug.strip().lower())
        )
        found = res.scalar_one_or_none()
        if found:
            return found

    # 2. Try x-tenant-slug header
    if request:
        header_slug = request.headers.get("x-tenant-slug")
        if header_slug and header_slug.strip().lower() not in reserved:
            res = await db.execute(
                select(Tenant).where(func.lower(Tenant.slug) == header_slug.strip().lower())
            )
            found = res.scalar_one_or_none()
            if found:
                return found

        # 3. Try Host header (e.g. jazz-cakes-ltd.localhost:3000)
        host = request.headers.get("host", "").split(":")[0].lower()
        if host.endswith(".localhost") and host != "localhost":
            sub = host.replace(".localhost", "")
            if sub and sub not in {"app", "core", "www", "api"}:
                res = await db.execute(
                    select(Tenant).where(func.lower(Tenant.slug) == sub)
                )
                found = res.scalar_one_or_none()
                if found:
                    return found
        elif "." in host:
            sub = host.split(".")[0]
            if sub and sub not in {"app", "core", "www", "api"}:
                res = await db.execute(
                    select(Tenant).where(func.lower(Tenant.slug) == sub)
                )
                found = res.scalar_one_or_none()
                if found:
                    return found

    # 4. Try current_user's associated tenant
    if current_user and current_user.tenant_id:
        res = await db.execute(
            select(Tenant).where(Tenant.id == current_user.tenant_id)
        )
        found = res.scalar_one_or_none()
        if found:
            return found

    return None


def sanitize_cart_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cleans cart items to ensure no null root fields ('size': null, 'flavor': null) are returned.
    If subfield options exist or size/flavor had values, preserve them inside options dict.
    """
    cleaned = dict(item)
    size_val = cleaned.pop("size", None)
    flavor_val = cleaned.pop("flavor", None)

    if size_val:
        sub = cleaned.setdefault("options", {})
        if isinstance(sub, dict):
            sub["size"] = size_val
    if flavor_val:
        sub = cleaned.setdefault("options", {})
        if isinstance(sub, dict):
            sub["flavor"] = flavor_val

    # Remove any None values from the dict to keep response clean
    return {k: v for k, v in cleaned.items() if v is not None}


def _get_cart_item_key(it: Dict[str, Any]) -> tuple:
    opts = it.get("options")
    opts_str = ""
    if isinstance(opts, dict):
        opts_str = "&".join(f"{k}:{v}" for k, v in sorted(opts.items()))
    return (str(it.get("id")), opts_str)


@router.get(
    "/{tenant_slug}",
    response_model=ApiResponse[CartResponse],
    summary="Get user's saved cart for a tenant",
)
async def get_cart(
    tenant_slug: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves the persisted cart for the authenticated user and specified tenant.
    Returns empty list if no items are currently saved.
    """
    tenant = await _resolve_tenant(tenant_slug, db, current_user, request)
    tenant_id = tenant.id if tenant else None

    # Query cart
    if tenant_id:
        stmt = select(UserCart).where(
            UserCart.user_id == current_user.id,
            UserCart.tenant_id == tenant_id,
        )
    else:
        stmt = select(UserCart).where(
            UserCart.user_id == current_user.id,
            UserCart.tenant_id.is_(None),
        )

    res = await db.execute(stmt)
    cart = res.scalar_one_or_none()

    items = [sanitize_cart_item(it) for it in cart.items] if cart and cart.items else []
    updated_at = cart.updated_at if cart else None

    return success_response(
        data=CartResponse(
            items=items,
            tenant_id=tenant_id,
            tenant_slug=tenant.slug if tenant else tenant_slug,
            updated_at=updated_at,
        ),
        message="User cart retrieved successfully",
    )


@router.put(
    "/{tenant_slug}",
    response_model=ApiResponse[CartResponse],
    summary="Sync / overwrite user's saved cart for a tenant",
)
async def sync_cart(
    tenant_slug: str,
    payload: CartSyncRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Persists the user's cart in the database. Overwrites the saved cart with the current items.
    """
    tenant = await _resolve_tenant(tenant_slug, db, current_user, request)
    tenant_id = tenant.id if tenant else None

    # Find existing cart with row lock
    if tenant_id:
        stmt = (
            select(UserCart)
            .where(
                UserCart.user_id == current_user.id,
                UserCart.tenant_id == tenant_id,
            )
            .with_for_update()
        )
    else:
        stmt = (
            select(UserCart)
            .where(
                UserCart.user_id == current_user.id,
                UserCart.tenant_id.is_(None),
            )
            .with_for_update()
        )

    res = await db.execute(stmt)
    cart = res.scalar_one_or_none()

    serialized_items = [
        sanitize_cart_item(item.model_dump(exclude_none=True))
        for item in payload.items
    ]

    if cart:
        cart.items = serialized_items
        cart.updated_at = func.now()
        await db.commit()
    else:
        cart = UserCart(
            user_id=current_user.id,
            tenant_id=tenant_id,
            items=serialized_items,
        )
        db.add(cart)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            res = await db.execute(stmt)
            cart = res.scalar_one_or_none()
            if cart:
                cart.items = serialized_items
                cart.updated_at = func.now()
                await db.commit()

    await db.refresh(cart)

    sanitized_output = [sanitize_cart_item(it) for it in cart.items]

    return success_response(
        data=CartResponse(
            items=sanitized_output,
            tenant_id=tenant_id,
            tenant_slug=tenant.slug if tenant else tenant_slug,
            updated_at=cart.updated_at,
        ),
        message="User cart synchronized successfully",
    )


@router.post(
    "/{tenant_slug}/merge",
    response_model=ApiResponse[CartResponse],
    summary="Merge guest items with saved database cart",
)
async def merge_cart(
    tenant_slug: str,
    payload: CartMergeRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Merges newly supplied items with the user's saved database cart.
    Combines quantities for items matching by product ID and variant options.
    """
    tenant = await _resolve_tenant(tenant_slug, db, current_user, request)
    tenant_id = tenant.id if tenant else None

    if tenant_id:
        stmt = (
            select(UserCart)
            .where(
                UserCart.user_id == current_user.id,
                UserCart.tenant_id == tenant_id,
            )
            .with_for_update()
        )
    else:
        stmt = (
            select(UserCart)
            .where(
                UserCart.user_id == current_user.id,
                UserCart.tenant_id.is_(None),
            )
            .with_for_update()
        )

    res = await db.execute(stmt)
    cart = res.scalar_one_or_none()

    existing_items: List[Dict[str, Any]] = (
        [sanitize_cart_item(it) for it in cart.items] if cart and cart.items else []
    )
    incoming_items: List[Dict[str, Any]] = [
        sanitize_cart_item(item.model_dump(exclude_none=True))
        for item in payload.items
    ]

    # Merge logic: keyed by (id, options)
    merged_map: Dict[tuple, Dict[str, Any]] = {}

    # Add existing items first
    for it in existing_items:
        key = _get_cart_item_key(it)
        merged_map[key] = dict(it)

    # Merge incoming items
    for it in incoming_items:
        key = _get_cart_item_key(it)
        if key in merged_map:
            # If the item already exists in the cart, take the max quantity to avoid accidental doubling
            merged_map[key]["quantity"] = max(
                int(merged_map[key].get("quantity", 1)),
                int(it.get("quantity", 1)),
            )
        else:
            merged_map[key] = dict(it)

    final_items = list(merged_map.values())

    if cart:
        cart.items = final_items
        cart.updated_at = func.now()
        await db.commit()
    else:
        cart = UserCart(
            user_id=current_user.id,
            tenant_id=tenant_id,
            items=final_items,
        )
        db.add(cart)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            res = await db.execute(stmt)
            cart = res.scalar_one_or_none()
            if cart:
                cart.items = final_items
                cart.updated_at = func.now()
                await db.commit()

    await db.commit()
    await db.refresh(cart)

    sanitized_output = [sanitize_cart_item(it) for it in cart.items]

    return success_response(
        data=CartResponse(
            items=sanitized_output,
            tenant_id=tenant_id,
            tenant_slug=tenant.slug if tenant else tenant_slug,
            updated_at=cart.updated_at,
        ),
        message="User cart merged and updated successfully",
    )


@router.delete(
    "/{tenant_slug}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Clear saved user cart for a tenant",
)
async def clear_cart(
    tenant_slug: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Clears the saved cart in the database (e.g. after a completed order checkout).
    """
    tenant = await _resolve_tenant(tenant_slug, db, current_user, request)
    tenant_id = tenant.id if tenant else None

    if tenant_id:
        stmt = select(UserCart).where(
            UserCart.user_id == current_user.id,
            UserCart.tenant_id == tenant_id,
        )
    else:
        stmt = select(UserCart).where(
            UserCart.user_id == current_user.id,
            UserCart.tenant_id.is_(None),
        )

    res = await db.execute(stmt)
    cart = res.scalar_one_or_none()

    if cart:
        cart.items = []
        cart.updated_at = func.now()
        await db.commit()

    return success_response(
        data={"cleared": True},
        message="User cart cleared successfully",
    )
