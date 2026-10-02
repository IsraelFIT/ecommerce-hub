from contextlib import asynccontextmanager
from typing import Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, init_db
from app.routes import (
    health_router,
    auth_router,
    tenants_router,
    products_router,
    orders_router,
    payments_router,
    webhooks_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database schema tables (with auto-fallback if needed)
    await init_db()
    yield
    # Cleanup engine resources
    try:
        await engine.dispose()
    except Exception:
        pass



from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.exceptions import (
    validation_exception_handler,
    http_exception_handler,
    generic_exception_handler,
)


app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-Tenant E-Commerce Platform Core API with PostgreSQL RLS, Interchangeable Data Adapters, and Subaccount Split Payments.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Exception Handlers for uniform envelope responses
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(tenants_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(webhooks_router, prefix="/api")


from app.schemas.response import success_response, ApiResponse


@app.get(
    "/",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Root Service Index",
)
async def root():
    return success_response(
        data={
            "app_name": settings.APP_NAME,
            "version": "1.0.0",
            "docs": "/docs",
            "openapi": "/openapi.json",
        },
        message="EcommerceHub Multi-Tenant Core API",
    )
