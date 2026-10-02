# E-Commerce Hub (Multi-Tenant Platform)

> **Status:** **Active & Ongoing Development**  
> This project is actively being developed as a high-performance Commercial Open Source Software (COSS) multi-tenant e-commerce platform. Architectural components, features, and adapters are continuously evolving.

---

## Overview

**E-Commerce Hub** is an enterprise-ready, multi-tenant e-commerce platform designed for instant tenant provisioning, custom storefront branding, and isolated data domains. It leverages Next.js Edge Proxy routing on the frontend and an asynchronous FastAPI backend backed by Neon Serverless PostgreSQL with Row-Level Security (RLS).

```mermaid
graph TD
    Client[Client Request] --> Proxy[Next.js Edge Proxy / proxy.ts]

    Proxy -->|Root Host / Landing| Landing[SaaS Landing & Onboarding]
    Proxy -->|core.domain.com| CoreConsole[Core Super-Admin Console]
    Proxy -->|{tenant}.domain.com| Storefront[Tenant Storefront]
    Proxy -->|{tenant}.domain.com/admin| TenantAdmin[Tenant Merchant Admin]

    Storefront & TenantAdmin & CoreConsole --> Backend[FastAPI Async Backend]

    Backend --> RLS[Postgres Row-Level Security Engine]
    Backend --> Adapters[Interchangeable Data Adapters]

    Adapters --> Postgres[Neon Serverless Postgres]
    Adapters --> Sanity[Sanity CMS Layer]
```

---

## Domain Topology & Routing

The platform runs from a unified codebase that renders tailored experiences based on the hostname and subdomain:

| Domain / Subdomain                                                        | Target Route                     | Purpose                                                                                                                                                       |
| :------------------------------------------------------------------------ | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`ecommerce-hub.com`**<br>`localhost:3000`                               | `app/page.tsx`<br>`app/(auth)/*` | **SaaS Landing Page & Tenant Registration**: Marketing, pricing, tenant self-serve onboarding & automatic provisioning.                                       |
| **`core.ecommerce-hub.com`**<br>`core.localhost:3000`                     | `app/[tenant]/(core)/*`          | **Platform Super-Admin Console**: System-wide oversight, cross-tenant management, developer configurations, revenue metrics, and tenant lifecycle operations. |
| **`{tenant}.ecommerce-hub.com`**<br>`{tenant}.localhost:3000`             | `app/[tenant]/*`                 | **Customer Storefront**: Custom tenant branding, product catalog, cart, customer checkout, and order tracking.                                                |
| **`{tenant}.ecommerce-hub.com/admin`**<br>`{tenant}.localhost:3000/admin` | `app/[tenant]/(admin)/*`         | **Merchant Dashboard**: Individual tenant management of products, inventory, orders, customer insights, and payment gateway connections.                      |

---

## Technical Stack

### **Frontend**

