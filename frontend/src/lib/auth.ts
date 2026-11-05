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
  const accessCookieOptions = {
    maxAge: 30 * 60, // 30 minutes
    path: "/",
    sameSite: "lax" as const,
    ...(domain ? { domain } : {}),
  };

  const refreshCookieOptions = {
    maxAge: 12 * 60 * 60, // 12 hours
    path: "/",
    sameSite: "lax" as const,
    ...(domain ? { domain } : {}),
  };

  setCookie(
    APP_CONFIG.sessionCookieName || "auth_session",
    token,
    accessCookieOptions,
  );
  setCookie("auth_token", token, accessCookieOptions);
  if (refreshToken) {
    setCookie("refresh_token", refreshToken, refreshCookieOptions);
  }
  setCookie(
    APP_CONFIG.roleCookieName || "userRole",
    user.role,
    refreshCookieOptions,
  );
}

export function clearAuthSession() {
  const domain = getCookieDomain();
  const deleteOptions = { path: "/", ...(domain ? { domain } : {}) };

  const cookieNames = [
    APP_CONFIG.sessionCookieName || "auth_session",
    "auth_session",
    "auth_token",
    "refresh_token",
    APP_CONFIG.roleCookieName || "userRole",
    "userRole",
    "tenant_id",
    "tenant_slug",
  ];

  // 1. Delete cookies via cookies-next (host-only & root domain)
  cookieNames.forEach((name) => {
    deleteCookie(name, { path: "/" });
    if (domain) {
      deleteCookie(name, deleteOptions);
    }
  });

  // 2. Direct browser cleanup for cookies, localStorage, and sessionStorage
  if (typeof window !== "undefined") {
    try {
      const cookies = document.cookie.split(";");
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
          if (domain) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain};`;
          }
        }
      }
    } catch {
      // Ignore document access errors
    }

    try {
      localStorage.removeItem("user-storage");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("auth_session");
      localStorage.removeItem("userRole");
      localStorage.removeItem("cart-storage");
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear localStorage/sessionStorage:", e);
    }
  }
}

export function getRefreshToken(): string | undefined {
  const cookieVal =
    (getCookie("refresh_token") as string | undefined) ||
    (getCookie("auth_refresh_token") as string | undefined);
  if (cookieVal && cookieVal.trim().length > 0) return cookieVal;
  return undefined;
}
