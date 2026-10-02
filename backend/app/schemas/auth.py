import uuid
import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class LoginRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "example": {
                "email": "buzizala@yopmail.com",
                "password": "Pa$$w0rd!",
            }
        },
    )

    email: EmailStr
    password: str = Field(..., min_length=1, description="User password")


class RegisterRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "example": {
                "first_name": "Bode",
                "last_name": "Adebayo",
                "email": "bode@cakesbybode.com",
                "phone_number": "+1234567890",
                "store_name": "Cakes by Bode",
                "store_slug": "cakes-by-bode",
                "store_category": "Bakery & Confectionery",
                "password": "SecurePassword123!",
                "confirm_password": "SecurePassword123!",
                "consent_to_terms": True,
            }
        },
    )

    first_name: str = Field(..., min_length=1, max_length=100, description="Owner first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Owner last name")
    email: EmailStr = Field(..., description="Unique email address")
    phone_number: Optional[str] = Field(None, max_length=50, description="Contact phone number")
    
    # Tenant Store Parameters
    store_name: str = Field(..., min_length=2, max_length=255, description="Tenant brand/store name")
    store_slug: str = Field(..., min_length=2, max_length=100, description="Store subdomain slug")
    store_category: str = Field(default="General", max_length=100, description="Store category/industry")
    
    password: str = Field(..., min_length=6, description="Account password (min 6 characters)")
    confirm_password: str = Field(..., min_length=6, description="Password confirmation")
    consent_to_terms: bool = Field(..., description="Consent to platform terms and fee splitting")

    @model_validator(mode="after")
    def validate_registration(self) -> "RegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        if not self.consent_to_terms:
            raise ValueError("You must agree to the terms of service")
        # Sanitize slug
        slug = re.sub(r"[^a-z0-9-]+", "-", self.store_slug.lower()).strip("-")
        if not slug:
            raise ValueError("Invalid store slug")
        self.store_slug = slug
        return self


class TenantCustomerRegisterRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "example": {
                "first_name": "Jane",
                "last_name": "Doe",
                "email": "jane@example.com",
                "phone_number": "+1234567890",
                "tenant_slug": "jazz-cakes",
                "password": "SecurePassword123!",
                "confirm_password": "SecurePassword123!",
            }
        },
    )

    first_name: str = Field(..., min_length=1, max_length=100, description="Customer first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Customer last name")
    email: EmailStr = Field(..., description="Customer email address")
    phone_number: Optional[str] = Field(None, max_length=50, description="Contact phone number")
    tenant_slug: str = Field(..., min_length=2, max_length=100, description="Tenant store slug")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    confirm_password: str = Field(..., min_length=6, description="Confirm password")

    @model_validator(mode="after")
    def validate_customer_registration(self) -> "TenantCustomerRegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class ForgotPasswordRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "example": {
                "email": "bode@cakesbybode.com",
            }
        },
    )

    email: EmailStr = Field(..., description="Registered account email")


class ResetPasswordRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "example": {
                "email": "bode@cakesbybode.com",
                "otp": "492817",
                "new_password": "NewSecurePassword123!",
                "confirm_password": "NewSecurePassword123!",
            }
        },
    )

    email: EmailStr = Field(..., description="Registered account email")
    otp: str = Field(..., min_length=4, max_length=10, description="One-time verification code")
    new_password: str = Field(..., min_length=6, description="New password")
    confirm_password: str = Field(..., min_length=6, description="Confirm new password")

    @model_validator(mode="after")
    def validate_password_reset(self) -> "ResetPasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class RefreshTokenRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NDhhM2Y4MS1lMjMwLTQxMzEtYjg0MS0zODI5NDcxOTIzMDEiLCJleHAiOjE3OTAyNjYyMDAsInRva2VuX3R5cGUiOiJyZWZyZXNoIn0.SignatureExample...",
            }
        },
    )

    refresh_token: str = Field(..., min_length=1, description="Valid JWT refresh token")


class AuthTokenData(BaseModel):
    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NDhhM2Y4MS1lMjMwLTQxMzEtYjg0MS0zODI5NDcxOTIzMDEiLCJleHAiOjE3OTAwNDY2MDAsInRva2VuX3R5cGUiOiJhY2Nlc3MifQ.SignatureExample...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NDhhM2Y4MS1lMjMwLTQxMzEtYjg0MS0zODI5NDcxOTIzMDEiLCJleHAiOjE3OTAyNjYyMDAsInRva2VuX3R5cGUiOiJyZWZyZXNoIn0.SignatureExample...",
                "expires_in": "21600",
            }
        },
    )

    access_token: str = Field(..., description="JWT Bearer access token valid for 6 hours")
    refresh_token: str = Field(..., description="JWT Refresh token valid for 3 days")
    expires_in: str = Field(default="21600", description="Access token expiration in seconds (6 hours = 21600)")


class UserResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "948a3f81-e230-4131-b841-382947192301",
                "first_name": "Bode",
                "last_name": "Adebayo",
                "email": "bode@cakesbybode.com",
                "phone_number": "+1234567890",
                "role": "tenant_admin",
                "is_active": True,
                "tenant_id": "948a3f81-e230-4131-b841-382947192301",
                "created_at": "2026-09-23T10:15:30Z",
            }
        },
    )

    id: uuid.UUID
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    role: str
    is_active: bool
    tenant_id: Optional[uuid.UUID] = None
    created_at: datetime


class AuthResponse(BaseModel):
    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={
            "example": {
                "id": "948a3f81-e230-4131-b841-382947192301",
                "email": "bode@cakesbybode.com",
                "first_name": "Bode",
                "last_name": "Adebayo",
                "full_name": "Bode Adebayo",
                "role": "tenant_admin",
                "tenant_slug": "cakes-by-bode",
                "tenant_name": "Cakes by Bode",
                "auth": {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NDhhM2Y4MS1lMjMwLTQxMzEtYjg0MS0zODI5NDcxOTIzMDEiLCJleHAiOjE3OTAwNDY2MDAsInRva2VuX3R5cGUiOiJhY2Nlc3MifQ.Signature...",
                    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NDhhM2Y4MS1lMjMwLTQxMzEtYjg0MS0zODI5NDcxOTIzMDEiLCJleHAiOjE3OTAyNjYyMDAsInRva2VuX3R5cGUiOiJyZWZyZXNoIn0.Signature...",
                    "expires_in": "21600",
                },
            }
        },
    )

    id: uuid.UUID
    email: EmailStr
    first_name: str
    last_name: str
    full_name: str
    role: str
    tenant_slug: Optional[str] = None
    tenant_name: Optional[str] = None
    auth: AuthTokenData


class MessageResponse(BaseModel):
    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={
            "example": {
                "message": "Password has been reset successfully. Please login again.",
                "detail": None,
                "dev_otp": "492817",
            }
        },
    )

    message: str
    detail: Optional[str] = None
    dev_otp: Optional[str] = None
