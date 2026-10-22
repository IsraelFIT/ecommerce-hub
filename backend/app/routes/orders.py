import uuid
import secrets
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_tenant_context, get_rls_db_session, get_current_user, get_current_tenant_admin
from app.models.tenant import Tenant
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.models.product import Product, ProductVariant
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate, OrderCancelRequest
from app.schemas.response import success_response, PaginationMeta, ApiResponse, PaginatedData, ErrorResponse

router = APIRouter(
    prefix="/orders",
    tags=["Orders (RLS Isolated)"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        404: {"model": ErrorResponse, "description": "Order Not Found"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
    },
)


async def enrich_order_items_from_products(
    orders: List[Order],
    db: AsyncSession,
    persist: bool = True,
) -> None:
    """
    Enriches order items directly from the Product table in the database:
    - Resolves each item's product by Product.id, ProductVariant.id (parent product), or title/name.
    - Sets item['image'] to the product's first image (product.images[0]) from the DB.
    - If no image is configured for the product in the DB, sets item['image'] to None.
    - Sorts the order items within each order alphabetically by product title.
    - Automatically persists changes back to the database.
    """
    if not orders:
        return

    # Collect product candidate UUIDs and titles from all order items
    raw_ids = set()
    raw_titles = set()
    for o in orders:
        for it in (o.items or []):
            p_id = it.get("product_id")
            if p_id:
                try:
                    raw_ids.add(uuid.UUID(str(p_id)))
                except Exception:
                    pass
            title = it.get("title") or it.get("product_title")
            if title:
                raw_titles.add(str(title).strip().lower())

    prod_by_id: Dict[str, Product] = {}
    variant_to_prod: Dict[str, Product] = {}
    prod_by_title: Dict[str, Product] = {}

    # 1. Look up products by ID directly from the Product table
    if raw_ids:
        p_res = await db.execute(select(Product).where(Product.id.in_(raw_ids)))
        for p in p_res.scalars().all():
            prod_by_id[str(p.id)] = p
            if p.title:
                prod_by_title[p.title.strip().lower()] = p
            if p.name:
                prod_by_title[p.name.strip().lower()] = p

        # 2. Check remaining candidate IDs against ProductVariant table to locate parent Product
        remaining_ids = [uid for uid in raw_ids if str(uid) not in prod_by_id]
        if remaining_ids:
            pv_res = await db.execute(
                select(ProductVariant).where(ProductVariant.id.in_(remaining_ids))
            )
            variants = pv_res.scalars().all()
            variant_parent_ids = {v.product_id for v in variants}

            if variant_parent_ids:
                parent_res = await db.execute(
                    select(Product).where(Product.id.in_(variant_parent_ids))
                )
                parent_map = {p.id: p for p in parent_res.scalars().all()}
                for v in variants:
                    if v.product_id in parent_map:
                        parent_p = parent_map[v.product_id]
                        variant_to_prod[str(v.id)] = parent_p
                        prod_by_id[str(parent_p.id)] = parent_p
                        if parent_p.title:
                            prod_by_title[parent_p.title.strip().lower()] = parent_p
                        if parent_p.name:
                            prod_by_title[parent_p.name.strip().lower()] = parent_p

    # 3. Look up remaining items by title/name from Product table
    if raw_titles:
        title_res = await db.execute(
            select(Product).where(
                or_(
                    func.lower(Product.title).in_(raw_titles),
                    func.lower(Product.name).in_(raw_titles),
                )
            )
        )
        for tp in title_res.scalars().all():
            if tp.title:
                prod_by_title[tp.title.strip().lower()] = tp
            if tp.name:
                prod_by_title[tp.name.strip().lower()] = tp
            prod_by_id[str(tp.id)] = tp

    # Populate each order item with product data and first image directly from DB
    any_modified = False
    for o in orders:
        if not o.items:
            continue
        order_modified = False
        new_items = []
        for it in o.items:
            it_dict = dict(it)
            p_id = str(it_dict.get("product_id") or "")
            title = str(it_dict.get("title") or it_dict.get("product_title") or "").strip().lower()

            matched_product = (
                prod_by_id.get(p_id)
                or variant_to_prod.get(p_id)
                or prod_by_title.get(title)
            )

            if matched_product:
                # Set image to first image of the product from DB, or None
                first_img = (
                    matched_product.images[0]
                    if matched_product.images and len(matched_product.images) > 0
                    else None
                )
                if it_dict.get("image") != first_img:
                    it_dict["image"] = first_img
                    order_modified = True

                # Synchronize title if missing
                db_title = matched_product.name or matched_product.title
                if db_title and not it_dict.get("title"):
                    it_dict["title"] = db_title
                    order_modified = True

            new_items.append(it_dict)

        # Sort order items alphabetically by product title
        new_items.sort(key=lambda item: str(item.get("title") or "").lower())

        if order_modified or new_items != o.items:
            o.items = new_items
            db.add(o)
            any_modified = True

    if persist and any_modified:
        try:
            await db.commit()
        except Exception:
            pass


enrich_order_items_images = enrich_order_items_from_products


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrderResponse],
    summary="Create order and calculate subaccount split fees",
    description="Creates an order for the tenant and automatically calculates 2.5% platform fee and tenant payout.",
)
@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrderResponse],
    include_in_schema=False,
)
async def create_order(
    order_in: OrderCreate,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    subtotal = sum(item.unit_price * item.quantity for item in order_in.items)
    delivery_fee = (
        float(order_in.delivery_fee or 0.0)
        if order_in.fulfillment_type == "delivery"
        else 0.0
    )
    total_amount = round(subtotal + delivery_fee, 2)
    platform_fee = round(total_amount * (settings.PLATFORM_FEE_PERCENTAGE / 100.0), 2)
    tenant_payout = round(total_amount - platform_fee, 2)

    resolved_currency = (order_in.currency or tenant.currency or "NGN").upper()
    gateway_ref = f"ECH-{tenant.slug.upper()}-{secrets.token_hex(6).upper()}"

    # Auto-resolve user_id if customer_email matches an existing user
    user_id = order_in.user_id
    if not user_id and order_in.customer_email:
        user_res = await db.execute(
            select(User.id).where(User.email == order_in.customer_email.strip().lower())
        )
        user_id = user_res.scalar_one_or_none()

    # Resolve items and first images directly from the Product table in the DB
    raw_item_dicts = [item.model_dump(mode="json", exclude_none=True) for item in order_in.items]
    raw_ids = set()
    raw_titles = set()
    for it in raw_item_dicts:
        p_id = it.get("product_id")
        if p_id:
            try:
                raw_ids.add(uuid.UUID(str(p_id)))
            except Exception:
                pass
        title = it.get("title") or it.get("product_title")
        if title:
            raw_titles.add(str(title).strip().lower())

    prod_by_id: Dict[str, Product] = {}
    variant_to_prod: Dict[str, Product] = {}
    prod_by_title: Dict[str, Product] = {}

    if raw_ids:
        p_res = await db.execute(select(Product).where(Product.id.in_(raw_ids)))
        for p in p_res.scalars().all():
            prod_by_id[str(p.id)] = p
            if p.title:
                prod_by_title[p.title.strip().lower()] = p
            if p.name:
                prod_by_title[p.name.strip().lower()] = p

        remaining_ids = [uid for uid in raw_ids if str(uid) not in prod_by_id]
        if remaining_ids:
            pv_res = await db.execute(
                select(ProductVariant).where(ProductVariant.id.in_(remaining_ids))
            )
            variants = pv_res.scalars().all()
            variant_parent_ids = {v.product_id for v in variants}
            if variant_parent_ids:
                parent_res = await db.execute(
                    select(Product).where(Product.id.in_(variant_parent_ids))
                )
                parent_map = {p.id: p for p in parent_res.scalars().all()}
                for v in variants:
                    if v.product_id in parent_map:
                        parent_p = parent_map[v.product_id]
                        variant_to_prod[str(v.id)] = parent_p
                        prod_by_id[str(parent_p.id)] = parent_p
                        if parent_p.title:
                            prod_by_title[parent_p.title.strip().lower()] = parent_p
                        if parent_p.name:
                            prod_by_title[parent_p.name.strip().lower()] = parent_p

    if raw_titles:
        title_res = await db.execute(
            select(Product).where(
                or_(
                    func.lower(Product.title).in_(raw_titles),
                    func.lower(Product.name).in_(raw_titles),
                )
            )
        )
        for tp in title_res.scalars().all():
            if tp.title:
                prod_by_title[tp.title.strip().lower()] = tp
            if tp.name:
                prod_by_title[tp.name.strip().lower()] = tp
            prod_by_id[str(tp.id)] = tp

    target_p_ids = set()
    for p in prod_by_id.values():
        target_p_ids.add(p.id)

    # Acquire explicit row-level locks on target products and variants to prevent overselling race conditions
    locked_products: Dict[uuid.UUID, Product] = {}
    locked_variants: Dict[uuid.UUID, ProductVariant] = {}

    if target_p_ids:
        sorted_p_ids = sorted(list(target_p_ids), key=lambda x: str(x))
        p_lock_res = await db.execute(
            select(Product)
            .where(Product.id.in_(sorted_p_ids))
            .options(selectinload(Product.variants))
            .with_for_update()
        )
        locked_products = {p.id: p for p in p_lock_res.scalars().all()}

        v_lock_res = await db.execute(
            select(ProductVariant)
            .where(ProductVariant.product_id.in_(sorted_p_ids))
            .with_for_update()
        )
        for v in v_lock_res.scalars().all():
            locked_variants[v.id] = v

    inventory_deductions = []

    resolved_items = []
    for it in raw_item_dicts:
        p_id = str(it.get("product_id") or "")
        title = str(it.get("title") or it.get("product_title") or "").strip().lower()
        req_qty = int(it.get("quantity") or 1)

        matched_p = (
            prod_by_id.get(p_id)
            or variant_to_prod.get(p_id)
            or prod_by_title.get(title)
        )
        if matched_p:
            it["image"] = (
                matched_p.images[0]
                if matched_p.images and len(matched_p.images) > 0
                else None
            )
            if not it.get("title") and (matched_p.name or matched_p.title):
                it["title"] = matched_p.name or matched_p.title

            if matched_p.id in locked_products:
                p_record = locked_products[matched_p.id]
                p_name = p_record.name or p_record.title or "Product"

                # If product was already unlisted / draft due to 0 stock, reject with clear error message
                if not p_record.is_published or p_record.availability in ("unavailable", "out_of_stock"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"The item '{p_name}' is out of stock and is not available.",
                    )

                # Resolve specific variant
                matched_v: Optional[ProductVariant] = None
                try:
                    p_uuid = uuid.UUID(p_id)
                    if p_uuid in locked_variants:
                        matched_v = locked_variants[p_uuid]
                except Exception:
                    pass

                if not matched_v:
                    p_vars = [v for v in locked_variants.values() if v.product_id == p_record.id]
                    it_options = it.get("options")
                    if it_options and isinstance(it_options, dict):
                        for v in p_vars:
                            if v.options == it_options:
                                matched_v = v
                                break
                    if not matched_v and p_vars:
                        matched_v = p_vars[0]

                if matched_v and matched_v.track_inventory:
                    if matched_v.stock_quantity <= 0:
                        p_record.is_published = False
                        p_record.availability = "out_of_stock"
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"The item '{p_name}' is out of stock and is not available.",
                        )
                    if matched_v.stock_quantity < req_qty:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"The item '{p_name}' is not available in requested quantity (only {matched_v.stock_quantity} left).",
                        )

                    # Deduct stock quantity atomically under the row lock
                    matched_v.stock_quantity -= req_qty
                    inventory_deductions.append({
                        "variant_id": str(matched_v.id),
                        "product_id": str(p_record.id),
                        "quantity": req_qty,
                    })

        resolved_items.append(it)

    # Recalculate remaining total stock per locked product and apply draft/low_stock states
    for p_record in locked_products.values():
        tracked = [v for v in locked_variants.values() if v.product_id == p_record.id and v.track_inventory]
        if tracked:
            total_stock = sum(v.stock_quantity for v in tracked)
            if total_stock <= 0:
                p_record.is_published = False  # Set to draft status so customers don't see
                p_record.availability = "out_of_stock"
            elif total_stock < 5:
                p_record.availability = "low_stock"  # Rate as low quantity when less than 5 left
            else:
                p_record.availability = "available"

    # Sort items alphabetically by product title
    resolved_items.sort(key=lambda item: str(item.get("title") or "").lower())

    order = Order(
        tenant_id=tenant.id,
        user_id=user_id,
        customer_email=order_in.customer_email.strip().lower(),
        customer_name=order_in.customer_name,
        total_amount=total_amount,
        platform_fee=platform_fee,
        tenant_payout_amount=tenant_payout,
        currency=resolved_currency,
        status=OrderStatus.PENDING,
        payment_gateway=order_in.payment_gateway,
        gateway_reference=gateway_ref,
        items=resolved_items,
        metadata_json={
            "tenant_slug": tenant.slug,
            "subaccount_used": tenant.paystack_subaccount_code or tenant.stripe_account_id,
            "fulfillment_type": order_in.fulfillment_type,
            "delivery_fee": delivery_fee,
            "delivery_address": order_in.delivery_address,
            "fulfillment_date": order_in.fulfillment_date,
            "fulfillment_time": order_in.fulfillment_time,
            "gift_message": order_in.gift_message,
            "inventory_deducted": len(inventory_deductions) > 0,
            "deductions": inventory_deductions,
        },
    )

    db.add(order)
    await db.commit()
    await db.refresh(order)
    return success_response(
        data=OrderResponse.model_validate(order).model_dump(mode="json"),
        message="Order created successfully",
    )


