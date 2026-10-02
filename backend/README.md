# EcommerceHub — Multi-Tenant Backend API

FastAPI backend engine built for enterprise-grade multi-tenancy, PostgreSQL Row-Level Security (RLS), interchangeable data layers (Adapter Pattern), and automatic split payments.

---

## 🏗️ Core Architecture & Design Patterns

1. **PostgreSQL Row-Level Security (RLS)**
   - Every request extracts tenant context from `X-Tenant-ID` or `X-Tenant-Slug` headers.
   - `get_rls_db_session` executes `SET LOCAL app.current_tenant = :tenant_id` at the database session level.

2. **Interchangeable Data Layer (Adapter Pattern)**
   - `ProductRepositoryAdapter` defines a strict Abstract Base Class (ABC).
   - Injects either `PostgresAdapter` or `SanityAdapter` at runtime based on the tenant's `backend_type`.
   - Both adapters yield identical Pydantic v2 `ProductResponse` schemas.

3. **Pluggable Payment Gateways & Split Payments**
   - Implements Strategy Pattern with `PaystackPaymentProvider` and `StripePaymentProvider`.
   - Automatically splits transaction totals into tenant payout and platform commission at the gateway subaccount level.

4. **Cryptographic Webhook Security & Idempotency**
   - Webhooks read `request.body()` directly for raw byte HMAC signature verification.
   - Returns immediate `200 OK` responses.
   - Background worker utilizes `processed_webhooks` unique event constraint for idempotency.

---

## 🚀 Running Locally

```bash
# 1. Activate virtual environment
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start local development server
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Docs:** `http://localhost:8000/docs`
- **OpenAPI JSON Schema:** `http://localhost:8000/openapi.json`

---

## 🧪 Running the Test Suite

```bash
pytest -v
```
