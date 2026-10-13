"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Award, HeartHandshake } from "lucide-react";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";

interface TenantAboutProps {
  storeName: string;
  tenantSlug: string;
}

export function TenantAbout({ storeName, tenantSlug }: TenantAboutProps) {
  const { branding } = useTenantTheme();
  return (
    <section className="py-20 md:py-32 bg-stone-50 text-stone-900 border-b border-stone-200">
      <div className="container px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Column: Story & Philosophy */}
          <div className="lg:pr-8 flex flex-col items-start">
            <div
              style={{ color: branding?.secondaryColor || "var(--primary)" }}
              className="font-secondary text-xs font-bold tracking-[0.25em] uppercase mb-3"
            >
              Our Story & Standards
            </div>

            <h2 className="font-semibold capitalize mb-4 text-stone-950">
              A devotion to craftsmanship & authentic quality
            </h2>

            <p className="text-stone-600 mb-4">
              At {storeName}, we believe exceptional products begin with
              intentional curation — uncompromising standards, premium raw
              materials, and genuine passion. Every single item in our
              collection is selected and inspected to ensure it exceeds your
              expectations.
            </p>

            <p className="text-stone-500 mb-8">
              Whether you are discovering something new or ordering a signature
              favorite, our store offers secure checkout, direct tracking, and
              dedicated client assistance.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 w-full border-y border-stone-200 py-6">
              <div className="flex flex-col items-start gap-1">
                <ShieldCheck
                  style={{ color: branding?.accentColor || "var(--primary)" }}
                  className="h-5 w-5"
                />
                <span className="font-bold text-xs uppercase tracking-wider text-stone-900">
                  Authentic
                </span>
                <span className="text-stone-500">100% Verified</span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <Award
                  style={{ color: branding?.accentColor || "var(--primary)" }}
                  className="h-5 w-5"
                />
                <span className="font-bold text-xs uppercase tracking-wider text-stone-900">
                  Guaranteed
                </span>
                <span className="text-stone-500">Top Craftsmanship</span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <HeartHandshake
                  style={{ color: branding?.accentColor || "var(--primary)" }}
                  className="h-5 w-5"
                />
                <span className="font-bold text-xs uppercase tracking-wider text-stone-900">
                  Bespoke
                </span>
                <span className="text-stone-500">Care in Every Order</span>
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
            <div
              style={{
                background: `radial-gradient(at top right, ${branding?.secondaryColor + "20" || "var(--primary)"} 0%, ${branding?.primaryColor + "20" || "var(--secondary)"} 50%)`,
              }}
              className="absolute inset-0"
            />
            <div className="absolute top-8 right-8 text-xs uppercase tracking-widest">
              Est. {new Date().getFullYear()}
            </div>

            <div className="relative z-10 space-y-4">
              <span
                style={{
                  backgroundColor:
                    `${branding?.accentColor}20` || "var(--secondary)",
                  borderColor: branding?.accentColor || "var(--secondary)",
                  color: branding?.accentColor || "var(--primary)",
                }}
                className="inline-block px-3 py-1 border rounded-full text-xs font-semibold uppercase tracking-wider "
              >
                Crafted With Precision
              </span>
              <h3 className="font-bold font-secondary">
                Designed For Discerning Clients
              </h3>
              <p className="text-stone-300 font-light">
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
