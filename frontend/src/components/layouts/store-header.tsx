"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname } from "next/navigation";
import { Store, ShoppingCart, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { useUserStore } from "@/store/user";
import { useStoreInvalidPaths } from "@/hooks/invalid-paths";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { cn } from "@/lib/utils";

export function StoreHeader() {
  const isInvalid = useStoreInvalidPaths();
  const params = useParams();
  const pathname = usePathname();
  const tenant = (params?.tenant as string) || "store";
  const { branding } = useTenantTheme();
  const { user } = useUserStore();

  const isTenantAdmin = user?.role === "tenant_admin";
  const cartCount = useCartStore((state) => state.getCartCount());

  const navLinks = [
    { label: "Home", href: `/${tenant}` },
    { label: "Menu", href: `/${tenant}/menu` },
    { label: "About", href: `/${tenant}#about` },
    { label: "Contact", href: `/${tenant}#consultations` },
  ];

  const formattedStoreName = tenant
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  if (isInvalid) return null;

  return (
    <div className="sticky top-0 z-40 w-full">
      {/* Dynamic Announcement Banner */}
      {branding.announcementText && (
        <div
          className="w-full text-center py-1.5 px-4 text-[11px] md:text-xs font-semibold text-white transition-colors tracking-wide select-none shadow-xs"
          style={{ backgroundColor: branding.primaryColor || "var(--primary)" }}
        >
          {branding.announcementText}
        </div>
      )}

      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container relative flex h-16 items-center justify-between">
          {/* Store Brand / Logo */}
          <Link
            href={`/${tenant}`}
            className="flex items-center gap-3 group transition-opacity"
          >
            <div className="flex h-9 w-9 items-center justify-center group-hover:scale-105 overflow-hidden">
              {branding.logoUrl ? (
                <Image
                  src={branding.logoUrl}
                  alt={formattedStoreName}
                  width={36}
                  height={36}
                  className="object-cover h-full w-full"
                  unoptimized
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105 overflow-hidden">
                  <Store className="h-5 w-5" />
                </div>
              )}
            </div>
            <div>
              <h5 className="font-bold text-foreground">
                {formattedStoreName}
              </h5>
            </div>
          </Link>

          {/* Navigation Menus - Centered */}
          <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1.5 p-1 rounded-full border border-border bg-muted/40 shadow-2xs">
            {navLinks.map((link, idx) => {
              const active =
                link.href === `/${tenant}`
                  ? pathname === `/${tenant}` || pathname === `/${tenant}/`
                  : pathname === link.href ||
                    pathname?.startsWith(`${link.href}/`);

              return (
                <Link
                  key={idx}
                  href={link.href}
                  style={
                    active
                      ? {
                          backgroundColor:
                            branding.primaryColor || "var(--primary)",
                          color: "#ffffff",
                        }
                      : undefined
                  }
                  className={cn(
                    "px-4 py-1.5 text-xs font-semibold rounded-full transition-all",
                    active
                      ? "font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-card",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Admin Link & Cart */}
          <div className="flex items-center gap-2.5 md:gap-3">
            {isTenantAdmin && (
              <Link
                href={`/${tenant}/admin`}
                className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                <span>Admin Portal</span>
              </Link>
            )}

            <Link href={`/${tenant}/cart`}>
              <Button
                variant="outline"
                size="md"
                className="relative gap-2 h-9 cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden md:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}

export default StoreHeader;