@router.get(
    "",
    response_model=ApiResponse[PaginatedData[OrderResponse]],
    summary="List orders isolated by PostgreSQL RLS",
    description="Retrieves orders filtered strictly at database level by PostgreSQL RLS for the tenant, with product sorting support.",
)
@router.get(
    "/",
    response_model=ApiResponse[PaginatedData[OrderResponse]],
    include_in_schema=False,
)
async def list_orders(
    page: int = 1,
    per_page: int = 15,
    customer_email: Optional[str] = None,
    user_id: Optional[uuid.UUID] = None,
    product_id: Optional[uuid.UUID] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    offset = (page - 1) * per_page

    query_count = select(func.count(Order.id)).where(
        Order.tenant_id == tenant.id,
        Order.is_deleted == False,
    )
    query_items = (
        select(Order)
        .where(Order.tenant_id == tenant.id, Order.is_deleted == False)
        .options(selectinload(Order.user))
        .order_by(Order.created_at.desc())
    )

    is_admin = (
        current_user.role == "super_admin"
        or (current_user.role in ("admin", "tenant_admin") and current_user.tenant_id == tenant.id)
    )

    if is_admin:
        if user_id and customer_email:
            condition = or_(
                Order.user_id == user_id,
                Order.customer_email == customer_email.strip().lower(),
            )
            query_count = query_count.where(condition)
            query_items = query_items.where(condition)
        elif user_id:
            query_count = query_count.where(Order.user_id == user_id)
            query_items = query_items.where(Order.user_id == user_id)
        elif customer_email:
            query_count = query_count.where(Order.customer_email == customer_email.strip().lower())
            query_items = query_items.where(Order.customer_email == customer_email.strip().lower())
    else:
        cust_condition = or_(
            Order.user_id == current_user.id,
            Order.customer_email == current_user.email.strip().lower(),
        )
        query_count = query_count.where(cust_condition)
        query_items = query_items.where(cust_condition)

    total_query = await db.execute(query_count)
    total = total_query.scalar() or 0

    result = await db.execute(query_items.offset(offset).limit(per_page))
    orders = list(result.scalars().all())

    # Automatically enrich orders directly from the products table in the DB
    await enrich_order_items_from_products(orders, db, persist=True)

    # Filter by product_id if provided
    if product_id:
        p_str = str(product_id).lower()
        orders = [
            o for o in orders
            if any(str(it.get("product_id") or "").lower() == p_str for it in (o.items or []))
        ]

    # Sort orders directly by their products if sort_by is product/product_name
    if sort_by in ("product", "product_name"):
        is_desc = (sort_order or "asc").lower() == "desc"
        def get_product_sort_key(o: Order) -> str:
            if o.items and len(o.items) > 0:
                first_item = o.items[0]
                return str(first_item.get("title") or first_item.get("product_title") or "").lower()
            return ""
        orders.sort(key=get_product_sort_key, reverse=is_desc)
    elif sort_by in ("total_amount", "amount"):
        is_desc = (sort_order or "desc").lower() == "desc"
        orders.sort(key=lambda o: float(o.total_amount or 0.0), reverse=is_desc)
    elif sort_by in ("created_at", "date"):
        is_desc = (sort_order or "desc").lower() == "desc"
        orders.sort(key=lambda o: o.created_at, reverse=is_desc)

    # Fallback lookup for guest/unlinked orders with matching customer_email
    emails_to_lookup = [
        o.customer_email.strip().lower()
        for o in orders
        if not o.user and o.customer_email
    ]
    email_user_map = {}
    if emails_to_lookup:
        eu_res = await db.execute(
            select(User).where(func.lower(User.email).in_(emails_to_lookup))
        )
        for eu in eu_res.scalars().all():
            email_user_map[eu.email.lower()] = eu

    last_page = max(1, (total + per_page - 1) // per_page)
    pagination = PaginationMeta(
        current_page=page,
        last_page=last_page,
        per_page=per_page,
        total=total,
    )

    items = []
    for o in orders:
        resp = OrderResponse.model_validate(o)
        if o.user and getattr(o.user, "avatar_url", None):
            resp.customer_avatar_url = o.user.avatar_url
        elif o.customer_email and o.customer_email.strip().lower() in email_user_map:
            resp.customer_avatar_url = getattr(email_user_map[o.customer_email.strip().lower()], "avatar_url", None)
        items.append(resp.model_dump(mode="json"))

    return success_response(
        data={"items": items},
        pagination=pagination,
        message="Orders retrieved successfully",
    )


@router.get(
    "/{order_identifier}",
    response_model=ApiResponse[OrderResponse],
    summary="Get order details by UUID, gateway reference, or customer email",
)
async def get_order(
    order_identifier: str,
    email: Optional[str] = None,
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    clean_ident = order_identifier.strip().lstrip("#")
    if "@" in clean_ident:
        query = (
            select(Order)
            .where(
                func.lower(Order.customer_email) == clean_ident.lower(),
                Order.is_deleted == False,
            )
            .order_by(Order.created_at.desc())
        )
    else:
        try:
            order_uuid = uuid.UUID(clean_ident)
            query = select(Order).where(Order.id == order_uuid, Order.is_deleted == False)
        except ValueError:
            query = (
                select(Order)
                .where(
                    or_(
                        func.lower(Order.gateway_reference) == clean_ident.lower(),
                        Order.gateway_reference.ilike(f"%{clean_ident}%"),
                    ),
                    Order.is_deleted == False,
                )
                .order_by(Order.created_at.desc())
            )

    result = await db.execute(query.options(selectinload(Order.user)))
    order = result.scalars().first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_identifier}' not found in tenant store",
        )

    # Automatically enrich order directly from the products table in the DB
    await enrich_order_items_from_products([order], db, persist=True)

    if email and order.customer_email:
        if order.customer_email.strip().lower() != email.strip().lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The billing email does not match this order",
            )
    resp = OrderResponse.model_validate(order)
    if order.user and getattr(order.user, "avatar_url", None):
        resp.customer_avatar_url = order.user.avatar_url
    elif order.customer_email:
        cu_res = await db.execute(
            select(User).where(func.lower(User.email) == order.customer_email.strip().lower())
        )
        cu = cu_res.scalar_one_or_none()
        if cu and getattr(cu, "avatar_url", None):
            resp.customer_avatar_url = cu.avatar_url

    return success_response(
        data=resp.model_dump(mode="json"),
        message="Order details retrieved successfully",
    )


