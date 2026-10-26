import uuid
import secrets
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, func, or_, String
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_tenant_context, get_rls_db_session, get_current_user, get_current_tenant_admin
from app.models.tenant import Tenant
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.models.product import Product, ProductVariant
from app.payments.paystack import PaystackPaymentProvider
from app.payments.stripe import StripePaymentProvider
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderListItemResponse,
    OrderStatusUpdate,
    OrderCancelRequest,
    OrderCalculateRequest,
    OrderCalculateResponse,
)
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

        # 2. Check remaining candidate IDs against ProductVariant table joined with parent Product
        remaining_ids = [uid for uid in raw_ids if str(uid) not in prod_by_id]
        if remaining_ids:
            pv_res = await db.execute(
                select(ProductVariant, Product)
                .join(Product, ProductVariant.product_id == Product.id)
                .where(ProductVariant.id.in_(remaining_ids))
            )
            for v, parent_p in pv_res.all():
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


async def compute_server_pricing(
    items_in: List[Any],
    tenant: Tenant,
    fulfillment_type: str,
    db: AsyncSession,
    lock_rows: bool = False,
) -> Dict[str, Any]:
    """
    Authoritative server-side pricing engine:
    1. NEVER trusts client-submitted unit_price or delivery_fee.
    2. Queries live database Product and ProductVariant tables for authentic prices.
    3. Resolves tenant-configured delivery fee server-side.
    4. Calculates statutory Nigerian 7.5% VAT when tenant currency is NGN or country is Nigeria.
    5. Optionally acquires explicit row-level locks on products & variants to prevent overselling race conditions.
    """
    raw_item_dicts = [
        it.model_dump(mode="json", exclude_none=True) if hasattr(it, "model_dump") else dict(it)
        for it in items_in
    ]
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
                select(ProductVariant, Product)
                .join(Product, ProductVariant.product_id == Product.id)
                .where(ProductVariant.id.in_(remaining_ids))
            )
            for v, parent_p in pv_res.all():
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

    target_p_ids = {p.id for p in prod_by_id.values()}

    locked_products: Dict[uuid.UUID, Product] = {}
    locked_variants: Dict[uuid.UUID, ProductVariant] = {}

    if target_p_ids:
        sorted_p_ids = sorted(list(target_p_ids), key=lambda x: str(x))
        if lock_rows:
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
        else:
            p_res = await db.execute(
                select(Product)
                .where(Product.id.in_(sorted_p_ids))
                .options(selectinload(Product.variants))
            )
            locked_products = {p.id: p for p in p_res.scalars().all()}

            v_res = await db.execute(
                select(ProductVariant)
                .where(ProductVariant.product_id.in_(sorted_p_ids))
            )
            for v in v_res.scalars().all():
                locked_variants[v.id] = v

    inventory_deductions = []
    resolved_items = []

    for it in raw_item_dicts:
        p_id = str(it.get("product_id") or "")
        title = str(it.get("title") or it.get("product_title") or "").strip().lower()
        req_qty = max(1, int(it.get("quantity") or 1))

        matched_p = (
            prod_by_id.get(p_id)
            or variant_to_prod.get(p_id)
            or prod_by_title.get(title)
        )
        if not matched_p:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with ID '{p_id}' or title '{title}' not found in store catalog.",
            )

        p_record = locked_products.get(matched_p.id) if matched_p else None
        p_name = (p_record.name or p_record.title) if p_record else (it.get("title") or "Item")

        # In transactional order creation, enforce availability
        if lock_rows and p_record:
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

        if not matched_v and p_record:
            p_vars = [v for v in locked_variants.values() if v.product_id == p_record.id]
            it_options = it.get("options")
            if it_options and isinstance(it_options, dict):
                for v in p_vars:
                    if v.options == it_options:
                        matched_v = v
                        break
            if not matched_v and p_vars:
                matched_v = p_vars[0]

        # Enforce inventory deductions if lock_rows is True
        if lock_rows and matched_v and matched_v.track_inventory:
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
            matched_v.stock_quantity -= req_qty
            inventory_deductions.append({
                "variant_id": str(matched_v.id),
                "product_id": str(p_record.id),
                "quantity": req_qty,
            })

        # Resolve verified unit price server-side (NEVER TRUST CLIENT unit_price)
        verified_unit_price: float = 0.0
        if matched_v and matched_v.price is not None:
            verified_unit_price = round(float(matched_v.price), 2)
        elif matched_p and hasattr(matched_p, "price") and matched_p.price is not None:
            verified_unit_price = round(float(matched_p.price), 2)

        it["unit_price"] = verified_unit_price
        it["quantity"] = req_qty
        it["line_total"] = round(verified_unit_price * req_qty, 2)
        it["title"] = p_name
        it["image"] = (
            matched_p.images[0]
            if matched_p and matched_p.images and len(matched_p.images) > 0
            else None
        )
        resolved_items.append(it)

    # Post-deduction stock check for locked products
    if lock_rows:
        for p_record in locked_products.values():
            tracked = [v for v in locked_variants.values() if v.product_id == p_record.id and v.track_inventory]
            if tracked:
                total_stock = sum(v.stock_quantity for v in tracked)
                if total_stock <= 0:
                    p_record.is_published = False
                    p_record.availability = "out_of_stock"
                elif total_stock < 5:
                    p_record.availability = "low_stock"
                else:
                    p_record.availability = "available"

    # Sort items alphabetically by title
    resolved_items.sort(key=lambda item: str(item.get("title") or "").lower())

    # 1. Server-side Subtotal
    subtotal = round(sum(it["unit_price"] * it["quantity"] for it in resolved_items), 2)

    # 2. Server-side Delivery Fee
    if (fulfillment_type or "").strip().lower() == "delivery":
        configured_fee = tenant.delivery_fee
        if configured_fee is None:
            configured_fee = (tenant.branding_config or {}).get("deliveryFee", 45.0)
        delivery_fee = round(float(configured_fee or 0.0), 2)
    else:
        delivery_fee = 0.0

    # 3. Server-side Tax (VAT) Calculation for Nigeria (7.5%)
    is_nigeria = (
        (tenant.country or "").strip().lower() == "nigeria"
        or (tenant.currency or "").strip().upper() == "NGN"
    )
    if is_nigeria:
        tax_rate = 0.075  # 7.5% Nigerian statutory VAT
        tax_title = "VAT (7.5%)"
    else:
        tax_rate = 0.0
        tax_title = "Taxes"

    tax_amount = round(subtotal * tax_rate, 2)

    # 4. Total Amount & Platform Split
    total_amount = round(subtotal + delivery_fee + tax_amount, 2)
    platform_fee = round(total_amount * (settings.PLATFORM_FEE_PERCENTAGE / 100.0), 2)
    tenant_payout = round(total_amount - platform_fee, 2)

    return {
        "resolved_items": resolved_items,
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
        "tax_rate": tax_rate,
        "tax_title": tax_title,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
        "platform_fee": platform_fee,
        "tenant_payout": tenant_payout,
        "inventory_deductions": inventory_deductions,
    }


