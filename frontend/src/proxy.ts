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

  // 2. Allow API routes
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 3. Extract current host without port
  const currentHost = hostname.replace(/:\d+$/, "").toLowerCase();

  // Multi-tenant subdomain extraction (Supports *.localhost:3000 in dev and *.{rootDomain} in prod)
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
    const cookieOptions = {
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax" as const,
    };
    response.cookies.set("auth_session", queryToken, cookieOptions);
    response.cookies.set("auth_token", queryToken, cookieOptions);
    if (queryRole) response.cookies.set("userRole", queryRole, cookieOptions);
    if (queryRefreshToken)
      response.cookies.set("refresh_token", queryRefreshToken, cookieOptions);
    return response;
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
    "/branding",
    "/adapters",
    "/tenants",
    "/revenue",
    "/subscriptions",
    "/developers",
    "/security",
    "/core",
  ];

  const isProtectedPath =
    protectedRoutePrefixes.some(
      (prefix) =>
        normalizedPath === prefix ||
        normalizedPath.startsWith(`${prefix}/`) ||
        pathname.includes(prefix),
    ) ||
    (tenantSlug === "core" && normalizedPath !== "/login");

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
