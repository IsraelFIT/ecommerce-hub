import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.tenant import Tenant


@pytest.mark.asyncio
async def test_register_and_provision_tenant(client: AsyncClient, db_session: AsyncSession):
    payload = {
        "first_name": "Bode",
        "last_name": "Adebayo",
        "email": "bode@cakesbybode.com",
        "phone_number": "+1234567890",
        "store_name": "Cakes by Bode",
        "store_slug": "cakes-by-bode",
        "store_category": "Bakery & Confectionery",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "consent_to_terms": True,
    }

    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "success"
    assert "data" in body
    data = body["data"]
    assert "access_token" in data["auth"]
    assert "refresh_token" in data["auth"]
    assert data["auth"]["expires_in"] == "21600"
    assert data["email"] == "bode@cakesbybode.com"
    assert data["first_name"] == "Bode"
    assert data["last_name"] == "Adebayo"
    assert data["tenant_slug"] == "cakes-by-bode"
    assert data["tenant_name"] == "Cakes by Bode"

    # Verify Database records
    user_res = await db_session.execute(select(User).where(User.email == "bode@cakesbybode.com"))
    user = user_res.scalar_one()
    assert user.first_name == "Bode"
    assert user.role == "tenant_admin"

    tenant_res = await db_session.execute(select(Tenant).where(Tenant.slug == "cakes-by-bode"))
    tenant = tenant_res.scalar_one()
    assert tenant.name == "Cakes by Bode"
    assert tenant.category == "Bakery & Confectionery"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "first_name": "Bode",
        "last_name": "Adebayo",
        "email": "duplicate@example.com",
        "phone_number": "+1234567890",
        "store_name": "Store One",
        "store_slug": "store-one",
        "store_category": "Bakery",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "consent_to_terms": True,
    }

    res1 = await client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    payload2 = {**payload, "store_name": "Store Two", "store_slug": "store-two"}
    res2 = await client.post("/api/auth/register", json=payload2)
    assert res2.status_code == 400
    res2_body = res2.json()
    assert res2_body["status"] == "error"
    assert "already exists" in res2_body["message"]


@pytest.mark.asyncio
async def test_register_duplicate_store_slug(client: AsyncClient):
    payload = {
        "first_name": "Alice",
        "last_name": "Smith",
        "email": "alice@example.com",
        "phone_number": "+1234567890",
        "store_name": "Artisan Studio",
        "store_slug": "artisan-studio",
        "store_category": "Artisanal",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "consent_to_terms": True,
    }

    res1 = await client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    payload2 = {**payload, "email": "bob@example.com", "store_name": "Other Studio"}
    res2 = await client.post("/api/auth/register", json=payload2)
    assert res2.status_code == 400
    res2_body = res2.json()
    assert res2_body["status"] == "error"
    assert "already taken" in res2_body["message"]


@pytest.mark.asyncio
async def test_validation_error_format_422(client: AsyncClient):
    # Missing required fields and password mismatch
    bad_payload = {
        "first_name": "",
        "email": "not-an-email",
        "password": "pass",
        "confirm_password": "mismatch",
        "consent_to_terms": False,
    }
    res = await client.post("/api/auth/register", json=bad_payload)
    assert res.status_code == 422
    body = res.json()
    assert body["status"] == "error"
    assert body["message"] == "The given data was invalid."
    assert "errors" in body
    assert isinstance(body["errors"], dict)


