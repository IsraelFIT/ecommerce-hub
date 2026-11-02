from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.redis import cache
from app.config import settings
from app.schemas.response import success_response, ApiResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=ApiResponse[Dict[str, Any]],
    summary="System liveness & database connection health check",
)
async def health_check(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Liveness check and database/cache ping."""
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    cache_status = "disabled"
    if settings.CACHE_ENABLED and settings.REDIS_URL:
        is_alive = await cache.ping()
        cache_status = "healthy" if is_alive else "unreachable"

    overall_healthy = db_status == "healthy" and cache_status in ["healthy", "disabled"]

    return success_response(
        data={
            "overall_status": "healthy" if overall_healthy else "degraded",
            "service": "EcommerceHub-Core-API",
            "database": db_status,
            "cache": cache_status,
        },
        message="System health check successful",
    )
