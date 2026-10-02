import pytest
import uuid
from app.adapters.postgres_adapter import PostgresAdapter
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse


@pytest.mark.asyncio
async def test_postgres_adapter_crud(db_session, sample_tenant):
    adapter = PostgresAdapter(session=db_session, tenant_id=sample_tenant.id)

    # Test Create
    new_product = ProductCreate(
        title="Ergonomic Desk",
        slug="ergonomic-desk",
        description="Premium standing desk",
        price=450.0,
        currency="USD",
        inventory_count=15,
        images=["https://example.com/desk.jpg"],
        is_published=True,
    )
    created = await adapter.create_product(new_product)
    assert isinstance(created, ProductResponse)
    assert created.title == "Ergonomic Desk"
    assert created.tenant_id == sample_tenant.id

    # Test Get by ID
    fetched = await adapter.get_by_id(created.id)
    assert fetched is not None
    assert fetched.id == created.id
    assert fetched.slug == "ergonomic-desk"

    # Test Get by Slug
    by_slug = await adapter.get_by_slug("ergonomic-desk")
    assert by_slug is not None
    assert by_slug.id == created.id

    # Test Update
    updated = await adapter.update_product(
        created.id,
        ProductUpdate(price=499.0, inventory_count=10),
    )
    assert updated is not None
    assert updated.price == 499.0
    assert updated.inventory_count == 10

    # Test List
    product_list = await adapter.list_products()
    assert len(product_list) == 1
    assert product_list[0].id == created.id

    # Test Delete
    deleted = await adapter.delete_product(created.id)
    assert deleted is True

    # Verify Not Found after deletion
    not_found = await adapter.get_by_id(created.id)
    assert not_found is None
