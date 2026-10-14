"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";
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
  const { branding, tenant } = useTenantTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fallbackCurrency = tenant?.currency || "NGN";
  const secondaryColor = branding?.secondaryColor || "#10b981";
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch real tenant products from API
  const loadTenantProducts = useCallback(async () => {
    if (!tenantSlug) return;
    try {
      setIsLoading(true);
      const res = await getProducts({
        tenantSlug,
        published_only: true,
        per_page: 20,
      });

      if (res?.data?.items && res.data.items.length > 0) {
        setProducts(res.data.items);
      } else {
        // Fallback sample catalog if tenant has not created products yet
        setProducts([
          {
            id: "prod-sample-1",
            title: "Signature Artisan Reserve",
            price: 145.0,
            currency: fallbackCurrency,
            category: "Bespoke Collection",
            description:
              "Handcrafted with premium materials, immaculate finishing, and timeless aesthetic design.",
            images: [
              "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80",
            ],
            inventory_count: 12,
            is_published: true,
            slug: "signature-artisan-reserve",
          },
          {
            id: "prod-sample-2",
            title: "Heritage Masterpiece Selection",
            price: 195.0,
            currency: fallbackCurrency,
            category: "Limited Reserve",
            description:
              "Engineered for excellence. Impeccable attention to detail and durable craftsmanship.",
            images: [
              "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80",
            ],
            inventory_count: 8,
            is_published: true,
            slug: "heritage-masterpiece-selection",
          },
          {
            id: "prod-sample-3",
            title: "Minimalist Studio Series",
            price: 89.0,
            currency: fallbackCurrency,
            category: "Daily Essentials",
            description:
              "Sophisticated minimalism combined with superior functionality and understated elegance.",
            images: [
              "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80",
            ],
            inventory_count: 25,
            is_published: true,
            slug: "minimalist-studio-series",
          },
          {
            id: "prod-sample-4",
            title: "Premier Noir Custom Edition",
            price: 260.0,
            currency: fallbackCurrency,
            category: "Ultra Luxury",
            description:
              "Our highest tier offering, curated in limited batches for discerning connoisseurs.",
            images: [
              "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=800&q=80",
            ],
            inventory_count: 5,
            is_published: true,
            slug: "premier-noir-custom-edition",
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load tenant products:", err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        ) : products.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-stone-300 bg-white p-8">
            <PackageOpen className="size-12 mx-auto text-stone-400 mb-3" />
            <h3 className="font-semibold text-lg text-stone-800">
              No products found in this collection
            </h3>
            <p className="text-stone-500 text-sm mt-1">
              Check back soon as {storeName} publishes new items!
            </p>
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
