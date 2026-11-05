import { Tenant } from "@/types/users";

/**
 * Server-side helper to fetch tenant data in Next.js Server Components / Layouts.
 * Enables SSR pre-rendering with tenant branding, avoiding React hydration mismatch.
 */
export async function getTenantServerData(
  slug: string,
): Promise<Tenant | null> {
  if (!slug || slug === "core" || slug === "store") return null;

  const backendUrl = (
    process.env.INTERNAL_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://127.0.0.1:8000"
  )
    .replace(/\/+$/, "")
    .replace("//localhost:", "//127.0.0.1:");

  const targetUrl = `${backendUrl}/api/tenants/by-slug/${slug.toLowerCase()}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(targetUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(9000),
      });

      if (!res.ok) return null;

      const json = await res.json();
      return (json.data as Tenant) || null;
    } catch (err) {
      if (attempt === 1) {
        // Brief 250ms pause before retry to allow serverless DB compute to finish waking up
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      console.warn(
        `[getTenantServerData] Failed to fetch server tenant data for ${slug} after 2 attempts:`,
        err,
      );
      return null;
    }
  }
  return null;
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
