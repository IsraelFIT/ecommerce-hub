import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy import select, or_, func, cast
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import selectinload, defer
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.ext.asyncio import AsyncSession
from app.adapters.base import ProductRepositoryAdapter
from app.models.product import Product, ProductVariant, ProductClass, Category
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductVariantResponse,
    ProductSummaryResponse,
    ProductVariantSummaryResponse,
)


class PostgresAdapter(ProductRepositoryAdapter):
    """
    PostgreSQL Adapter implementing the Core + JSONB + Variant catalog architecture
    leveraging AsyncSession and Engine-level Row-Level Security (RLS).
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID, currency: str = "NGN"):
        self.session = session
        self.tenant_id = tenant_id
        self.currency = currency

    def _to_response(self, product: Product) -> ProductResponse:
        """Transforms a Product SQLAlchemy model and its variants into a ProductResponse."""
        variants_list = [
            ProductVariantResponse(
                id=v.id,
                product_id=v.product_id,
                tenant_id=v.tenant_id,
                sku=v.sku,
                price=float(v.price),
                compare_at_price=float(v.compare_at_price) if v.compare_at_price is not None else None,
                track_inventory=v.track_inventory,
                stock_quantity=v.stock_quantity,
                options=v.options or {},
            )
            for v in (product.variants or [])
        ]

        primary_variant = variants_list[0] if variants_list else None
        sku = primary_variant.sku if primary_variant else None
        price = primary_variant.price if primary_variant else 0.0
        inventory_count = sum(v.stock_quantity for v in variants_list if v.track_inventory)
        prod_currency = product.currency or self.currency or "NGN"

        has_tracked_inv = any(v.track_inventory for v in variants_list)
        if has_tracked_inv and inventory_count <= 0:
            avail = "out_of_stock"
        elif has_tracked_inv and inventory_count < 5:
            avail = "low_stock"
        else:
            avail = getattr(product, "availability", "available") or "available"

        return ProductResponse(
            id=product.id,
            tenant_id=product.tenant_id,
            name=product.name,
            title=product.name,
            slug=product.slug,
            description=product.description,
            product_class=product.product_class,
            specifications=product.specifications or {},
            filters=product.filters or {},
            category_id=product.category_id,
            category=product.category_str,
            images=product.images or [],
            availability=avail,
            is_published=product.is_published,
            variants=variants_list,
            sku=sku,
            price=price,
            currency=prod_currency,
            inventory_count=inventory_count,
            created_at=product.created_at,
            updated_at=product.updated_at,
        )

    def _to_summary_response(self, product: Product) -> ProductSummaryResponse:
        """Transforms a Product model into a lightweight ProductSummaryResponse for catalog listings."""
        variants_list = product.variants or []
        primary_variant = variants_list[0] if variants_list else None
        price = float(primary_variant.price) if primary_variant else (float(product.price) if product.price else 0.0)
        inventory_count = sum(v.stock_quantity for v in variants_list if v.track_inventory) if variants_list else (product.inventory_count or 0)
        prod_currency = product.currency or self.currency or "NGN"

        has_tracked_inv = any(v.track_inventory for v in variants_list) if variants_list else True
        if has_tracked_inv and inventory_count <= 0:
            avail = "out_of_stock"
        elif has_tracked_inv and inventory_count < 5:
            avail = "low_stock"
        else:
            avail = getattr(product, "availability", "available") or "available"

        first_img = product.images[0] if (product.images and len(product.images) > 0) else None
        images = [first_img] if first_img else []

        return ProductSummaryResponse(
            id=product.id,
            tenant_id=product.tenant_id,
            name=product.name,
            slug=product.slug,
            description=product.description,
            product_class=product.product_class,
            filters=product.filters or {},
            category=product.category_str,
            images=images,
            availability=avail,
            is_published=product.is_published,
            price=price,
            currency=prod_currency,
            inventory_count=inventory_count,
        )

    async def get_by_id(self, product_id: uuid.UUID) -> Optional[ProductResponse]:
        query = (
            select(Product)
            .where(
                Product.id == product_id,
                Product.tenant_id == self.tenant_id,
                Product.is_deleted == False,
            )
            .options(selectinload(Product.variants), selectinload(Product.category))
        )
        result = await self.session.execute(query)
        product = result.scalar_one_or_none()
        if not product:
            return None
        return self._to_response(product)

    async def get_by_slug(self, slug: str) -> Optional[ProductResponse]:
        query = (
            select(Product)
            .where(
                Product.slug == slug,
                Product.tenant_id == self.tenant_id,
                Product.is_deleted == False,
            )
            .options(selectinload(Product.variants), selectinload(Product.category))
        )
        result = await self.session.execute(query)
        product = result.scalar_one_or_none()
        if not product:
            return None
        return self._to_response(product)

    async def list_products(
        self,
        skip: int = 0,
        limit: int = 50,
        published_only: bool = True,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        availability: Optional[str] = None,
        search: Optional[str] = None,
        filters: Optional[Dict[str, List[str]]] = None,
        product_class: Optional[str] = None,
        **kwargs,
    ) -> List[ProductSummaryResponse]:
        query = (
            select(Product)
            .options(
                defer(Product.specifications),
                selectinload(Product.variants),
                selectinload(Product.category),
            )
        )
        query = query.where(
            Product.tenant_id == self.tenant_id,
            Product.is_deleted == False,
        )
        if published_only:
            query = query.where(Product.is_published == True)

        # 1. Category Filter
        if category and category.strip() and category.strip().upper() != "ALL":
            cat_val = category.strip().lower()
            query = query.outerjoin(Product.category).where(
                or_(
                    func.lower(Category.name) == cat_val,
                    func.lower(Product.category_name) == cat_val,
                )
            )

        # 2. Availability Filter
        if availability and availability.strip() and availability.strip().lower() != "all":
            avail_val = availability.strip().lower()
            if avail_val in ("schedule", "preorder"):
                query = query.where(Product.availability.in_(["preorder", "schedule"]))
            elif avail_val == "available":
                query = query.where(
                    or_(
                        Product.availability == "available",
                        Product.availability.is_(None),
                    )
                )

        # 3. Search Filter
        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Product.name.ilike(s),
                    Product.title.ilike(s),
                    Product.description.ilike(s),
                    Product.variants.any(ProductVariant.sku.ilike(s)),
                )
            )

        # 4. Price Bounds Filter
        if min_price is not None:
            query = query.where(
                Product.variants.any(ProductVariant.price >= min_price)
            )
        if max_price is not None:
            query = query.where(
                Product.variants.any(ProductVariant.price <= max_price)
            )

        # 5. Dynamic Filters (JSONB in PostgreSQL, string matching in SQLite)
        if filters:
            bind = getattr(self.session, "bind", None) or self.session.get_bind()
            is_postgres = getattr(getattr(bind, "dialect", None), "name", "") == "postgresql"

            for slug, options in filters.items():
                if not options:
                    continue
                option_conds = []
                for opt in options:
                    if not opt:
                        continue
                    opt_str = str(opt).strip()
                    if is_postgres:
                        for variant in {opt_str, opt_str.lower(), opt_str.title(), opt_str.capitalize()}:
                            option_conds.append(
                                cast(Product.filters, JSONB).contains({slug: [variant]})
                            )
                            option_conds.append(
                                cast(Product.filters, JSONB).contains({slug: variant})
                            )
                    else:
                        from sqlalchemy import String
                        option_conds.append(
                            cast(Product.filters[slug], String).ilike(f"%{opt_str}%")
                        )
                if option_conds:
                    query = query.where(or_(*option_conds))

        # 6. Product Class Filter
        if product_class and product_class.strip() and product_class.strip().lower() != "all":
            from app.models.product import ProductClass
            class_str = product_class.strip().lower()
            try:
                p_class = ProductClass(class_str)
                query = query.where(Product.product_class == p_class)
            except ValueError:
                pass

        query = query.offset(skip).limit(limit)

        result = await self.session.execute(query)
        products = result.scalars().all()
        return [self._to_summary_response(p) for p in products]

    async def create_product(self, product_in: ProductCreate) -> ProductResponse:
        resolved_name = product_in.name or product_in.title or "Untitled Product"
        category_name = product_in.category or "General"

        raw_filters = product_in.filters or {}
        cleaned_filters = {}
        if isinstance(raw_filters, dict):
            for fk, fv in raw_filters.items():
                if isinstance(fv, list):
                    valid_items = [str(x).strip() for x in fv if str(x).strip()]
                    if valid_items:
                        cleaned_filters[fk] = valid_items
                elif fv:
                    cleaned_filters[fk] = [str(fv).strip()]

        prod_currency = self.currency or product_in.currency or "NGN"

        product = Product(
            tenant_id=self.tenant_id,
            name=resolved_name,
            title=resolved_name,
            slug=product_in.slug,
            description=product_in.description,
            product_class=product_in.product_class,
            specifications=product_in.specifications or {},
            filters=cleaned_filters,
            images=(product_in.images or [])[:5],
            availability=product_in.availability or "available",
            is_published=product_in.is_published,
            category_id=product_in.category_id,
            category_name=category_name,
            currency=prod_currency,
        )
        self.session.add(product)
        await self.session.flush()

        # Add variants
        for v_in in product_in.variants:
            variant = ProductVariant(
                product_id=product.id,
                tenant_id=self.tenant_id,
                sku=v_in.sku,
                price=v_in.price,
                compare_at_price=v_in.compare_at_price,
                track_inventory=v_in.track_inventory,
                stock_quantity=v_in.stock_quantity if v_in.track_inventory else 0,
                options=v_in.options or {},
            )
            self.session.add(variant)

        await self.session.commit()
        refetched = await self.get_by_id(product.id)
        if not refetched:
            return self._to_response(product)
        return refetched

    async def update_product(
        self,
        product_id: uuid.UUID,
        product_in: ProductUpdate,
    ) -> Optional[ProductResponse]:
        query = (
            select(Product)
            .where(
                Product.id == product_id,
                Product.tenant_id == self.tenant_id,
                Product.is_deleted == False,
            )
            .options(selectinload(Product.variants), selectinload(Product.category))
            .with_for_update()
        )
        result = await self.session.execute(query)
        product = result.scalar_one_or_none()
        if not product:
            return None

        update_data = product_in.model_dump(exclude_unset=True, exclude={"variants"})

        # Synchronize title and name
        if "title" in update_data:
            t_val = update_data.pop("title")
            product.title = t_val
            if "name" not in update_data and t_val:
                product.name = t_val

        if "name" in update_data:
            n_val = update_data.pop("name")
            product.name = n_val
            product.title = n_val

        if "category" in update_data:
            cat_name = update_data.pop("category")
            if cat_name:
                product.category_name = cat_name

        if "category_id" in update_data:
            cat_id = update_data.pop("category_id")
            product.category_id = cat_id

        if "images" in update_data:
            imgs = update_data.pop("images")
            if imgs is not None:
                product.images = imgs[:5]

        if "filters" in update_data:
            flts = update_data.pop("filters")
            cleaned_filters = {}
            if isinstance(flts, dict):
                for fk, fv in flts.items():
                    if isinstance(fv, list):
                        valid_items = [str(x).strip() for x in fv if str(x).strip()]
                        if valid_items:
                            cleaned_filters[fk] = valid_items
                    elif fv:
                        cleaned_filters[fk] = [str(fv).strip()]
            product.filters = cleaned_filters
            flag_modified(product, "filters")

        if "specifications" in update_data:
            specs = update_data.pop("specifications")
            product.specifications = dict(specs) if specs is not None else {}
            flag_modified(product, "specifications")

        if "currency" in update_data:
            c_val = update_data.pop("currency")
            if c_val:
                product.currency = c_val
        elif not product.currency:
            product.currency = self.currency

        for key, value in update_data.items():
            if hasattr(product, key) and key not in ("category", "title", "name", "currency"):
                setattr(product, key, value)

        # Update or recreate variants if provided
        if product_in.variants is not None:
            # Delete existing variants and insert updated list
            for existing_v in list(product.variants or []):
                await self.session.delete(existing_v)
            await self.session.flush()

            new_variants = []
            for v_in in product_in.variants:
                if v_in.sku:
                    variant = ProductVariant(
                        product_id=product.id,
                        tenant_id=self.tenant_id,
                        sku=v_in.sku,
                        price=v_in.price if v_in.price is not None else 100.0,
                        compare_at_price=v_in.compare_at_price,
                        track_inventory=v_in.track_inventory if v_in.track_inventory is not None else True,
                        stock_quantity=v_in.stock_quantity if v_in.stock_quantity is not None else 0,
                        options=v_in.options or {},
                    )
                    self.session.add(variant)
                    new_variants.append(variant)
            product.variants = new_variants
        elif product.variants:
            # Update the primary variant if legacy flat fields were passed
            primary_v = product.variants[0]
            if product_in.price is not None:
                primary_v.price = product_in.price
            if product_in.inventory_count is not None:
                primary_v.stock_quantity = product_in.inventory_count
            if product_in.sku is not None:
                primary_v.sku = product_in.sku

        # Recalculate remaining total stock per product and apply draft/low_stock states if inventory is tracked
        tracked = [v for v in (product.variants or []) if v.track_inventory]
        if tracked:
            total_stock = sum(v.stock_quantity for v in tracked)
            if total_stock <= 0:
                product.is_published = False
                product.availability = "out_of_stock"
            elif total_stock < 5:
                if product.availability not in ("preorder",):
                    product.availability = "low_stock"
            elif product.availability in ("out_of_stock", "low_stock"):
                product.availability = "available"

        await self.session.commit()
        return await self.get_by_id(product.id)

    async def delete_product(self, product_id: uuid.UUID) -> bool:
        query = (
            select(Product)
            .where(
                Product.id == product_id,
                Product.tenant_id == self.tenant_id,
                Product.is_deleted == False,
            )
            .with_for_update()
        )
        result = await self.session.execute(query)
        product = result.scalar_one_or_none()
        if not product:
            return False

        product.is_deleted = True
        product.deleted_at = func.now()
        await self.session.commit()
        return True
