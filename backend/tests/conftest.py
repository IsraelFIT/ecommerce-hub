import os
import pytest_asyncio
import uuid
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool

from app.main import app as fastapi_app
from app.database import Base, get_db
from app.models.tenant import Tenant, BackendType
from app.services import webhook_worker

TEST_DB_FILE = os.path.abspath("test_suite.db")
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_FILE}"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=NullPool,
)

TestAsyncSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    original_worker_factory = webhook_worker.AsyncSessionLocal
    webhook_worker.AsyncSessionLocal = TestAsyncSessionLocal

    async with TestAsyncSessionLocal() as session:
        yield session

    webhook_worker.AsyncSessionLocal = original_worker_factory

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def sample_tenant(db_session: AsyncSession) -> Tenant:
    tenant = Tenant(
        id=uuid.uuid4(),
        name="Acme Corp",
        slug="acme",
        backend_type=BackendType.POSTGRES,
        paystack_subaccount_code="ACCT_12345",
        stripe_account_id="acct_stripe_123",
        default_gateway="paystack",
        branding_config={
            "primaryColor": "#6366f1",
            "accentColor": "#ec4899",
            "tagline": "Acme High Quality Goods",
        },
    )
    db_session.add(tenant)
    await db_session.commit()
    await db_session.refresh(tenant)
    return tenant
