import uuid
import httpx
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.adapters.base import ProductRepositoryAdapter
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse


class SanityAdapter(ProductRepositoryAdapter):
    """
    Sanity CMS Adapter implementing the interchangeable data layer interface via GROQ API.
    Returns standard Pydantic ProductResponse models identical to PostgresAdapter.
    """

    def __init__(
        self,
        project_id: str,
        dataset: str,
        token: Optional[str],
        tenant_id: uuid.UUID,
    ):
        self.project_id = project_id
        self.dataset = dataset
        self.token = token
        self.tenant_id = tenant_id
        self.base_url = f"https://{project_id}.api.sanity.io/v2023-08-01/data"

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _map_sanity_to_schema(self, doc: Dict[str, Any]) -> ProductResponse:
        """Transforms a Sanity document into a standard Pydantic ProductResponse."""
        # Ensure a deterministic or valid UUID for product ID
        raw_id = doc.get("_id", "")
        try:
            prod_id = uuid.UUID(raw_id)
        except ValueError:
            prod_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"sanity-{raw_id}")

        created_str = doc.get("_createdAt")
        updated_str = doc.get("_updatedAt")

        created_at = (
            datetime.fromisoformat(created_str.replace("Z", "+00:00"))
            if created_str
            else datetime.utcnow()
        )
        updated_at = (
            datetime.fromisoformat(updated_str.replace("Z", "+00:00"))
            if updated_str
            else datetime.utcnow()
        )

        return ProductResponse(
            id=prod_id,
            tenant_id=self.tenant_id,
            title=doc.get("title", ""),
            slug=doc.get("slug", {}).get("current", doc.get("slug", "")),
            description=doc.get("description"),
            price=float(doc.get("price", 0.0)),
            currency=doc.get("currency", "USD"),
            inventory_count=int(doc.get("inventoryCount", 0)),
            images=doc.get("images", []),
            is_published=doc.get("isPublished", True),
            created_at=created_at,
            updated_at=updated_at,
        )

    async def get_by_id(self, product_id: uuid.UUID) -> Optional[ProductResponse]:
        query = f'*[_type == "product" && _id == "{product_id}"][0]'
        url = f"{self.base_url}/query/{self.dataset}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url, params={"query": query}, headers=self._headers())
            if res.status_code != 200:
                return None
            data = res.json().get("result")
            if not data:
                return None
            return self._map_sanity_to_schema(data)

    async def get_by_slug(self, slug: str) -> Optional[ProductResponse]:
        query = f'*[_type == "product" && (slug.current == "{slug}" || slug == "{slug}")][0]'
        url = f"{self.base_url}/query/{self.dataset}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url, params={"query": query}, headers=self._headers())
            if res.status_code != 200:
                return None
            data = res.json().get("result")
            if not data:
                return None
            return self._map_sanity_to_schema(data)

    async def list_products(
        self,
        skip: int = 0,
        limit: int = 50,
        published_only: bool = True,
    ) -> List[ProductResponse]:
        filter_clause = '_type == "product"'
        if published_only:
            filter_clause += ' && (!defined(isPublished) || isPublished == true)'
        
        query = f'*[{filter_clause}] | order(_createdAt desc) [{skip}...{skip + limit}]'
        url = f"{self.base_url}/query/{self.dataset}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url, params={"query": query}, headers=self._headers())
            if res.status_code != 200:
                return []
            items = res.json().get("result", [])
            return [self._map_sanity_to_schema(item) for item in items]

    async def create_product(self, product_in: ProductCreate) -> ProductResponse:
        mutations = [
            {
                "create": {
                    "_type": "product",
                    "title": product_in.title,
                    "slug": {"_type": "slug", "current": product_in.slug},
                    "description": product_in.description,
                    "price": product_in.price,
                    "currency": product_in.currency,
                    "inventoryCount": product_in.inventory_count,
                    "images": product_in.images,
                    "isPublished": product_in.is_published,
                }
            }
        ]
        url = f"{self.base_url}/mutate/{self.dataset}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json={"mutations": mutations}, headers=self._headers())
            res.raise_for_status()
            results = res.json().get("results", [])
            doc_id = results[0]["id"]
            prod_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, f"sanity-{doc_id}")

            return ProductResponse(
                id=prod_uuid,
                tenant_id=self.tenant_id,
                title=product_in.title,
                slug=product_in.slug,
                description=product_in.description,
                price=product_in.price,
                currency=product_in.currency,
                inventory_count=product_in.inventory_count,
                images=product_in.images,
                is_published=product_in.is_published,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

    async def update_product(
        self,
        product_id: uuid.UUID,
        product_in: ProductUpdate,
    ) -> Optional[ProductResponse]:
        patch_set: Dict[str, Any] = {}
        dumped = product_in.model_dump(exclude_unset=True)
        if "title" in dumped:
            patch_set["title"] = dumped["title"]
        if "slug" in dumped:
            patch_set["slug"] = {"_type": "slug", "current": dumped["slug"]}
        if "description" in dumped:
            patch_set["description"] = dumped["description"]
        if "price" in dumped:
            patch_set["price"] = dumped["price"]
        if "currency" in dumped:
            patch_set["currency"] = dumped["currency"]
        if "inventory_count" in dumped:
            patch_set["inventoryCount"] = dumped["inventory_count"]
        if "images" in dumped:
            patch_set["images"] = dumped["images"]
        if "is_published" in dumped:
            patch_set["isPublished"] = dumped["is_published"]

        mutations = [{"patch": {"id": str(product_id), "set": patch_set}}]
        url = f"{self.base_url}/mutate/{self.dataset}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json={"mutations": mutations}, headers=self._headers())
            if res.status_code != 200:
                return None
            return await self.get_by_id(product_id)

    async def delete_product(self, product_id: uuid.UUID) -> bool:
        mutations = [{"delete": {"id": str(product_id)}}]
        url = f"{self.base_url}/mutate/{self.dataset}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json={"mutations": mutations}, headers=self._headers())
            return res.status_code == 200
