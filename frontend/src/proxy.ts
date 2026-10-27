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

  // 1. Skip static assets, public files with extensions, and internal paths
  if (
    excludedPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    ) ||
    /\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|eot)$/i.test(pathname)
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

    // 1. Resolve access token from Authorization header or auth cookies
    const rawAuth = requestHeaders.get("authorization");
    let token =
      rawAuth && rawAuth.startsWith("Bearer ")
        ? rawAuth.split("Bearer ")[1]?.trim() || rawAuth.slice(7).trim()
        : null;

    if (token === "undefined" || token === "null" || token === "") {
      token = null;
    }

    if (!token) {
      token =
        request.cookies.get("auth_session")?.value ||
        request.cookies.get("auth_token")?.value ||
        null;
    }

    if (token) {
      requestHeaders.set("authorization", `Bearer ${token}`);
    } else {
      requestHeaders.delete("authorization");
    }

    // 2. Primary Source of Truth: Decode verified JWT claims from access token
    let tokenTenantSlug: string | null = null;
    let tokenRole: string | null = null;
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length >= 2) {
          const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const jsonStr = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join(""),
          );
          const payload = JSON.parse(jsonStr);
          tokenTenantSlug = payload.tenant_slug || payload.tenantSlug || null;
          tokenRole = payload.role || null;
        }
      } catch {
        // ignore decode failure
      }
    }

    // 3. Determine effective tenant slug
    let effectiveTenant: string | null = tokenTenantSlug;

    // Super admin or Hub admin: allow explicit target via header or query params
    if (tokenRole === "super_admin" || tokenRole === "hub_admin") {
      effectiveTenant =
        requestHeaders.get("x-tenant-slug") ||
        searchParams.get("tenant_slug") ||
        searchParams.get("tenant") ||
        null;
    }

    // Unauthenticated public visitors: fallback to subdomain host or query params
    if (!effectiveTenant) {
      effectiveTenant =
        tenantSlug ||
        requestHeaders.get("x-tenant-slug") ||
        searchParams.get("tenant_slug") ||
        searchParams.get("tenant") ||
        null;
    }

    if (effectiveTenant) {
      requestHeaders.set("x-tenant-slug", effectiveTenant);
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
      !hostname.endsWith(".vercel.app") &&
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

  // Extract path-based tenant slug if not already on a subdomain
  const pathSegments = pathname.split("/").filter(Boolean);
  const reservedRootSlugs = [
    "api",
    "core",
    "login",
    "signup",
    "register",
    "forgot-password",
    "reset-password",
    "dashboard",
    "_next",
    "static",
    "favicon.ico",
  ];
  let effectiveTenantSlug = tenantSlug;
  if (
    !effectiveTenantSlug &&
    pathSegments.length > 0 &&
    !reservedRootSlugs.includes(pathSegments[0]) &&
    !pathSegments[0].includes(".")
  ) {
    effectiveTenantSlug = pathSegments[0];
  }

  // Normalize path if the subdomain URL OR path-based URL included the leading tenant slug
  let normalizedPath = pathname;
  if (
    effectiveTenantSlug &&
    (normalizedPath === `/${effectiveTenantSlug}` ||
      normalizedPath.startsWith(`/${effectiveTenantSlug}/`))
  ) {
    normalizedPath =
      normalizedPath.slice(`/${effectiveTenantSlug}`.length) || "/";
  }

  // 4. Auth and Protected Route checking
  const isValid = validateSessionFromRequest(request);

  // Extract authentic JWT token and decode verified claims
  const rawAuth = request.headers.get("authorization");
  const token =
    (rawAuth && rawAuth.startsWith("Bearer ")
      ? rawAuth.split("Bearer ")[1]?.trim() || rawAuth.slice(7).trim()
      : null) ||
    request.cookies.get("auth_session")?.value ||
    request.cookies.get("auth_token")?.value;

  let tokenRole: string | null = null;
  let tokenTenantSlug: string | null = null;
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const jsonStr = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        );
        const payload = JSON.parse(jsonStr);
        tokenRole = payload.role || null;
        tokenTenantSlug = payload.tenant_slug || payload.tenantSlug || null;
      }
    } catch {
      // ignore decode failure
    }
  }

  const roleCookie = request.cookies.get("userRole")?.value;
  const primaryRole = tokenRole || roleCookie || null;
  const userRoles: string[] = primaryRole ? [primaryRole] : [];

  const isCorePlatform =
    tenantSlug === "core" ||
    pathname === "/core" ||
    pathname.startsWith("/core/");

  const isCoreAdmin =
    primaryRole === "super_admin" ||
    primaryRole === "hub_admin" ||
    userRoles.includes("super_admin") ||
    userRoles.includes("hub_admin");

  // Core Platform Security Enforcement: ONLY super_admin and hub_admin can access http://core.localhost:3000/ and its pages
  if (isCorePlatform && normalizedPath !== "/login") {
    if (!isValid) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set(
        "redirect",
        pathname +
          (request.nextUrl.search &&
          !request.nextUrl.search.includes("redirect")
            ? request.nextUrl.search
            : ""),
      );
      return NextResponse.redirect(redirectUrl);
    }

    if (!isCoreAdmin) {
      const assignedTenant =
        tokenTenantSlug ||
        (effectiveTenantSlug && effectiveTenantSlug !== "core"
          ? effectiveTenantSlug
          : null);
      const isLocal =
        currentHost.includes("localhost") || currentHost.includes("127.0.0.1");
      const port = request.nextUrl.port ? `:${request.nextUrl.port}` : "";

      if (assignedTenant && assignedTenant !== "core") {
        const targetUrl = isLocal
          ? `http://${assignedTenant}.localhost${port}/admin`
          : `https://${assignedTenant}.${rootDomain}/admin`;
        return NextResponse.redirect(new URL(targetUrl));
      }

      const targetUrl = isLocal
        ? `http://localhost${port}/dashboard`
        : `https://${rootDomain}/dashboard`;
      return NextResponse.redirect(new URL(targetUrl));
    }
  }

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
      pathname +
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

    if (isCoreAdmin) {
      const fallbackPath = tenantSlug === "core" ? "/" : "/core";
      return NextResponse.redirect(new URL(fallbackPath, request.url));
    }

    const assignedTenant =
      tokenTenantSlug ||
      (effectiveTenantSlug && effectiveTenantSlug !== "core"
        ? effectiveTenantSlug
        : null);
    const isLocal =
      currentHost.includes("localhost") || currentHost.includes("127.0.0.1");
    const port = request.nextUrl.port ? `:${request.nextUrl.port}` : "";

    if (assignedTenant && assignedTenant !== "core") {
      const targetUrl = isLocal
        ? `http://${assignedTenant}.localhost${port}/admin`
        : `https://${assignedTenant}.${rootDomain}/admin`;
      return NextResponse.redirect(new URL(targetUrl));
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Case 3: RBAC check
  if (
    isValid &&
    isProtectedPath &&
    !checkPathAllowed(normalizedPath, userRoles)
  ) {
    const assignedTenant =
      tokenTenantSlug ||
      (effectiveTenantSlug && effectiveTenantSlug !== "core"
        ? effectiveTenantSlug
        : null);
    const isLocal =
      currentHost.includes("localhost") || currentHost.includes("127.0.0.1");
    const port = request.nextUrl.port ? `:${request.nextUrl.port}` : "";

    if (assignedTenant && assignedTenant !== "core") {
      const targetUrl = isLocal
        ? `http://${assignedTenant}.localhost${port}/admin`
        : `https://${assignedTenant}.${rootDomain}/admin`;
      return NextResponse.redirect(new URL(targetUrl));
    }

    const fallbackPath = isCoreAdmin
      ? tenantSlug === "core"
        ? "/"
        : "/core"
      : "/dashboard";
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
        rewrittenPath = "/core";
      } else if (coreSubPath === "/login") {
        rewrittenPath = "/login";
      } else {
        const cleanSub = coreSubPath.startsWith("/")
          ? coreSubPath
          : `/${coreSubPath}`;
        rewrittenPath = `/core${cleanSub}`;
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

  // 6. Handle /core/* (Super Admin console)
  if (pathname === "/core" || pathname.startsWith("/core/")) {
    const subPath = pathname.slice(5) || "/";
    const port = request.nextUrl.port ? `:${request.nextUrl.port}` : "";
    const isLocal =
      currentHost === "localhost" || currentHost.endsWith(".localhost");

    // On *.vercel.app without custom wildcard subdomains, rewrite internally instead of redirecting
    if (currentHost.endsWith(".vercel.app")) {
      const targetPath =
        subPath === "/login"
          ? "/login"
          : `/core${subPath === "/" || subPath === "" ? "" : subPath}`;
      return NextResponse.rewrite(new URL(targetPath, request.url));
    }

    const targetHost = isLocal ? `core.localhost${port}` : `core.${rootDomain}`;
    const redirectUrl = new URL(
      `${request.nextUrl.protocol}//${targetHost}${subPath}`,
    );

    // Forward existing search parameters (e.g. search queries or pagination)
    request.nextUrl.searchParams.forEach((val, key) => {
      redirectUrl.searchParams.set(key, val);
    });

    // Cross-subdomain token handoff from root/host domain to core console
    const currentToken =
      request.cookies.get("auth_session")?.value ||
      request.cookies.get("auth_token")?.value;
    const currentRefreshToken = request.cookies.get("refresh_token")?.value;
    const currentRole = request.cookies.get("userRole")?.value;

    if (currentToken && !redirectUrl.searchParams.has("auth_token")) {
      redirectUrl.searchParams.set("auth_token", currentToken);
      if (
        currentRefreshToken &&
        !redirectUrl.searchParams.has("refresh_token")
      ) {
        redirectUrl.searchParams.set("refresh_token", currentRefreshToken);
      }
      if (currentRole && !redirectUrl.searchParams.has("role")) {
        redirectUrl.searchParams.set("role", currentRole);
      }
    }

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
