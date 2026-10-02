import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

SQLITE_FALLBACK_URL = "sqlite+aiosqlite:///./ecommerce_hub.db"

is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args=connect_args,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def init_db():
    """Initializes database schema tables, falling back to SQLite if PostgreSQL is offline."""
    global engine, AsyncSessionLocal
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print(f"✓ Database tables verified and connected successfully on {engine.url.drivername}.")
    except Exception as exc:
        print(f"⚠ Warning: Could not connect to PostgreSQL ({exc}).")
        print(f"✓ Automatically falling back to local SQLite database: {SQLITE_FALLBACK_URL}")
        engine = create_async_engine(
            SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False},
            future=True,
        )
        AsyncSessionLocal = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✓ Local SQLite database schema initialized successfully.")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yields a database session with automatic lifecycle management."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

