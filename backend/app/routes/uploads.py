import os
import uuid
import mimetypes
import asyncio
from typing import Dict, Any, Optional
import httpx
import boto3
import botocore.client
from fastapi import APIRouter, UploadFile, File, Header, HTTPException, status, Depends, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.database import get_db
from app.models.tenant import Tenant, BackendType
from app.models.user import User
from app.dependencies import get_current_user
from app.schemas.response import success_response, ErrorResponse

router = APIRouter(
    prefix="/uploads",
    tags=["Uploads & Media Assets"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
    },
)

# Local static upload directory (fallback)
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../static/uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "image/svg+xml": ".svg",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _get_neon_s3_client():
    """Initializes and returns a boto3 S3 client configured for Neon Object Storage."""
    if not (settings.AWS_ACCESS_KEY_ID and settings.AWS_ENDPOINT_URL_S3):
        return None

    return boto3.client(
        "s3",
        endpoint_url=settings.AWS_ENDPOINT_URL_S3,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
        config=botocore.client.Config(s3={"addressing_style": "path"}),
    )


@router.post(
    "/image",
    summary="Upload product or branding image",
    description="Uploads an image file to Neon Object Storage (S3), Sanity CDN, or local fallback storage.",
)
async def upload_image(
    file: UploadFile = File(...),
    x_tenant_slug: Optional[str] = Header(None, alias="X-Tenant-Slug"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0]
    if not content_type or content_type.lower() not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{content_type}'. Allowed types: JPG, PNG, WEBP, GIF, AVIF, SVG.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10 MB maximum limit.",
        )

    # 1. Fetch tenant context if provided
    tenant: Optional[Tenant] = None
    if x_tenant_slug:
        result = await db.execute(select(Tenant).where(Tenant.slug == x_tenant_slug.lower()))
        tenant = result.scalar_one_or_none()

    if tenant and current_user.role != "super_admin":
        if current_user.tenant_id != tenant.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to upload assets for this tenant store.",
            )

    # 2. If tenant uses Sanity CMS and has credentials, upload to Sanity Asset CDN
    if tenant and tenant.backend_type == BackendType.SANITY:
        project_id = tenant.sanity_project_id or settings.SANITY_PROJECT_ID
        dataset = tenant.sanity_dataset or settings.SANITY_DATASET or "production"
        token = settings.SANITY_API_TOKEN

        if project_id and token:
            try:
                sanity_upload_url = f"https://{project_id}.api.sanity.io/v2023-08-01/assets/images/{dataset}"
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": content_type,
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.post(
                        sanity_upload_url,
                        content=file_bytes,
                        headers=headers,
                        params={"filename": file.filename or "upload.jpg"},
                    )
                    if res.status_code in (200, 201):
                        data = res.json().get("document", {})
                        cdn_url = data.get("url")
                        if cdn_url:
                            return success_response(
                                data={
                                    "url": cdn_url,
                                    "filename": file.filename,
                                    "storage": "sanity_cdn",
                                    "size": len(file_bytes),
                                },
                                message="Image uploaded successfully to Sanity Asset CDN",
                            )
            except Exception as e:
                print(f"Sanity Asset upload fallback: {e}")

    # 3. Upload to Neon Object Storage (S3-Compatible)
    s3_client = _get_neon_s3_client()
    if s3_client:
        try:
            ext = ALLOWED_IMAGE_TYPES.get(content_type, ".jpg")
            tenant_prefix = tenant.slug if tenant else (x_tenant_slug or "general")
            object_key = f"tenants/{tenant_prefix}/products/{uuid.uuid4().hex[:12]}{ext}"
            bucket_name = settings.NEON_STORAGE_BUCKET

            # Run S3 synchronous put_object in worker thread
            def _put_s3():
                s3_client.put_object(
                    Bucket=bucket_name,
                    Key=object_key,
                    Body=file_bytes,
                    ContentType=content_type,
                    CacheControl="public, max-age=31536000, immutable",
                )

            await asyncio.to_thread(_put_s3)

            endpoint = settings.AWS_ENDPOINT_URL_S3.rstrip("/")
            public_url = f"{endpoint}/{bucket_name}/{object_key}"

            return success_response(
                data={
                    "url": public_url,
                    "filename": file.filename or object_key.split("/")[-1],
                    "storage": "neon_s3",
                    "bucket": bucket_name,
                    "key": object_key,
                    "size": len(file_bytes),
                },
                message="Image uploaded successfully to Neon Object Storage",
            )
        except Exception as e:
            print(f"Neon S3 upload error, falling back to local storage: {e}")

    # 4. Fallback: Local Static Storage
    ext = ALLOWED_IMAGE_TYPES.get(content_type, ".jpg")
    unique_filename = f"img_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    base_url = f"http://localhost:{settings.PORT}"
    file_url = f"{base_url}/static/uploads/{unique_filename}"

    return success_response(
        data={
            "url": file_url,
            "filename": unique_filename,
            "storage": "local_static",
            "size": len(file_bytes),
        },
        message="Image uploaded and stored successfully",
    )


@router.api_route("/proxy", methods=["GET", "HEAD"], summary="Proxy image to bypass CORS for client-side PDF export")
async def proxy_image(url: str):
    """
    Fetches an image from an external or S3 URL and returns it with CORS headers,
    enabling client-side canvas and jsPDF exports without cross-origin tainted canvas issues.
    """
    if not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="Invalid URL protocol")

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=f"Failed to fetch image: {resp.status_code}")

            content_type = resp.headers.get("content-type", "image/png")
            return Response(
                content=resp.content,
                media_type=content_type,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "public, max-age=86400",
                },
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

