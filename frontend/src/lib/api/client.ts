import { ApiResponse } from "@/types/users";
import { deleteSession, getSession, createSession } from "@/lib/session";
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
  const url =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    APP_CONFIG.apiUrl ||
    "http://localhost:8000";
  return url.replace(/\/+$/, "");
};

const BACKEND_URL = getBackendBaseUrl();

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

/**
 * Primary helper function for all backend JSON API requests.
 */
export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  try {
    const session = await getSession();
    const accessToken = session?.accessToken;

    // Prepare headers with JSON default and Bearer authorization
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    };

    const path = normalizeEndpoint(endpoint);
    const url = `${BACKEND_URL}${path}`;
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

      if (!isRefreshEndpoint && session?.refreshToken) {
        console.log(
          "⚠️ Access token expired, attempting automatic token refresh...",
        );
        try {
          // Dynamic import to avoid circular dependency
          const { refreshToken: performRefresh } = await import("./auth");
          const refreshResponse = await performRefresh({
            refresh_token: session.refreshToken,
          });

          if (refreshResponse.status === "success" && refreshResponse.data) {
            const authData = refreshResponse.data;
            const newAccessToken =
              authData.auth?.access_token ||
              (authData as unknown as { access_token?: string }).access_token;
            const newRefreshToken =
              authData.auth?.refresh_token ||
              (authData as unknown as { refresh_token?: string })
                .refresh_token ||
              session.refreshToken;

            if (newAccessToken) {
              await createSession(
                newAccessToken,
                newRefreshToken,
                undefined,
                authData.role,
                {},
                60 * 60 * 24 * 7,
              );

              console.log(
                "✅ Token refreshed successfully, retrying request...",
              );

              // Retry original request with new Bearer token
              const retryHeaders: HeadersInit = {
                ...headers,
                Authorization: `Bearer ${newAccessToken}`,
              };

              const retryResponse = await fetch(url, {
                ...options,
                headers: retryHeaders,
              });

              const retryText = await retryResponse.text();
              const retryData: ParsedData = retryText
                ? JSON.parse(retryText)
                : {};

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
        } catch (refreshError) {
          console.error("❌ Automatic token refresh failed:", refreshError);
        }
      }

      console.log("⚠️ Session expired or invalid, clearing session...");
      await deleteSession();
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
    const url = `${BACKEND_URL}${path}`;

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
      console.log(
        "⚠️ Session expired for FormData request, clearing session...",
      );
      await deleteSession();
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
