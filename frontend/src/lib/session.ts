import type { NextRequest } from "next/server";
import { getCookie, setCookie, deleteCookie } from "cookies-next";
import { APP_CONFIG } from "@/constants";
import type { UserRole } from "@/types/users";

export const AUTH_TOKEN_KEY = APP_CONFIG.sessionCookieName || "auth_session";
export const USER_ROLE_KEY = APP_CONFIG.roleCookieName || "userRole";
export const REFRESH_TOKEN_KEY = "refresh_token";

export interface ClientSession {
  accessToken?: string;
  refreshToken?: string;
  role?: UserRole | string;
}

/**
 * Validates session presence from NextRequest inside Proxy (Middleware).
 */
export function validateSessionFromRequest(request: NextRequest): boolean {
  const token =
    request.cookies.get(AUTH_TOKEN_KEY)?.value ||
    request.cookies.get("auth_session")?.value ||
    request.cookies.get("auth_token")?.value;
  return Boolean(token && token.trim().length > 0);
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
    (getCookie("auth_token") as string | undefined);
  const refreshToken = getCookie(REFRESH_TOKEN_KEY) as string | undefined;
  const role = getCookie(USER_ROLE_KEY) as string | undefined;

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    role,
  };
}

/**
 * Stores tokens and session state in cookies.
 */
export async function createSession(
  accessToken: string,
  refreshToken?: string,
  customToken?: string,
  role?: string,
  extra?: Record<string, unknown>,
  expiresInSeconds: number = 60 * 60 * 24 * 7,
): Promise<void> {
  const cookieOptions = {
    maxAge: expiresInSeconds,
    path: "/",
    sameSite: "lax" as const,
  };

  setCookie(AUTH_TOKEN_KEY, accessToken, cookieOptions);
  setCookie("auth_session", accessToken, cookieOptions);
  setCookie("auth_token", accessToken, cookieOptions);

  if (refreshToken) {
    setCookie(REFRESH_TOKEN_KEY, refreshToken, cookieOptions);
  }
  if (role) {
    setCookie(USER_ROLE_KEY, role, cookieOptions);
  }
}

/**
 * Deletes all authentication and session cookies.
 */
export async function deleteSession(): Promise<void> {
  deleteCookie(AUTH_TOKEN_KEY, { path: "/" });
  deleteCookie("auth_session", { path: "/" });
  deleteCookie("auth_token", { path: "/" });
  deleteCookie(USER_ROLE_KEY, { path: "/" });
  deleteCookie("userRole", { path: "/" });
  deleteCookie(REFRESH_TOKEN_KEY, { path: "/" });
}

export function deleteAuthCookies(): void {
  deleteSession();
}
