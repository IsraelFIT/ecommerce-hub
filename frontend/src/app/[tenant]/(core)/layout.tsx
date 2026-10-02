import type { ReactNode } from "react";
import { CoreSidebar } from "@/components/core-layout/core-sidebar";
import { CoreHeader } from "@/components/core-layout/core-header";
import { CoreBreadcrumb } from "@/components/core-layout/core-breadcrumb";
import { SessionSyncWrapper } from "@/components/core-layout/session-sync";

export default function CoreDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex p-1.5 md:p-2.5 gap-1.5 md:gap-2.5 antialiased font-primary text-foreground select-none">
      <SessionSyncWrapper>
        {/* Left Floating Sidebar */}
        <CoreSidebar />

        <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
          {/* Top Bar Header */}
          <CoreHeader />

          {/* Collapsible Sub-route Breadcrumb */}
          <CoreBreadcrumb />

          {/* Main Nested Card Canvas with Custom Scrollbar */}
          <div className="flex-1 flex flex-col h-full bg-card border border-border rounded-[20px] overflow-hidden relative z-10 min-w-0 shadow-xs">
            <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-3 md:p-5">
              <div className="mx-auto w-full max-w-[1600px]">{children}</div>
            </main>
          </div>
        </div>
      </SessionSyncWrapper>
    </div>
  );
}
