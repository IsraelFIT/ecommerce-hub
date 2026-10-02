from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "EcommerceHub-Core"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/ecommerce_hub",
        description="Async PostgreSQL / Neon serverless connection string",
    )

    # JWT & Auth
    JWT_SECRET_KEY: str = "supersecretkey_change_in_production_min_32_chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 360  # 6 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 3      # 3 days

    # Payment Gateway Split Settings
    PLATFORM_FEE_PERCENTAGE: float = 2.5
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    PAYSTACK_SECRET_KEY: Optional[str] = None
    PAYSTACK_WEBHOOK_SECRET: Optional[str] = None

    # Sanity CMS Settings
    SANITY_PROJECT_ID: Optional[str] = None
    SANITY_DATASET: str = "production"
    SANITY_API_TOKEN: Optional[str] = None


settings = Settings()
