import { setCookie, deleteCookie, getCookie } from "cookies-next";
import { APP_CONFIG } from "@/constants";
import { User } from "@/types/users";

function getCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const hostname = window.location.hostname;
  if (hostname.endsWith("localhost") || hostname === "127.0.0.1") {
    // Browsers reject Domain=localhost cookies. Leaving domain undefined sets the cookie for the current host.
    return undefined;
  }
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ecommerce-hub.com";
  if (hostname.endsWith(rootDomain)) {
    return `.${rootDomain}`;
  }
  return undefined;
}

export function setAuthSession(
  token: string,
  user: User,
  refreshToken?: string,
) {
  const domain = getCookieDomain();
  const cookieOptions = {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "lax" as const,
    ...(domain ? { domain } : {}),
  };

  setCookie(
    APP_CONFIG.sessionCookieName || "auth_session",
    token,
    cookieOptions,
  );
  setCookie("auth_token", token, cookieOptions);
  if (refreshToken) {
    setCookie("refresh_token", refreshToken, cookieOptions);
  }
  setCookie(APP_CONFIG.roleCookieName || "userRole", user.role, cookieOptions);
}

export function clearAuthSession() {
  const domain = getCookieDomain();
  const deleteOptions = { path: "/", ...(domain ? { domain } : {}) };

  deleteCookie(APP_CONFIG.sessionCookieName || "auth_session", deleteOptions);
  deleteCookie("auth_token", deleteOptions);
  deleteCookie("refresh_token", deleteOptions);
  deleteCookie(APP_CONFIG.roleCookieName || "userRole", deleteOptions);
}

export function getRefreshToken(): string | undefined {
  return getCookie("refresh_token") as string | undefined;
}
