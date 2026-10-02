from collections import defaultdict
from typing import Dict, List, Any
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Transforms FastAPI/Pydantic validation errors into the specification's 422 format:
    {
      "status": "error",
      "message": "The given data was invalid.",
      "errors": {
        "field_name": ["Description..."]
      }
    }
    """
    errors_dict: Dict[str, List[str]] = defaultdict(list)
    for error in exc.errors():
        loc = error.get("loc", [])
        # Strip 'body', 'query', 'path', etc. prefixes if present
        field_parts = [str(part) for part in loc if part not in ("body", "query", "path", "header")]
        field_name = ".".join(field_parts) if field_parts else "non_field_errors"
        msg = error.get("msg", "Invalid value.")
        # Clean up pydantic prefix if exists (e.g. "Value error, Passwords do not match" -> "Passwords do not match")
        if msg.startswith("Value error, "):
            msg = msg.replace("Value error, ", "")
        errors_dict[field_name].append(msg)

    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "message": "The given data was invalid.",
            "errors": dict(errors_dict),
        },
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    Formats standard HTTP exceptions into the uniform envelope:
    {
      "status": "error",
      "message": "Descriptive error message"
    }
    """
    message = exc.detail if isinstance(exc.detail, str) else "An error occurred"
    errors = exc.detail if isinstance(exc.detail, dict) else None

    content: Dict[str, Any] = {
        "status": "error",
        "message": message,
    }
    if errors:
        content["errors"] = errors

    return JSONResponse(
        status_code=exc.status_code,
        content=content,
        headers=getattr(exc, "headers", None),
    )


import traceback
from app.config import settings


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catches unhandled server exceptions and returns a clean 500 error envelope.
    """
    traceback.print_exc()
    content: Dict[str, Any] = {
        "status": "error",
        "message": f"An unexpected server error occurred: {str(exc)}" if settings.DEBUG else "An unexpected server error occurred. Please try again later.",
    }
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=content,
    )
