import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare } from "lucide-react";

interface TenantCtaBookingProps {
  storeName: string;
  tenantSlug: string;
}

export function TenantCtaBooking({
  storeName,
  tenantSlug,
}: TenantCtaBookingProps) {
  return (
    <section
      id="consultations"
      className="relative py-24 md:py-32 flex items-center justify-center overflow-hidden bg-stone-950 text-white"
    >
      {/* Background Ambient Decor */}
      <div className="absolute inset-0 bg-radial-[at_center] from-stone-800 via-stone-900 to-stone-950" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-125 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Styled Central Card with Polygon Cut */}
      <div
        className="relative z-10 bg-white mx-4 md:mx-12 lg:mx-24 px-8 md:px-20 pt-16 pb-28 text-center max-w-4xl w-full text-stone-950 shadow-2xl rounded-3xl"
        style={{
          clipPath: "polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)",
        }}
      >
        <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.25em] uppercase text-emerald-700 mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Custom Orders & Inquiries</span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold uppercase leading-[0.95] mb-4 text-stone-950">
          Request Bespoke Customizations
        </h1>

        <p className="mb-10 max-w-xl mx-auto text-stone-600 font-light text-sm md:text-base leading-relaxed">
          Need custom volume orders, personalized modifications, or tailored
          corporate bundles from {storeName}? Connect directly with our team for
          personalized quotes and expedited fulfilment.
        </p>

        <Link href={`/${tenantSlug}#contact`}>
          <Button className="bg-stone-900 text-white font-bold tracking-wider hover:bg-emerald-700 transition-colors uppercase h-12 px-8 rounded-xl cursor-pointer shadow-lg gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Send Direct Inquiry →</span>
          </Button>
        </Link>
      </div>
    </section>
  );
}
