import CoreDashboardLayout from "./(core)/layout";
import CoreDashboardPage from "./(core)/core/page";
import { DefaultStorefront } from "@/components/storefronts/default/default-storefront";
import {
  BESPOKE_STOREFRONTS,
  hasBespokeStorefront,
} from "@/components/storefronts/bespoke";
import { getTenantServerData } from "@/lib/api/server-tenant";

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

  // 1. Fetch server-side tenant configuration
  const tenantData = await getTenantServerData(tenant);
  const branding = tenantData?.branding_config;
  const storeName =
    tenantData?.name ||
    tenant
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // 2. If tenant opted for bespoke custom storefront & custom component exists in registry:
  if (branding?.landingPageType === "custom" && hasBespokeStorefront(tenant)) {
    const BespokeComponent = BESPOKE_STOREFRONTS[tenant.toLowerCase()];
    if (BespokeComponent) {
      return (
        <BespokeComponent
          tenantSlug={tenant}
          storeName={storeName}
          branding={branding}
        />
      );
    }
  }

  // 3. Fallback to standard high-converting multi-tenant storefront
  return (
    <DefaultStorefront
      tenantSlug={tenant}
      storeName={storeName}
      branding={branding}
    />
  );
}
