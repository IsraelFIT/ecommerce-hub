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

  // Admin and tenant admins have access to tenant administrative routes
  if (userRoles.includes("admin") || userRoles.includes("tenant_admin")) {
    if (
      pathname.includes("/admin") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/products") ||
      pathname.startsWith("/orders") ||
      pathname.startsWith("/branding") ||
      pathname.startsWith("/adapters") ||
      pathname.startsWith("/tenants") ||
      pathname.startsWith("/core")
    ) {
      return true;
    }
  }

  return userRoles.some((role) => {
    const allowedPrefixes = ROLE_ROUTE_ACCESS[role] || [];
    return allowedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  });
}

export function getUserAllowedPaths(role: string): string[] {
  return ROLE_ROUTE_ACCESS[role] || [];
}
