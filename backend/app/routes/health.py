from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.response import success_response, ApiResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=ApiResponse[Dict[str, Any]],
    summary="System liveness & database connection health check",
)
async def health_check(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Liveness check and database ping."""
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return success_response(
        data={
            "overall_status": "healthy" if db_status == "healthy" else "degraded",
            "service": "EcommerceHub-Core-API",
            "database": db_status,
        },
        message="System health check successful",
    )
