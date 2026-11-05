"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { ArrowRight, ShoppingCart } from "lucide-react";

interface TenantBannerProps {
  storeName: string;
  tenantSlug: string;
}

export function TenantBanner({ storeName, tenantSlug }: TenantBannerProps) {
  const { branding } = useTenantTheme();

  const bannerBadge = branding?.bannerBadge || "Elevate Your Collection";
  const bannerHeadline =
    branding?.bannerHeadline || `Experience Excellence at ${storeName}`;
  const bannerDescription =
    branding?.bannerDescription ||
    "Discover exclusive collections, enjoy secure multi-currency payment checkout, and have authentic goods delivered right to your doorstep.";
  const bannerButtonText = branding?.bannerButtonText || "Shop Now";
  const bannerButtonLink =
    branding?.bannerButtonLink || `/${tenantSlug}#collection`;
  const bannerImage = branding?.bannerUrl;

  return (
    <section className="relative py-24 md:py-32 flex items-center justify-center overflow-hidden bg-stone-950 text-white border-t border-stone-800">
      {/* Background Decor & Optional Image */}
      {bannerImage && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${bannerImage})` }}
        />
      )}
      <div
        className={`absolute inset-0 z-0 ${bannerImage ? "bg-stone-950/80 backdrop-blur-xs" : "bg-radial-[at_top] from-stone-900 via-stone-950 to-stone-950"}`}
      />
      <div className="absolute inset-0 bg-black/50 z-10" />

      {/* Central Content */}
      <div className="relative z-20 max-w-3xl mx-auto px-4 text-center flex flex-col items-center">
        <p
          style={{ color: branding?.accentColor || "var(--primary)" }}
          className="font-bold tracking-[0.25em] uppercase text-xs mb-3"
        >
          {bannerBadge}
        </p>

        <h2 className="font-semibold uppercase mb-4 text-white">
          {bannerHeadline}
        </h2>

        <p className="text-stone-300 mb-10 max-w-lg font-light whitespace-pre-line">
          {bannerDescription}
        </p>

        <Link href={bannerButtonLink}>
          <Button className="uppercase font-bold px-6">
            <ShoppingCart className="h-4 w-4" />
            <span>{bannerButtonText}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
