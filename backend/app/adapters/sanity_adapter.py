import re
import uuid
import httpx
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.adapters.base import ProductRepositoryAdapter
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductClass,
    ProductVariantResponse,
)


class SanityAdapter(ProductRepositoryAdapter):
    """
    Sanity CMS Adapter implementing the interchangeable data layer interface via GROQ API.
    Maps Sanity's unstructured data directly into specifications and variants/options JSON dictionaries.
    Returns standard Pydantic ProductResponse models identical to PostgresAdapter.
    """

    def __init__(
        self,
        project_id: str,
        dataset: str,
        token: Optional[str],
        tenant_id: uuid.UUID,
        currency: str = "NGN",
    ):
        self.project_id = project_id
        self.dataset = dataset
        self.token = token
        self.tenant_id = tenant_id
        self.currency = currency
        self.base_url = f"https://{project_id}.api.sanity.io/v2023-08-01/data"

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _map_sanity_to_schema(self, doc: Dict[str, Any]) -> ProductResponse:
        """Transforms a Sanity document into a standard Pydantic ProductResponse."""
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

        raw_slug = doc.get("slug")
        if isinstance(raw_slug, dict):
            slug_val = raw_slug.get("current", "")
        else:
            slug_val = str(raw_slug) if raw_slug else ""

        title = doc.get("title") or doc.get("name") or "Untitled Product"
        if not slug_val or not slug_val.strip():
            clean_title = re.sub(r"[^a-zA-Z0-9\s-]", "", title).strip().lower()
            slug_val = re.sub(r"[\s-]+", "-", clean_title) or f"product-{str(prod_id)[:8]}"

        raw_class = doc.get("productClass") or doc.get("product_class") or "physical"
        try:
            prod_class = ProductClass(raw_class.lower())
        except ValueError:
            prod_class = ProductClass.PHYSICAL

        # Dynamic specifications from Sanity metadata
        specifications = doc.get("specifications") or {}
        if not isinstance(specifications, dict):
            specifications = {}

        # Capture unstructured attributes into specifications
        for key in ["author", "brand", "material", "dietary", "duration", "dimensions", "weight"]:
            if key in doc and key not in specifications:
                specifications[key] = doc[key]

        # Extract variants or build default variant
        raw_variants = doc.get("variants")
        variants_list: List[ProductVariantResponse] = []

        if isinstance(raw_variants, list) and len(raw_variants) > 0:
            for idx, rv in enumerate(raw_variants):
                if isinstance(rv, dict):
                    v_sku = rv.get("sku") or f"SKU-{str(prod_id)[:4]}-{idx+1}"
                    v_price = float(rv.get("price", 100.0))
                    v_compare = float(rv.get("compareAtPrice")) if rv.get("compareAtPrice") else None
                    v_track = rv.get("trackInventory", prod_class == ProductClass.PHYSICAL)
                    v_stock = int(rv.get("stockQuantity", 0)) if v_track else 0
                    v_options = rv.get("options", {})
                    variants_list.append(
                        ProductVariantResponse(
                            id=uuid.uuid5(uuid.NAMESPACE_DNS, f"sanity-variant-{raw_id}-{idx}"),
                            product_id=prod_id,
                            tenant_id=self.tenant_id,
                            sku=v_sku,
                            price=v_price,
                            compare_at_price=v_compare,
                            track_inventory=v_track,
                            stock_quantity=v_stock,
                            options=v_options if isinstance(v_options, dict) else {},
                        )
                    )

        if not variants_list:
            price_val = doc.get("price", 100.0)
            try:
                price_float = float(price_val)
            except (ValueError, TypeError):
                price_float = 100.0

            sku_val = doc.get("sku") or f"SKU-{str(prod_id)[:6].upper()}"
            track_inv = prod_class == ProductClass.PHYSICAL
            stock_qty = int(doc.get("inventoryCount", 0) or 0) if track_inv else 0

            variants_list.append(
                ProductVariantResponse(
                    id=uuid.uuid5(uuid.NAMESPACE_DNS, f"sanity-variant-{raw_id}-default"),
                    product_id=prod_id,
                    tenant_id=self.tenant_id,
                    sku=sku_val,
                    price=price_float,
                    track_inventory=track_inv,
                    stock_quantity=stock_qty,
                    options={},
                )
            )

        primary_variant = variants_list[0]
        inventory_count = sum(v.stock_quantity for v in variants_list if v.track_inventory)

        return ProductResponse(
            id=prod_id,
            tenant_id=self.tenant_id,
            name=title,
            title=title,
            slug=slug_val,
            description=doc.get("description"),
            product_class=prod_class,
            specifications=specifications,
            filters=doc.get("filters") or {},
            category_id=uuid.UUID(str(doc["category_id"])) if doc.get("category_id") else None,
            category=doc.get("category", "General") or "General",
            images=doc.get("images", []) or [],
            is_published=doc.get("isPublished", True) if doc.get("isPublished") is not None else True,
            variants=variants_list,
            sku=primary_variant.sku,
            price=primary_variant.price,
            currency=self.currency or doc.get("currency") or "NGN",
            inventory_count=inventory_count,
            created_at=created_at,
            updated_at=updated_at,
        )

    async def _resolve_sanity_doc(self, product_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        pid_str = str(product_id)
        url = f"{self.base_url}/query/{self.dataset}"
        query = f'*[_type == "product" && (_id == "{pid_str}" || _id == "drafts.{pid_str}")][0]'

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.get(
                    url,
                    params={"query": query},
                    headers=self._headers(),
                )
                if res.status_code == 200:
                    data = res.json().get("result")
                    if data:
                        return data
            except Exception:
                pass

        # Fallback: query all products and match deterministic UUID
        query_all = '*[_type == "product"]'
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.get(
                    url,
                    params={"query": query_all},
                    headers=self._headers(),
                )
                if res.status_code == 200:
                    all_docs = res.json().get("result", [])
                    for doc in all_docs:
                        raw_id = doc.get("_id", "")
                        try:
                            if uuid.UUID(raw_id) == product_id:
                                return doc
                        except ValueError:
                            if uuid.uuid5(uuid.NAMESPACE_DNS, f"sanity-{raw_id}") == product_id:
                                return doc
            except Exception:
                pass

        return None

    async def get_by_id(self, product_id: uuid.UUID) -> Optional[ProductResponse]:
        doc = await self._resolve_sanity_doc(product_id)
        if not doc:
            return None
        return self._map_sanity_to_schema(doc)

    async def get_by_slug(self, slug: str) -> Optional[ProductResponse]:
        url = f"{self.base_url}/query/{self.dataset}"
        query = f'*[_type == "product" && slug.current == "{slug}"][0]'

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.get(
                    url,
                    params={"query": query},
                    headers=self._headers(),
                )
                if res.status_code == 200:
                    doc = res.json().get("result")
                    if doc:
                        return self._map_sanity_to_schema(doc)
            except Exception:
                pass
        return None

    async def list_products(
        self,
        skip: int = 0,
        limit: int = 50,
        published_only: bool = True,
    ) -> List[ProductResponse]:
        url = f"{self.base_url}/query/{self.dataset}"
        filter_expr = '!(_id in path("drafts.**"))' if published_only else "true"
        query = f'*[_type == "product" && {filter_expr}] | order(_createdAt desc) [{skip}...{skip + limit}]'

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.get(
                    url,
                    params={"query": query},
                    headers=self._headers(),
                )
                if res.status_code == 200:
                    docs = res.json().get("result", [])
                    return [self._map_sanity_to_schema(d) for d in docs if isinstance(d, dict)]
            except Exception:
                pass
        return []

    async def create_product(self, product_in: ProductCreate) -> ProductResponse:
        url = f"{self.base_url}/mutate/{self.dataset}"
        prod_name = product_in.name or product_in.title or "Untitled Product"
        primary_variant = product_in.variants[0] if product_in.variants else None
        prod_class_str = (
            product_in.product_class.value
            if hasattr(product_in.product_class, "value")
            else str(product_in.product_class)
        )

        doc_body: Dict[str, Any] = {
            "_type": "product",
            "name": prod_name,
            "title": prod_name,
            "slug": {"_type": "slug", "current": product_in.slug},
            "description": product_in.description,
            "productClass": prod_class_str,
            "category": product_in.category or "General",
            "category_id": str(product_in.category_id) if product_in.category_id else None,
            "specifications": product_in.specifications,
            "filters": product_in.filters or {},
            "images": product_in.images,
            "isPublished": product_in.is_published,
            "price": primary_variant.price if primary_variant else 100.0,
            "sku": primary_variant.sku if primary_variant else "SKU-001",
            "variants": [v.model_dump(mode="json") for v in product_in.variants],
        }

        mutations = [{"create": doc_body}]
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                url,
                json={"mutations": mutations},
                headers=self._headers(),
            )
            if res.status_code in (200, 201):
                results = res.json().get("results", [])
                if results:
                    created_id = results[0].get("id", str(uuid.uuid4()))
                    doc_body["_id"] = created_id
                    return self._map_sanity_to_schema(doc_body)

        return self._map_sanity_to_schema(doc_body)

    async def update_product(
        self,
        product_id: uuid.UUID,
        product_in: ProductUpdate,
    ) -> Optional[ProductResponse]:
        existing_doc = await self._resolve_sanity_doc(product_id)
        if not existing_doc:
            return None

        sanity_id = existing_doc.get("_id", str(product_id))
        url = f"{self.base_url}/mutate/{self.dataset}"
        updates = product_in.model_dump(mode="json", exclude_unset=True)

        set_fields: Dict[str, Any] = {}
        if "name" in updates or "title" in updates:
            t = updates.get("name") or updates.get("title")
            set_fields["name"] = t
            set_fields["title"] = t
        if "slug" in updates:
            set_fields["slug"] = {"_type": "slug", "current": updates["slug"]}
        if "description" in updates:
            set_fields["description"] = updates["description"]
        if "product_class" in updates and updates["product_class"]:
            set_fields["productClass"] = (
                updates["product_class"].value
                if hasattr(updates["product_class"], "value")
                else str(updates["product_class"])
            )
        if "specifications" in updates:
            set_fields["specifications"] = updates["specifications"]
        if "filters" in updates:
            set_fields["filters"] = updates["filters"] or {}
        if "category_id" in updates:
            set_fields["category_id"] = str(updates["category_id"]) if updates["category_id"] else None
        if "category" in updates:
            set_fields["category"] = updates["category"]
        if "images" in updates:
            set_fields["images"] = updates["images"]
        if "is_published" in updates:
            set_fields["isPublished"] = updates["is_published"]
        if "variants" in updates and updates["variants"]:
            set_fields["variants"] = updates["variants"]

        mutations = [{"patch": {"id": sanity_id, "set": set_fields}}]
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                url,
                json={"mutations": mutations},
                headers=self._headers(),
            )

        updated_doc = {**existing_doc, **set_fields}
        return self._map_sanity_to_schema(updated_doc)

    async def delete_product(self, product_id: uuid.UUID) -> bool:
        existing_doc = await self._resolve_sanity_doc(product_id)
        if not existing_doc:
            return False

        sanity_id = existing_doc.get("_id", str(product_id))
        url = f"{self.base_url}/mutate/{self.dataset}"
        mutations = [{"delete": {"id": sanity_id}}]

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                url,
                json={"mutations": mutations},
                headers=self._headers(),
            )
            return res.status_code in (200, 204)
