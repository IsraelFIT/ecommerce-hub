from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.tenants import router as tenants_router
from app.routes.products import router as products_router
from app.routes.orders import router as orders_router
from app.routes.payments import router as payments_router
from app.routes.webhooks import router as webhooks_router

__all__ = [
    "health_router",
    "auth_router",
    "tenants_router",
    "products_router",
    "orders_router",
    "payments_router",
    "webhooks_router",
]
