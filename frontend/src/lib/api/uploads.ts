import { apiRequest } from "./client";
import { ApiResponse } from "@/types/users";
import { ResolveImageUrlResponse } from "@/types/products";

export interface UploadImageResponse {
  url: string;
}

/**
 * Upload an image file (PNG, JPG, SVG, WebP) to storage.
 */
export async function uploadImage(
  file: File,
  tenantIdOrSlug?: string,
): Promise<ApiResponse<UploadImageResponse>> {
  const formData = new FormData();
  formData.append("file", file);
  if (tenantIdOrSlug) {
    formData.append("tenant_id", tenantIdOrSlug);
  }

  const headers: Record<string, string> = {};
  if (tenantIdOrSlug) {
    headers["X-Tenant-Slug"] = tenantIdOrSlug;
  }

  return apiRequest<UploadImageResponse>("/uploads/image", {
    method: "POST",
    headers,
    body: formData,
  });
}

/**
 * Resolves a webpage photo URL (such as Unsplash, Pinterest, etc.) into a direct photo asset binary URL.
 */
export async function resolveImageUrl(
  url: string,
): Promise<ApiResponse<ResolveImageUrlResponse>> {
  return apiRequest<ResolveImageUrlResponse>("/uploads/resolve-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}
