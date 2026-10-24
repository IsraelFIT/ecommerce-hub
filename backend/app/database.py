import os
import asyncio
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
connect_args = (
    {"check_same_thread": False}
    if is_sqlite
    else {"statement_cache_size": 0}
)

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
    """Initializes database schema tables, retrying PostgreSQL if compute is waking up."""
    global engine, AsyncSessionLocal

    max_attempts = 1 if is_sqlite else 3
    for attempt in range(1, max_attempts + 1):
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

                    # User profile fields & Soft deletion
                    await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);"))
                    await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);"))
                    await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;"))
                    await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_is_deleted ON users (is_deleted);"))

                    # Tenant physical address & pickup settings
                    await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS store_address VARCHAR(500);"))
                    await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS store_phone VARCHAR(50);"))
                    await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS store_email VARCHAR(255);"))
                    await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pickup_location_name VARCHAR(255);"))
                    await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pickup_address VARCHAR(500);"))
                    await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pickup_hours VARCHAR(255);"))
                    await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS delivery_fee FLOAT DEFAULT 45.0;"))
                    await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS delivery_instruction TEXT;"))
                    await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pickup_instruction TEXT;"))
                    await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;"))
                    await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tenants_is_deleted ON tenants (is_deleted);"))

                    # Populate sensible defaults for tenant pickup location if missing
                    await conn.execute(text("""
                        UPDATE tenants
                        SET pickup_location_name = COALESCE(pickup_location_name, name || ' Studio'),
                            pickup_address = COALESCE(pickup_address, '742 Designer Row, New York, NY 10011'),
                            pickup_hours = COALESCE(pickup_hours, 'Available: Tuesday–Saturday, 10:00 – 18:00')
                        WHERE pickup_location_name IS NULL OR pickup_address IS NULL;
                    """))

                    # Soft delete columns across deletable entities
                    await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;"))
                    await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_products_is_deleted ON products (is_deleted);"))

                    await conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;"))
                    await conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_categories_is_deleted ON categories (is_deleted);"))

                    await conn.execute(text("ALTER TABLE product_filters ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;"))
                    await conn.execute(text("ALTER TABLE product_filters ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_product_filters_is_deleted ON product_filters (is_deleted);"))

                    await conn.execute(text("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;"))
                    await conn.execute(text("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_reviews_is_deleted ON reviews (is_deleted);"))

                    await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;"))
                    await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_orders_is_deleted ON orders (is_deleted);"))

                    # User addresses table
                    await conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS user_addresses (
                            id UUID PRIMARY KEY,
                            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            first_name VARCHAR(100) NOT NULL,
                            last_name VARCHAR(100) NOT NULL,
                            company VARCHAR(150),
                            country VARCHAR(100) DEFAULT 'United States' NOT NULL,
                            street VARCHAR(255) NOT NULL,
                            city VARCHAR(100) NOT NULL,
                            state VARCHAR(100) NOT NULL,
                            zip_code VARCHAR(50) NOT NULL,
                            phone VARCHAR(50),
                            email VARCHAR(255),
                            is_default BOOLEAN DEFAULT FALSE NOT NULL,
                            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
                            deleted_at TIMESTAMP WITH TIME ZONE,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                        );
                    """))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_addresses_user_id ON user_addresses (user_id);"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_addresses_is_deleted ON user_addresses (is_deleted);"))

                    await conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS user_carts (
                            id UUID PRIMARY KEY,
                            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
                            items JSON DEFAULT '[]' NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                        );
                    """))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_carts_user_id ON user_carts (user_id);"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_carts_tenant_id ON user_carts (tenant_id);"))

                    # Banks cached table for Paystack supported settlement banks
                    await conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS banks (
                            id UUID PRIMARY KEY,
                            paystack_id INTEGER,
                            name VARCHAR(255) NOT NULL,
                            slug VARCHAR(255),
                            code VARCHAR(50) NOT NULL,
                            longcode VARCHAR(50),
                            gateway VARCHAR(50),
                            pay_with_bank BOOLEAN DEFAULT FALSE NOT NULL,
                            supports_transfer BOOLEAN DEFAULT TRUE NOT NULL,
                            active BOOLEAN DEFAULT TRUE NOT NULL,
                            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
                            country VARCHAR(50) DEFAULT 'nigeria' NOT NULL,
                            currency VARCHAR(10) DEFAULT 'NGN' NOT NULL,
                            bank_type VARCHAR(50) DEFAULT 'nuban',
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                        );
                    """))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_banks_name ON banks (name);"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_banks_code ON banks (code);"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_banks_country ON banks (country);"))
                    await conn.execute(text("DROP INDEX IF EXISTS ix_banks_country_code;"))
                    await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_banks_paystack_id ON banks (paystack_id);"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_banks_country_code ON banks (country, code);"))

                    try:
                        await conn.execute(text("ALTER TABLE products DROP CONSTRAINT IF EXISTS check_products_max_images;"))
                        await conn.execute(text("ALTER TABLE products ADD CONSTRAINT check_products_max_images CHECK (images IS NULL OR json_array_length(images) <= 5);"))
                    except Exception:
                        pass
            print(f"✓ Database tables verified and connected successfully on {engine.url.drivername}.")
            return
        except Exception as exc:
            import traceback
            traceback.print_exc()
            if not is_sqlite and attempt < max_attempts:
                print(f"⏳ Neon PostgreSQL compute warming up (attempt {attempt}/{max_attempts}: {exc}). Retrying in 2s...")
                await asyncio.sleep(2)
                continue

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
                for col_sql in [
                    "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);",
                    "ALTER TABLE users ADD COLUMN gender VARCHAR(20);",
                    "ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT 0;",
                    "ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;",
                    "ALTER TABLE tenants ADD COLUMN country VARCHAR(100) DEFAULT 'Nigeria';",
                    "ALTER TABLE tenants ADD COLUMN currency VARCHAR(10) DEFAULT 'NGN';",
                    "ALTER TABLE tenants ADD COLUMN store_address VARCHAR(500);",
                    "ALTER TABLE tenants ADD COLUMN store_phone VARCHAR(50);",
                    "ALTER TABLE tenants ADD COLUMN store_email VARCHAR(255);",
                    "ALTER TABLE tenants ADD COLUMN pickup_location_name VARCHAR(255);",
                    "ALTER TABLE tenants ADD COLUMN pickup_address VARCHAR(500);",
                    "ALTER TABLE tenants ADD COLUMN pickup_hours VARCHAR(255);",
                    "ALTER TABLE tenants ADD COLUMN delivery_fee FLOAT DEFAULT 45.0;",
                    "ALTER TABLE tenants ADD COLUMN delivery_instruction TEXT;",
                    "ALTER TABLE tenants ADD COLUMN pickup_instruction TEXT;",
                    "ALTER TABLE tenants ADD COLUMN is_deleted BOOLEAN DEFAULT 0;",
                    "ALTER TABLE tenants ADD COLUMN deleted_at TIMESTAMP;",
                    "ALTER TABLE products ADD COLUMN currency VARCHAR(10) DEFAULT 'NGN';",
                    "ALTER TABLE products ADD COLUMN product_class VARCHAR(50) DEFAULT 'physical';",
                ]:
                    try:
                        await conn.execute(text(col_sql))
                    except Exception:
                        pass
                try:
                    await conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS user_carts (
                            id UUID PRIMARY KEY,
                            user_id UUID NOT NULL,
                            tenant_id UUID,
                            items JSON DEFAULT '[]' NOT NULL,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
                        );
                    """))
                except Exception:
                    pass
            print("✓ Local SQLite database schema initialized successfully.")
            return


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yields a database session with automatic lifecycle management."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
