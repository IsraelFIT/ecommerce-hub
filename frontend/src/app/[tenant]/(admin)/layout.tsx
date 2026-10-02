import { StoreSidebar } from "@/components/layouts/store-sidebar";
import { StoreNavbar } from "@/components/layouts/store-navbar";

export default function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-card text-foreground">
      <StoreSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <StoreNavbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
