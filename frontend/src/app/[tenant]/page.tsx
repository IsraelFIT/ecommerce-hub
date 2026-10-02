import { TenantHero } from "@/components/pages/tenant/tenant-hero";
import { TenantAbout } from "@/components/pages/tenant/tenant-about";
import { TenantStats } from "@/components/pages/tenant/tenant-stats";
import { TenantCollection } from "@/components/pages/tenant/tenant-collection";
import { TenantCtaBooking } from "@/components/pages/tenant/tenant-cta-booking";
import { TenantTestimonials } from "@/components/pages/tenant/tenant-testimonials";
import { TenantBanner } from "@/components/pages/tenant/tenant-banner";

import CoreDashboardLayout from "./(core)/layout";
import CoreDashboardPage from "./(core)/core/page";

interface TenantPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TenantStorefrontPage({
  params,
}: TenantPageProps) {
  const { tenant } = await params;

  if (tenant === "core") {
    return (
      <CoreDashboardLayout>
        <CoreDashboardPage />
      </CoreDashboardLayout>
    );
  }

  const storeName = tenant
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900 selection:bg-stone-950 selection:text-white">
      {/* Store Hero */}
      <TenantHero storeName={storeName} tenantSlug={tenant} />

      {/* About Store Section */}
      <section id="about">
        <TenantAbout storeName={storeName} tenantSlug={tenant} />
      </section>

      {/* Stats Strip */}
      <TenantStats storeName={storeName} />

      {/* Signature / Featured Products Collection */}
      <section id="collection">
        <TenantCollection storeName={storeName} tenantSlug={tenant} />
      </section>

      {/* Custom Booking / Inquiries CTA */}
      <section id="consultations">
        <TenantCtaBooking storeName={storeName} tenantSlug={tenant} />
      </section>

      {/* Client Testimonials */}
      <section id="testimonials">
        <TenantTestimonials storeName={storeName} />
      </section>

      {/* Final Store CTA Banner */}
      <TenantBanner storeName={storeName} tenantSlug={tenant} />
    </div>
  );
}
