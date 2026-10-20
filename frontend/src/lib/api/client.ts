import { ApiResponse } from "@/types/users";
import {
  deleteSession,
  getSession,
  createSession,
  ACCESS_TOKEN_MAX_AGE,
} from "@/lib/session";
import { getRefreshToken, clearAuthSession } from "@/lib/auth";
import {
  recordUserActivity,
  isUserRecentlyActive,
} from "@/lib/activity-tracker";
import { APP_CONFIG } from "@/constants";

interface ParsedData {
  status?: "success" | "error";
  message?: string;
  detail?: string;
  data?: unknown;
  pagination?: Record<string, unknown>;
  filters?: Record<string, unknown>;
  errors?: Record<string, unknown>;
}

export const getBackendBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // In browser: if an external custom API is specified (e.g. non-localhost remote API in production), use it.
    // Otherwise use "" (relative URL) so Next.js proxy/rewrites handle the request locally without CORS or localhost IPv6 issues.
    const customApi =
      process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    if (
      customApi &&
      !customApi.includes("localhost") &&
      !customApi.includes("127.0.0.1")
    ) {
      return customApi.replace(/\/+$/, "");
    }
    return "";
  }

  const url =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    APP_CONFIG.apiUrl ||
    "http://127.0.0.1:8000";
  return url.replace(/\/+$/, "");
};

/**
 * Normalizes an API endpoint to ensure consistent URL formatting.
 */
function normalizeEndpoint(endpoint: string): string {
  const clean = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  // Automatically prefix /api if not already prefixed and not root
  if (!clean.startsWith("/api") && clean !== "/") {
    return `/api${clean}`;
  }
  return clean;
}

let refreshPromise: Promise<string | null> | null = null;

