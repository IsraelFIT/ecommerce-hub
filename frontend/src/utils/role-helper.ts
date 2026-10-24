import { ROLE_ROUTE_ACCESS } from "@/constants";

export function checkPathAllowed(
  pathname: string,
  userRoles: string[],
): boolean {
  if (!userRoles || userRoles.length === 0) return false;

  // Super admin has full access across all platform routes
  if (userRoles.includes("super_admin")) {
    return true;
  }

  // Strip leading tenant slug if present in path-based routing (e.g. /gunn-studios/products -> /products)
  const segments = pathname.split("/").filter(Boolean);
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
  ];
  let subRoute = pathname;
  if (segments.length > 1 && !reservedRootSlugs.includes(segments[0])) {
    subRoute = `/${segments.slice(1).join("/")}`;
  }

  // Hub admin has full platform administration access alongside super_admin
  if (userRoles.includes("hub_admin")) {
    return true;
  }

  // Admin and tenant_admin have access ONLY to tenant-level administrative routes
  if (userRoles.includes("admin") || userRoles.includes("tenant_admin")) {
    // Explicitly forbid core platform routes to tenant_admin
    const isCorePlatformRoute =
      pathname.startsWith("/core") ||
      subRoute.startsWith("/core") ||
      pathname.startsWith("/tenants") ||
      subRoute.startsWith("/tenants") ||
      pathname.startsWith("/revenue") ||
      subRoute.startsWith("/revenue") ||
      pathname.startsWith("/subscriptions") ||
      subRoute.startsWith("/subscriptions") ||
      pathname.startsWith("/customizations") ||
      subRoute.startsWith("/customizations") ||
      pathname.startsWith("/developers") ||
      subRoute.startsWith("/developers") ||
      pathname.startsWith("/security") ||
      subRoute.startsWith("/security");

    if (isCorePlatformRoute) {
      return false;
    }

    if (
      pathname.includes("/admin") ||
      subRoute.includes("/admin") ||
      pathname.startsWith("/dashboard") ||
      subRoute.startsWith("/dashboard") ||
      pathname.startsWith("/settings") ||
      subRoute.startsWith("/settings") ||
      pathname.startsWith("/products") ||
      subRoute.startsWith("/products") ||
      pathname.startsWith("/orders") ||
      subRoute.startsWith("/orders") ||
      pathname.startsWith("/reviews") ||
      subRoute.startsWith("/reviews") ||
      pathname.startsWith("/users") ||
      subRoute.startsWith("/users") ||
      pathname.startsWith("/branding") ||
      subRoute.startsWith("/branding") ||
      pathname.startsWith("/adapters") ||
      subRoute.startsWith("/adapters") ||
      pathname.startsWith("/category-filters") ||
      subRoute.startsWith("/category-filters")
    ) {
      return true;
    }
  }

  return userRoles.some((role) => {
    const allowedPrefixes = ROLE_ROUTE_ACCESS[role] || [];
    return allowedPrefixes.some(
      (prefix) =>
        pathname === prefix ||
        pathname.startsWith(`${prefix}/`) ||
        subRoute === prefix ||
        subRoute.startsWith(`${prefix}/`),
    );
  });
}

export function getUserAllowedPaths(role: string): string[] {
  return ROLE_ROUTE_ACCESS[role] || [];
}
