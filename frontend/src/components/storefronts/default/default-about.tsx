"use client";

import Link from "next/link";
import { ShieldCheck, Award, HeartHandshake } from "lucide-react";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import type { BrandingConfig } from "@/types/users";
import { TenantBanner } from "@/components/pages/tenant/tenant-banner";

export interface DefaultAboutProps {
  tenantSlug: string;
  storeName: string;
  branding?: BrandingConfig;
}

export function DefaultAbout({
  tenantSlug,
  storeName,
  branding: initialBranding,
}: DefaultAboutProps) {
  const { branding: themeBranding } = useTenantTheme();
  const branding = initialBranding || themeBranding;

  const primaryColor = branding?.primaryColor || "#059669";
  const secondaryColor =
    branding?.secondaryColor || branding?.accentColor || "#ec4899";

  const heroBg = branding?.aboutBackgroundUrl || branding?.heroBackgroundUrl;
  const showcaseImage = branding?.aboutImageUrl;

  const aboutBadge = branding?.aboutBadge || "Our Story & Standards";
  const aboutTitle =
    branding?.aboutTitle ||
    `Devotion to Craftsmanship & Quality at ${storeName}`;
  const aboutDescription =
    branding?.aboutDescription ||
    `At ${storeName}, we believe exceptional products begin with intentional curation — uncompromising standards, premium raw materials, and genuine passion. Every single item in our collection is carefully crafted and rigorously inspected to ensure it exceeds your expectations.`;
  const aboutSecondaryDescription =
    branding?.aboutSecondaryDescription ||
    "Whether you are discovering something new or ordering a signature favorite, our store offers secure checkout, direct tracking, and dedicated client assistance every step of the way.";
  const aboutMission =
    branding?.aboutMission ||
    "To bring authentic excellence, artisanal beauty, and seamless digital commerce together in an experience built for discerning clients.";

  const feat1Title = branding?.aboutFeature1Title || "Authentic Quality";
  const feat1Desc =
    branding?.aboutFeature1Desc ||
    "Every piece is handcrafted from verified, premium materials.";
  const feat2Title = branding?.aboutFeature2Title || "Guaranteed Standards";
  const feat2Desc =
    branding?.aboutFeature2Desc ||
    "Rigorous quality checks ensure longevity and perfection.";
  const feat3Title = branding?.aboutFeature3Title || "Bespoke Care";
  const feat3Desc =
    branding?.aboutFeature3Desc ||
    "Tailored service and dedicated fulfillment for every client.";

  const cardBadge = branding?.aboutCardBadge || "Crafted With Precision";
  const cardTitle =
    branding?.aboutCardTitle || "Designed For Discerning Clients";
  const cardDescription =
    branding?.aboutCardDescription ||
    `Enjoy seamless multi-currency checkout, tracked global fulfilment, and instant payment settlement on ${storeName}.`;

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900 selection:bg-stone-950 selection:text-white">
      {/* Hero Header */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-stone-950 text-white">
        {heroBg && (
          <div
            className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
        )}
        <div
          className={`absolute inset-0 z-0 ${heroBg ? "bg-stone-950/85 backdrop-blur-xs" : "bg-radial-[at_top_right] from-stone-800 via-stone-900 to-stone-950"}`}
        />
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-120 h-120 rounded-full blur-3xl pointer-events-none opacity-20 transition-colors duration-500"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="container relative z-10 flex-col gap-0 items-center">
          {/* Breadcrumb */}
          <nav className="inline-flex items-center gap-2 mb-2">
            <Link
              href={`/${tenantSlug}`}
              className="text-stone-200 hover:text-white transition-colors"
            >
              <p>Home</p>
            </Link>
            <span>/</span>
            <p className="text-stone-200 font-medium">About Us</p>
          </nav>

          <div
            style={{ color: secondaryColor }}
            className="inline-flex items-center gap-2 font-bold tracking-[0.25em] uppercase mb-2"
          >
            <p>{aboutBadge}</p>
          </div>

          <h2 className="font-bold font-secondary uppercase tracking-wide text-stone-100 text-center max-w-4xl">
            {aboutTitle}
          </h2>

          <p className="text-stone-300 text-center max-w-2xl">
            {aboutDescription}
          </p>
        </div>
      </section>

      {/* Main Story & Values Section */}
      <section className="py-10 container flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Mission & Narrative */}
          <div className="lg:col-span-7 space-y-4">
            <div
              style={{ color: primaryColor }}
              className="text-xs font-bold uppercase tracking-widest"
            >
              Our Philosophy & Heritage
            </div>

            <h3 className="text-2xl md:text-4xl font-bold text-stone-950 font-secondary">
              Rooted in Passion, Defined by Excellence
            </h3>

            <p className="text-stone-600 whitespace-pre-line">
              {aboutDescription}
            </p>

            <p className="text-stone-600 whitespace-pre-line">
              {aboutSecondaryDescription}
            </p>

            {/* Mission Callout Card */}
            <div className="p-3 rounded-xl border border-primary bg-stone-100/80">
              <h6 className="font-bold uppercase tracking-wider text-stone-900 mb-1">
                Our Mission
              </h6>
              <p className="text-stone-700 font-light">
                &ldquo;{aboutMission}&rdquo;
              </p>
            </div>
          </div>

          {/* Right Column: Visual Showcase Card */}
          <div className="lg:col-span-5 relative w-full aspect-4/5 rounded-2xl overflow-hidden bg-stone-900 flex flex-col justify-end p-8 text-white shadow-xl border border-stone-800">
            {showcaseImage && (
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                style={{ backgroundImage: `url(${showcaseImage})` }}
              />
            )}
            <div
              style={{
                background: showcaseImage
                  ? "linear-gradient(to top, rgba(12, 10, 9, 0.94) 0%, rgba(12, 10, 9, 0.5) 60%, rgba(12, 10, 9, 0.2) 100%)"
                  : `radial-gradient(at top right, ${secondaryColor + "30"} 0%, ${primaryColor + "30"} 60%, #0c0a09 100%)`,
              }}
              className="absolute inset-0"
            />
            <div className="relative z-10 space-y-1">
              <span
                style={{
                  backgroundColor: `${primaryColor}30`,
                  borderColor: primaryColor,
                  color: "#ffffff",
                }}
                className="inline-block px-2 py-0.5 border rounded-full text-[11px] font-semibold uppercase tracking-wider backdrop-blur-xs"
              >
                {cardBadge}
              </span>
              <h4 className="font-bold font-secondary drop-shadow">
                {cardTitle}
              </h4>
              <p className="text-stone-300 font-light drop-shadow">
                {cardDescription}
              </p>
            </div>
          </div>
        </div>

        {/* 3 Core Pillars */}
        <div className="w-full mt-20 py-16 border-t border-stone-200">
          <div className="text-center mb-10">
            <span
              style={{ color: primaryColor }}
              className="text-xs font-bold uppercase tracking-widest"
            >
              Why Choose {storeName}
            </span>
            <h3 className="font-bold text-stone-950 font-secondary mt-2">
              Uncompromising Standards in Every Detail
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col items-start gap-3 hover:shadow-md transition-shadow">
              <div
                className="p-3 rounded-xl"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                }}
              >
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-stone-900">{feat1Title}</h4>
              <p className="text-stone-600">{feat1Desc}</p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col items-start gap-3 hover:shadow-md transition-shadow">
              <div
                className="p-3 rounded-xl"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                }}
              >
                <Award className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-stone-900">{feat2Title}</h4>
              <p className="text-stone-600">{feat2Desc}</p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col items-start gap-3 hover:shadow-md transition-shadow">
              <div
                className="p-3 rounded-xl"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                }}
              >
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-stone-900">{feat3Title}</h4>
              <p className="text-stone-600">{feat3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Store CTA Banner */}
      <TenantBanner storeName={storeName} tenantSlug={tenantSlug} />
    </div>
  );
}

export default DefaultAbout;
