"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sun,
  Moon,
  Settings,
  ChevronLeft,
  X,
  LogOut,
  Store,
  ExternalLink,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useUserStore from "@/store/user";
import useSidebarStore, { STORE_NAV_ITEMS } from "@/store/sidebar";
import { deleteAuthCookies } from "@/lib/session";
import { clearAuthSession } from "@/lib/auth";
import { getTenantSubdomainUrl, getTenantRoute } from "@/utils/helper";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function StoreSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useUserStore();
  const { isExpanded, isMobileOpen, toggleExpand, setMobileOpen } =
    useSidebarStore();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  const tenantSlug = (params?.tenant as string) || "store";

  const formattedStoreName =
    user?.tenant_name ||
    tenantSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const subdomainUrl = getTenantSubdomainUrl(tenantSlug);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (typeof window !== "undefined") {
      const isDarkMode =
        document.documentElement.classList.contains("dark") ||
        localStorage.getItem("theme") === "dark";
      setIsDark(isDarkMode);
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (typeof window !== "undefined") {
      if (nextDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleLogout = async () => {
    try {
      deleteAuthCookies();
      clearAuthSession();
      clearUser();
      toast.success("Signed out of Store Admin");
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const displayName = user
    ? user.full_name ||
      user.name ||
      `${user.first_name || "Store"} ${user.last_name || "Admin"}`
    : "Store Admin";
  const displayEmail = user?.email || `admin@${tenantSlug}.com`;
  const displayInitials =
    (user?.first_name?.[0] || "") + (user?.last_name?.[0] || "") ||
    formattedStoreName.slice(0, 2).toUpperCase() ||
    "SA";

  const renderSidebar = (isMobile = false) => {
    const expanded = isMobile || isExpanded;

    return (
      <div
        className={cn(
          "h-full flex flex-col justify-between py-3 select-none overflow-hidden transition-all duration-300 ease-in-out",
          expanded ? "px-3" : "px-1.5",
        )}
      >
        {/* Top Brand / Logo */}
        <div className="flex items-center justify-between px-0.5 shrink-0 h-10 overflow-hidden">
          <Link
            href={getTenantRoute(tenantSlug, "/admin")}
            className="flex items-center group overflow-hidden"
            title={`${formattedStoreName} Admin`}
          >
            {/* Logo Badge */}
            <div className="size-8.5 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0 font-secondary font-black text-sm tracking-tighter">
              <Store className="size-4.5 stroke-[2.2]" />
            </div>

            <div
              className={cn(
                "flex flex-col overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                expanded
                  ? "max-w-35 opacity-100 translate-x-0 ml-2.5"
                  : "max-w-0 opacity-0 -translate-x-3 ml-0 pointer-events-none",
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-secondary font-bold text-foreground leading-tight text-[13px] truncate">
                  {formattedStoreName}
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop expand/collapse toggle */}
          {!isMobile && (
            <button
              type="button"
              onClick={toggleExpand}
              className={cn(
                "hidden md:flex size-7 rounded-sm items-center justify-center text-foreground hover:text-primary hover:bg-muted/80 transition-all duration-300 ease-in-out cursor-pointer shrink-0",
                expanded
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-75 pointer-events-none w-0 max-w-0 overflow-hidden",
              )}
              title={expanded ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <ChevronLeft className="size-4" />
            </button>
          )}

          {/* Mobile close button */}
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="size-7 rounded-sm flex items-center justify-center text-foreground hover:text-primary hover:bg-muted/80 shrink-0 cursor-pointer"
              title="Close Sidebar"
            >
              <X className="size-4.5" />
            </button>
          )}
        </div>

        {/* Navigation items (Scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar my-1.5 py-1 w-full">
          <TooltipProvider delayDuration={100}>
            <nav className="flex flex-col gap-1 w-full">
              {STORE_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const itemHref = getTenantRoute(tenantSlug, item.hrefSegment);
                const isActive =
                  item.hrefSegment === "/admin"
                    ? pathname === `/${tenantSlug}/admin` ||
                      pathname === `/${tenantSlug}` ||
                      pathname === "/admin" ||
                      pathname === "/"
                    : pathname === itemHref ||
                      pathname.startsWith(`${itemHref}/`) ||
                      pathname === `/${tenantSlug}${item.hrefSegment}` ||
                      pathname.startsWith(
                        `/${tenantSlug}${item.hrefSegment}/`,
                      ) ||
                      pathname === item.hrefSegment ||
                      pathname.startsWith(`${item.hrefSegment}/`);

                const linkElement = (
                  <Link
                    key={item.id}
                    href={itemHref}
                    className={cn(
                      "relative group flex items-center rounded-sm transition-colors duration-200 overflow-hidden border border-transparent",
                      expanded
                        ? "px-2.5 py-2 w-full justify-start"
                        : "size-8.5 mx-auto justify-center px-0",
                      isActive
                        ? "bg-primary/10 text-primary border-primary/30 font-medium dark:bg-primary/20"
                        : "text-foreground hover:text-primary hover:bg-muted/80",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-200",
                        isActive ? "stroke-[2.2] text-primary" : "stroke-[1.8]",
                      )}
                    />

                    <span
                      className={cn(
                        "text-xs font-medium tracking-wide truncate whitespace-nowrap transition-all duration-300 ease-in-out",
                        expanded
                          ? "max-w-35 opacity-100 translate-x-0 ml-2.5"
                          : "max-w-0 opacity-0 -translate-x-2 ml-0 pointer-events-none",
                      )}
                    >
                      {item.shortLabel}
                    </span>
                  </Link>
                );

                if (!expanded) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={12}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return linkElement;
              })}

              {/* Live Storefront External Link */}
              {!expanded ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={subdomainUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="size-8.5 mx-auto justify-center px-0 rounded-sm flex items-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors duration-200 overflow-hidden border border-transparent mt-1"
                    >
                      <Globe className="size-4 stroke-[1.8] shrink-0" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12}>
                    Live Storefront
                  </TooltipContent>
                </Tooltip>
              ) : (
                <a
                  href={subdomainUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-2 w-full justify-between rounded-sm flex items-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors duration-200 overflow-hidden border border-transparent mt-1 group"
                >
                  <div className="flex items-center">
                    <Globe className="size-4 stroke-[1.8] shrink-0 text-muted-foreground group-hover:text-primary" />
                    <span className="text-xs font-medium whitespace-nowrap transition-all duration-300 ease-in-out max-w-35 opacity-100 translate-x-0 ml-2.5">
                      Live Storefront
                    </span>
                  </div>
                  <ExternalLink className="size-3 stroke-[1.8] opacity-60 group-hover:opacity-100" />
                </a>
              )}
            </nav>
          </TooltipProvider>
        </div>

        {/* Bottom controls */}
        <div className="flex flex-col gap-1 w-full pt-2 border-t border-border shrink-0 mt-auto">
          <TooltipProvider delayDuration={100}>
            {/* Theme Toggle */}
            {!expanded ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="size-8.5 mx-auto justify-center px-0 rounded-sm flex items-center text-foreground hover:text-primary hover:bg-muted/80 transition-colors duration-200 cursor-pointer overflow-hidden border border-transparent"
                  >
                    {mounted && isDark ? (
                      <Sun className="size-4 stroke-[1.8] text-amber-400 shrink-0" />
                    ) : (
                      <Moon className="size-4 stroke-[1.8] text-primary shrink-0" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  {mounted && isDark ? "Light Mode" : "Dark Mode"}
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={toggleTheme}
                className="px-2.5 py-2 w-full justify-start rounded-sm flex items-center text-foreground hover:text-primary hover:bg-muted/80 transition-colors duration-200 cursor-pointer overflow-hidden border border-transparent"
              >
                {mounted && isDark ? (
                  <Sun className="size-4 stroke-[1.8] text-amber-400 shrink-0" />
                ) : (
                  <Moon className="size-4 stroke-[1.8] text-primary shrink-0" />
                )}
                <span className="text-xs font-medium whitespace-nowrap transition-all duration-300 ease-in-out max-w-35 opacity-100 translate-x-0 ml-2.5">
                  {mounted && isDark ? "Light Mode" : "Dark Mode"}
                </span>
              </button>
            )}

            {/* Store Settings */}
            {!expanded ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={getTenantRoute(tenantSlug, "/settings")}
                    className={cn(
                      "size-8.5 mx-auto justify-center px-0 rounded-sm flex items-center text-foreground hover:text-primary hover:bg-muted/80 transition-colors duration-200 overflow-hidden border border-transparent",
                      pathname.includes("/settings") &&
                        "bg-primary/10 text-primary border-primary/30 font-medium",
                    )}
                  >
                    <Settings className="size-4 stroke-[1.8] shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  Store Settings
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href={getTenantRoute(tenantSlug, "/settings")}
                className={cn(
                  "px-2.5 py-2 w-full justify-start rounded-sm flex items-center text-foreground hover:text-primary hover:bg-muted/80 transition-colors duration-200 overflow-hidden border border-transparent",
                  pathname.includes("/settings") &&
                    "bg-primary/10 text-primary border-primary/30 font-medium",
                )}
              >
                <Settings className="size-4 stroke-[1.8] shrink-0" />
                <span className="text-xs font-medium whitespace-nowrap transition-all duration-300 ease-in-out max-w-35 opacity-100 translate-x-0 ml-2.5">
                  Store Settings
                </span>
              </Link>
            )}
          </TooltipProvider>

          {/* Store Admin Avatar & Popover */}
          {!expanded ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="size-8.5 mx-auto flex items-center justify-center p-0.5 rounded-sm hover:bg-muted/80 transition-all cursor-pointer group"
                  title={`${displayName} (Store Admin)`}
                >
                  <div className="size-7 rounded-full bg-primary/20 border border-primary/40 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {displayInitials}
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="right"
                align="end"
                sideOffset={14}
                className="w-68 p-3.5 bg-card border border-border shadow-2xl rounded-xl z-50 text-foreground animate-in fade-in-0 zoom-in-95"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-border">
                    <div className="size-9 rounded-full bg-primary/20 border border-primary/40 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                      {displayInitials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {displayName}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {displayEmail}
                      </span>
                      <span className="text-[10px] text-primary font-semibold mt-0.5">
                        {formattedStoreName} Administrator
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Link
                      href={getTenantRoute(tenantSlug, "/settings")}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-sm text-xs text-foreground hover:bg-muted/80 hover:text-primary transition-colors"
                    >
                      <Settings className="size-3.5" />
                      <span>Store Settings</span>
                    </Link>

                    <a
                      href={subdomainUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-2.5 py-2 rounded-sm text-xs text-foreground hover:bg-muted/80 hover:text-primary transition-colors"
                    >
                      <Globe className="size-3.5" />
                      <span>View Live Storefront</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-sm text-xs text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors w-full cursor-pointer text-left"
                    >
                      <LogOut className="size-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className="flex items-center justify-between gap-1.5 w-full pt-1">
              <Link
                href={getTenantRoute(tenantSlug, "/settings")}
                className="relative rounded-sm flex items-center hover:bg-muted/80 transition-all duration-300 ease-in-out overflow-hidden px-2 py-1.5 flex-1 min-w-0"
                title={`${displayName} (Store Admin)`}
              >
                <div className="size-7 rounded-full bg-primary/20 border border-primary/40 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                  {displayInitials}
                </div>
                <div className="flex flex-col min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out max-w-32.5 opacity-100 translate-x-0 ml-2.5">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-primary font-semibold truncate">
                    Store Admin
                  </span>
                </div>
              </Link>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="size-7 rounded-sm flex items-center justify-center text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 ease-in-out cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut className="size-4 stroke-[1.8]" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col shrink-0 h-full transition-all duration-300 ease-in-out z-30",
          isExpanded ? "w-60" : "w-14",
        )}
      >
        {renderSidebar(false)}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 w-64 bg-card border-r border-border z-50 md:hidden transition-transform duration-300 ease-in-out shadow-2xl",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {renderSidebar(true)}
      </div>
    </>
  );
}

export default StoreSidebar;
