"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Store,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Sparkles,
  Database,
  Settings,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/store/sidebar";
import { useUserStore } from "@/store/user";
import { clearAuthSession } from "@/lib/auth";
import { getTenantSubdomainUrl } from "@/utils/helper";
import { cn } from "@/lib/utils";

export function StoreSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const tenantSlug = (params?.tenant as string) || "store";

  const { isCollapsed, toggleCollapsed, isOpen, setOpen } = useSidebarStore();
  const { user, clearUser } = useUserStore();

  const formattedStoreName =
    user?.tenant_name ||
    tenantSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const subdomainUrl = getTenantSubdomainUrl(tenantSlug);

  const handleLogout = () => {
    clearAuthSession();
    clearUser();
    router.push("/login");
  };

  const navItems = [
    {
      title: "Overview",
      path: `/${tenantSlug}/admin`,
      icon: LayoutDashboard,
      isActive: pathname === `/${tenantSlug}/admin`,
    },
    {
      title: "Products & Catalog",
      path: `/${tenantSlug}/products`,
      icon: Package,
      isActive: pathname.startsWith(`/${tenantSlug}/products`),
    },
    {
      title: "Orders & Payouts",
      path: `/${tenantSlug}/orders`,
      icon: ShoppingBag,
      isActive: pathname.startsWith(`/${tenantSlug}/orders`),
    },
    {
      title: "Storefront & Domain",
      path: `/${tenantSlug}/branding`,
      icon: Sparkles,
      isActive: pathname.startsWith(`/${tenantSlug}/branding`),
    },
    {
      title: "DB / CMS Adapters",
      path: `/${tenantSlug}/adapters`,
      icon: Database,
      isActive: pathname.startsWith(`/${tenantSlug}/adapters`),
    },
    {
      title: "Settings",
      path: `/${tenantSlug}/settings`,
      icon: Settings,
      isActive: pathname.startsWith(`/${tenantSlug}/settings`),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex h-screen flex-col border-r border-stone-200/80 bg-white text-stone-900 transition-all duration-300 ease-in-out md:h-screen md:sticky md:top-0 shrink-0",
          isCollapsed ? "w-20" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Top Store Identity */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-stone-100 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs font-bold">
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h5 className="block font-bold truncate text-stone-900 text-sm">
                  {formattedStoreName}
                </h5>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Store className="h-5 w-5" />
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="hidden md:flex ml-auto h-8 w-8 text-stone-400 hover:text-stone-700"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Live Storefront Quick Link */}
        {!isCollapsed && (
          <div className="p-3 shrink-0">
            <a
              href={subdomainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200/70 text-xs font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-2 truncate">
                <Globe className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                <span className="truncate">Live Storefront</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
            </a>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                  item.isActive
                    ? "bg-emerald-600 text-white shadow-sm font-bold"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                  isCollapsed && "justify-center px-2",
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Profile & Logout */}
        <div className="border-t border-stone-100 p-3 space-y-2 shrink-0">
          {!isCollapsed && (
            <div className="px-2 py-1.5 rounded-xl bg-stone-50 border border-stone-200/60">
              <div className="flex items-center justify-between gap-1 mb-1">
                <p className="text-xs font-bold text-stone-900 truncate">
                  {user?.name || user?.full_name || "Store Admin"}
                </p>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-stone-500 truncate">
                {user?.email || "admin@store.com"}
              </p>
            </div>
          )}

          <Button
            variant="ghost"
            size="md"
            className={cn(
              "w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-semibold gap-2 h-9",
              isCollapsed && "justify-center px-0",
            )}
            onClick={handleLogout}
            title={isCollapsed ? "Log out" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
