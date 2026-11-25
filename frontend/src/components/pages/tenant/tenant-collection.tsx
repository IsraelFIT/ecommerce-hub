"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { getProducts } from "@/lib/api/products";
import { MenuCard } from "@/components/pages/menu/menu-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types/products";

interface TenantCollectionProps {
  storeName: string;
  tenantSlug: string;
}

export function TenantCollection({
  storeName,
  tenantSlug,
}: TenantCollectionProps) {
  const { branding } = useTenantTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const secondaryColor = branding?.secondaryColor || "#10b981";
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch real tenant products from API
  const loadTenantProducts = useCallback(async () => {
    if (!tenantSlug) return;
    try {
      setIsLoading(true);
      // 1. First attempt to fetch featured products
      const featuredRes = await getProducts({
        tenantSlug,
        published_only: true,
        is_featured: true,
        per_page: 20,
      });

      if (featuredRes?.data?.items && featuredRes.data.items.length > 0) {
        setProducts(featuredRes.data.items);
        return;
      }

      // 2. If no featured products, fall back to 5 most recently added products
      const recentRes = await getProducts({
        tenantSlug,
        published_only: true,
        per_page: 5,
      });

      if (recentRes?.data?.items && recentRes.data.items.length > 0) {
        setProducts(recentRes.data.items);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Failed to load tenant products:", err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTenantProducts();
  }, [loadTenantProducts]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo =
        direction === "left"
          ? scrollLeft - clientWidth / 2
          : scrollLeft + clientWidth / 2;

      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth",
      });
    }
  };

  // If loading finished and tenant has no products, hide the entire section
  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section
      id="collection"
      className="py-20 md:py-32 bg-stone-50 text-stone-900 overflow-hidden relative border-b border-stone-200"
    >
      <div className="container flex-col px-4 md:px-8">
        {/* Header */}
        <div className="w-full flex items-end justify-between mb-8 gap-4">
          <div>
            <div
              style={{ color: secondaryColor }}
              className="text-xs font-secondary font-bold tracking-[0.25em] uppercase mb-1"
            >
              Curated Catalog
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-stone-950">
              Featured Creations from {storeName}
            </h2>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="w-full flex gap-6 overflow-hidden pb-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="flex-none w-72 md:w-80 rounded-2xl border border-stone-200 bg-white p-2 space-y-4 shadow-xs"
              >
                <Skeleton className="aspect-square w-full rounded-xl" />
                <div className="space-y-2 p-2">
                  <Skeleton className="h-4 w-3/4 rounded-sm" />
                  <Skeleton className="h-3 w-1/2 rounded-sm" />
                </div>
                <div className="p-2 pt-1 border-t border-stone-100 flex justify-between items-center">
                  <Skeleton className="h-5 w-16 rounded-sm" />
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Carousel Content */
          <div className="w-full relative group">
            {products.length > 4 && (
              <button
                onClick={() => scroll("left")}
                aria-label="Previous products"
                className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-stone-300 bg-white hover:border-stone-900 flex items-center justify-center transition-all shadow-xs cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
            )}

            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6"
              style={{ scrollbarWidth: "none" }}
            >
              {products.map((product) => (
                <MenuCard
                  key={product.id}
                  product={product}
                  tenantSlug={tenantSlug}
                  className="flex-none w-72 md:w-80"
                />
              ))}
            </div>

            {products.length > 4 && (
              <button
                onClick={() => scroll("right")}
                aria-label="Next products"
                className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-stone-300 bg-white hover:border-stone-900 flex items-center justify-center transition-all shadow-xs cursor-pointer"
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default TenantCollection;
