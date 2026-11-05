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

  const aboutBadge = branding?.aboutBadge || "Our Story & Standards";
  const aboutTitle =
    branding?.aboutTitle || "A devotion to craftsmanship & authentic quality";
  const aboutDescription =
    branding?.aboutDescription ||
    `At ${storeName}, we believe exceptional products begin with intentional curation — uncompromising standards, premium raw materials, and genuine passion. Every single item in our collection is selected and inspected to ensure it exceeds your expectations.`;
  const aboutSecondaryDescription =
    branding?.aboutSecondaryDescription ||
    "Whether you are discovering something new or ordering a signature favorite, our store offers secure checkout, direct tracking, and dedicated client assistance.";

  const feat1Title = branding?.aboutFeature1Title || "Authentic";
  const feat1Desc = branding?.aboutFeature1Desc || "100% Verified";
  const feat2Title = branding?.aboutFeature2Title || "Guaranteed";
  const feat2Desc = branding?.aboutFeature2Desc || "Top Craftsmanship";
  const feat3Title = branding?.aboutFeature3Title || "Bespoke";
  const feat3Desc = branding?.aboutFeature3Desc || "Care in Every Order";

  const cardBadge = branding?.aboutCardBadge || "Crafted With Precision";
  const cardTitle =
    branding?.aboutCardTitle || "Designed For Discerning Clients";
  const cardDescription =
    branding?.aboutCardDescription ||
    `Enjoy seamless multi-currency checkout, tracked global fulfilment, and instant payment settlement on ${storeName}.`;
  const showcaseImage = branding?.aboutImageUrl;
  const bgImage = branding?.aboutBackgroundUrl;

  return (
    <section
      className="relative py-20 md:py-32 bg-stone-50 text-stone-900 border-b border-stone-200 overflow-hidden"
      style={
        bgImage
          ? {
              backgroundImage: `linear-gradient(rgba(250, 250, 249, 0.94), rgba(250, 250, 249, 0.94)), url(${bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="container px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Column: Story & Philosophy */}
          <div className="lg:pr-8 flex flex-col items-start">
            <div
              style={{ color: branding?.secondaryColor || "var(--primary)" }}
              className="font-secondary text-xs font-bold tracking-[0.25em] uppercase mb-3"
            >
              {aboutBadge}
            </div>

            <h2 className="font-semibold capitalize mb-4 text-stone-950">
              {aboutTitle}
            </h2>

            <p className="text-stone-600 mb-4 whitespace-pre-line">
              {aboutDescription}
            </p>

            <p className="text-stone-500 mb-8 whitespace-pre-line">
              {aboutSecondaryDescription}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 w-full border-y border-stone-200 py-6">
              <div className="flex flex-col items-start gap-1">
                <ShieldCheck
                  style={{ color: branding?.accentColor || "var(--primary)" }}
                  className="h-5 w-5"
                />
                <span className="font-bold text-xs uppercase tracking-wider text-stone-900">
                  {feat1Title}
                </span>
                <span className="text-stone-500 text-xs">{feat1Desc}</span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <Award
                  style={{ color: branding?.accentColor || "var(--primary)" }}
                  className="h-5 w-5"
                />
                <span className="font-bold text-xs uppercase tracking-wider text-stone-900">
                  {feat2Title}
                </span>
                <span className="text-stone-500 text-xs">{feat2Desc}</span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <HeartHandshake
                  style={{ color: branding?.accentColor || "var(--primary)" }}
                  className="h-5 w-5"
                />
                <span className="font-bold text-xs uppercase tracking-wider text-stone-900">
                  {feat3Title}
                </span>
                <span className="text-stone-500 text-xs">{feat3Desc}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link href={`/${tenantSlug}#collection`}>
                <Button variant="outline" className="uppercase font-bold px-6">
                  Explore Products →
                </Button>
              </Link>
              <Link href={`/${tenantSlug}/about`}>
                <Button
                  variant="ghost"
                  className="font-bold uppercase px-4 underline underline-offset-4"
                >
                  Read Full Story
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Showcase Card */}
          <div className="relative w-full aspect-4/5 rounded-2xl overflow-hidden bg-stone-900 flex flex-col justify-end p-8 text-white shadow-2xl border border-stone-800">
            {showcaseImage && (
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                style={{ backgroundImage: `url(${showcaseImage})` }}
              />
            )}
            <div
              style={{
                background: showcaseImage
                  ? "linear-gradient(to top, rgba(12, 10, 9, 0.92) 0%, rgba(12, 10, 9, 0.4) 60%, rgba(12, 10, 9, 0.2) 100%)"
                  : `radial-gradient(at top right, ${branding?.secondaryColor + "20" || "var(--primary)"} 0%, ${branding?.primaryColor + "20" || "var(--secondary)"} 50%)`,
              }}
              className="absolute inset-0"
            />

            <div className="relative z-10 space-y-4">
              <span
                style={{
                  backgroundColor:
                    `${branding?.accentColor}20` || "var(--secondary)",
                  borderColor: branding?.accentColor || "var(--secondary)",
                  color: branding?.accentColor || "var(--primary)",
                }}
                className="inline-block px-3 py-1 border rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-xs"
              >
                {cardBadge}
              </span>
              <h3 className="font-bold font-secondary drop-shadow">
                {cardTitle}
              </h3>
              <p className="text-stone-300 font-light drop-shadow">
                {cardDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
