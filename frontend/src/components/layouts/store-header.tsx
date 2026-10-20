"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Store,
  ShoppingCart,
  User,
  Heart,
  Package,
  MapPin,
  KeyRound,
  ShieldCheck,
  LogOut,
  ChevronDown,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCartStore } from "@/store/cart";
import { useUserStore } from "@/store/user";
import { useStoreInvalidPaths } from "@/hooks/invalid-paths";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { deleteAuthCookies } from "@/lib/session";
import { clearAuthSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";

export function StoreHeader() {
  const isInvalid = useStoreInvalidPaths();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const tenant = (params?.tenant as string) || "store";
  const { branding } = useTenantTheme();
  const { user, clearUser } = useUserStore();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const isTenantAdmin =
    user?.role === "tenant_admin" ||
    user?.role === "super_admin" ||
    user?.role === "admin";
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

  // Normalize path for both subdomain routing (/menu) and path-based routing (/store-slug/menu)
  const normalizedPath =
    (pathname || "/").replace(new RegExp(`^/${tenant}(?=/|$)`), "") || "/";

  const isLinkActive = (href: string, label: string) => {
    if (label === "Home" || href === `/${tenant}`) {
      return (
        normalizedPath === "/" ||
        pathname === `/${tenant}` ||
        pathname === `/${tenant}/`
      );
    }
    const linkBase = href.replace(new RegExp(`^/${tenant}`), "");
    if (!linkBase) return false;

    return (
      normalizedPath === linkBase ||
      normalizedPath.startsWith(`${linkBase}/`) ||
      pathname === href ||
      pathname?.startsWith(`${href}/`)
    );
  };

  const handleLogout = () => {
    try {
      deleteAuthCookies();
      clearAuthSession();
      clearUser();
      useCartStore.getState().clearCart(tenant, false);
      setIsAccountOpen(false);
      toast.success("Logged out successfully");
      router.push(`/${tenant}`);
      router.refresh();
    } catch {
      clearUser();
      useCartStore.getState().clearCart(tenant, false);
      setIsAccountOpen(false);
      router.push(`/${tenant}`);
    }
  };

  const displayName = user
    ? user.full_name ||
      user.name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.email
    : "Guest User";

  if (isInvalid) return null;

  return (
    <div className="sticky top-0 z-40 w-full">
      {/* Dynamic Announcement Banner */}
      {branding.announcementText && (
        <div
          data-announcement-bar="true"
          className="w-full text-center py-1.5 px-4 text-[11px] md:text-xs font-semibold text-white transition-colors tracking-wide select-none shadow-xs no-print"
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

          {/* Navigation Menus */}
          <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1.5 p-1 rounded-full border border-border bg-muted/40 shadow-2xs">
            {navLinks.map((link, idx) => {
              const active = isLinkActive(link.href, link.label);

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
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-card",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Cart & My Account */}
          <div className="flex items-center gap-2 md:gap-2.5">
            <Link href={`/${tenant}/cart`}>
              <Button
                variant="outline"
                size="md"
                className="relative gap-2 h-9 cursor-pointer border-border bg-card hover:bg-muted/50"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden md:inline text-xs font-semibold">
                  Cart
                </span>
                {isMounted && cartCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* My Account Popover */}
            <Popover open={isAccountOpen} onOpenChange={setIsAccountOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="md"
                  className="h-9 px-2.5 sm:px-3 gap-1.5 sm:gap-2 cursor-pointer font-semibold text-xs border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  {user ? (
                    <UserAvatar
                      src={user.avatar_url || user.avatarUrl}
                      name={displayName}
                      email={user.email}
                      size="xs"
                      shape="circle"
                      className="h-5 w-5 border-none"
                    />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="hidden sm:inline">My Account</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70" />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                className="w-64 p-2 shadow-lg border border-border bg-popover rounded-xl"
              >
                {/* User Header */}
                <div className="px-3 py-2.5 border-b border-border/60 mb-1 flex items-center gap-2.5">
                  <UserAvatar
                    src={user?.avatar_url || user?.avatarUrl}
                    name={displayName}
                    email={user?.email}
                    size="sm"
                    shape="circle"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {user?.email || "Not signed in"}
                    </p>
                    {user?.role && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground uppercase tracking-wider">
                        {user.role.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Account Navigation Links */}
                <div className="flex flex-col gap-0.5 py-1">
                  <Link
                    href={`/${tenant}/profile?tab=profile`}
                    onClick={() => setIsAccountOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href={`/${tenant}/profile?tab=wishlist`}
                    onClick={() => setIsAccountOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
                  >
                    <Heart className="h-4 w-4 text-rose-500" />
                    <span>Wishlist</span>
                  </Link>

                  <Link
                    href={`/${tenant}/profile?tab=orders`}
                    onClick={() => setIsAccountOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
                  >
                    <Package className="h-4 w-4 text-amber-500" />
                    <span>My Orders</span>
                  </Link>

                  <Link
                    href={`/${tenant}/profile?tab=address`}
                    onClick={() => setIsAccountOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span>Manage Address</span>
                  </Link>

                  <Link
                    href={`/${tenant}/profile?tab=password`}
                    onClick={() => setIsAccountOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
                  >
                    <KeyRound className="h-4 w-4 text-emerald-500" />
                    <span>Change Password</span>
                  </Link>

                  {/* Tenant Admin / Super Admin Portal */}
                  {isTenantAdmin && (
                    <>
                      <div className="my-1 border-t border-border/60" />
                      <Link
                        href={`/${tenant}/admin`}
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Admin Portal</span>
                      </Link>
                    </>
                  )}
                </div>

                {/* Auth Actions (Login / Logout) */}
                <div className="mt-1 pt-1 border-t border-border/60">
                  {user ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  ) : (
                    <Link
                      href={`/login?redirect=/${tenant}/profile`}
                      onClick={() => setIsAccountOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>Sign In / Register</span>
                    </Link>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>
    </div>
  );
}

export default StoreHeader;
