import { Tenant } from "@/types/users";

/**
 * Server-side helper to fetch tenant data in Next.js Server Components / Layouts.
 * Enables SSR pre-rendering with tenant branding, avoiding React hydration mismatch.
 */
export async function getTenantServerData(
  slug: string,
): Promise<Tenant | null> {
  if (!slug || slug === "core" || slug === "store") return null;

  try {
    const backendUrl =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://127.0.0.1:8000";

    const cleanBase = backendUrl.replace(/\/+$/, "");
    const res = await fetch(
      `${cleanBase}/api/tenants/by-slug/${slug.toLowerCase()}`,
      {
        cache: "no-store",
      },
    );

    if (!res.ok) return null;

    const json = await res.json();
    return (json.data as Tenant) || null;
  } catch (err) {
    console.warn(
      `[getTenantServerData] Failed to fetch server tenant data for ${slug}:`,
      err,
    );
    return null;
  }
}

/**
 * Returns formatted store name and description for SEO metadata across tenant routes.
 */
export async function getTenantMeta(slug: string) {
  const tenantData = await getTenantServerData(slug);
  const storeName =
    tenantData?.name ||
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const storeDescription =
    tenantData?.branding_config?.tagline ||
    tenantData?.branding_config?.storeHeadline ||
    "Explore our collection of custom celebration cakes and pastries.";

  return { storeName, storeDescription, tenantData };
}
