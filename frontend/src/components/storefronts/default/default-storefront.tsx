import { TenantHero } from "@/components/pages/tenant/tenant-hero";
import { TenantAbout } from "@/components/pages/tenant/tenant-about";
import { TenantStats } from "@/components/pages/tenant/tenant-stats";
import { TenantCollection } from "@/components/pages/tenant/tenant-collection";
import { TenantCtaBooking } from "@/components/pages/tenant/tenant-cta-booking";
import { TenantTestimonials } from "@/components/pages/tenant/tenant-testimonials";
import { TenantBanner } from "@/components/pages/tenant/tenant-banner";
import type { BrandingConfig } from "@/types/users";

export interface DefaultStorefrontProps {
  tenantSlug: string;
  storeName: string;
  branding?: BrandingConfig;
}

export function DefaultStorefront({
  tenantSlug,
  storeName,
}: DefaultStorefrontProps) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900 selection:bg-stone-950 selection:text-white">
      {/* Store Hero */}
      <TenantHero storeName={storeName} tenantSlug={tenantSlug} />

      {/* About Store Section */}
      <section id="about">
        <TenantAbout storeName={storeName} tenantSlug={tenantSlug} />
      </section>

      {/* Stats Strip */}
      <TenantStats storeName={storeName} />

      {/* Signature / Featured Products Collection */}
      <section id="collection">
        <TenantCollection storeName={storeName} tenantSlug={tenantSlug} />
      </section>

      {/* Custom Booking / Inquiries CTA */}
      <section id="consultations">
        <TenantCtaBooking storeName={storeName} tenantSlug={tenantSlug} />
      </section>

      {/* Client Testimonials */}
      <section id="testimonials">
        <TenantTestimonials storeName={storeName} />
      </section>

      {/* Final Store CTA Banner */}
      <TenantBanner storeName={storeName} tenantSlug={tenantSlug} />
    </div>
  );
}

export default DefaultStorefront;
