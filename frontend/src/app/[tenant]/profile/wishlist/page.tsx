"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MenuCard } from "@/components/pages/menu/menu-card";
import { apiRequest } from "@/lib/api/client";
import { getTenantRoute } from "@/utils/helper";
import type { Product } from "@/types/products";

export default function ProfileWishlistPage() {
  const params = useParams();
  const tenant = (params?.tenant as string) || "store";

  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchWishlistProducts() {
      setIsLoadingWishlist(true);
      try {
        const res = await apiRequest<{ items: Product[] }>(
          `/products?page=1&per_page=50&published_only=true`,
        );
        if (isMounted && res.data?.items) {
          const likedItems = res.data.items.filter(
            (p: Product) => p.is_liked === true,
          );
          setWishlistItems(likedItems);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setIsLoadingWishlist(false);
      }
    }

    fetchWishlistProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
        <h4 className="font-bold text-foreground">
          Wishlist ({wishlistItems.length})
        </h4>
        <Link href={getTenantRoute(tenant, "/menu")}>
          <Button variant="outline" size="sm" className="font-semibold">
            Discover Products
          </Button>
        </Link>
      </div>

      {isLoadingWishlist ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="py-12 text-center">
          <Heart className="h-12 w-12 text-rose-400 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold text-foreground">
            Your wishlist is empty
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Explore our products and tap the heart icon to save your favorites
            here.
          </p>
          <Link href={getTenantRoute(tenant, "/menu")}>
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-6">
              Browse Menu
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((prod) => (
            <MenuCard key={prod.id} product={prod} tenantSlug={tenant} />
          ))}
        </div>
      )}
    </div>
  );
}
