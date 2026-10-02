import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.adapters.base import ProductRepositoryAdapter
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse


class PostgresAdapter(ProductRepositoryAdapter):
    """
    PostgreSQL Adapter leveraging AsyncSession and Engine-level Row-Level Security (RLS).
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID):
        self.session = session
        self.tenant_id = tenant_id

    async def get_by_id(self, product_id: uuid.UUID) -> Optional[ProductResponse]:
        query = select(Product).where(Product.id == product_id)
        result = await self.session.execute(query)
        product = result.scalar_one_or_none()
        if not product:
            return None
        return ProductResponse.model_validate(product)

    async def get_by_slug(self, slug: str) -> Optional[ProductResponse]:
        query = select(Product).where(Product.slug == slug)
        result = await self.session.execute(query)
        product = result.scalar_one_or_none()
        if not product:
            return None
        return ProductResponse.model_validate(product)

    async def list_products(
        self,
        skip: int = 0,
        limit: int = 50,
        published_only: bool = True,
    ) -> List[ProductResponse]:
        query = select(Product)
        if published_only:
            query = query.where(Product.is_published == True)
        query = query.offset(skip).limit(limit)

        result = await self.session.execute(query)
        products = result.scalars().all()
        return [ProductResponse.model_validate(p) for p in products]

    async def create_product(self, product_in: ProductCreate) -> ProductResponse:
        product_data = product_in.model_dump()
        product = Product(
            tenant_id=self.tenant_id,
            **product_data,
        )
        self.session.add(product)
        await self.session.commit()
        await self.session.refresh(product)
        return ProductResponse.model_validate(product)

    async def update_product(
        self,
        product_id: uuid.UUID,
        product_in: ProductUpdate,
    ) -> Optional[ProductResponse]:
        query = select(Product).where(Product.id == product_id)
        result = await self.session.execute(query)
        product = result.scalar_one_or_none()
        if not product:
            return None

        update_data = product_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(product, key, value)

        await self.session.commit()
        await self.session.refresh(product)
        return ProductResponse.model_validate(product)

    async def delete_product(self, product_id: uuid.UUID) -> bool:
        query = select(Product).where(Product.id == product_id)
        result = await self.session.execute(query)
        product = result.scalar_one_or_none()
        if not product:
            return False

        await self.session.delete(product)
        await self.session.commit()
        return True