async function executeTokenRefresh(
  refreshTokenValue: string,
): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      console.log(
        "⚠️ Access token expired, user is active: attempting automatic token refresh...",
      );
      // Dynamic import to avoid circular dependency
      const { refreshToken: performRefresh } = await import("./auth");
      const refreshResponse = await performRefresh({
        refresh_token: refreshTokenValue,
      });

      if (refreshResponse.status === "success" && refreshResponse.data) {
        const authData = refreshResponse.data;
        const newAccessToken =
          authData.auth?.access_token ||
          (authData as unknown as { access_token?: string }).access_token;
        const newRefreshToken =
          authData.auth?.refresh_token ||
          (authData as unknown as { refresh_token?: string }).refresh_token ||
          refreshTokenValue;

        if (newAccessToken) {
          await createSession(
            newAccessToken,
            newRefreshToken,
            authData.role,
            ACCESS_TOKEN_MAX_AGE,
          );

          console.log("✅ Token refreshed successfully, retrying request...");
          return newAccessToken;
        }
      }
      return null;
    } catch (refreshError) {
      console.error("❌ Automatic token refresh failed:", refreshError);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Primary helper function for all backend JSON API requests.
 */
export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  try {
    // Record frontend activity on outgoing user API requests
    recordUserActivity();

    const session = await getSession();
    const accessToken = session?.accessToken;

    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData;

    const guestId =
      typeof window !== "undefined"
        ? localStorage.getItem("ecommerce_guest_session_id")
        : null;

    // Detect tenant slug in browser if available
    let autoTenantSlug: string | null = null;
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname.toLowerCase();
      if (
        hostname.includes(".localhost") &&
        !hostname.startsWith("localhost")
      ) {
        autoTenantSlug = hostname.split(".localhost")[0];
      } else {
        const segs = window.location.pathname.split("/").filter(Boolean);
        const reserved = [
          "api",
          "core",
          "login",
          "signup",
          "dashboard",
          "_next",
          "static",
        ];
        if (segs.length > 0 && !reserved.includes(segs[0])) {
          autoTenantSlug = segs[0];
        }
      }
    }
    if (!autoTenantSlug && session?.tenantSlug) {
      autoTenantSlug = session.tenantSlug;
    }

    // Prepare headers with JSON default (unless FormData) and Bearer authorization
    const headers: HeadersInit = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(guestId ? { "X-Session-ID": guestId } : {}),
      ...(autoTenantSlug ? { "X-Tenant-Slug": autoTenantSlug } : {}),
      ...options.headers,
    };

    const path = normalizeEndpoint(endpoint);
    const baseUrl = getBackendBaseUrl();
    const url = `${baseUrl}${path}`;
    const isSilent =
      endpoint.includes("/notifications") || endpoint.includes("/health");

    if (!isSilent && process.env.NODE_ENV !== "production") {
      console.log(`🌐 API Request: ${options.method || "GET"} ${path}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {
        status: "success",
        message: "Operation completed successfully",
        data: {} as T,
      };
    }

    const responseText = await response.text();

    // Try to parse JSON response
    let data: ParsedData = {};
    try {
      data = responseText ? (JSON.parse(responseText) as ParsedData) : {};
    } catch {
      console.error("❌ Failed to parse response as JSON:", responseText);
      throw new Error(
        `Invalid JSON response: ${responseText.substring(0, 100)}`,
      );
    }

    if (!isSilent && process.env.NODE_ENV !== "production") {
      console.log(`📥 API Response (${response.status}):`, {
        path,
        status: response.status,
        message: data.message || data.detail,
      });
    }

    // Handle token expiration (401 errors)
    if (response.status === 401) {
      const isRefreshEndpoint = endpoint.includes("/refresh-token");
      const refreshTokenValue = session?.refreshToken || getRefreshToken();

      const hasRecentActivity = isUserRecentlyActive(12 * 60 * 60 * 1000);

      if (!isRefreshEndpoint && refreshTokenValue && hasRecentActivity) {
        const newAccessToken = await executeTokenRefresh(refreshTokenValue);

        if (newAccessToken) {
          // Retry original request with new Bearer token
          const retryHeaders: HeadersInit = {
            ...headers,
            Authorization: `Bearer ${newAccessToken}`,
          };

          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
          });

          if (retryResponse.status === 204) {
            return {
              status: "success",
              message: "Operation completed successfully",
              data: {} as T,
            };
          }

          const retryText = await retryResponse.text();
          let retryData: ParsedData = {};
          try {
            retryData = retryText ? JSON.parse(retryText) : {};
          } catch {
            throw new Error(
              `Invalid JSON response: ${retryText.substring(0, 100)}`,
            );
          }

          if (retryResponse.ok) {
            return {
              status: (retryData.status as "success" | "error") || "success",
              message: retryData.message || "Request successful",
              data: (retryData.data ?? retryData) as T,
              pagination: retryData.pagination,
              filters: retryData.filters,
              errors: retryData.errors as
                | Record<string, string[] | string>
                | undefined,
            };
          }
        }
      }

      console.log("⚠️ Session expired or invalid, clearing session...");
      await deleteSession();
      clearAuthSession();
      throw new Error("Session expired. Please login again.");
    }

    // Handle non-OK error responses
    if (!response.ok) {
      let errorMessage =
        data.message || data.detail || `HTTP error! status: ${response.status}`;

      const errorMsgLower = errorMessage.toLowerCase();

      // 1. Session Revoked (401)
      if (
        response.status === 401 &&
        (errorMsgLower.includes("session expired") ||
          errorMsgLower.includes("invalid token"))
      ) {
        await deleteSession();
        throw new Error(errorMessage);
      }

      // 2. Account Blocked / Inactive (403)
      if (
        response.status === 403 &&
        (errorMsgLower.includes("blocked") ||
          errorMsgLower.includes("inactive"))
      ) {
        console.log("🚫 Account blocked or inactive, clearing session...");
        await deleteSession();
        throw new Error(errorMessage);
      }

      // 3. Validation errors mapping
      if (data.errors && typeof data.errors === "object") {
        const fieldErrors = Object.entries(data.errors)
          .map(([field, messages]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(", ")}`;
            }
            return `${field}: ${messages}`;
          })
          .join(" | ");

        if (fieldErrors) {
          errorMessage = fieldErrors;
        }
      }

      throw new Error(errorMessage);
    }

    // Return uniform API response envelope
    return {
      status: (data.status as "success" | "error") || "success",
      message: data.message || "Request successful",
      data: (data.data ?? data) as T,
      pagination: data.pagination,
      filters: data.filters,
      errors: data.errors as Record<string, string[] | string> | undefined,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ API request error:", {
      endpoint,
      error: err.message,
    });
    throw err;
  }
};

