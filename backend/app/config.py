import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_ENV_FILE = os.path.abspath(os.path.join(_BASE_DIR, "../.env"))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", _ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Kiyo-Core"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/kiyo",
        description="Async PostgreSQL / Neon serverless connection string",
    )

    # JWT & Auth (30-min access token, 12-hour refresh token)
    JWT_SECRET_KEY: str = "supersecretkey_change_in_production_min_32_chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minutes
    REFRESH_TOKEN_EXPIRE_HOURS: int = 12  # 12 hours

    # Payment Gateway Split Settings
    PLATFORM_FEE_PERCENTAGE: float = 2.5
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    PAYSTACK_SECRET_KEY: str | None = None
    PAYSTACK_WEBHOOK_SECRET: str | None = None
    PAYSTACK_API_URL: str = "https://api.paystack.co"

    # Sanity CMS Settings
    SANITY_PROJECT_ID: str | None = None
    SANITY_DATASET: str = "staging"
    SANITY_API_TOKEN: str | None = None

    # Neon Object Storage (S3-Compatible)
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_ENDPOINT_URL_S3: str | None = None
    AWS_REGION: str = "eu-central-1"
    NEON_STORAGE_BUCKET: str = "kiyo-media"

    # Redis Caching (Upstash or Local)
    REDIS_URL: str | None = None
    CACHE_ENABLED: bool = True
    CACHE_TTL_DEFAULT: int = 300  # 5 minutes
    CACHE_TTL_TENANT: int = 1800  # 30 minutes
    CACHE_TTL_CATEGORIES: int = 1800  # 30 minutes
    CACHE_TTL_PRODUCTS: int = 300  # 5 minutes

    # Sentry Error Tracking & Real-Time Alerts
    SENTRY_DSN: str | None = None
    SENTRY_ENVIRONMENT: str = "development"
    SENTRY_TRACES_SAMPLE_RATE: float = 0.2
    SENTRY_PROFILES_SAMPLE_RATE: float = 0.1
    SENTRY_SEND_DEFAULT_PII: bool = False

    # Email Service (Brevo SMTP / Console)
    EMAIL_PROVIDER: str = "auto"  # "smtp", "console", or "auto"
    SMTP_HOST: str = "smtp-relay.brevo.com"
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_USE_TLS: bool = True
    SMTP_FROM_EMAIL: str = "no-reply@kiyostores.space"
    SMTP_FROM_NAME: str = "Kiyo"
    SUPPORT_EMAIL: str = "help@kiyostores.space"

    # Frontend & CORS Configuration
    FRONTEND_URL: str = "http://localhost:3000"
    API_BASE_URL: str | None = None
    CORS_ORIGINS: str = (
        "https://kiyostores.space,"
        "https://www.kiyostores.space,"
        "https://staging.kiyostores.space,"
        "http://localhost:3000"
    )
    CORS_ORIGIN_REGEX: str = (
        r"^https://([a-z0-9-]+\.)?(staging\.)?kiyostores\.space$"
        r"|^http://([a-z0-9-]+\.)?localhost(:\d+)?$"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Return parsed list of allowed CORS origin URLs."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
