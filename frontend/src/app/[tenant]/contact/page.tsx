import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DefaultContact } from "@/components/storefronts/default/default-contact";
import {
  BESPOKE_CONTACT_PAGES,
  hasBespokeContact,
} from "@/components/storefronts/bespoke";
import { getTenantServerData, getTenantMeta } from "@/lib/api/server-tenant";

interface TenantContactPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export async function generateMetadata({
  params,
}: TenantContactPageProps): Promise<Metadata> {
  const { tenant } = await params;
  if (tenant === "core") {
    return {
      title: "Core Administration Console",
      description: "Platform oversight, merchants, and governance console.",
    };
  }

  const { storeName, storeDescription } = await getTenantMeta(tenant);

  return {
    title: `Contact Us | ${storeName}`,
    description: `Contact ${storeName}. ${storeDescription || "Get in touch for custom inquiries, orders, and support."}`,
  };
}

export default async function TenantContactPage({
  params,
}: TenantContactPageProps) {
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

  // 2. If tenant opted for bespoke custom storefront & custom contact component exists in registry:
  if (branding?.landingPageType === "custom" && hasBespokeContact(tenant)) {
    const BespokeComponent = BESPOKE_CONTACT_PAGES[tenant.toLowerCase()];
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

  // 3. Fallback to standard high-converting multi-tenant contact page
  return (
    <DefaultContact
      tenantSlug={tenant}
      storeName={storeName}
      branding={branding}
    />
  );
}
