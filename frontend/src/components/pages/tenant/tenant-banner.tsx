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

  return (
    <section className="relative py-24 md:py-32 flex items-center justify-center overflow-hidden bg-stone-950 text-white border-t border-stone-800">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-radial-[at_top] from-stone-900 via-stone-950 to-stone-950" />
      <div className="absolute inset-0 bg-black/50 z-10" />

      {/* Central Content */}
      <div className="relative z-20 max-w-3xl mx-auto px-4 text-center flex flex-col items-center">
        <p
          style={{ color: branding.accentColor }}
          className="font-bold tracking-[0.25em] uppercase text-xs mb-3"
        >
          Elevate Your Collection
        </p>

        <h2 className="font-semibold uppercase mb-4 text-white">
          Experience Excellence at {storeName}
        </h2>

        <p className="text-stone-300 mb-10 max-w-lg font-light">
          Discover exclusive collections, enjoy secure multi-currency payment
          checkout, and have authentic goods delivered right to your doorstep.
        </p>

        <Link href={`/${tenantSlug}#collection`}>
          <Button className="bg-white text-stone-950 font-bold tracking-wider transition-all uppercase h-12 px-8 cursor-pointer gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Shop Now</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
