from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.tenants import router as tenants_router
from app.routes.products import router as products_router
from app.routes.categories import router as categories_router
from app.routes.filters import router as filters_router
from app.routes.orders import router as orders_router
from app.routes.payments import router as payments_router
from app.routes.webhooks import router as webhooks_router
from app.routes.uploads import router as uploads_router
from app.routes.customizations import router as customizations_router
from app.routes.reviews import router as reviews_router
from app.routes.likes import router as likes_router
from app.routes.cart import router as cart_router
from app.routes.users import router as users_router

__all__ = [
    "health_router",
    "auth_router",
    "tenants_router",
    "products_router",
    "categories_router",
    "filters_router",
    "orders_router",
    "payments_router",
    "webhooks_router",
    "uploads_router",
    "customizations_router",
    "reviews_router",
    "likes_router",
    "cart_router",
    "users_router",
]