@pytest.mark.asyncio
async def test_login_success_and_failure(client: AsyncClient):
    register_payload = {
        "first_name": "Chef",
        "last_name": "Bode",
        "email": "chef@cakes.com",
        "phone_number": "+1122334455",
        "store_name": "Chef Store",
        "store_slug": "chef-store",
        "store_category": "Bakery",
        "password": "MySecretPassword123!",
        "confirm_password": "MySecretPassword123!",
        "consent_to_terms": True,
    }
    await client.post("/api/auth/register", json=register_payload)

    # Valid login
    login_res = await client.post(
        "/api/auth/login",
        json={"email": "chef@cakes.com", "password": "MySecretPassword123!"},
    )
    assert login_res.status_code == 200
    body = login_res.json()
    assert body["status"] == "success"
    assert body["message"] == "Logged in successfully"
    data = body["data"]
    assert "auth" in data
    token = data["auth"]["access_token"]

    # Test /me endpoint with token
    me_res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_body = me_res.json()
    assert me_body["status"] == "success"
    assert me_body["data"]["email"] == "chef@cakes.com"

    # Invalid password login
    bad_login_res = await client.post(
        "/api/auth/login",
        json={"email": "chef@cakes.com", "password": "WrongPassword!"},
    )
    assert bad_login_res.status_code == 401
    bad_body = bad_login_res.json()
    assert bad_body["status"] == "error"
    assert "Invalid email or password" in bad_body["message"]


@pytest.mark.asyncio
async def test_forgot_and_reset_password_flow(client: AsyncClient):
    register_payload = {
        "first_name": "Jane",
        "last_name": "Doe",
        "email": "jane@example.com",
        "phone_number": "+1999888777",
        "store_name": "Jane Boutique",
        "store_slug": "jane-boutique",
        "store_category": "Fashion",
        "password": "OldPassword123!",
        "confirm_password": "OldPassword123!",
        "consent_to_terms": True,
    }
    await client.post("/api/auth/register", json=register_payload)

    # 1. Request forgot password OTP
    forgot_res = await client.post(
        "/api/auth/forgot-password",
        json={"email": "jane@example.com"},
    )
    assert forgot_res.status_code == 200
    forgot_body = forgot_res.json()
    assert forgot_body["status"] == "success"
    dev_otp = forgot_body.get("data", {}).get("dev_otp")
    assert dev_otp is not None
    assert len(dev_otp) == 6

    # 2. Reset password with invalid OTP
    bad_reset_res = await client.post(
        "/api/auth/reset-password",
        json={
            "email": "jane@example.com",
            "otp": "000000",
            "new_password": "BrandNewPassword123!",
            "confirm_password": "BrandNewPassword123!",
        },
    )
    assert bad_reset_res.status_code == 400
    assert bad_reset_res.json()["status"] == "error"

    # 3. Reset password with valid OTP
    good_reset_res = await client.post(
        "/api/auth/reset-password",
        json={
            "email": "jane@example.com",
            "otp": dev_otp,
            "new_password": "BrandNewPassword123!",
            "confirm_password": "BrandNewPassword123!",
        },
    )
    assert good_reset_res.status_code == 200
    assert good_reset_res.json()["status"] == "success"

    # 4. Old password fails
    old_login = await client.post(
        "/api/auth/login",
        json={"email": "jane@example.com", "password": "OldPassword123!"},
    )
    assert old_login.status_code == 401

    # 5. New password succeeds
    new_login = await client.post(
        "/api/auth/login",
        json={"email": "jane@example.com", "password": "BrandNewPassword123!"},
    )
    assert new_login.status_code == 200
    assert new_login.json()["status"] == "success"
    assert "access_token" in new_login.json()["data"]["auth"]


@pytest.mark.asyncio
async def test_refresh_token_flow(client: AsyncClient):
    payload = {
        "first_name": "Token",
        "last_name": "User",
        "email": "tokenuser@example.com",
        "phone_number": "+1234567890",
        "store_name": "Token Store",
        "store_slug": "token-store",
        "store_category": "Tech",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "consent_to_terms": True,
    }
    reg_res = await client.post("/api/auth/register", json=payload)
    assert reg_res.status_code == 201
    auth_data = reg_res.json()["data"]["auth"]
    refresh_token = auth_data["refresh_token"]

    # Test Refresh Token Endpoint
    refresh_res = await client.post(
        "/api/auth/refresh-token",
        json={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 200
    ref_body = refresh_res.json()
    assert ref_body["status"] == "success"
    assert ref_body["message"] == "Token refreshed successfully"
    assert "access_token" in ref_body["data"]["auth"]
    assert "refresh_token" in ref_body["data"]["auth"]
    assert ref_body["data"]["auth"]["expires_in"] == "21600"
    assert ref_body["data"]["email"] == "tokenuser@example.com"
