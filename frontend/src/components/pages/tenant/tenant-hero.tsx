"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";

interface TenantHeroProps {
  storeName: string;
  tenantSlug: string;
}

export function TenantHero({ storeName, tenantSlug }: TenantHeroProps) {
  const { branding } = useTenantTheme();
  const headline =
    branding.storeHeadline || `Official Storefront • ${storeName}`;
  const tagline =
    branding.tagline || "Discover exclusive collections and authentic goods";

  return (
    <section className="relative min-h-[90vh] flex items-end pb-16 overflow-hidden bg-stone-950 text-white">
      {/* Background linear & Ambient Glows */}
      <div className="absolute inset-0 z-0 bg-radial-[at_top_right] from-stone-800 via-stone-900 to-stone-950" />
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full blur-3xl pointer-events-none opacity-20 transition-colors duration-500"
        style={{ backgroundColor: branding.primaryColor || "var(--primary)" }}
      />
      <div className="absolute inset-0 bg-black/40 z-10" />

      <div className="container relative z-20 flex flex-col items-start justify-end gap-6 px-4 md:px-8">
        {/* Store Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
          <span>{headline}</span>
        </div>

        <div className="flex flex-col">
          {tagline && (
            <p className="text-stone-300 max-w-xl font-light">{tagline}</p>
          )}

          {/* Large Decorative Text */}
          <h1 className="text-stone-100 font-secondary leading-[0.85] tracking-wide text-[60px] md:text-[100px] lg:text-[140px] xl:text-[180px] uppercase font-bold select-none opacity-90 wrap-break-word max-w-full">
            {storeName}
          </h1>
        </div>

        {/* Buttons container */}
        <div className="flex flex-wrap gap-4">
          <Link href={`/${tenantSlug}#collection`}>
            <Button
              className="text-white font-bold tracking-wider transition-all uppercase h-12 px-7 rounded-none cursor-pointer shadow-lg hover:opacity-90"
              style={{
                backgroundColor: branding.primaryColor || "var(--primary)",
              }}
            >
              Explore Collection
            </Button>
          </Link>
          <Link href={`/${tenantSlug}#consultations`}>
            <Button
              variant="outline"
              className="border-white/80 bg-transparent text-white font-bold tracking-wider hover:bg-white/10 transition-colors uppercase h-12 px-7 rounded-none cursor-pointer"
            >
              Custom Inquiries
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default TenantHero;
