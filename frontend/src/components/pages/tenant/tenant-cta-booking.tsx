"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare } from "lucide-react";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";

interface TenantCtaBookingProps {
  storeName: string;
  tenantSlug: string;
}

export function TenantCtaBooking({
  storeName,
  tenantSlug,
}: TenantCtaBookingProps) {
  const { branding } = useTenantTheme();
  const primaryColor = branding?.primaryColor || "#059669";
  const secondaryColor = branding?.secondaryColor || branding?.accentColor;

  return (
    <section
      id="consultations"
      className="relative py-24 md:py-32 flex items-center justify-center overflow-hidden bg-stone-950 text-white"
    >
      {/* Background Ambient Decor */}
      <div className="absolute inset-0 bg-radial-[at_center] from-stone-800 via-stone-900 to-stone-950" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-125 rounded-full blur-3xl pointer-events-none opacity-20 transition-colors duration-500"
        style={{ backgroundColor: primaryColor }}
      />
      {secondaryColor && (
        <div
          className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-15 transition-colors duration-500"
          style={{ backgroundColor: secondaryColor }}
        />
      )}

      {/* Styled Central Card with Polygon Cut */}
      <div
        className="relative z-10 bg-white mx-4 md:mx-12 lg:mx-24 px-8 md:px-20 pt-16 pb-28 text-center max-w-4xl w-full text-stone-950 shadow-2xl rounded-3xl"
        style={{
          clipPath: "polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)",
        }}
      >
        <div
          style={{ color: primaryColor }}
          className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.25em] uppercase mb-2"
        >
          <span>Custom Orders & Inquiries</span>
        </div>

        <h3 className="font-semibold uppercase mb-4 text-stone-950">
          Request Bespoke Customizations
        </h3>

        <p className="mb-10 max-w-xl mx-auto text-stone-600 font-light text-sm md:text-base leading-relaxed">
          Need custom volume orders, personalized modifications, or tailored
          corporate bundles from {storeName}? Connect directly with our team for
          personalized quotes and expedited fulfilment.
        </p>

        <Link href={`/${tenantSlug}#contact`}>
          <Button
            className="text-white font-bold tracking-wider transition-all uppercase h-12 px-8 cursor-pointer shadow-lg gap-2 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Send Direct Inquiry</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

export default TenantCtaBooking;
