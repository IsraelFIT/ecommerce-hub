import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DefaultAbout } from "@/components/storefronts/default/default-about";
import {
  BESPOKE_ABOUT_PAGES,
  hasBespokeAbout,
} from "@/components/storefronts/bespoke";
import { getTenantServerData, getTenantMeta } from "@/lib/api/server-tenant";

interface TenantAboutPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export async function generateMetadata({
  params,
}: TenantAboutPageProps): Promise<Metadata> {
  const { tenant } = await params;
  if (tenant === "core") {
    return {
      title: "Core Administration Console",
      description: "Platform oversight, merchants, and governance console.",
    };
  }

  const { storeName, storeDescription } = await getTenantMeta(tenant);

  return {
    title: `About Us | ${storeName}`,
    description: `Learn more about ${storeName}. ${storeDescription || "Discover our heritage, mission, and dedication to authentic quality."}`,
  };
}

export default async function TenantAboutPage({
  params,
}: TenantAboutPageProps) {
  const { tenant } = await params;

  if (tenant === "core") {
    redirect("/core");
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

  // 2. If tenant opted for bespoke custom storefront & custom about component exists in registry:
  if (branding?.landingPageType === "custom" && hasBespokeAbout(tenant)) {
    const BespokeComponent = BESPOKE_ABOUT_PAGES[tenant.toLowerCase()];
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

  // 3. Fallback to standard high-converting multi-tenant about page
  return (
    <DefaultAbout
      tenantSlug={tenant}
      storeName={storeName}
      branding={branding}
    />
  );
}

