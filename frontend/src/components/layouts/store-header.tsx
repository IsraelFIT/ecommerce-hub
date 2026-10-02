"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Store, ShoppingCart, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { useStoreInvalidPaths } from "@/hooks/invalid-paths";
import { getTenantSubdomainUrl } from "@/utils/helper";

export function StoreHeader() {
  const isInvalid = useStoreInvalidPaths();
  const params = useParams();
  const tenant = (params?.tenant as string) || "store";

  const cartCount = useCartStore((state) => state.getCartCount());

  const formattedStoreName = tenant
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const subdomainDisplay = getTenantSubdomainUrl(tenant).replace(
    /^https?:\/\//,
    "",
  );

  if (isInvalid) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Store Brand / Logo */}
        <Link
          href={`/${tenant}`}
          className="flex items-center gap-3 group transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg leading-none text-foreground">
              {formattedStoreName} Store
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              {subdomainDisplay}
            </p>
          </div>
        </Link>

        {/* Right Actions: Admin Link & Cart */}
        <div className="flex items-center gap-2.5 md:gap-3">
          <Link
            href={`/${tenant}/admin`}
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            <span>Admin Portal</span>
          </Link>

          <Link href={`/${tenant}/cart`}>
            <Button variant="outline" size="md" className="relative gap-2 h-9">
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
  );
}
