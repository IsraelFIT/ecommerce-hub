import type { NextRequest } from "next/server";
import { getCookie, setCookie, deleteCookie } from "cookies-next";
import { APP_CONFIG } from "@/constants";
import type { UserRole } from "@/types/users";

export const AUTH_TOKEN_KEY = APP_CONFIG.sessionCookieName || "auth_session";
export const USER_ROLE_KEY = APP_CONFIG.roleCookieName || "userRole";
export const REFRESH_TOKEN_KEY = "refresh_token";

// Expiration constants
export const ACCESS_TOKEN_MAX_AGE = 30 * 60; // 30 minutes in seconds (1800)
export const REFRESH_TOKEN_MAX_AGE = 12 * 60 * 60; // 12 hours in seconds (43200)

export interface ClientSession {
  accessToken?: string;
  refreshToken?: string;
  role?: UserRole | string;
  tenantSlug?: string;
}

/**
 * Safely extracts exp timestamp (in milliseconds) from a JWT token.
 * Returns null if token is missing or malformed.
 */
export function getJwtExpirationMs(token: string | undefined): number | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const payload = JSON.parse(jsonStr);
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Checks whether a given JWT token is already expired.
 */
export function isTokenExpired(token: string | undefined): boolean {
  const expMs = getJwtExpirationMs(token);
  if (!expMs) return false;
  return Date.now() >= expMs;
}

function getCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const hostname = window.location.hostname;
  if (
    hostname.endsWith("localhost") ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".vercel.app")
  ) {
    return undefined;
  }
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ecommerce-hub.com";
  if (hostname.endsWith(rootDomain)) {
    return `.${rootDomain}`;
  }
  return undefined;
}

/**
 * Validates session presence and expiration from NextRequest inside Proxy (Middleware).
 */
export function validateSessionFromRequest(request: NextRequest): boolean {
  const token =
    request.cookies.get(AUTH_TOKEN_KEY)?.value ||
    request.cookies.get("auth_session")?.value ||
    request.cookies.get("auth_token")?.value;

  const refreshToken = request.cookies.get(REFRESH_TOKEN_KEY)?.value;

  if (!token && !refreshToken) {
    return false;
  }

  // If access token is missing or expired, check if a valid unexpired refresh token exists.
  // Allowing the request through lets client-side SessionMonitor or API client refresh the access token.
  if (!token || isTokenExpired(token)) {
    if (refreshToken && !isTokenExpired(refreshToken)) {
      return true;
    }
    return false;
  }

  return true;
}

/**
 * Retrieves the raw JWT session token on client or server.
 */
export function getSessionTokenClient(): string | undefined {
  return (
    (getCookie(AUTH_TOKEN_KEY) as string | undefined) ||
    (getCookie("auth_session") as string | undefined) ||
    (getCookie("auth_token") as string | undefined)
  );
}

/**
 * Returns the current active session object with tokens and role.
 */
export async function getSession(): Promise<ClientSession | null> {
  const accessToken =
    (getCookie(AUTH_TOKEN_KEY) as string | undefined) ||
    (getCookie("auth_session") as string | undefined) ||
    (getCookie("auth_token") as string | undefined);
  const refreshToken =
    (getCookie(REFRESH_TOKEN_KEY) as string | undefined) ||
    (getCookie("refresh_token") as string | undefined) ||
    (getCookie("auth_refresh_token") as string | undefined);
  const role =
    (getCookie(USER_ROLE_KEY) as string | undefined) ||
    (getCookie("userRole") as string | undefined);

  if (!accessToken && !refreshToken) {
    return null;
  }

  let tenantSlug: string | undefined;
  if (accessToken) {
    try {
      const parts = accessToken.split(".");
      if (parts.length >= 2) {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const jsonStr = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        );
        const payload = JSON.parse(jsonStr);
        tenantSlug = payload.tenant_slug || payload.tenantSlug;
      }
    } catch {
      // Ignore malformed token decode
    }
  }

  return {
    accessToken,
    refreshToken,
    role,
    tenantSlug,
  };
}

/**
 * Stores tokens and session state in cookies with accurate expirations:
 * - Access token: 30 minutes
 * - Refresh token: 12 hours
 * - User role: 12 hours
 */
export async function createSession(
  accessToken: string,
  refreshToken?: string,
  role?: string,
  expiresInSeconds: number = ACCESS_TOKEN_MAX_AGE,
): Promise<void> {
  const domain = getCookieDomain();
  const isHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const accessCookieOptions = {
    maxAge: expiresInSeconds || ACCESS_TOKEN_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
    secure: isHttps,
    ...(domain ? { domain } : {}),
  };

  const refreshCookieOptions = {
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
    secure: isHttps,
    ...(domain ? { domain } : {}),
  };

  setCookie(AUTH_TOKEN_KEY, accessToken, accessCookieOptions);
  setCookie("auth_session", accessToken, accessCookieOptions);
  setCookie("auth_token", accessToken, accessCookieOptions);

  if (refreshToken) {
    setCookie(REFRESH_TOKEN_KEY, refreshToken, refreshCookieOptions);
    setCookie("refresh_token", refreshToken, refreshCookieOptions);
  }
  if (role) {
    setCookie(USER_ROLE_KEY, role, refreshCookieOptions);
    setCookie("userRole", role, refreshCookieOptions);
  }
}

/**
 * Deletes all authentication and session cookies, as well as client local/session storage.
 */
export async function deleteSession(): Promise<void> {
  const cookieNames = [
    AUTH_TOKEN_KEY,
    "auth_session",
    "auth_token",
    USER_ROLE_KEY,
    "userRole",
    REFRESH_TOKEN_KEY,
    "tenant_id",
    "tenant_slug",
  ];

  // 1. Delete standard cookies (host-level)
  cookieNames.forEach((name) => {
    deleteCookie(name, { path: "/" });
  });

  // 2. Delete root-domain cookies if in browser on custom subdomain
  if (typeof window !== "undefined") {
    const rootDomain =
      process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ecommerce-hub.com";
    const hostname = window.location.hostname;
    if (hostname.endsWith(rootDomain)) {
      cookieNames.forEach((name) => {
        deleteCookie(name, { path: "/", domain: `.${rootDomain}` });
      });
    }

    // Direct document.cookie fallback
    try {
      const cookies = document.cookie.split(";");
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
          if (hostname.endsWith(rootDomain)) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${rootDomain};`;
          }
        }
      }
    } catch {
      // Ignore
    }

    // 3. Clear localStorage and sessionStorage completely
    try {
      localStorage.removeItem("user-storage");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("auth_session");
      localStorage.removeItem("userRole");
      localStorage.clear();
      sessionStorage.clear();
    } catch (err) {
      console.warn("Could not clear browser storage on deleteSession:", err);
    }
  }
}

export function deleteAuthCookies(): void {
  deleteSession();
}
