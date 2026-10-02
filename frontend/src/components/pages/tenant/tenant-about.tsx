import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Award, HeartHandshake } from "lucide-react";

interface TenantAboutProps {
  storeName: string;
  tenantSlug: string;
}

export function TenantAbout({ storeName, tenantSlug }: TenantAboutProps) {
  return (
    <section className="py-20 md:py-32 bg-stone-50 text-stone-900 border-b border-stone-200">
      <div className="container px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Column: Story & Philosophy */}
          <div className="lg:pr-8 flex flex-col items-start">
            <div className="font-secondary text-xs font-bold tracking-[0.25em] uppercase text-emerald-700 mb-3">
              Our Story & Standards
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold capitalize mb-6 leading-tight text-stone-950">
              A devotion to craftsmanship & authentic quality
            </h2>

            <p className="text-stone-600 mb-4 leading-relaxed text-base">
              At {storeName}, we believe exceptional products begin with
              intentional curation — uncompromising standards, premium raw
              materials, and genuine passion. Every single item in our
              collection is selected and inspected to ensure it exceeds your
              expectations.
            </p>

            <p className="text-stone-500 mb-8 leading-relaxed text-sm">
              Whether you are discovering something new or ordering a signature
              favorite, our store offers secure checkout, direct tracking, and
              dedicated client assistance.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 w-full border-y border-stone-200 py-6">
              <div className="flex flex-col items-start gap-1">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-xs uppercase tracking-wider text-stone-900">
                  Authentic
                </span>
                <span className="text-[11px] text-stone-500">
                  100% Verified
                </span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <Award className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-xs uppercase tracking-wider text-stone-900">
                  Guaranteed
                </span>
                <span className="text-[11px] text-stone-500">
                  Top Craftsmanship
                </span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <HeartHandshake className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-xs uppercase tracking-wider text-stone-900">
                  Bespoke
                </span>
                <span className="text-[11px] text-stone-500">
                  Care in Every Order
                </span>
              </div>
            </div>

            <Link href={`/${tenantSlug}#collection`}>
              <Button
                variant="outline"
                className="border-stone-950 text-stone-950 hover:bg-stone-950 hover:text-white rounded-none uppercase tracking-wider font-semibold transition-all px-8 h-12"
              >
                Explore Products →
              </Button>
            </Link>
          </div>

          {/* Right Column: Visual Showcase Card */}
          <div className="relative w-full aspect-4/5 rounded-2xl overflow-hidden bg-stone-900 flex flex-col justify-end p-8 text-white shadow-2xl border border-stone-800">
            <div className="absolute inset-0 bg-radial-[at_top_right] from-emerald-950/60 via-stone-900 to-stone-950" />
            <div className="absolute top-8 right-8 text-stone-700 font-mono text-xs uppercase tracking-widest">
              Est. {new Date().getFullYear()}
            </div>

            <div className="relative z-10 space-y-4">
              <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-emerald-500/30">
                Crafted With Precision
              </span>
              <h3 className="text-2xl md:text-3xl font-bold font-secondary">
                Designed For Discerning Clients
              </h3>
              <p className="text-stone-300 text-xs md:text-sm font-light leading-relaxed">
                Enjoy seamless multi-currency checkout, tracked global
                fulfilment, and instant payment settlement on {storeName}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