async def _restock_cancelled_order(order: Order, db: AsyncSession) -> None:
    """Restores reserved inventory and republishes products if they were set to draft on 0 stock."""
    meta = dict(order.metadata_json or {})
    if not meta.get("inventory_deducted"):
        return

    deductions = meta.get("deductions") or []
    variant_ids = []
    for d in deductions:
        try:
            variant_ids.append(uuid.UUID(str(d.get("variant_id"))))
        except Exception:
            pass

    if variant_ids:
        # Acquire explicit row locks on variants to prevent race conditions during restock
        v_res = await db.execute(
            select(ProductVariant)
            .where(ProductVariant.id.in_(variant_ids))
            .with_for_update()
        )
        variants = {v.id: v for v in v_res.scalars().all()}
        parent_p_ids = {v.product_id for v in variants.values()}

        for d in deductions:
            try:
                v_uuid = uuid.UUID(str(d.get("variant_id")))
                qty = int(d.get("quantity") or 0)
                if v_uuid in variants and qty > 0:
                    variants[v_uuid].stock_quantity += qty
            except Exception:
                pass

        # Lock parent products and update draft / low stock status
        if parent_p_ids:
            p_res = await db.execute(
                select(Product)
                .where(Product.id.in_(parent_p_ids))
                .options(selectinload(Product.variants))
                .with_for_update()
            )
            for p in p_res.scalars().all():
                tracked = [v for v in (p.variants or []) if v.track_inventory]
                if tracked:
                    total_stock = sum(v.stock_quantity for v in tracked)
                    if total_stock > 0 and not p.is_published:
                        p.is_published = True  # Re-publish from draft status
                    if total_stock <= 0:
                        p.is_published = False
                        p.availability = "out_of_stock"
                    elif total_stock < 5:
                        p.availability = "low_stock"
                    else:
                        p.availability = "available"

    meta["inventory_deducted"] = False
    meta["inventory_restocked"] = True
    order.metadata_json = meta


