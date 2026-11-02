import json
import logging
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional, Union
from uuid import UUID

import redis.asyncio as aioredis
from redis.exceptions import RedisError

from app.config import settings

logger = logging.getLogger("app.cache")


def _json_serial(obj: Any) -> Any:
    """JSON serializer for objects not serializable by default json code."""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, Decimal):
        return float(obj)
    if hasattr(obj, "model_dump"):
        return obj.model_dump(mode="json")
    if hasattr(obj, "dict"):
        return obj.dict()
    raise TypeError(f"Type {type(obj)} not serializable")


class RedisClient:
    def __init__(self) -> None:
        self._client: Optional[aioredis.Redis] = None
        self._is_enabled: bool = settings.CACHE_ENABLED and bool(settings.REDIS_URL)

    async def connect(self) -> None:
        """Initialize Redis connection pool."""
        if not self._is_enabled or not settings.REDIS_URL:
            logger.info("ℹ️ Redis cache is disabled (CACHE_ENABLED=False or REDIS_URL not set).")
            return

        try:
            self._client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=5.0,
                socket_connect_timeout=5.0,
                retry_on_timeout=True,
            )
            # Verify connectivity
            await self._client.ping()
            logger.info("✅ Redis cache connected successfully.")
        except Exception as e:
            logger.warning(f"⚠️ Failed to connect to Redis ({e}). Running in fail-open cache mode.")
            self._client = None

    async def close(self) -> None:
        """Close Redis connection pool."""
        if self._client:
            try:
                await self._client.aclose()
                logger.info("🔌 Redis connection closed.")
            except Exception as e:
                logger.warning(f"Error closing Redis connection: {e}")
            finally:
                self._client = None

    @property
    def is_connected(self) -> bool:
        return self._client is not None

    async def get(self, key: str) -> Optional[str]:
        """Fetch raw string from Redis. Fails open on error."""
        if not self._client:
            return None
        try:
            return await self._client.get(key)
        except RedisError as e:
            logger.warning(f"Redis GET error for key '{key}': {e}")
            return None

    async def get_json(self, key: str) -> Optional[Any]:
        """Fetch and deserialize JSON value from Redis. Fails open on error."""
        val = await self.get(key)
        if val is None:
            return None
        try:
            return json.loads(val)
        except Exception as e:
            logger.warning(f"Error deserializing cached JSON for key '{key}': {e}")
            return None

    async def set(
        self,
        key: str,
        value: Union[str, bytes],
        ttl: Optional[int] = None,
    ) -> bool:
        """Store string in Redis with optional TTL in seconds."""
        if not self._client:
            return False
        try:
            effective_ttl = ttl if ttl is not None else settings.CACHE_TTL_DEFAULT
            await self._client.set(key, value, ex=effective_ttl)
            return True
        except RedisError as e:
            logger.warning(f"Redis SET error for key '{key}': {e}")
            return False

    async def set_json(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
    ) -> bool:
        """Serialize and store JSON in Redis with optional TTL in seconds."""
        if not self._client:
            return False
        try:
            payload = json.dumps(value, default=_json_serial)
            return await self.set(key, payload, ttl=ttl)
        except Exception as e:
            logger.warning(f"Error serializing JSON for key '{key}': {e}")
            return False

    async def delete(self, *keys: str) -> int:
        """Delete one or more keys from Redis."""
        if not self._client or not keys:
            return 0
        try:
            return await self._client.delete(*keys)
        except RedisError as e:
            logger.warning(f"Redis DELETE error for keys {keys}: {e}")
            return 0

    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern using non-blocking SCAN.
        Safe for production Redis instances.
        """
        if not self._client:
            return 0
        try:
            deleted_count = 0
            batch = []
            async for key in self._client.scan_iter(match=pattern, count=100):
                batch.append(key)
                if len(batch) >= 100:
                    deleted_count += await self._client.delete(*batch)
                    batch = []
            if batch:
                deleted_count += await self._client.delete(*batch)
            return deleted_count
        except RedisError as e:
            logger.warning(f"Redis DELETE_PATTERN error for pattern '{pattern}': {e}")
            return 0

    async def ping(self) -> bool:
        """Check if Redis connection is alive."""
        if not self._client:
            return False
        try:
            return bool(await self._client.ping())
        except RedisError:
            return False


# Global singleton instance
cache = RedisClient()


# ─── Multi-Tenant Cache Key Builders ───────────────────────────

def build_tenant_key(tenant_slug: str, *parts: str) -> str:
    """Builds a standardized tenant-scoped cache key (e.g. cache:tenant:bakery:products:...)."""
    slug = (tenant_slug or "global").lower().strip()
    sub_path = ":".join(str(p).strip().lower() for p in parts if p is not None)
    return f"cache:tenant:{slug}:{sub_path}" if sub_path else f"cache:tenant:{slug}"


def build_global_key(*parts: str) -> str:
    """Builds a standardized global cache key (e.g. cache:global:tenants:list)."""
    sub_path = ":".join(str(p).strip().lower() for p in parts if p is not None)
    return f"cache:global:{sub_path}" if sub_path else "cache:global"


# ─── Cache Invalidation Helpers ────────────────────────────────

async def invalidate_tenant_metadata(tenant_slug: str) -> int:
    """Invalidate cached tenant configuration and branding."""
    key = build_tenant_key(tenant_slug, "config")
    slug_key = build_tenant_key(tenant_slug, "by_slug")
    return await cache.delete(key, slug_key)


async def invalidate_tenant_products(tenant_slug: str) -> int:
    """Invalidate all cached product listings and items for a tenant."""
    pattern = build_tenant_key(tenant_slug, "products:*")
    count = await cache.delete_pattern(pattern)
    # Also invalidate singular product entries
    count += await cache.delete_pattern(build_tenant_key(tenant_slug, "product:*"))
    return count


async def invalidate_tenant_categories(tenant_slug: str) -> int:
    """Invalidate cached categories for a tenant."""
    pattern = build_tenant_key(tenant_slug, "categories:*")
    count = await cache.delete_pattern(pattern)
    count += await cache.delete(build_tenant_key(tenant_slug, "categories"))
    return count


async def invalidate_all_tenant_cache(tenant_slug: str) -> int:
    """Invalidate everything associated with a tenant."""
    pattern = build_tenant_key(tenant_slug, "*")
    return await cache.delete_pattern(pattern)