@router.post(
    "/calculate",
    response_model=ApiResponse[OrderCalculateResponse],
    summary="Calculate order pricing, delivery fee, and Nigerian VAT server-side",
    description="Authoritative backend calculation for items, delivery fee, subtotal, 7.5% Nigerian VAT, and grand total.",
)
async def calculate_order(
    payload: OrderCalculateRequest,
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
) -> Dict[str, Any]:
    pricing = await compute_server_pricing(
        items_in=payload.items,
        tenant=tenant,
        fulfillment_type=payload.fulfillment_type or "pickup",
        db=db,
        lock_rows=False,
    )
    resolved_currency = (payload.currency or tenant.currency or "NGN").upper()
    return success_response(
        data={
            "items": pricing["resolved_items"],
            "subtotal": pricing["subtotal"],
            "delivery_fee": pricing["delivery_fee"],
            "tax_rate": pricing["tax_rate"],
            "tax_title": pricing["tax_title"],
            "tax_amount": pricing["tax_amount"],
            "total_amount": pricing["total_amount"],
            "currency": resolved_currency,
        },
        message="Order pricing and VAT calculated successfully",
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[OrderResponse],
    summary="Create order and calculate subaccount split fees",
    description="Creates an order for the tenant with 100% server-side verified pricing, 7.5% Nigerian VAT, delivery fee, and automated split settlement.",
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
    # Calculate all pricing, delivery fees, and Nigerian VAT strictly server-side under row-level locks
    pricing = await compute_server_pricing(
        items_in=order_in.items,
        tenant=tenant,
        fulfillment_type=order_in.fulfillment_type or "pickup",
        db=db,
        lock_rows=True,
    )

    resolved_currency = (order_in.currency or tenant.currency or "NGN").upper()
    gateway_ref = f"ECH-{tenant.slug.upper()}-{secrets.token_hex(6).upper()}"

    # Auto-resolve user_id if customer_email matches an existing user
    user_id = order_in.user_id
    if not user_id and order_in.customer_email:
        user_res = await db.execute(
            select(User.id).where(User.email == order_in.customer_email.strip().lower())
        )
        user_id = user_res.scalar_one_or_none()

    order = Order(
        tenant_id=tenant.id,
        user_id=user_id,
        customer_email=order_in.customer_email.strip().lower(),
        customer_name=order_in.customer_name,
        total_amount=pricing["total_amount"],
        platform_fee=pricing["platform_fee"],
        tenant_payout_amount=pricing["tenant_payout"],
        currency=resolved_currency,
        status=OrderStatus.PENDING,
        payment_gateway=order_in.payment_gateway,
        gateway_reference=gateway_ref,
        items=pricing["resolved_items"],
        metadata_json={
            "tenant_slug": tenant.slug,
            "subaccount_used": tenant.paystack_subaccount_code or tenant.stripe_account_id,
            "fulfillment_type": order_in.fulfillment_type,
            "subtotal": pricing["subtotal"],
            "delivery_fee": pricing["delivery_fee"],
            "tax_rate": pricing["tax_rate"],
            "tax_title": pricing["tax_title"],
            "tax_amount": pricing["tax_amount"],
            "total_amount": pricing["total_amount"],
            "delivery_address": order_in.delivery_address,
            "fulfillment_date": order_in.fulfillment_date,
            "fulfillment_time": order_in.fulfillment_time,
            "gift_message": order_in.gift_message,
            "inventory_deducted": len(pricing["inventory_deductions"]) > 0,
            "deductions": pricing["inventory_deductions"],
        },
    )

    db.add(order)
    await db.commit()
    await db.refresh(order)

    resp = OrderResponse.model_validate(order)
    resp.subtotal = pricing["subtotal"]
    resp.delivery_fee = pricing["delivery_fee"]
    resp.tax_rate = pricing["tax_rate"]
    resp.tax_title = pricing["tax_title"]
    resp.tax_amount = pricing["tax_amount"]

    return success_response(
        data=resp.model_dump(mode="json"),
        message="Order created successfully with server-verified pricing and VAT",
    )


@router.get(
    "",
    response_model=ApiResponse[PaginatedData[OrderListItemResponse]],
    summary="List orders isolated by PostgreSQL RLS",
    description="Retrieves orders filtered strictly at database level by PostgreSQL RLS for the tenant, with product sorting support.",
)
@router.get(
    "/",
    response_model=ApiResponse[PaginatedData[OrderListItemResponse]],
    include_in_schema=False,
)
async def list_orders(
    page: int = 1,
    per_page: int = 15,
    customer_email: Optional[str] = None,
    user_id: Optional[uuid.UUID] = None,
    product_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    include_items: bool = False,
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
        select(Order, User)
        .outerjoin(
            User,
            or_(
                Order.user_id == User.id,
                func.lower(Order.customer_email) == func.lower(User.email),
            ),
        )
        .where(Order.tenant_id == tenant.id, Order.is_deleted == False)
    )

    is_admin = (
        current_user.role == "super_admin"
        or (current_user.role in ("admin", "tenant_admin", "hub_admin") and current_user.tenant_id == tenant.id)
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

        # For regular customers, hide abandoned orders that were superseded after customer paid again
        superseded_filter = func.cast(Order.metadata_json, String).not_ilike('%"is_abandoned_superseded": true%')
        query_count = query_count.where(superseded_filter)
        query_items = query_items.where(superseded_filter)

    # Status filter at SQL level
    if status and status.strip().lower() != "all":
        clean_status = status.strip().lower()
        status_cond = func.lower(func.cast(Order.status, String)) == clean_status
        query_count = query_count.where(status_cond)
        query_items = query_items.where(status_cond)

    # Search filter at SQL level across name, email, gateway ref, and ID
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        search_filter = or_(
            func.lower(Order.customer_name).ilike(term),
            func.lower(Order.customer_email).ilike(term),
            func.lower(Order.gateway_reference).ilike(term),
            func.lower(Order.payment_gateway).ilike(term),
            func.cast(Order.id, String).ilike(term),
        )
        query_count = query_count.where(search_filter)
        query_items = query_items.where(search_filter)

    # Apply database-level ordering before pagination
    if sort_by in ("total_amount", "amount"):
        sort_col = Order.total_amount.desc() if (sort_order or "desc").lower() == "desc" else Order.total_amount.asc()
        query_items = query_items.order_by(sort_col)
    elif sort_by in ("created_at", "date"):
        sort_col = Order.created_at.desc() if (sort_order or "desc").lower() == "desc" else Order.created_at.asc()
        query_items = query_items.order_by(sort_col)
    else:
        query_items = query_items.order_by(Order.created_at.desc())

    total_query = await db.execute(query_count)
    total = total_query.scalar() or 0

    result = await db.execute(query_items.offset(offset).limit(per_page))
    rows = list(result.all())
    orders = [r[0] for r in rows]
    user_map = {r[0].id: r[1] for r in rows}

    # Only enrich items when requested (e.g. for customer invoices)
    if include_items:
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

    last_page = max(1, (total + per_page - 1) // per_page)
    pagination = PaginationMeta(
        current_page=page,
        last_page=last_page,
        per_page=per_page,
        total=total,
    )

    items = []
    for o in orders:
        u = user_map.get(o.id)
        resp = OrderListItemResponse(
            id=o.id,
            gateway_reference=o.gateway_reference,
            customer_name=o.customer_name,
            customer_email=o.customer_email,
            customer_avatar_url=getattr(u, "avatar_url", None) if u else None,
            total_amount=float(o.total_amount),
            platform_fee=float(o.platform_fee),
            tenant_payout_amount=float(o.tenant_payout_amount),
            currency=o.currency,
            status=o.status,
            payment_gateway=o.payment_gateway,
            created_at=o.created_at,
            items=o.items if include_items else None,
        )

        if include_items:
            items.append(resp.model_dump(mode="json"))
        else:
            items.append(resp.model_dump(mode="json", exclude={"items"}))

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
    base_query = (
        select(Order, User)
        .outerjoin(
            User,
            or_(
                Order.user_id == User.id,
                func.lower(Order.customer_email) == func.lower(User.email),
            ),
        )
    )
    clean_ident = order_identifier.strip().lstrip("#")
    if "@" in clean_ident:
        query = (
            base_query
            .where(
                func.lower(Order.customer_email) == clean_ident.lower(),
                Order.is_deleted == False,
            )
            .order_by(Order.created_at.desc())
        )
    else:
        try:
            order_uuid = uuid.UUID(clean_ident)
            query = base_query.where(Order.id == order_uuid, Order.is_deleted == False)
        except ValueError:
            query = (
                base_query
                .where(
                    or_(
                        func.lower(Order.gateway_reference) == clean_ident.lower(),
                        Order.gateway_reference.ilike(f"%{clean_ident}%"),
                    ),
                    Order.is_deleted == False,
                )
                .order_by(Order.created_at.desc())
            )

    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_identifier}' not found in tenant store",
        )
    order, user = row

    # Automatically enrich order directly from the products table in the DB
    await enrich_order_items_from_products([order], db, persist=True)

    if email and order.customer_email:
        if order.customer_email.strip().lower() != email.strip().lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The billing email does not match this order",
            )
    resp = OrderResponse.model_validate(order)
    meta = order.metadata_json or {}
    resp.subtotal = meta.get("subtotal")
    resp.delivery_fee = meta.get("delivery_fee")
    resp.tax_rate = meta.get("tax_rate")
    resp.tax_title = meta.get("tax_title")
    resp.tax_amount = meta.get("tax_amount")

    if user and getattr(user, "avatar_url", None):
        resp.customer_avatar_url = user.avatar_url

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
    tenant: Tenant = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_rls_db_session),
    current_user: User = Depends(get_current_tenant_admin),
) -> Dict[str, Any]:
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.tenant_id == tenant.id, Order.is_deleted == False).with_for_update()
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found in tenant store",
        )

    if order.status == OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order status cannot be modified until payment has been completed.",
        )

    clean_status = payload.status.strip().lower()
    if clean_status in ("pending", "paid"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status '{clean_status}' is an automated payment lifecycle status and cannot be set manually by administrators.",
        )

    allowed_admin_statuses = {
        OrderStatus.ACCEPTED.value: OrderStatus.ACCEPTED,
        OrderStatus.PROCESSING.value: OrderStatus.PROCESSING,
        OrderStatus.SHIPPED.value: OrderStatus.SHIPPED,
        OrderStatus.DELIVERED.value: OrderStatus.DELIVERED,
        OrderStatus.CANCELLED.value: OrderStatus.CANCELLED,
    }

    if clean_status not in allowed_admin_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.status}'. Tenant admins can only update orders to: {list(allowed_admin_statuses.keys())}",
        )

    new_status = allowed_admin_statuses[clean_status]

    if order.status in (OrderStatus.DELIVERED, OrderStatus.FULFILLED) and new_status == OrderStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order has already been delivered and cannot be cancelled.",
        )

    # If transitioning to cancelled, restore reserved inventory and trigger 100% gateway refund
    if new_status == OrderStatus.CANCELLED and order.status != OrderStatus.CANCELLED:
        await _restock_cancelled_order(order, db)

        meta = dict(order.metadata_json or {})
        now_utc = datetime.now(timezone.utc)
        meta["cancelled_at"] = now_utc.isoformat()
        meta["cancelled_by"] = f"admin:{current_user.email}"

        # If order was paid, accepted, or processing, trigger full 100% refund via gateway
        if order.status in (OrderStatus.PAID, OrderStatus.ACCEPTED, OrderStatus.PROCESSING):
            gateway = (order.payment_gateway or tenant.default_gateway or "paystack").lower()
            provider = StripePaymentProvider() if gateway == "stripe" else PaystackPaymentProvider()
            refund_res = await provider.refund_transaction(
                reference=order.gateway_reference,
                amount=float(order.total_amount),
                currency=order.currency,
            )
            meta["refund_amount"] = float(order.total_amount)
            meta["refund_percentage"] = 100.0
            meta["tenant_retention_amount"] = 0.0
            meta["refund_status"] = "processed"
            meta["refund_triggered_by"] = f"admin:{current_user.email}"
            meta["refund_gateway_response"] = refund_res

        order.metadata_json = meta

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
            current_user.role in ("admin", "tenant_admin", "hub_admin") and current_user.tenant_id == tenant.id
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

    if order.status in (OrderStatus.DELIVERED, OrderStatus.FULFILLED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order has already been delivered and cannot be cancelled.",
        )

    # Customer cancellation constraints:
    # Processing, shipped, delivered, fulfilled, and cancelled cannot be cancelled by customer
    if not is_admin and order.status in (
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.FULFILLED,
        OrderStatus.CANCELLED,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be cancelled in its current status '{order.status.value}'. Please contact store support.",
        )

    # Admin cancellation constraints:
    if is_admin and order.status in (OrderStatus.DELIVERED, OrderStatus.FULFILLED, OrderStatus.CANCELLED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be cancelled in its current status '{order.status.value}'.",
        )

    # Restock inventory under row lock
    await _restock_cancelled_order(order, db)

    now_utc = datetime.now(timezone.utc)
    meta = dict(order.metadata_json or {})
    meta["cancelled_at"] = now_utc.isoformat()
    if is_admin and current_user:
        meta["cancelled_by"] = f"admin:{current_user.email}"
    elif current_user:
        meta["cancelled_by"] = f"customer:{current_user.email}"
    else:
        meta["cancelled_by"] = f"customer:{order.customer_email}"

    if payload and payload.reason:
        meta["cancel_reason"] = payload.reason

    # Process gateway refund if order was paid or accepted
    if order.status in (OrderStatus.PAID, OrderStatus.ACCEPTED, OrderStatus.PROCESSING):
        total = float(order.total_amount)
        if is_admin:
            # Full 100% refund when admin cancels
            customer_refund = total
            refund_pct = 100.0
            tenant_retention = 0.0
        else:
            # Customer policy:
            # <= 24 hours: 100% refund
            # > 24 hours: 70% refund to customer, 30% retained by tenant admin
            order_time = order.created_at
            if order_time.tzinfo is None:
                order_time = order_time.replace(tzinfo=timezone.utc)
            elapsed_seconds = (now_utc - order_time).total_seconds()
            is_within_one_day = elapsed_seconds <= 86400

            if is_within_one_day:
                customer_refund = total
                refund_pct = 100.0
                tenant_retention = 0.0
            else:
                customer_refund = round(total * 0.70, 2)
                refund_pct = 70.0
                tenant_retention = round(total * 0.30, 2)

        gateway = (order.payment_gateway or tenant.default_gateway or "paystack").lower()
        provider = StripePaymentProvider() if gateway == "stripe" else PaystackPaymentProvider()
        refund_res = await provider.refund_transaction(
            reference=order.gateway_reference,
            amount=customer_refund,
            currency=order.currency,
        )

        meta["refund_amount"] = customer_refund
        meta["refund_percentage"] = refund_pct
        meta["tenant_retention_amount"] = tenant_retention
        meta["refund_status"] = "processed"
        meta["refund_triggered_by"] = meta["cancelled_by"]
        meta["refund_gateway_response"] = refund_res

    order.status = OrderStatus.CANCELLED
    order.metadata_json = meta
    await db.commit()
    await db.refresh(order)

    return success_response(
        data=OrderResponse.model_validate(order).model_dump(mode="json"),
        message="Order cancelled successfully",
    )

