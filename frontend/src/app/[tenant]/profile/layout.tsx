"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProfileSidebar } from "@/components/layouts/profile-sidebar";
import { getTenantRoute } from "@/utils/helper";


export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const tenant = (params?.tenant as string) || "store";
  const pathname = usePathname();

  const getCurrentTitle = () => {
    if (!pathname) return "Personal Information";
    if (pathname.includes("/profile/orders")) return "My Orders";
    if (pathname.includes("/profile/address")) return "Manage Address";
    if (pathname.includes("/profile/password")) return "Password Manager";
    if (pathname.includes("/profile/wishlist")) return "Wishlist";
    return "Personal Information";
  };

  const currentTitle = getCurrentTitle();

  return (
    <div className="w-full bg-background py-8 min-h-screen">
      <div className="container flex-col">
        {/* Breadcrumb Navigation */}
        <nav className="w-full flex items-center gap-2 text-sm text-foreground font-medium mb-8">
          <Link
            href={getTenantRoute(tenant, "/")}
            className="hover:text-stone-900 transition-colors text-stone-500"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          <Link
            href={getTenantRoute(tenant, "/profile")}
            className="hover:text-stone-900 transition-colors text-stone-500"
          >
            My Account
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          <span className="text-stone-900 font-semibold truncate max-w-xs">
            {currentTitle}
          </span>
        </nav>

        <div className="w-full flex flex-col md:flex-row items-start gap-8 lg:gap-12">
          {/* Profile Sidebar */}
          <ProfileSidebar />

          {/* Page Content Panel */}
          <div className="flex-1 w-full min-w-0 bg-card border border-border/60 rounded-xl p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