@router.delete(
    "/{order_id}",
    response_model=ApiResponse[Dict[str, str]],
    summary="Soft-delete an order (Tenant Admin)",
)
async def delete_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_rls_db_session),
    current_user: User = Depends(get_current_tenant_admin),
) -> Dict[str, Any]:
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.is_deleted == False).with_for_update()
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found in tenant store",
        )
    order.is_deleted = True
    order.deleted_at = func.now()
    await db.commit()
    return success_response(
        data={"id": str(order_id)},
        message="Order deleted successfully",
    )


@router.patch(
    "/{order_id}/status",
    response_model=ApiResponse[OrderResponse],
    summary="Update order fulfillment/payment status (Tenant Admin)",
)
async def update_order_status(
    order_id: uuid.UUID,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_rls_db_session),
    current_user: User = Depends(get_current_tenant_admin),
) -> Dict[str, Any]:
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.is_deleted == False).with_for_update()
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found in tenant store",
        )

    try:
        new_status = OrderStatus(payload.status.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.status}'. Valid statuses: {[s.value for s in OrderStatus]}",
        )

    # If transitioning to cancelled, restore reserved inventory
    if new_status == OrderStatus.CANCELLED and order.status != OrderStatus.CANCELLED:
        await _restock_cancelled_order(order, db)

    order.status = new_status
    if payload.tracking_notes:
        meta = dict(order.metadata_json or {})
        meta["tracking_notes"] = payload.tracking_notes
        order.metadata_json = meta

    await db.commit()
    await db.refresh(order)
    return success_response(
        data=OrderResponse.model_validate(order).model_dump(mode="json"),
        message=f"Order status updated to {new_status.value}",
    )


