"use client";

import { usePathname, useParams } from "next/navigation";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getSubdomainSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname.toLowerCase();
  const rootDomain = (
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ecommerce-hub.com"
  ).toLowerCase();

  const isDevSubdomain =
    hostname.endsWith(".localhost") && hostname !== "localhost";
  const isProdSubdomain =
    hostname.endsWith(`.${rootDomain}`) &&
    hostname !== rootDomain &&
    hostname !== `www.${rootDomain}` &&
    hostname !== `app.${rootDomain}` &&
    hostname !== `core.${rootDomain}`;

  return isDevSubdomain || isProdSubdomain;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Hook to determine if the root platform Header and Footer should be hidden.
 * Returns true if the user is on:
 * - A tenant subdomain (e.g. jazz-cakes.localhost:3000 or jazz-cakes.ecommerce-hub.com)
 * - Any tenant route ([tenant], /admin, /cart, /checkout, /menu, etc.)
 * - Auth pages (/signup, /register, /login, /forgot-password, /reset-password)
 * - Platform dashboard (/dashboard and subpaths)
 *
 * Returns false on root marketing landing page (http://localhost:3000/ or http://ecommerce-hub.com/)
 */
export default function useInvalidPaths(): boolean {
  const pathname = usePathname() || "";
  const params = useParams();
  const isSubdomain = useSyncExternalStore(
    subscribe,
    getSubdomainSnapshot,
    getServerSnapshot,
  );

  // Check if we are inside a tenant parameter route (e.g. /[tenant]/...)
  const isTenantRoute = Boolean(params && params.tenant);

  // Platform paths where root header/footer should not render
  const platformExcludedPaths = [
    "/signup",
    "/register",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/dashboard",
    "/admin",
    "/products",
    "/orders",
    "/branding",
    "/adapters",
    "/settings",
  ];

  const isExcludedPath = platformExcludedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`) || pathname.includes(path),
  );

  return isSubdomain || isTenantRoute || isExcludedPath;
}

/**
 * Hook to determine if the tenant Store Header and Store Footer should be hidden.
 * Returns true (hidden) on:
 * - Tenant Admin Dashboard & management pages (admin, products, orders, branding, adapters, settings)
 * - Tenant Auth pages (/login, /register, /signup, /forgot-password, /reset-password)
 */
export function useStoreInvalidPaths(): boolean {
  const pathname = usePathname() || "";
  const params = useParams();
  const tenant = params?.tenant as string | undefined;

  // Normalize path by stripping leading tenant segment if present (e.g. /[tenant]/products -> /products)
  let normalizedPath = pathname;
  if (tenant && (normalizedPath === `/${tenant}` || normalizedPath.startsWith(`/${tenant}/`))) {
    normalizedPath = normalizedPath.slice(`/${tenant}`.length) || "/";
  }

  const storeExcludedPaths = [
    "/admin",
    "/products",
    "/orders",
    "/branding",
    "/adapters",
    "/settings",
    "/login",
    "/register",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  return storeExcludedPaths.some(
    (path) =>
      normalizedPath === path ||
      normalizedPath.startsWith(`${path}/`) ||
      pathname.includes(path),
  );
}

