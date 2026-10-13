import { StoreHeader } from "@/components/layouts/store-header";
import { StoreFooter } from "@/components/layouts/store-footer";
import { TenantThemeProvider } from "@/components/providers/tenant-theme-provider";
import { getTenantServerData } from "@/lib/api/server-tenant";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;

  // Core management console handles its own dedicated layout
  if (tenant === "core") {
    return <>{children}</>;
  }

  const tenantData = await getTenantServerData(tenant);

  return (
    <TenantThemeProvider
      tenantSlug={tenant}
      initialBranding={tenantData?.branding_config}
      initialTenant={tenantData}
    >
      <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <StoreHeader />
        <div className="flex-1 flex flex-col">{children}</div>
        <StoreFooter />
      </div>
    </TenantThemeProvider>
  );
}