- **Framework:** [Next.js 15+ (App Router)](https://nextjs.org/) with TypeScript
- **Styling & UI:** Vanilla CSS design tokens (`globals.css`), Radix UI primitives, Lucide Icons
- **State Management:** Zustand, LocalStorage Session Sync
- **Routing:** Edge Proxy (`proxy.ts`) for wildcard subdomain multi-tenancy
- **Package Manager:** `pnpm`

### **Backend**

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+, async/await)
- **Validation & Serialization:** Pydantic v2
- **Database Engine:** [Neon Serverless PostgreSQL](https://neon.tech/) with SQLAlchemy 2.0 (`asyncpg`) & Alembic
- **Multi-Tenant Isolation:** Database engine-level PostgreSQL Row-Level Security (RLS)
- **Data Layer Pattern:** Pluggable Adapter Pattern (`PostgresAdapter`, `SanityAdapter`)
- **Payments:** Split-payment gateway integrations (Paystack, Stripe subaccounts)
- **Background Tasks:** FastAPI `BackgroundTasks` for idempotent webhook workers

---

## Key Architectural Pillars

### 1. Multi-Tenant Edge Routing (`proxy.ts`)

Next.js Edge Proxy intercepts all incoming HTTP requests. It parses the hostname, identifies the tenant slug or `core` super-admin subdomain, and dynamically rewrites requests to the appropriate route layout while preserving tenant context across requests.

### 2. Native Row-Level Security (RLS)

Data isolation is enforced directly at the database engine level. Every API request extracts the `X-Tenant-ID` header (or authenticated token claims) and sets `SET LOCAL app.current_tenant = :tenant_id` within the database transaction. PostgreSQL policies automatically constrain queries without relying on error-prone application-level filters.

### 3. Interchangeable Data Layer (Adapter Pattern)

Business logic and API routes are decoupled from the physical persistence mechanism. Tenants can be backed by Neon Postgres or Sanity CMS via standard Abstract Base Classes (ABCs), returning unified Pydantic schemas.

### 4. Split-Payment Engine

The platform does not escrow payments. Transactions are partitioned at the gateway level into merchant principal and platform fees using subaccount routing.

### 5. Idempotent Webhook Ingestion

Webhook handlers validate raw HMAC signatures (`await request.body()`) before payload parsing, immediately acknowledge `200 OK`, and schedule asynchronous background processing with unique idempotency keys.

---

## Repository Structure

```
ecommerce-hub/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── adapters/         # Data layer adapters (Postgres, Sanity)
│   │   ├── core/             # Config, security, database session management
│   │   ├── models/           # SQLAlchemy ORM models (Tenant, User, Product, Order, etc.)
│   │   ├── routes/           # REST endpoints (auth, tenants, products, orders, webhooks)
│   │   ├── schemas/          # Pydantic v2 request/response schemas
│   │   └── services/         # Tenant provisioning, webhook workers, payment logic
│   ├── tests/                # Pytest async test suite
│   ├── requirements.txt      # Python dependencies
│   └── pytest.ini            # Pytest configuration
│
├── frontend/                 # Next.js Application
│   ├── public/               # Static media & assets
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/       # Main platform auth (login, signup, reset)
│   │   │   ├── [tenant]/
│   │   │   │   ├── (admin)/  # Merchant management dashboard
│   │   │   │   ├── (core)/   # Super-admin core management console
│   │   │   │   ├── cart/     # Storefront cart
│   │   │   │   ├── checkout/ # Storefront checkout
│   │   │   │   └── menu/     # Storefront product catalog
│   │   │   ├── globals.css   # System design tokens & HSL themes
│   │   │   ├── layout.tsx    # Root layout
│   │   │   └── page.tsx      # Landing page
│   │   ├── components/       # UI components & layouts (Core, Merchant, Storefront)
│   │   ├── lib/              # API client, auth helpers, session management
│   │   ├── store/            # Zustand stores
│   │   ├── types/            # TypeScript data contracts & user schemas
│   │   └── proxy.ts          # Edge routing proxy convention
│   ├── package.json          # Node dependencies
│   └── next.config.ts        # Next.js configuration
│
├── neon.ts                   # Neon branch & deployment configuration
├── package.json              # Monorepo root scripts
├── .gitignore                # Git exclusions (.env, .neon, .agents, build artifacts)
└── README.md                 # Project documentation
```

---

## Getting Started for Developers

### Prerequisites

- **Node.js**: v20+ & **pnpm**
- **Python**: 3.11+
- **PostgreSQL / Neon Account**: For database connectivity

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment configuration
cp .env.example .env   # Or create .env with your DATABASE_URL

# Run FastAPI server with hot-reload
uvicorn app.main:app --reload --port 8000
```

The backend interactive API docs will be available at:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

---

### 3. Testing Local Subdomains

To simulate tenant storefronts and the core console locally, configure your `/etc/hosts` file:

```text
127.0.0.1   localhost
127.0.0.1   core.localhost
127.0.0.1   alpha.localhost
127.0.0.1   bakery.localhost
```

You can then test the different experiences:

- Landing Page: `http://localhost:3000`
- Core Console: `http://core.localhost:3000/core`
- Merchant Admin: `http://bakery.localhost:3000/admin`
- Tenant Storefront: `http://bakery.localhost:3000`

---

## Security & Secrets Management

This project strictly follows the **Commercial Open Source Software (COSS)** model:

- **Zero Hardcoded Secrets:** All credentials, tokens, and database URIs must be sourced from environment variables.
- **Git Hygiene:** `.env`, `.env*.local`, `.neon`, `.agents/`, and local database binaries are excluded from version control via `.gitignore`.
- **Production Isolation:** Sensitive production branch data is isolated from staging and local test environments.

---

## Ongoing Project Roadmap

- [x] Multi-tenant Edge Proxy routing architecture
- [x] Neon Postgres branching & RLS data isolation
- [x] Core Super-Admin management console & navigation system
- [x] Unified frontend API client with automated JWT refresh
- [ ] Automated tenant custom domain SSL mapping
- [ ] Sanity CMS headless catalog adapter integration
- [ ] Paystack & Stripe live split-payment webhook workers
- [ ] Tenant analytics & real-time revenue aggregation pipeline

---

## License & Attribution

Internal / Commercial Open-Source License. Maintained by the **IsraelFIT**.
