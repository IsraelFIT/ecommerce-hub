import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateSessionFromRequest } from "@/lib/session";
import { checkPathAllowed } from "@/utils/role-helper";

const authPaths = [
  "/login",
  "/signup",
  "/register",
  "/forgot-password",
  "/reset-password",
];
const excludedPaths = [
  "/_next",
  "/favicon.ico",
  "/images/",
  "/assets/",
  "/api/auth/",
];

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ecommerce-hub.com";

  // 1. Skip static assets and internal paths
  if (
    excludedPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return NextResponse.next();
  }

  // 2. Extract current host without port and multi-tenant subdomain
  const currentHost = hostname.replace(/:\d+$/, "").toLowerCase();
  let tenantSlug: string | null = null;

  if (currentHost.endsWith(".localhost") && currentHost !== "localhost") {
    tenantSlug = currentHost.replace(".localhost", "");
  } else if (
    currentHost.endsWith(`.${rootDomain}`) &&
    currentHost !== rootDomain &&
    currentHost !== `www.${rootDomain}` &&
    currentHost !== `app.${rootDomain}`
  ) {
    tenantSlug = currentHost.replace(`.${rootDomain}`, "");
  }

  // 3. Proxy API routes & static uploads directly to FastAPI backend
  if (pathname.startsWith("/api/") || pathname.startsWith("/static/")) {
    const backendBase =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://127.0.0.1:8000";
    const targetUrl = new URL(
      `${backendBase.replace(/\/+$/, "")}${pathname}${request.nextUrl.search}`,
    );
    const requestHeaders = new Headers(request.headers);

    let effectiveTenant = tenantSlug || requestHeaders.get("x-tenant-slug");
    if (!effectiveTenant) {
      effectiveTenant =
        searchParams.get("tenant_slug") || searchParams.get("tenant") || null;
    }
    if (!effectiveTenant) {
      const referer = request.headers.get("referer");
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          const segs = refererUrl.pathname.split("/").filter(Boolean);
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
            effectiveTenant = segs[0];
          }
        } catch {
          // ignore invalid referer
        }
      }
    }

    if (effectiveTenant && !requestHeaders.has("x-tenant-slug")) {
      requestHeaders.set("x-tenant-slug", effectiveTenant);
    }
    if (!requestHeaders.has("authorization")) {
      const token =
        request.cookies.get("auth_session")?.value ||
        request.cookies.get("auth_token")?.value;
      if (token) {
        requestHeaders.set("authorization", `Bearer ${token}`);
      }
    }
    return NextResponse.rewrite(targetUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Cross-subdomain token handoff support (e.g. redirecting from root login to tenant admin)
  const queryToken =
    searchParams.get("auth_token") || searchParams.get("token");
  const queryRole = searchParams.get("role");
  const queryRefreshToken = searchParams.get("refresh_token");

  if (queryToken) {
    const cleanUrl = new URL(request.url);
    cleanUrl.searchParams.delete("auth_token");
    cleanUrl.searchParams.delete("token");
    cleanUrl.searchParams.delete("role");
    cleanUrl.searchParams.delete("refresh_token");

    const response = NextResponse.redirect(cleanUrl);
    const hostname = request.nextUrl.hostname.toLowerCase();
    const rootDomain = (
      process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ecommerce-hub.com"
    ).toLowerCase();
    const cookieDomain =
      !hostname.endsWith("localhost") &&
      hostname !== "127.0.0.1" &&
      (hostname === rootDomain || hostname.endsWith(`.${rootDomain}`))
        ? `.${rootDomain}`
        : undefined;

    const isSecure = request.nextUrl.protocol === "https:";

    const accessCookieOptions = {
      maxAge: 30 * 60, // 30 minutes
      path: "/",
      sameSite: "lax" as const,
      secure: isSecure,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    };
    const refreshCookieOptions = {
      maxAge: 12 * 60 * 60, // 12 hours
      path: "/",
      sameSite: "lax" as const,
      secure: isSecure,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    };
    response.cookies.set("auth_session", queryToken, accessCookieOptions);
    response.cookies.set("auth_token", queryToken, accessCookieOptions);
    if (queryRole)
      response.cookies.set("userRole", queryRole, refreshCookieOptions);
    if (queryRefreshToken)
      response.cookies.set(
        "refresh_token",
        queryRefreshToken,
        refreshCookieOptions,
      );
    return response;
  }

  // 3.5 Redirect redundant tenant prefix on subdomain URLs (e.g. jazz-cakes-ltd.localhost:3000/jazz-cakes-ltd/products -> /products)
  if (
    tenantSlug &&
    tenantSlug !== "core" &&
    (pathname === `/${tenantSlug}` || pathname.startsWith(`/${tenantSlug}/`))
  ) {
    const cleanPath = pathname.slice(`/${tenantSlug}`.length) || "/";
    const redirectUrl = new URL(
      `${cleanPath}${request.nextUrl.search}`,
      request.url,
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Normalize path if the subdomain URL included the leading tenant slug
  let normalizedPath = pathname;
  if (
    tenantSlug &&
    (normalizedPath === `/${tenantSlug}` ||
      normalizedPath.startsWith(`/${tenantSlug}/`))
  ) {
    normalizedPath = normalizedPath.slice(`/${tenantSlug}`.length) || "/";
  }

  // 4. Auth and Protected Route checking
  const isValid = validateSessionFromRequest(request);
  const roleCookie = request.cookies.get("userRole")?.value;
  const userRoles: string[] = roleCookie ? [roleCookie] : [];
  const primaryRole = userRoles[0];

  const protectedRoutePrefixes = [
    "/dashboard",
    "/settings",
    "/admin",
    "/products",
    "/orders",
    "/reviews",
    "/users",
    "/branding",
    "/adapters",
    "/tenants",
    "/customizations",
    "/revenue",
    "/subscriptions",
    "/developers",
    "/security",
    "/core",
    "/category-filters",
  ];

  const isProtectedPath =
    normalizedPath !== "/orders/confirmation" &&
    !normalizedPath.startsWith("/orders/confirmation/") &&
    (protectedRoutePrefixes.some(
      (prefix) =>
        normalizedPath === prefix ||
        normalizedPath.startsWith(`${prefix}/`) ||
        pathname.includes(prefix),
    ) ||
      (tenantSlug === "core" && normalizedPath !== "/login"));

  const isAuthPath = authPaths.some(
    (path) => normalizedPath === path || normalizedPath.startsWith(`${path}/`),
  );

  // Case 1: Unauthenticated user on protected route
  if (isProtectedPath && !isValid) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set(
      "redirect",
      normalizedPath +
        (request.nextUrl.search && !request.nextUrl.search.includes("redirect")
          ? request.nextUrl.search
          : ""),
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Case 2: Authenticated user on auth route (e.g. /login)
  if (isAuthPath && isValid) {
    let targetRedirect = searchParams.get("redirect");
    if (targetRedirect) {
      if (
        tenantSlug &&
        (targetRedirect === `/${tenantSlug}` ||
          targetRedirect.startsWith(`/${tenantSlug}/`))
      ) {
        targetRedirect = targetRedirect.slice(`/${tenantSlug}`.length) || "/";
      }
      return NextResponse.redirect(new URL(targetRedirect, request.url));
    }
    const fallbackPath =
      primaryRole === "super_admin"
        ? tenantSlug === "core"
          ? "/"
          : "/core"
        : primaryRole === "tenant_admin" || primaryRole === "admin"
          ? tenantSlug
            ? "/admin"
            : "/dashboard"
          : "/";
    return NextResponse.redirect(new URL(fallbackPath, request.url));
  }

  // Case 3: RBAC check
  if (
    isValid &&
    isProtectedPath &&
    !checkPathAllowed(normalizedPath, userRoles)
  ) {
    const fallbackPath = tenantSlug ? "/" : "/dashboard";
    return NextResponse.redirect(new URL(fallbackPath, request.url));
  }

  // 5. Multi-tenant URL rewrite for tenant subdomains (e.g. core.localhost:3000 or bakery.localhost:3000)
  if (tenantSlug) {
    let rewrittenPath: string;

    if (tenantSlug === "core") {
      // Core Super Admin Console routing
      let coreSubPath = normalizedPath;
      if (coreSubPath.startsWith("/core/")) {
        coreSubPath = coreSubPath.slice(5) || "/";
      } else if (coreSubPath === "/core") {
        coreSubPath = "/";
      }

      if (
        coreSubPath === "/" ||
        coreSubPath === "/dashboard" ||
        coreSubPath === "/overview"
      ) {
        rewrittenPath = "/core/core";
      } else if (coreSubPath === "/login") {
        rewrittenPath = "/core/login";
      } else {
        const cleanSub = coreSubPath.startsWith("/")
          ? coreSubPath
          : `/${coreSubPath}`;
        rewrittenPath = `/core/core${cleanSub}`;
      }
    } else {
      rewrittenPath = `/${tenantSlug}${normalizedPath === "/" ? "" : normalizedPath}`;
    }

    const tenantUrl = new URL(rewrittenPath, request.url);
    const response = NextResponse.rewrite(tenantUrl);

    if (isProtectedPath) {
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("X-XSS-Protection", "1; mode=block");
      response.headers.set(
        "Referrer-Policy",
        "strict-origin-when-cross-origin",
      );
      response.headers.set("Cache-Control", "no-store, max-age=0");
    }

    return response;
  }

  // 6. Redirect root domain /core/* to core.{domain}/*
  if (pathname === "/core" || pathname.startsWith("/core/")) {
    const subPath = pathname.slice(5) || "/";
    const port = request.nextUrl.port ? `:${request.nextUrl.port}` : "";
    const isLocal =
      currentHost === "localhost" || currentHost.endsWith(".localhost");
    const targetHost = isLocal ? `core.localhost${port}` : `core.${rootDomain}`;
    const redirectUrl = new URL(
      `${request.nextUrl.protocol}//${targetHost}${subPath}`,
    );
    return NextResponse.redirect(redirectUrl);
  }

  // 7. Standard response with security headers for root domain
  const response = NextResponse.next();
  if (isProtectedPath) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Cache-Control", "no-store, max-age=0");
  }

  return response;
}

export default proxy;

export const config = {
  matcher: ["/", "/:path*"],
};
