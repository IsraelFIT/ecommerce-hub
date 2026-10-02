from typing import Generic, TypeVar, Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, model_serializer

T = TypeVar("T")


class PaginationMeta(BaseModel):
    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={
            "example": {
                "current_page": 1,
                "last_page": 5,
                "per_page": 15,
                "total": 68,
                "next_page_url": "/api/products/?page=2&per_page=15",
                "prev_page_url": None,
            }
        },
    )

    current_page: int
    last_page: int
    per_page: int
    total: int
    next_page_url: Optional[str] = None
    prev_page_url: Optional[str] = None


class PaginatedData(BaseModel, Generic[T]):
    model_config = ConfigDict(extra="ignore")

    items: List[T]
    pagination: Optional[PaginationMeta] = None


class ApiResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={
            "example": {
                "status": "success",
                "message": "Operation completed successfully",
                "data": {},
            }
        },
    )

    status: str = "success"
    message: str = "Operation completed successfully"
    data: Optional[T] = None
    pagination: Optional[PaginationMeta] = None
    filters: Optional[Dict[str, Any]] = None

    @model_serializer(mode="wrap")
    def serialize_model(self, handler):
        dumped = handler(self)
        if dumped.get("pagination") is None:
            dumped.pop("pagination", None)
        if dumped.get("filters") is None:
            dumped.pop("filters", None)
        return dumped


class ErrorResponse(BaseModel):
    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={
            "example": {
                "status": "error",
                "message": "The given data was invalid.",
                "errors": {
                    "email": ["The email must be a valid email address."],
                    "password": ["The password must be at least 6 characters."],
                },
            }
        },
    )

    status: str = "error"
    message: str
    errors: Optional[Dict[str, List[str]]] = None


def success_response(
    data: Optional[Any] = None,
    message: str = "Operation completed successfully",
    pagination: Optional[PaginationMeta] = None,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Helper to build a uniform API success response dictionary."""
    res: Dict[str, Any] = {
        "status": "success",
        "message": message,
        "data": data if data is not None else {},
    }
    if pagination is not None:
        res["pagination"] = pagination.model_dump()
    if filters is not None:
        res["filters"] = filters
    return res


def error_response(
    message: str = "An error occurred",
    errors: Optional[Dict[str, List[str]]] = None,
) -> Dict[str, Any]:
    """Helper to build a uniform API error response dictionary."""
    res: Dict[str, Any] = {
        "status": "error",
        "message": message,
    }
    if errors is not None:
        res["errors"] = errors
    return res
