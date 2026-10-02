"use client";

import { useParams, usePathname } from "next/navigation";
import { Menu, ArrowUpRight, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/store/sidebar";
import { useUserStore } from "@/store/user";
import { getTenantSubdomainUrl } from "@/utils/helper";
import Link from "next/link";

export function StoreNavbar() {
  const params = useParams();
  const pathname = usePathname();
  const tenantSlug = (params?.tenant as string) || "store";

  const { toggleOpen } = useSidebarStore();
  const { user } = useUserStore();

  const subdomainUrl = getTenantSubdomainUrl(tenantSlug);

  const getPageTitle = () => {
    if (pathname.includes("/products")) return "Products & Catalog";
    if (pathname.includes("/orders")) return "Orders & Payouts";
    if (pathname.includes("/branding")) return "Storefront & Domain";
    if (pathname.includes("/adapters")) return "DB / CMS Adapters";
    if (pathname.includes("/settings")) return "Settings";
    return "Overview";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/90 bg-white/95 backdrop-blur-md shrink-0">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 md:px-8 gap-4">
        {/* Left: Mobile Toggle & Store Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-stone-700"
            onClick={toggleOpen}
            aria-label="Toggle store menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h5 className="font-semibold text-stone-800 text-sm md:text-base">
            {getPageTitle()}
          </h5>
        </div>

        {/* Right: Quick actions & Live Store link */}
        <div className="flex items-center gap-2.5">
          <Link
            href={subdomainUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-emerald-700 hover:border-emerald-200 transition-all shadow-2xs"
          >
            <span>Live Store</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-stone-400" />
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200/70 text-xs">
              <UserIcon className="h-3.5 w-3.5 text-stone-500" />
              <span className="font-medium text-stone-700">
                {user.name || user.full_name}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
