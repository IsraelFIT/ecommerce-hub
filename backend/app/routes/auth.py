import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.otp import PasswordResetOTP
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_otp,
)
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TenantCustomerRegisterRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    UserResponse,
    AuthResponse,
)
from app.schemas.response import success_response, ApiResponse, ErrorResponse
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication & Session Management"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request / Business Logic Failure"},
        422: {"model": ErrorResponse, "description": "Validation Error (Form / Schema)"},
    },
)


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[AuthResponse],
    summary="Register a new tenant store owner, provision store and issue tokens",
    description="Registers a new store owner, automatically creates tenant organisation and returns 6-hour access token & 3-day refresh token.",
)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    # 1. Check if user email already exists
    existing_user_query = await db.execute(select(User).where(User.email == payload.email))
    if existing_user_query.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists",
        )

    # 2. Check if store slug already exists
    existing_tenant_query = await db.execute(select(Tenant).where(Tenant.slug == payload.store_slug))
    if existing_tenant_query.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Store subdomain slug '{payload.store_slug}' is already taken",
        )

    # 3. Provision Tenant Store
    tenant = Tenant(
        name=payload.store_name,
        slug=payload.store_slug,
        category=payload.store_category,
        is_active=True,
    )
    db.add(tenant)
    await db.flush()

    # 4. Create User Account
    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone_number=payload.phone_number,
        hashed_password=hash_password(payload.password),
        role="tenant_admin",
        is_active=True,
        is_verified=True,
        consent_to_terms=payload.consent_to_terms,
        tenant_id=tenant.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    await db.refresh(tenant)

    # 5. Generate 6-hour Access Token & 3-day Refresh Token
    token_claims = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "tenant_id": str(tenant.id),
        "tenant_slug": tenant.slug,
    }
    access_token = create_access_token(token_claims)
    refresh_token = create_refresh_token(token_claims)

    user_data = {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": f"{user.first_name} {user.last_name}",
        "role": user.role,
        "tenant_slug": tenant.slug,
        "tenant_name": tenant.name,
        "auth": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": "21600",  # 6 hours = 21600 seconds
        },
    }

    return success_response(
        data=user_data,
        message="Store registered and provisioned successfully",
    )


@router.post(
    "/tenant-register",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[AuthResponse],
    summary="Register a customer/shopper user under a specific tenant store",
    description="Registers a customer account under an existing tenant store and returns access & refresh tokens.",
)
async def tenant_customer_register(
    payload: TenantCustomerRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    # 1. Fetch tenant by slug
    t_query = await db.execute(select(Tenant).where(Tenant.slug == payload.tenant_slug))
    tenant = t_query.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store '{payload.tenant_slug}' not found",
        )

    # 2. Check if user email already exists
    existing_user_query = await db.execute(select(User).where(User.email == payload.email))
    if existing_user_query.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists",
        )

    # 3. Create customer User Account
    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone_number=payload.phone_number,
        hashed_password=hash_password(payload.password),
        role="customer",
        is_active=True,
        is_verified=True,
        consent_to_terms=True,
        tenant_id=tenant.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 4. Generate 6-hour Access Token & 3-day Refresh Token
    token_claims = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "tenant_id": str(tenant.id),
        "tenant_slug": tenant.slug,
    }
    access_token = create_access_token(token_claims)
    refresh_token = create_refresh_token(token_claims)

    user_data = {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": f"{user.first_name} {user.last_name}",
        "role": user.role,
        "tenant_slug": tenant.slug,
        "tenant_name": tenant.name,
        "auth": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": "21600",
        },
    }

    return success_response(
        data=user_data,
        message=f"Account created successfully for {tenant.name}",
    )


