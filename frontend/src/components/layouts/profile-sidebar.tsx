"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { useUserStore } from "@/store/user";
import { deleteAuthCookies } from "@/lib/session";
import { clearAuthSession } from "@/lib/auth";
import { getTenantRoute } from "@/utils/helper";
import { cn } from "@/lib/utils";

export type ProfileTabId =
  | "profile"
  | "orders"
  | "address"
  | "password"
  | "wishlist";

interface TabItem {
  id: ProfileTabId;
  label: string;
  path: string;
}

const TABS: TabItem[] = [
  { id: "profile", label: "Personal Information", path: "/profile" },
  { id: "orders", label: "My Orders", path: "/profile/orders" },
  { id: "address", label: "Manage Address", path: "/profile/address" },
  { id: "password", label: "Password Manager", path: "/profile/password" },
  { id: "wishlist", label: "Wishlist", path: "/profile/wishlist" },
];

export function ProfileSidebar({ className }: { className?: string }) {
  const params = useParams();
  const tenant = (params?.tenant as string) || "store";
  const pathname = usePathname();
  const router = useRouter();
  const { branding } = useTenantTheme();
  const { clearUser } = useUserStore();

  const primaryColor = branding?.primaryColor || "#059669";

  const getActiveTab = (): ProfileTabId => {
    if (!pathname) return "profile";
    if (pathname.includes("/profile/orders")) return "orders";
    if (pathname.includes("/profile/address")) return "address";
    if (pathname.includes("/profile/password")) return "password";
    if (pathname.includes("/profile/wishlist")) return "wishlist";
    return "profile";
  };

  const activeTab = getActiveTab();

  const handleLogout = () => {
    try {
      deleteAuthCookies();
      clearAuthSession();
      clearUser();
      toast.success("Logged out successfully");
      router.push(getTenantRoute(tenant, "/"));
      router.refresh();
    } catch {
      clearUser();
      router.push(getTenantRoute(tenant, "/"));
    }
  };

  return (
    <aside className={cn("w-full md:w-64 lg:w-72 shrink-0", className)}>
      <div className="flex flex-col gap-2.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const href = getTenantRoute(tenant, tab.path);

          return (
            <Link
              key={tab.id}
              href={href}
              style={
                isActive
                  ? {
                      backgroundColor: primaryColor,
                      color: "#ffffff",
                    }
                  : undefined
              }
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-sm text-sm font-semibold transition-all cursor-pointer block",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm font-bold scale-[1.01]"
                  : "bg-card border border-border/70 text-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-left px-3 py-2.5 rounded-sm text-sm font-semibold transition-all cursor-pointer border border-border/70 bg-card text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 mt-1 shadow-2xs"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default ProfileSidebar;
