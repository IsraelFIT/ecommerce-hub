"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Grid, List, Loader2, ChevronRight } from "lucide-react";
import { Product, ProductCategory, ProductFilter } from "@/types/products";
import { MenuCard, CardProduct } from "@/components/pages/menu/menu-card";
import { MenuSidebar } from "@/components/pages/menu/menu-sidebar";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { useUserStore } from "@/store/user";
import { formatCurrency, getTenantRoute } from "@/utils/helper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import { getFilters } from "@/lib/api/filters";
import { cn } from "@/lib/utils";

export function MenuList() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || "store";

  const { branding, tenant } = useTenantTheme();
  const { user } = useUserStore();
  const tenantCurrency = tenant?.currency || user?.tenant_currency || "NGN";

  const [products, setProducts] = useState<Product[]>([]);
  const [tenantCategories, setTenantCategories] = useState<ProductCategory[]>(
    [],
  );
  const [tenantFilters, setTenantFilters] = useState<ProductFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [catalogBounds, setCatalogBounds] = useState<{
    minPrice: number;
    maxCatalogPrice: number;
  }>({ minPrice: 0, maxCatalogPrice: 100 });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState<
    [number, number]
  >([0, 100]);
  const [selectedCustomFilters, setSelectedCustomFilters] = useState<
    Record<string, string[]>
  >({});
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [availability, setAvailability] = useState<
    "all" | "available" | "schedule"
  >("all");
  const [, setCurrentPage] = useState<number>(1);
  const isInitialMount = useRef(true);

  // Debounce price range slider
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 250);
    return () => clearTimeout(timer);
  }, [priceRange]);

  // Initial Load: Categories, Tenant Filters, and Initial Products
  useEffect(() => {
    let isMounted = true;
    async function loadCatalogAndFilters() {
      try {
        setIsLoading(true);
        const [prodRes, catRes, filterRes] = await Promise.all([
          getProducts({ tenantSlug, published_only: true, per_page: 50 }),
          getCategories({ tenantSlug }),
          getFilters({ tenantSlug, active_only: true }),
        ]);

        if (isMounted) {
          if (prodRes.status === "success" && prodRes.data?.items) {
            const items = prodRes.data.items;
            setProducts(items);

            if (items.length > 0) {
              let min = Infinity;
              let max = 0;
              items.forEach((p) => {
                const pr = p.variants?.[0]?.price ?? p.price ?? 0;
                if (pr < min) min = pr;
                if (pr > max) max = pr;
              });
              const foundMin = min === Infinity ? 0 : Math.floor(min);
              const foundMax = max > 0 ? Math.ceil(max) : 100;
              setCatalogBounds({
                minPrice: foundMin,
                maxCatalogPrice: foundMax,
              });
              setPriceRange([foundMin, foundMax]);
              setDebouncedPriceRange([foundMin, foundMax]);
            }
          }
          if (catRes.status === "success" && catRes.data) {
            setTenantCategories(catRes.data);
          }
          if (filterRes.status === "success" && filterRes.data) {
            setTenantFilters(filterRes.data);
          }
        }
      } catch (err) {
        console.error("Error loading products/filters for menu:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          isInitialMount.current = false;
        }
      }
    }
    loadCatalogAndFilters();
    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  // Query Backend getProducts API with active sidebar filters
  const fetchFilteredProducts = useCallback(async () => {
    try {
      setIsFiltering(true);
      const res = await getProducts({
        tenantSlug,
        published_only: true,
        per_page: 50,
        category: selectedCategory !== "ALL" ? selectedCategory : undefined,
        product_class: selectedClass !== "all" ? selectedClass : undefined,
        min_price:
          debouncedPriceRange[0] > catalogBounds.minPrice
            ? debouncedPriceRange[0]
            : undefined,
        max_price:
          debouncedPriceRange[1] < catalogBounds.maxCatalogPrice
            ? debouncedPriceRange[1]
            : undefined,
        rating: selectedRating > 0 ? selectedRating : undefined,
        availability: availability !== "all" ? availability : undefined,
        filters:
          Object.keys(selectedCustomFilters).length > 0
            ? selectedCustomFilters
            : undefined,
      });

      if (res.status === "success" && res.data?.items) {
        setProducts(res.data.items);
      }
    } catch (err) {
      console.error("Error querying filtered products from backend:", err);
    } finally {
      setIsFiltering(false);
    }
  }, [
    tenantSlug,
    selectedCategory,
    selectedClass,
    debouncedPriceRange,
    catalogBounds.minPrice,
    catalogBounds.maxCatalogPrice,
    selectedRating,
    availability,
    selectedCustomFilters,
  ]);

  // Trigger backend query whenever filter parameters change after mount
  useEffect(() => {
    if (isInitialMount.current) return;
    fetchFilteredProducts();
  }, [fetchFilteredProducts]);

  // Extract categories with counts from current product list
  const availableCategories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = (p.category || "General").trim();
      map.set(cat, (map.get(cat) || 0) + 1);
    });

    const seen = new Set<string>();
    const list: { name: string; count: number }[] = [];

    // First add defined tenant categories
    tenantCategories.forEach((tc) => {
      seen.add(tc.name.toLowerCase());
      list.push({
        name: tc.name,
        count: map.get(tc.name) || 0,
      });
    });

    // Then add any product categories that weren't in tenantCategories (e.g. Services, Digital, etc.)
    map.forEach((count, catName) => {
      if (!seen.has(catName.toLowerCase())) {
        seen.add(catName.toLowerCase());
        list.push({
          name: catName,
          count,
        });
      }
    });

    return list;
  }, [products, tenantCategories]);

  // Counts for each product class
  const classCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: products.length,
      physical: 0,
      digital: 0,
      service: 0,
    };
    products.forEach((p) => {
      const pClass = (p.product_class || "physical").toLowerCase();
      if (counts[pClass] !== undefined) {
        counts[pClass]++;
      }
    });
    return counts;
  }, [products]);

  const { minPrice, maxCatalogPrice } = catalogBounds;

  const toggleCustomFilter = (filterSlug: string, option: string) => {
    setSelectedCustomFilters((prev) => {
      const current = prev[filterSlug] || [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      const next = { ...prev };
      if (updated.length > 0) {
        next[filterSlug] = updated;
      } else {
        delete next[filterSlug];
      }
      return next;
    });
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setSelectedCategory("ALL");
    setSelectedClass("all");
    setPriceRange([catalogBounds.minPrice, catalogBounds.maxCatalogPrice]);
    setDebouncedPriceRange([
      catalogBounds.minPrice,
      catalogBounds.maxCatalogPrice,
    ]);
    setSelectedCustomFilters({});
    setSelectedRating(0);
    setAvailability("all");
    setCurrentPage(1);
  };

  // Filter products by selected class and sort by recency
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedClass !== "all") {
          const pClass = (p.product_class || "physical").toLowerCase();
          if (pClass !== selectedClass.toLowerCase()) return false;
        }
        return true;
      })
      .sort((a, b) => {
        return (b.created_at || "").localeCompare(a.created_at || "");
      });
  }, [products, selectedClass]);

  // Dynamic categories to render: ensure ALL items in filteredProducts are represented
  const categoriesToRender = useMemo(() => {
    if (selectedCategory !== "ALL") {
      const match = availableCategories.find(
        (c) => c.name.toLowerCase() === selectedCategory.toLowerCase(),
      );
      return match ? [match.name] : [selectedCategory];
    }
    const catsWithItems = availableCategories
      .map((c) => c.name)
      .filter((catName) =>
        filteredProducts.some(
          (p) =>
            (p.category || "General").toLowerCase() === catName.toLowerCase(),
        ),
      );

    // Include any categories present on filteredProducts that were not in availableCategories
    filteredProducts.forEach((p) => {
      const catName = (p.category || "General").trim();
      if (
        !catsWithItems.some((c) => c.toLowerCase() === catName.toLowerCase())
      ) {
        catsWithItems.push(catName);
      }
    });

    if (catsWithItems.length === 0 && filteredProducts.length > 0) {
      return ["General"];
    }

    return catsWithItems;
  }, [availableCategories, filteredProducts, selectedCategory]);

  // 4 items for Recently Viewed section at the bottom
  const recentlyViewed = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  return (
    <div className="min-h-screen py-8">
      <div className="container flex-col">
        {/* Breadcrumb Navigation */}
        <nav className="w-full flex items-center gap-2 text-sm text-foreground font-medium mb-6">
          <Link
            href={getTenantRoute(tenantSlug, "/")}
            className="hover:text-stone-900 transition-colors text-stone-500"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          <span
            className={cn(
              "font-semibold truncate max-w-xs",
              selectedCategory === "ALL"
                ? "text-stone-900"
                : "text-stone-500 cursor-pointer hover:text-stone-900",
            )}
            onClick={() => {
              if (selectedCategory !== "ALL") setSelectedCategory("ALL");
            }}
          >
            Menu
          </span>
          {selectedCategory !== "ALL" && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
              <span className="text-stone-900 font-semibold truncate max-w-xs">
                {selectedCategory}
              </span>
            </>
          )}
        </nav>

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Menu Sidebar */}
          <MenuSidebar
            isLoading={isLoading}
            isFiltering={isFiltering}
            availableCategories={availableCategories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            classCounts={classCounts}
            setCurrentPage={setCurrentPage}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            minPrice={minPrice}
            maxCatalogPrice={maxCatalogPrice}
            tenantCurrency={tenantCurrency}
            tenantFilters={tenantFilters}
            selectedCustomFilters={selectedCustomFilters}
            toggleCustomFilter={toggleCustomFilter}
            selectedRating={selectedRating}
            setSelectedRating={setSelectedRating}
            availability={availability}
            setAvailability={setAvailability}
            handleClearAll={handleClearAll}
            onApplyFilters={() => {
              setCurrentPage(1);
              fetchFilteredProducts();
            }}
          />

          <main className="lg:col-span-9 space-y-6">
            {/* Top Bar: Count & View Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-stone-900">
                  {filteredProducts.length} Menu Items
                </h4>
                {isFiltering && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                )}
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                {/* View Switcher */}
                <div className="flex items-center border border-stone-200 bg-white p-1 rounded-lg select-none shadow-2xs">
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 rounded-md transition-all cursor-pointer",
                      viewMode === "list"
                        ? "bg-primary text-white"
                        : "text-stone-400 hover:text-stone-950",
                    )}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-1.5 rounded-md transition-all cursor-pointer",
                      viewMode === "grid"
                        ? "bg-primary text-white"
                        : "text-stone-400 hover:text-stone-950",
                    )}
                    aria-label="Grid view"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading or Empty State */}
            {isLoading ? (
              <div className="space-y-8">
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-44 rounded-lg" />
                      <Skeleton className="h-3.5 w-28 rounded-md" />
                    </div>
                    <Skeleton className="h-10 w-12 rounded-md hidden sm:block" />
                  </div>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="rounded-2xl bg-white border border-stone-200/80 p-3.5 space-y-3"
                        >
                          <Skeleton className="aspect-square w-full rounded-xl" />
                          <div className="space-y-2 pt-1">
                            <Skeleton className="h-4 w-3/4 rounded-md" />
                            <Skeleton className="h-3 w-1/2 rounded-md" />
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <Skeleton className="h-5 w-16 rounded-md" />
                            <Skeleton className="h-8 w-20 rounded-xl" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-white border border-stone-100"
                        >
                          <Skeleton className="aspect-4/3 w-full sm:w-32 sm:h-28 rounded-xl shrink-0" />
                          <div className="grow space-y-2 w-full">
                            <Skeleton className="h-5 w-1/3 rounded-md" />
                            <Skeleton className="h-3.5 w-2/3 rounded-md" />
                            <Skeleton className="h-4 w-20 rounded-md" />
                          </div>
                          <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3 shadow-xs">
                <p className="text-sm font-bold text-stone-900">
                  No menu items match your filters
                </p>
                <p className="text-xs text-stone-500">
                  Try adjusting the price range, dietary criteria, or selected
                  categories.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs h-8 mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              /* Dynamic Categories Sections */
              <div className="space-y-12">
                {categoriesToRender.map((categoryName, idx) => {
                  const categoryItems = filteredProducts.filter((item) => {
                    const itemCat = (item.category || "General").toLowerCase();
                    return itemCat === categoryName.toLowerCase();
                  });

                  if (categoryItems.length === 0) return null;

                  const categoryCode = String(idx + 1).padStart(2, "0");

                  return (
                    <div
                      key={categoryName}
                      className="w-full pb-10 border-b border-stone-200 last:border-0 last:pb-0"
                    >
                      {/* Category Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex flex-col">
                          <h3 className="font-semibold text-xl md:text-2xl tracking-tight text-stone-950 leading-tight capitalize">
                            {categoryName}
                          </h3>
                          <p
                            style={{
                              color: branding.primaryColor || "var(--primary)",
                            }}
                            className="tracking-[0.2em] uppercase font-bold text-xs mt-0.5"
                          >
                            {categoryItems.length}{" "}
                            {categoryItems.length === 1
                              ? "Item Available"
                              : "Items Available"}
                          </p>
                        </div>
                        <span className="text-stone-200 font-semibold text-4xl md:text-5xl leading-none hidden sm:block select-none">
                          {categoryCode}
                        </span>
                      </div>

                      {/* Items Display Container */}
                      {viewMode === "list" ? (
                        /* LIST VIEW MODE */
                        <div className="divide-y divide-stone-200/60 flex flex-col">
                          {categoryItems.map((item) => {
                            const price =
                              item.variants?.[0]?.price ?? item.price ?? 0;
                            const itemClass = item.product_class;
                            const displayImage =
                              item.images?.[0] || "/images/placeholder.jpg";
                            const displayName =
                              item.name || item.title || "Product";

                            return (
                              <Link
                                key={item.id}
                                href={getTenantRoute(
                                  tenantSlug,
                                  `/menu/${item.id}`,
                                )}
                                className="flex flex-col sm:flex-row items-center gap-5 py-4 group hover:bg-white hover:-mx-4 hover:px-4 rounded-xl transition-all duration-200 border-transparent hover:shadow-xs"
                              >
                                <div className="grow w-full sm:w-auto min-w-0">
                                  <div className="flex flex-col sm:flex-row gap-5 items-center">
                                    <div className="relative aspect-4/3 w-full sm:w-32 sm:h-28 rounded-xl shrink-0 bg-stone-100 overflow-hidden">
                                      <Image
                                        src={displayImage}
                                        alt={displayName}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 640px) 100vw, 128px"
                                      />
                                    </div>

                                    <div className="flex flex-col justify-center min-w-0 text-left w-full sm:w-auto">
                                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <h4 className="font-bold tracking-tight text-stone-950 group-hover:text-primary transition-colors text-base">
                                          {displayName}
                                        </h4>

                                        {itemClass && (
                                          <Badge
                                            variant="outline"
                                            className="capitalize px-2 py-0.5 text-[10px]"
                                          >
                                            {itemClass}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-stone-500 leading-relaxed font-light text-xs line-clamp-2">
                                        {item.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div
                                  className="hidden sm:block grow max-w-28 h-px opacity-60"
                                  style={{
                                    backgroundImage:
                                      "repeating-linear-gradient(to right, #78716c 0px, #78716c 2px, transparent 2px, transparent 6px)",
                                  }}
                                />

                                <span className="font-secondary text-lg font-bold text-stone-950 shrink-0 select-none">
                                  {formatCurrency(price, tenantCurrency)}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        /* GRID VIEW MODE */
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                          {categoryItems.map((item) => (
                            <MenuCard
                              key={item.id}
                              product={item as unknown as CardProduct}
                              tenantSlug={tenantSlug}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {recentlyViewed.length > 0 && (
          <section className="pt-10 mt-10 border-t border-stone-200/80 space-y-6">
            <h3 className="text-xl md:text-2xl font-bold  text-stone-900 tracking-tight">
              Recently Viewed
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {recentlyViewed.map((item) => (
                <MenuCard
                  key={item.id}
                  product={item as unknown as CardProduct}
                  tenantSlug={tenantSlug}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default MenuList;