@router.post(
    "/{order_id}/cancel",
    response_model=ApiResponse[OrderResponse],
    summary="Cancel order (Customer or Tenant Admin)",
)
async def cancel_order(
    order_id: uuid.UUID,
    payload: Optional[OrderCancelRequest] = None,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
    request: Request = None,
) -> Dict[str, Any]:
    current_user: Optional[User] = None
    if request:
        try:
            current_user = await get_current_user(request=request, credentials=None, db=db)
        except Exception:
            current_user = None

    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.tenant_id == tenant.id,
            Order.is_deleted == False,
        ).with_for_update()
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found in tenant store",
        )

    is_admin = False
    is_owner = False

    if current_user:
        if current_user.role == "super_admin" or (
            current_user.role in ("admin", "tenant_admin") and current_user.tenant_id == tenant.id
        ):
            is_admin = True

        if (order.user_id and order.user_id == current_user.id) or (
            order.customer_email and order.customer_email.strip().lower() == current_user.email.strip().lower()
        ):
            is_owner = True

    if not is_admin and not is_owner and payload and payload.customer_email:
        if (
            order.customer_email
            and order.customer_email.strip().lower() == payload.customer_email.strip().lower()
        ):
            is_owner = True

    if not is_admin and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to cancel this order",
        )

    if order.status in (OrderStatus.DELIVERED, OrderStatus.FULFILLED, OrderStatus.CANCELLED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be cancelled in its current status '{order.status.value}'",
        )

    # Restock inventory under row lock
    await _restock_cancelled_order(order, db)

    order.status = OrderStatus.CANCELLED
    meta = dict(order.metadata_json or {})
    import datetime
    meta["cancelled_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    if is_admin and current_user:
        meta["cancelled_by"] = f"admin:{current_user.email}"
    elif current_user:
        meta["cancelled_by"] = f"customer:{current_user.email}"
    else:
        meta["cancelled_by"] = "customer:guest"

    if payload and payload.reason:
        meta["cancel_reason"] = payload.reason

    order.metadata_json = meta
    await db.commit()
    await db.refresh(order)

    return success_response(
        data=OrderResponse.model_validate(order).model_dump(mode="json"),
        message="Order cancelled successfully",
    )

