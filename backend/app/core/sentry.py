"""Sentry error tracking initialization and sensitive payload scrubbing."""

import logging
import os
import re
from typing import Any

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.types import Event, Hint

from app.config import settings

logger = logging.getLogger("app.sentry")

# Sensitive keys to sanitize from event payloads and breadcrumbs
SENSITIVE_KEYS = {
    "password",
    "new_password",
    "current_password",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "secret",
    "client_secret",
    "api_key",
    "cookie",
    "set-cookie",
    "otp",
    "otp_code",
    "cvv",
    "card_number",
}


def _scrub_data(data: Any) -> Any:
    """Recursively scrub sensitive keys and tokens from Sentry payloads."""
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            if str(k).lower() in SENSITIVE_KEYS:
                cleaned[k] = "[SCRUBBED]"
            else:
                cleaned[k] = _scrub_data(v)
        return cleaned
    elif isinstance(data, list):
        return [_scrub_data(item) for item in data]
    elif isinstance(data, str):
        # Scrub Bearer tokens in headers/strings
        if "bearer " in data.lower():
            return re.sub(r"(?i)bearer\s+[a-zA-Z0-9_\-\.]+", "Bearer [SCRUBBED]", data)
        return data
    return data


def _before_send(event: Event, _hint: Hint) -> Event | None:
    """Filter hook executed before an event is dispatched to Sentry."""
    try:
        # Scrub request headers
        req = event.get("request", {})
        if isinstance(req, dict):
            if "headers" in req:
                req["headers"] = _scrub_data(req["headers"])
            if "data" in req:
                req["data"] = _scrub_data(req["data"])
            if "cookies" in req:
                req["cookies"] = "[SCRUBBED]"

        # Scrub breadcrumbs
        breadcrumbs = event.get("breadcrumbs")
        if isinstance(breadcrumbs, dict) and isinstance(breadcrumbs.get("values"), list):
            for b in breadcrumbs["values"]:
                if isinstance(b, dict) and "data" in b:
                    b["data"] = _scrub_data(b["data"])
    except (KeyError, TypeError, ValueError, AttributeError) as e:
        logger.debug("Error in Sentry before_send scrubbing: %s", e)

    return event


def init_sentry() -> bool:
    """
    Initializes Sentry SDK with FastAPI, Starlette, SQLAlchemy and Redis integrations.
    Fails open gracefully when SENTRY_DSN is not configured.
    """
    dsn = (settings.SENTRY_DSN or "").strip()
    if not dsn:
        logger.info("ℹ️ Sentry is disabled (SENTRY_DSN not configured).")
        return False

    try:
        sentry_sdk.init(
            dsn=dsn,
            environment=settings.SENTRY_ENVIRONMENT,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            profiles_sample_rate=settings.SENTRY_PROFILES_SAMPLE_RATE,
            send_default_pii=settings.SENTRY_SEND_DEFAULT_PII,
            before_send=_before_send,
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                StarletteIntegration(transaction_style="endpoint"),
                SqlalchemyIntegration(),
                RedisIntegration(),
            ],
            release=(
                os.getenv("SENTRY_RELEASE")
                or os.getenv("RENDER_GIT_COMMIT")
                or f"{settings.APP_NAME}@1.0.0"
            ),
        )
        logger.info(
            "✅ Sentry error tracking initialized successfully (env: %s).",
            settings.SENTRY_ENVIRONMENT,
        )
        return True
    except (ValueError, TypeError, RuntimeError, OSError) as e:
        logger.warning("⚠️ Failed to initialize Sentry: %s. Running without error tracking.", e)
        return False


def capture_exception_with_context(
    exc: Exception,
    request: Any | None = None,
    user_id: str | None = None,
    tenant_slug: str | None = None,
    extra: dict[str, Any] | None = None,
) -> str | None:
    """
    Captures an exception with explicit multi-tenant and user context.
    Returns Sentry event ID if sent, or None.
    """
    if not sentry_sdk.is_initialized():
        return None

    with sentry_sdk.push_scope() as scope:
        if tenant_slug:
            scope.set_tag("tenant_slug", tenant_slug)
        if user_id:
            scope.set_user({"id": user_id})
        if request:
            scope.set_tag("endpoint", str(request.url.path))
            scope.set_tag("method", request.method)
            if hasattr(request, "headers"):
                req_slug = request.headers.get("x-tenant-slug")
                if req_slug and not tenant_slug:
                    scope.set_tag("tenant_slug", req_slug)
        if extra:
            for k, v in extra.items():
                scope.set_extra(k, _scrub_data(v))

        return sentry_sdk.capture_exception(exc)
