import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { BrandingConfig } from "@/types/users";

export interface BespokeStorefrontProps {
  tenantSlug: string;
  storeName: string;
  branding?: BrandingConfig;
}

/**
 * Registry of Bespoke Custom Landing Pages per tenant slug.
 * Each bespoke storefront is lazy-loaded via next/dynamic with SSR enabled,
 * ensuring zero bundle footprint on other tenants' storefronts.
 */
export const BESPOKE_STOREFRONTS: Record<
  string,
  ComponentType<BespokeStorefrontProps>
> = {
  // Bespoke artisanal landing page for Jazz Cakes Ltd
  "jazz-cakes-ltd": dynamic(() => import("./jazz-cakes-ltd/page"), {
    loading: () => (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-xs uppercase tracking-widest text-stone-400 ">
            Loading Bespoke Experience...
          </p>
        </div>
      </div>
    ),
  }),
};

/**
 * Check if a bespoke storefront component is implemented for the given tenant slug.
 */
export function hasBespokeStorefront(tenantSlug: string): boolean {
  return Boolean(BESPOKE_STOREFRONTS[tenantSlug.toLowerCase()]);
}

/**
 * Registry of Bespoke Custom About Pages per tenant slug.
 */
export const BESPOKE_ABOUT_PAGES: Record<
  string,
  ComponentType<BespokeStorefrontProps>
> = {
  // If a bespoke tenant implements a custom about page, it can be registered here.
};

export function hasBespokeAbout(tenantSlug: string): boolean {
  return Boolean(BESPOKE_ABOUT_PAGES[tenantSlug.toLowerCase()]);
}

/**
 * Registry of Bespoke Custom Contact Pages per tenant slug.
 */
export const BESPOKE_CONTACT_PAGES: Record<
  string,
  ComponentType<BespokeStorefrontProps>
> = {
  // If a bespoke tenant implements a custom contact page, it can be registered here.
};

export function hasBespokeContact(tenantSlug: string): boolean {
  return Boolean(BESPOKE_CONTACT_PAGES[tenantSlug.toLowerCase()]);
}
