"use client";

import { usePathname } from "next/navigation";
import { Menu, PanelLeft, Search, Bell, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import useCoreSidebarStore, { getCorePageInfo } from "@/store/core-sidebar";

export function CoreHeader() {
  const pathname = usePathname();
  const { toggleMobile, toggleExpand, isExpanded } = useCoreSidebarStore();
  const pageInfo = getCorePageInfo(pathname);

  return (
    <header className="h-14 px-2 flex items-center justify-between gap-3 md:gap-4 select-none shrink-0 bg-transparent animate-fadeInDown">
      {/* Left Section: Mobile Menu + Desktop Toggle + Dynamic Title */}
      <div className="flex items-center gap-2.5 md:gap-3 min-w-0 transition-all duration-300 ease-in-out">
        {/* Mobile Sidebar Toggle */}
        <button
          type="button"
          onClick={toggleMobile}
          className="md:hidden size-8 rounded-sm flex items-center justify-center bg-card dark:bg-white/5 text-foreground hover:text-primary hover:bg-muted/80 transition-all duration-200 cursor-pointer shrink-0"
          title="Open Menu"
        >
          <Menu className="size-4.5" />
        </button>

        {/* Desktop Sidebar Toggle (Smooth width/opacity/scale transition on expand/minimize) */}
        <button
          type="button"
          onClick={toggleExpand}
          className={cn(
            "hidden md:flex size-8 rounded-sm items-center justify-center bg-card dark:bg-white/5 text-foreground hover:text-primary hover:bg-muted/80 cursor-pointer shrink-0 transition-all duration-300 ease-in-out",
            !isExpanded
              ? "opacity-100 scale-100 w-8 pointer-events-auto mr-0"
              : "opacity-0 scale-75 w-0 pointer-events-none -mr-2.5 overflow-hidden p-0 border-0",
          )}
          title="Expand Sidebar"
        >
          <PanelLeft className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
        </button>

        {/* Dynamic Page Title & Subtitle */}
        <div
          key={pathname}
          className="flex flex-col min-w-0 justify-center animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <h4 className="font-secondary font-bold text-sm md:text-[15px] leading-tight text-foreground truncate transition-colors duration-200">
              {pageInfo.title}
            </h4>
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              2.5% fee
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground hidden md:block truncate leading-tight transition-colors duration-200">
            {pageInfo.subtitle}
          </span>
        </div>
      </div>

      {/* Right Section: Search + Status + Notifications */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0 transition-all duration-300 ease-in-out">
        {/* Quick Search */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-2.5 rounded-md bg-card border border-border w-44 md:w-80 focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200 h-9">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stores, tenants, fees, logs..."
            className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground w-full font-primary"
          />
          <kbd className="text-[10px] font-mono bg-background px-1.5 py-0.5 rounded text-foreground border border-border shadow-xs">
            ⌘K
          </kbd>
        </div>

        {/* Live Neon Branch indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-card border border-border text-xs text-foreground">
          <Database className="size-3.5 text-primary" />
          <span className="text-[11px] font-mono text-muted-foreground">
            neon:
          </span>
          <span className="text-[11px] font-semibold text-primary">
            staging
          </span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative size-8 rounded-sm bg-card dark:bg-white/5 flex items-center justify-center text-foreground hover:text-primary hover:bg-muted/80 transition-all duration-200 cursor-pointer shrink-0 hover:scale-105 active:scale-95"
          title="Platform Alerts"
        >
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary ring-2 ring-background animate-pulse" />
        </button>
      </div>
    </header>
  );
}

export default CoreHeader;
