"""Kiyo Core FastAPI application entrypoint."""

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, cast

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.core.exceptions import (
    generic_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.core.redis import cache
from app.core.sentry import init_sentry
from app.database import engine, init_db
from app.routes import (
    auth_router,
    cart_router,
    categories_router,
    customizations_router,
    filters_router,
    health_router,
    likes_router,
    orders_router,
    payments_router,
    products_router,
    reviews_router,
    tenants_router,
    uploads_router,
    users_router,
    webhooks_router,
)
from app.schemas.response import ApiResponse, success_response

# Initialize Sentry error tracking & APM
init_sentry()
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Initialize and clean up database and cache resources across app lifespan."""
    # Initialize database schema tables (with auto-fallback if needed)
    await init_db()
    # Connect to Redis Cache (fail-open if unreachable)
    await cache.connect()
    yield
    # Cleanup cache and engine resources
    await cache.close()
    try:
        await engine.dispose()
    except (SQLAlchemyError, OSError) as exc:
        logger.debug("Ignored error disposing database engine on shutdown: %s", exc)


_openapi_servers = [
    {"url": "https://api.kiyostores.space", "description": "Production API"},
    {"url": "https://staging-api.kiyostores.space", "description": "Staging API"},
]
if settings.API_BASE_URL:
    _openapi_servers.insert(
        0,
        {
            "url": settings.API_BASE_URL,
            "description": f"Active ({settings.ENVIRONMENT})",
        },
    )
elif settings.ENVIRONMENT == "development":
    _openapi_servers.insert(
        0,
        {
            "url": f"http://localhost:{settings.PORT}",
            "description": "Local Development",
        },
    )

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Kiyo Multi-Tenant E-Commerce Platform Core API with PostgreSQL RLS, "
        "Interchangeable Data Adapters, and Subaccount Split Payments."
    ),
    version="1.0.0",
    servers=_openapi_servers,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Exception Handlers for uniform envelope responses
app.add_exception_handler(RequestValidationError, cast(Any, validation_exception_handler))
app.add_exception_handler(StarletteHTTPException, cast(Any, http_exception_handler))
app.add_exception_handler(Exception, generic_exception_handler)

# CORS Configuration - Permit configured frontend origins & tenant subdomains
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files Directory
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../static"))
os.makedirs(os.path.join(static_dir, "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Register API Routers
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(tenants_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(filters_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(webhooks_router, prefix="/api")
app.include_router(uploads_router, prefix="/api")
app.include_router(customizations_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")
app.include_router(likes_router, prefix="/api")
app.include_router(cart_router, prefix="/api")
app.include_router(users_router, prefix="/api")


@app.get(
    "/",
    response_model=ApiResponse[dict[str, Any]],
    summary="Root Service Index",
)
async def root():
    """Return service metadata and documentation links."""
    return success_response(
        data={
            "app_name": settings.APP_NAME,
            "version": "1.0.0",
            "docs": "/docs",
            "openapi": "/openapi.json",
        },
        message="Kiyo Multi-Tenant Core API",
    )
