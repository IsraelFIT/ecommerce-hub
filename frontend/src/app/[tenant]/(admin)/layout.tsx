import type { ReactNode } from "react";
import { StoreSidebar } from "@/components/layouts/store-sidebar";
import { StoreNavbar } from "@/components/layouts/store-navbar";
import { StoreBreadcrumb } from "@/components/layouts/store-breadcrumb";
import { SessionSyncWrapper } from "@/components/core-layout/session-sync";
import { TenantThemeProvider } from "@/components/providers/tenant-theme-provider";
import { getTenantServerData } from "@/lib/api/server-tenant";

export default async function TenantAdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params?: Promise<{ tenant: string }>;
}) {
  const unwrappedParams = params ? await params : { tenant: "store" };
  const tenantSlug = unwrappedParams.tenant || "store";
  const tenantData = await getTenantServerData(tenantSlug);

  return (
    <TenantThemeProvider
      tenantSlug={tenantSlug}
      initialBranding={tenantData?.branding_config}
      initialTenant={tenantData}
    >
      <div className="h-screen w-screen overflow-hidden bg-background flex p-1.5 md:p-2.5 gap-1.5 md:gap-2.5 antialiased font-primary text-foreground select-none">
        <SessionSyncWrapper>
          {/* Left Floating Sidebar */}
          <StoreSidebar />

          <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
            {/* Top Bar Header */}
            <StoreNavbar />

            {/* Collapsible Sub-route Breadcrumb */}
            <StoreBreadcrumb />

            {/* Main Nested Card Canvas with Custom Scrollbar */}
            <div className="flex-1 flex flex-col h-full bg-card border border-border rounded-[20px] overflow-hidden relative z-10 min-w-0 shadow-xs">
              <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-3 md:p-5">
                <div className="w-full">{children}</div>
              </main>
            </div>
          </div>
        </SessionSyncWrapper>
      </div>
    </TenantThemeProvider>
  );
}
