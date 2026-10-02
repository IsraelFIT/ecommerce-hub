export * from "./enums";
export * from "./menu";

export const APP_CONFIG = {
  name: "EcommerceHub",
  description:
    "Next-generation multi-tenant e-commerce platform & boutique storefronts",
  version: "1.0.0",
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ecommerce-hub.com",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  sessionCookieName: "auth_session",
  roleCookieName: "userRole",
};

export const ROLE_ROUTE_ACCESS: Record<string, string[]> = {
  super_admin: [
    "/core",
    "/dashboard",
    "/tenants",
    "/revenue",
    "/subscriptions",
    "/adapters",
    "/developers",
    "/security",
    "/settings",
    "/admin",
    "/products",
    "/orders",
    "/branding",
    "/analytics",
  ],
  admin: [
    "/core",
    "/dashboard",
    "/settings",
    "/analytics",
    "/tenants",
    "/revenue",
    "/subscriptions",
    "/orders",
    "/menu",
    "/admin",
    "/products",
    "/branding",
    "/adapters",
  ],
  tenant_admin: [
    "/dashboard",
    "/settings",
    "/products",
    "/orders",
    "/branding",
    "/menu",
    "/admin",
    "/adapters",
  ],
  customer: ["/account", "/orders", "/cart", "/checkout"],
  user: ["/account", "/dashboard", "/cart", "/checkout"],
};
