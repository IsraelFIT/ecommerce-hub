import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.ext.asyncio import AsyncSession
from app.adapters.base import ProductRepositoryAdapter
from app.models.product import Product, ProductVariant, ProductClass
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductVariantResponse,
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
            is_published=product.is_published,
            variants=variants_list,
            sku=sku,
            price=price,
            currency=prod_currency,
            inventory_count=inventory_count,
            created_at=product.created_at,
            updated_at=product.updated_at,
        )

    async def get_by_id(self, product_id: uuid.UUID) -> Optional[ProductResponse]:
        query = (
            select(Product)
            .where(Product.id == product_id)
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
            .where(Product.slug == slug)
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
    ) -> List[ProductResponse]:
        query = (
            select(Product)
            .options(selectinload(Product.variants), selectinload(Product.category))
        )
        if published_only:
            query = query.where(Product.is_published == True)
        query = query.offset(skip).limit(limit)

        result = await self.session.execute(query)
        products = result.scalars().all()
        return [self._to_response(p) for p in products]

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
            .where(Product.id == product_id)
            .options(selectinload(Product.variants), selectinload(Product.category))
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

        await self.session.commit()
        return await self.get_by_id(product.id)

    async def delete_product(self, product_id: uuid.UUID) -> bool:
        query = select(Product).where(Product.id == product_id)
        result = await self.session.execute(query)
        product = result.scalar_one_or_none()
        if not product:
            return False

        await self.session.delete(product)
        await self.session.commit()
        return True