@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
    response_model=ApiResponse[AuthResponse],
    summary="Authenticate user and retrieve 6-hour access and 3-day refresh tokens",
    description="Authenticates tenant merchant credentials and returns a JWT access token valid for 6 hours along with a 3-day refresh token.",
)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    # 1. Fetch user by email
    query = await db.execute(select(User).where(User.email == payload.email))
    user = query.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials provided.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked or deactivated. Please contact support.",
        )

    # 2. Fetch tenant details if associated
    tenant_slug = None
    tenant_name = None
    if user.tenant_id:
        t_query = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
        tenant = t_query.scalar_one_or_none()
        if tenant:
            tenant_slug = tenant.slug
            tenant_name = tenant.name

    # 3. Create 6-hour Access Token & 3-day Refresh Token
    token_claims = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
        "tenant_slug": tenant_slug,
    }
    access_token = create_access_token(token_claims)
    refresh_token = create_refresh_token(token_claims)

    user_data = {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": f"{user.first_name} {user.last_name}",
        "role": user.role,
        "tenant_slug": tenant_slug,
        "tenant_name": tenant_name,
        "auth": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": "21600",  # 6 hours in seconds
        },
    }

    return success_response(
        data=user_data,
        message="Logged in successfully",
    )


@router.post(
    "/refresh-token",
    status_code=status.HTTP_200_OK,
    response_model=ApiResponse[AuthResponse],
    summary="Exchange valid 3-day refresh token for new access token & refreshed tokens",
    description="Validates a 3-day refresh token and re-issues a new 6-hour access token and updated refresh token.",
)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    # 1. Decode and validate refresh token
    decoded = decode_refresh_token(payload.refresh_token)
    if not decoded or not decoded.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or has expired.",
        )

    user_id_str = decoded["sub"]
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token subject.",
        )

    # 2. Check user in database
    query = await db.execute(select(User).where(User.id == user_uuid))
    user = query.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token no longer exists.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked or deactivated. Please contact support.",
        )

    tenant_slug = None
    tenant_name = None
    if user.tenant_id:
        t_query = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
        tenant = t_query.scalar_one_or_none()
        if tenant:
            tenant_slug = tenant.slug
            tenant_name = tenant.name

    # 3. Issue fresh 6-hour access token and updated 3-day refresh token
    token_claims = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
        "tenant_slug": tenant_slug,
    }
    new_access_token = create_access_token(token_claims)
    new_refresh_token = create_refresh_token(token_claims)

    user_data = {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": f"{user.first_name} {user.last_name}",
        "role": user.role,
        "tenant_slug": tenant_slug,
        "tenant_name": tenant_name,
        "auth": {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "expires_in": "21600",
        },
    }

    return success_response(
        data=user_data,
        message="Token refreshed successfully",
    )


@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    response_model=ApiResponse[Dict[str, Any]],
    summary="Send password reset verification code",
    description="Generates a single-use 6-digit verification OTP valid for 10 minutes.",
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    query = await db.execute(select(User).where(User.email == payload.email))
    user = query.scalar_one_or_none()

    otp_code: Optional[str] = None
    if user:
        otp_code = generate_otp(6)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        otp_record = PasswordResetOTP(
            user_id=user.id,
            otp_code=otp_code,
            expires_at=expires_at,
            is_used=False,
        )
        db.add(otp_record)
        await db.commit()

    return success_response(
        data={"dev_otp": otp_code} if otp_code else {},
        message="If this email is registered, a password reset code has been sent.",
    )


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    response_model=ApiResponse[Dict[str, Any]],
    summary="Reset password using verification code",
    description="Validates OTP verification code and sets a new password.",
)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    query = await db.execute(select(User).where(User.email == payload.email))
    user = query.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or verification code",
        )

    now = datetime.now(timezone.utc)
    otp_query = await db.execute(
        select(PasswordResetOTP)
        .where(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.otp_code == payload.otp,
            PasswordResetOTP.is_used == False,
            PasswordResetOTP.expires_at >= now,
        )
        .order_by(PasswordResetOTP.created_at.desc())
    )
    otp_record = otp_query.scalar_one_or_none()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code",
        )

    otp_record.is_used = True
    user.hashed_password = hash_password(payload.new_password)
    await db.commit()

    return success_response(
        data={},
        message="Password has been reset successfully. Please login again.",
    )


@router.get(
    "/me",
    status_code=status.HTTP_200_OK,
    response_model=ApiResponse[Dict[str, Any]],
    summary="Retrieve profile of currently authenticated user",
    description="Returns current authenticated user details from the Bearer access token.",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    user_data = UserResponse.model_validate(current_user).model_dump(mode="json")
    user_data["full_name"] = f"{current_user.first_name} {current_user.last_name}"
    return success_response(
        data=user_data,
        message="User details retrieved successfully",
    )
