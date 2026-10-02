import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface TenantHeroProps {
  storeName: string;
  tenantSlug: string;
}

export function TenantHero({ storeName, tenantSlug }: TenantHeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-end pb-16 overflow-hidden bg-stone-950 text-white">
      {/* Background linear & Ambient Glows */}
      <div className="absolute inset-0 z-0 bg-radial-[at_top_right] from-stone-800 via-stone-900 to-stone-950" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-black/40 z-10" />

      <div className="container relative z-20 flex flex-col items-start justify-end gap-6 px-4 md:px-8">
        {/* Store Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>Official Storefront • {storeName}</span>
        </div>

        {/* Buttons container */}
        <div className="flex flex-wrap gap-4 mt-2">
          <Link href={`/${tenantSlug}#collection`}>
            <Button className="bg-white text-stone-950 font-bold tracking-wider hover:bg-stone-200 hover:text-stone-950 transition-all uppercase h-12 px-7 rounded-none cursor-pointer shadow-lg">
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

        {/* Large Decorative Text */}
        <h1 className="text-stone-100 font-secondary leading-[0.85] tracking-wide text-[60px] md:text-[100px] md:text-[140px] lg:text-[180px] xl:text-[220px] uppercase font-bold select-none mt-4 opacity-90 wrap-break-word max-w-full">
          {storeName}
        </h1>
      </div>
    </section>
  );
}
