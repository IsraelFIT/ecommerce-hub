import { apiRequest } from "./client";
import { ApiResponse } from "@/types/users";

export interface LikeResponseData {
  product_id: string;
  liked: boolean;
  total_likes: number;
}

export function getOrCreateGuestSessionId(): string {
  if (typeof window === "undefined") return "guest-default";
  try {
    let guestId = localStorage.getItem("ecommerce_guest_session_id");
    if (!guestId) {
      guestId =
        "guest_" +
        Math.random().toString(36).substring(2) +
        Date.now().toString(36);
      localStorage.setItem("ecommerce_guest_session_id", guestId);
    }
    return guestId;
  } catch {
    return "guest-fallback";
  }
}

export async function toggleProductLike(
  productId: string,
  tenantSlug?: string,
  sessionId?: string,
): Promise<ApiResponse<LikeResponseData>> {
  const activeSessionId =
    sessionId ||
    (typeof window !== "undefined" ? getOrCreateGuestSessionId() : undefined);
  const headers: HeadersInit = {};
  if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;
  if (activeSessionId) headers["X-Session-ID"] = activeSessionId;

  return apiRequest<LikeResponseData>("/likes/toggle", {
    method: "POST",
    headers,
    body: JSON.stringify({
      product_id: productId,
      session_id: activeSessionId,
    }),
  });
}

export async function getProductLikeStatus(
  productId: string,
  tenantSlug?: string,
  sessionId?: string,
): Promise<ApiResponse<LikeResponseData>> {
  const activeSessionId =
    sessionId ||
    (typeof window !== "undefined" ? getOrCreateGuestSessionId() : undefined);
  const headers: HeadersInit = {};
  if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;
  if (activeSessionId) headers["X-Session-ID"] = activeSessionId;

  const q = activeSessionId
    ? `?session_id=${encodeURIComponent(activeSessionId)}`
    : "";
  return apiRequest<LikeResponseData>(`/likes/status/${productId}${q}`, {
    method: "GET",
    headers,
  });
}
