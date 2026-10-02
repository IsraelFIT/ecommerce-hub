import uuid
from abc import ABC, abstractmethod
from typing import List, Optional
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse


class ProductRepositoryAdapter(ABC):
    """
    Abstract Base Class defining the contract for product data access.
    Both PostgreSQL and Sanity CMS adapters must strictly return standard Pydantic models.
    """

    @abstractmethod
    async def get_by_id(self, product_id: uuid.UUID) -> Optional[ProductResponse]:
        """Fetch a single product by ID."""
        pass

    @abstractmethod
    async def get_by_slug(self, slug: str) -> Optional[ProductResponse]:
        """Fetch a single product by URL slug."""
        pass

    @abstractmethod
    async def list_products(
        self,
        skip: int = 0,
        limit: int = 50,
        published_only: bool = True,
    ) -> List[ProductResponse]:
        """List products with pagination."""
        pass

    @abstractmethod
    async def create_product(self, product_in: ProductCreate) -> ProductResponse:
        """Create a new product record."""
        pass

    @abstractmethod
    async def update_product(
        self,
        product_id: uuid.UUID,
        product_in: ProductUpdate,
    ) -> Optional[ProductResponse]:
        """Update an existing product record."""
        pass

    @abstractmethod
    async def delete_product(self, product_id: uuid.UUID) -> bool:
        """Delete a product record."""
        pass
