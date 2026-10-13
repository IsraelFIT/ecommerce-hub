import { apiRequest } from "./client";
import { ApiResponse } from "@/types/users";

export interface ReviewItem {
  id: string;
  tenant_id: string;
  product_id?: string | null;
  user_id?: string | null;
  product_name?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  customer_name: string;
  customer_email?: string | null;
  status: "approved" | "pending" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: Record<number, number>;
}

export interface PaginatedReviewsResponse {
  items: ReviewItem[];
}

export async function getReviews(options?: {
  tenantSlug?: string;
  productId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}): Promise<ApiResponse<PaginatedReviewsResponse>> {
  const {
    tenantSlug,
    productId,
    status,
    page = 1,
    perPage = 20,
  } = options || {};
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  if (productId) queryParams.set("product_id", productId);
  if (status) queryParams.set("status", status);

  const headers: HeadersInit = {};
  if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;

  return apiRequest<PaginatedReviewsResponse>(
    `/reviews?${queryParams.toString()}`,
    {
      method: "GET",
      headers,
    },
  );
}

export async function getReviewStats(options?: {
  tenantSlug?: string;
  productId?: string;
}): Promise<ApiResponse<ReviewStats>> {
  const { tenantSlug, productId } = options || {};
  const queryParams = new URLSearchParams();
  if (productId) queryParams.set("product_id", productId);

  const headers: HeadersInit = {};
  if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;

  const q = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return apiRequest<ReviewStats>(`/reviews/stats${q}`, {
    method: "GET",
    headers,
  });
}

export async function createReview(
  payload: {
    product_id?: string;
    rating: number;
    title?: string;
    comment: string;
    customer_name?: string;
    customer_email?: string;
  },
  tenantSlug?: string,
): Promise<ApiResponse<ReviewItem>> {
  const headers: HeadersInit = {};
  if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;

  return apiRequest<ReviewItem>("/reviews", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function updateReviewStatus(
  reviewId: string,
  status: "approved" | "pending" | "rejected",
  tenantSlug?: string,
): Promise<ApiResponse<ReviewItem>> {
  const headers: HeadersInit = {};
  if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;

  return apiRequest<ReviewItem>(`/reviews/${reviewId}/status`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status }),
  });
}

export async function deleteReview(
  reviewId: string,
  tenantSlug?: string,
): Promise<ApiResponse<{ deleted_id: string }>> {
  const headers: HeadersInit = {};
  if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;

  return apiRequest<{ deleted_id: string }>(`/reviews/${reviewId}`, {
    method: "DELETE",
    headers,
  });
}
