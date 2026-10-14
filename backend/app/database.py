import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
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
            if not is_sqlite:
                # Synchronize schema additions on existing PostgreSQL tables
                await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Nigeria';"))
                await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'NGN';"))
                await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'NGN';"))
                await conn.execute(text("""
                    UPDATE products p 
                    SET currency = t.currency 
                    FROM tenants t 
                    WHERE p.tenant_id = t.id AND (p.currency IS NULL OR p.currency = 'USD' OR p.currency != t.currency);
                """))
                await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS name VARCHAR(255);"))
                await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS title VARCHAR(255);"))
                await conn.execute(text("ALTER TABLE products ALTER COLUMN title DROP NOT NULL;"))
                await conn.execute(text("ALTER TABLE products ALTER COLUMN name DROP NOT NULL;"))
                await conn.execute(text("UPDATE products SET name = title WHERE name IS NULL AND title IS NOT NULL;"))
                await conn.execute(text("UPDATE products SET title = name WHERE title IS NULL AND name IS NOT NULL;"))
                await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS product_class VARCHAR(50) DEFAULT 'physical';"))
                await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSON DEFAULT '{}';"))
                await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS filters JSON DEFAULT '{}';"))
                await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID;"))
                await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS category_name VARCHAR(100) DEFAULT 'General';"))
                await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';"))
                await conn.execute(text("UPDATE products SET category_name = category WHERE category_name IS NULL AND category IS NOT NULL;"))
                await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS availability VARCHAR(50) DEFAULT 'available';"))
                await conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;"))
                await conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon VARCHAR(100);"))
                await conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;"))
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS product_filters (
                        id UUID PRIMARY KEY,
                        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                        name VARCHAR(100) NOT NULL,
                        slug VARCHAR(100) NOT NULL,
                        filter_type VARCHAR(50) DEFAULT 'checkbox' NOT NULL,
                        options JSON DEFAULT '[]' NOT NULL,
                        is_active BOOLEAN DEFAULT TRUE NOT NULL,
                        display_order INTEGER DEFAULT 0 NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_product_filters_tenant_id ON product_filters (tenant_id);"))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_product_filters_slug ON product_filters (slug);"))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_categories_tenant_id ON categories (tenant_id);"))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_categories_slug ON categories (slug);"))
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS reviews (
                        id UUID PRIMARY KEY,
                        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
                        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                        rating INTEGER NOT NULL,
                        title VARCHAR(255),
                        comment TEXT NOT NULL,
                        customer_name VARCHAR(100) DEFAULT 'Verified Buyer' NOT NULL,
                        customer_email VARCHAR(255),
                        status VARCHAR(50) DEFAULT 'approved' NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_reviews_tenant_id ON reviews (tenant_id);"))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_reviews_product_id ON reviews (product_id);"))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_reviews_status ON reviews (status);"))

                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS product_likes (
                        id UUID PRIMARY KEY,
                        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                        session_id VARCHAR(255),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_product_likes_tenant_id ON product_likes (tenant_id);"))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_product_likes_product_id ON product_likes (product_id);"))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_product_likes_user_id ON product_likes (user_id);"))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_product_likes_session_id ON product_likes (session_id);"))

                await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;"))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_orders_user_id ON orders (user_id);"))

                await conn.execute(text("""
                    DO $$ BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint WHERE conname = 'check_products_max_images'
                        ) THEN
                            ALTER TABLE products ADD CONSTRAINT check_products_max_images 
                            CHECK (images IS NULL OR json_array_length(images) <= 5);
                        END IF;
                    END $$;
                """))
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