/**
 * Helper function for FormData requests (e.g. file uploads, image assets).
 */
export const apiFormDataRequest = async <T = unknown>(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  try {
    const session = await getSession();
    const accessToken = session?.accessToken;

    const headers: HeadersInit = {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    };

    const path = normalizeEndpoint(endpoint);
    const baseUrl = getBackendBaseUrl();
    const url = `${baseUrl}${path}`;

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `🌐 API FormData Request: ${options.method || "POST"} ${path}`,
      );
    }

    const response = await fetch(url, {
      ...options,
      method: options.method || "POST",
      headers,
      body: formData,
    });

    const responseText = await response.text();

    let data: ParsedData = {};
    try {
      data = responseText ? (JSON.parse(responseText) as ParsedData) : {};
    } catch {
      console.error(
        "❌ Failed to parse FormData response as JSON:",
        responseText,
      );
      throw new Error(
        `Invalid JSON response: ${responseText.substring(0, 100)}`,
      );
    }

    if (response.status === 401) {
      const refreshTokenValue = session?.refreshToken || getRefreshToken();

      const hasRecentActivity = isUserRecentlyActive(12 * 60 * 60 * 1000);

      if (refreshTokenValue && hasRecentActivity) {
        const newAccessToken = await executeTokenRefresh(refreshTokenValue);
        if (newAccessToken) {
          const retryHeaders: HeadersInit = {
            ...headers,
            Authorization: `Bearer ${newAccessToken}`,
          };
          const retryResponse = await fetch(url, {
            ...options,
            method: options.method || "POST",
            headers: retryHeaders,
            body: formData,
          });
          const retryText = await retryResponse.text();
          let retryData: ParsedData = {};
          try {
            retryData = retryText ? JSON.parse(retryText) : {};
          } catch {
            throw new Error(
              `Invalid JSON response: ${retryText.substring(0, 100)}`,
            );
          }
          if (retryResponse.ok) {
            return {
              status: (retryData.status as "success" | "error") || "success",
              message: retryData.message || "Request successful",
              data: (retryData.data ?? retryData) as T,
              pagination: retryData.pagination,
              filters: retryData.filters,
              errors: retryData.errors as
                | Record<string, string[] | string>
                | undefined,
            };
          }
        }
      }

      console.log(
        "⚠️ Session expired for FormData request, clearing session...",
      );
      await deleteSession();
      clearAuthSession();
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      let errorMessage =
        data.message || data.detail || `HTTP error! status: ${response.status}`;

      if (data.errors && typeof data.errors === "object") {
        const fieldErrors = Object.entries(data.errors)
          .map(([field, messages]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(", ")}`;
            }
            return `${field}: ${messages}`;
          })
          .join(" | ");

        if (fieldErrors) {
          errorMessage = fieldErrors;
        }
      }

      throw new Error(errorMessage);
    }

    return {
      status: (data.status as "success" | "error") || "success",
      message: data.message || "Request successful",
      data: (data.data ?? data) as T,
      pagination: data.pagination,
      filters: data.filters,
      errors: data.errors as Record<string, string[] | string> | undefined,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ API FormData request error:", {
      endpoint,
      error: err.message,
    });
    throw err;
  }
};
