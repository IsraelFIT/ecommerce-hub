import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_tenant_provisioning_and_lookup(client: AsyncClient):
    # Provision new tenant
    signup_payload = {
        "name": "Beta Labs",
        "slug": "betalabs",
        "backend_type": "postgres",
        "default_gateway": "stripe",
        "branding_config": {
            "primaryColor": "#10b981",
            "accentColor": "#f59e0b",
            "tagline": "Innovations in tech",
        },
    }

    response = await client.post("/api/tenants/", json=signup_payload)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "success"
    assert body["data"]["slug"] == "betalabs"
    assert body["data"]["is_active"] is True

    # Duplicate slug check
    dup_res = await client.post("/api/tenants/", json=signup_payload)
    assert dup_res.status_code == 409
    assert dup_res.json()["status"] == "error"

    # Subdomain resolution endpoint (used by proxy)
    lookup_res = await client.get("/api/tenants/by-slug/betalabs")
    assert lookup_res.status_code == 200
    assert lookup_res.json()["status"] == "success"
    assert lookup_res.json()["data"]["name"] == "Beta Labs"


@pytest.mark.asyncio
async def test_tenant_header_isolation(client: AsyncClient, sample_tenant):
    # Missing tenant header should return 404/400
    res_no_header = await client.get("/api/products/")
    assert res_no_header.status_code in [400, 404]
    assert res_no_header.json()["status"] == "error"

    # Valid tenant slug header
    headers = {"X-Tenant-Slug": sample_tenant.slug}
    res_with_header = await client.get("/api/products/", headers=headers)
    assert res_with_header.status_code == 200
    assert res_with_header.json()["status"] == "success"
    assert "items" in res_with_header.json()["data"]
