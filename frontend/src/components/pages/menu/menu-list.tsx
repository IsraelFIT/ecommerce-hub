"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Grid, List, Loader2, Star, ChevronDown } from "lucide-react";
import { Product, ProductCategory, ProductFilter } from "@/types/products";
import { MenuCard, CardProduct } from "@/components/pages/menu/menu-card";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { useUserStore } from "@/store/user";
import { formatCurrency, getTenantRoute } from "@/utils/helper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import { getFilters } from "@/lib/api/filters";
import { cn } from "@/lib/utils";

type SortOption = "popular" | "price-asc" | "price-desc" | "newest";

export function MenuList() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || "store";

  const { branding, tenant } = useTenantTheme();
  const { user } = useUserStore();
  const tenantCurrency = tenant?.currency || user?.tenant_currency || "NGN";
  const primaryAccent = branding?.primaryColor || "#eab308"; // Primary accent color

  const [products, setProducts] = useState<Product[]>([]);
  const [tenantCategories, setTenantCategories] = useState<ProductCategory[]>(
    [],
  );
  const [tenantFilters, setTenantFilters] = useState<ProductFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [priceRange, setPriceRange] = useState<number>(100);
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [selectedCustomFilters, setSelectedCustomFilters] = useState<
    Record<string, string[]>
  >({});
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedMealTime, setSelectedMealTime] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [availability, setAvailability] = useState<
    "all" | "available" | "schedule"
  >("all");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    let isMounted = true;
    async function loadCatalogAndFilters() {
      try {
        setIsLoading(true);
        const [prodRes, catRes, filterRes] = await Promise.all([
          getProducts({ tenantSlug, published_only: true }),
          getCategories({ tenantSlug }),
          getFilters({ tenantSlug, active_only: true }),
        ]);

        if (isMounted) {
          if (prodRes.status === "success" && prodRes.data?.items) {
            setProducts(prodRes.data.items);
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
        if (isMounted) setIsLoading(false);
      }
    }
    loadCatalogAndFilters();
    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  // Extract categories with counts
  const availableCategories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = (p.category || "General").trim();
      map.set(cat, (map.get(cat) || 0) + 1);
    });

    if (tenantCategories.length > 0) {
      return tenantCategories.map((tc) => ({
        name: tc.name,
        count: map.get(tc.name) || 0,
      }));
    }

    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [products, tenantCategories]);

  // Extract unique sizes / options available across variants
  const availableSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    products.forEach((p) => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v) => {
          const sOpt = v.options?.Size || v.options?.size;
          if (Array.isArray(sOpt)) {
            sOpt.forEach((s) => sizeSet.add(String(s)));
          } else if (sOpt) {
            sizeSet.add(String(sOpt));
          } else if (v.sku) {
            sizeSet.add(v.sku);
          }
        });
      }
      if (p.specifications?.size && typeof p.specifications.size === "string") {
        sizeSet.add(p.specifications.size);
      }
    });
    const arr = Array.from(sizeSet);
    return arr.length > 0 ? arr : ["Regular", "Large", "Family"];
  }, [products]);

  // Derive min and max prices from active products
  const { minPrice, maxCatalogPrice } = useMemo(() => {
    if (products.length === 0) return { minPrice: 0, maxCatalogPrice: 100 };
    let min = Infinity;
    let max = 0;
    products.forEach((p) => {
      const pr = p.variants?.[0]?.price ?? p.price ?? 0;
      if (pr < min) min = pr;
      if (pr > max) max = pr;
    });
    return {
      minPrice: min === Infinity ? 0 : Math.floor(min),
      maxCatalogPrice: max > 0 ? Math.ceil(max) : 100,
    };
  }, [products]);

  // Set initial price slider when catalog loads
  useEffect(() => {
    if (maxCatalogPrice > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPriceRange(maxCatalogPrice);
    }
  }, [maxCatalogPrice]);

  const toggleCustomFilter = (filterSlug: string, option: string) => {
    setSelectedCustomFilters((prev) => {
      const current = prev[filterSlug] || [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [filterSlug]: updated };
    });
  };

  const toggleDietary = (tag: string) => {
    setSelectedDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const toggleMealTime = (meal: string) => {
    setSelectedMealTime((prev) =>
      prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal],
    );
  };

  const handleClearAll = () => {
    setSelectedCategory("ALL");
    setPriceRange(maxCatalogPrice);
    setSelectedSize("all");
    setSelectedCustomFilters({});
    setSelectedDietary([]);
    setSelectedMealTime([]);
    setSelectedRating(0);
    setAvailability("all");
    setCurrentPage(1);
  };

  // Filter and Sort Pipeline
  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        // 1. Category
        if (selectedCategory !== "ALL") {
          const cat = (item.category || "General").toLowerCase();
          if (cat !== selectedCategory.toLowerCase()) return false;
        }

        // 2. Price
        const price = item.variants?.[0]?.price ?? item.price ?? 0;
        if (price > priceRange && priceRange < maxCatalogPrice) return false;

        // 3. Size
        if (selectedSize !== "all") {
          const matchesVariant = item.variants?.some(
            (v) =>
              v.options?.Size === selectedSize ||
              v.options?.size === selectedSize ||
              v.sku.toLowerCase().includes(selectedSize.toLowerCase()),
          );
          const matchesSpec =
            item.specifications?.size === selectedSize ||
            item.specifications?.Size === selectedSize;
          if (!matchesVariant && !matchesSpec) return false;
        }

        // 4. Dynamic Custom Filters Configured in Backend
        const activeFilterEntries = Object.entries(
          selectedCustomFilters,
        ).filter(([, selectedOpts]) => selectedOpts.length > 0);

        for (const [slug, selectedOpts] of activeFilterEntries) {
          const prodFilterValues = item.filters?.[slug] || [];
          const specVal = item.specifications?.[slug];
          const desc = String(item.description || "").toLowerCase();
          const name = String(item.name || "").toLowerCase();

          const matches = selectedOpts.some((opt) => {
            const optLower = opt.toLowerCase();
            if (prodFilterValues.some((pv) => pv.toLowerCase() === optLower)) {
              return true;
            }
            if (
              typeof specVal === "string" &&
              specVal.toLowerCase().includes(optLower)
            ) {
              return true;
            }
            if (
              Array.isArray(specVal) &&
              specVal.some((v) => String(v).toLowerCase() === optLower)
            ) {
              return true;
            }
            return desc.includes(optLower) || name.includes(optLower);
          });

          if (!matches) return false;
        }

        // 5. Fallback Dietary filter (if no custom filters)
        if (selectedDietary.length > 0) {
          const specDietary = String(
            item.specifications?.dietary || "",
          ).toLowerCase();
          const specAllergen = String(
            item.specifications?.allergens || "",
          ).toLowerCase();
          const desc = String(item.description || "").toLowerCase();
          const name = String(item.name || "").toLowerCase();
          const combined = `${specDietary} ${specAllergen} ${desc} ${name}`;
          const matchesAny = selectedDietary.some((tag) =>
            combined.includes(tag.toLowerCase()),
          );
          if (!matchesAny) return false;
        }

        // 6. Fallback Meal Time filter (if no custom filters)
        if (selectedMealTime.length > 0) {
          const pClass = String(item.product_class || "").toLowerCase();
          const pCat = String(item.category || "").toLowerCase();
          const desc = String(item.description || "").toLowerCase();
          const combined = `${pClass} ${pCat} ${desc}`;
          const matchesAny = selectedMealTime.some((m) =>
            combined.includes(m.toLowerCase()),
          );
          if (!matchesAny) return false;
        }

        // 7. Rating filter
        if (selectedRating > 0) {
          if (selectedRating > 4.5) return true;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.variants?.[0]?.price ?? a.price ?? 0;
        const priceB = b.variants?.[0]?.price ?? b.price ?? 0;
        if (sortBy === "price-asc") return priceA - priceB;
        if (sortBy === "price-desc") return priceB - priceA;
        if (sortBy === "newest")
          return (b.created_at || "").localeCompare(a.created_at || "");
        return 0; // Popular / Default
      });
  }, [
    products,
    selectedCategory,
    priceRange,
    maxCatalogPrice,
    selectedSize,
    selectedCustomFilters,
    selectedDietary,
    selectedMealTime,
    selectedRating,
    sortBy,
  ]);

  // Dynamic categories to render
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
    <div className="bg-stone-100/60 min-h-screen py-8 md:py-12">
      <div className="container flex-col">
        {/* 2-Column Layout matching Image 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ========================================= */}
          {/* LEFT SIDEBAR: FILTERS                     */}
          {/* ========================================= */}
          <aside className="lg:col-span-3 bg-white rounded-2xl border border-stone-200/90 p-5 space-y-6 sticky top-24">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h5 className="font-bold text-stone-900">Filters</h5>
              <button
                onClick={handleClearAll}
                className="text-xs text-stone-500 hover:text-stone-900 font-medium transition-colors cursor-pointer"
              >
                Clear all
              </button>
            </div>

            {/* 1. Category Checkboxes */}
            <div className="space-y-3">
              <h6 className="font-bold text-stone-900">Category</h6>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-foreground hover:text-stone-950 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === "ALL"}
                    onChange={() => {
                      setSelectedCategory("ALL");
                      setCurrentPage(1);
                    }}
                    className="w-4 h-4 text-primary focus:ring-primary border-stone-300 accent-primary cursor-pointer"
                  />
                  <span
                    className={cn(
                      selectedCategory === "ALL" && "font-bold text-stone-950",
                    )}
                  >
                    All
                  </span>
                </label>
                {availableCategories.map((cat) => {
                  const isChecked =
                    selectedCategory.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <label
                      key={cat.name}
                      className="flex items-center gap-2.5 text-xs text-foreground hover:text-stone-950 cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedCategory(cat.name);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-primary focus:ring-primary border-stone-300 accent-primary cursor-pointer"
                      />
                      <span
                        className={cn(isChecked && "font-bold text-stone-950")}
                      >
                        {cat.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-stone-100" />

            {/* 2. Price Range Slider (With Tenant Currency) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h6 className="font-bold text-stone-900">Price Range</h6>
                <span className="text-xs font-bold text-primary">
                  {formatCurrency(priceRange, tenantCurrency)}
                </span>
              </div>

              <input
                type="range"
                min={minPrice}
                max={maxCatalogPrice}
                step={1}
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />

              <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                <span>{formatCurrency(minPrice, tenantCurrency)}</span>
                <span>{formatCurrency(maxCatalogPrice, tenantCurrency)}</span>
              </div>
            </div>

            <div className="h-px bg-stone-100" />

            {/* 3. Portion Size Pills */}
            <div className="space-y-3">
              <h6 className="font-bold text-stone-900">Portion Size</h6>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedSize("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                    selectedSize === "all"
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-300",
                  )}
                >
                  All
                </button>
                {availableSizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                        isSelected
                          ? "bg-primary text-stone-950 border-primary shadow-xs"
                          : "bg-white text-stone-600 border-stone-200 hover:border-stone-300",
                      )}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-stone-100" />

            {/* 4. Dynamic Filters configured by tenant admin */}
            {tenantFilters.length > 0 ? (
              tenantFilters.map((filter) => (
                <div key={filter.id} className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    {filter.name}
                  </h4>
                  <div className="space-y-2">
                    {filter.options.map((opt) => {
                      const isChecked =
                        selectedCustomFilters[filter.slug]?.includes(opt) ||
                        false;
                      return (
                        <label
                          key={opt}
                          className="flex items-center gap-2.5 text-xs text-foreground hover:text-stone-950 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              toggleCustomFilter(filter.slug, opt)
                            }
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-stone-300 accent-primary cursor-pointer"
                          />
                          <span
                            className={cn(
                              isChecked && "font-bold text-stone-950",
                            )}
                          >
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="h-px bg-stone-100" />
                </div>
              ))
            ) : (
              <>
                {/* Fallback Dietary Checkboxes */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Dietary
                  </h4>
                  <div className="space-y-2">
                    {["Vegetarian", "Vegan", "Spicy", "Gluten-Free"].map(
                      (tag) => {
                        const isChecked = selectedDietary.includes(tag);
                        return (
                          <label
                            key={tag}
                            className="flex items-center gap-2.5 text-xs text-foreground hover:text-stone-950 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleDietary(tag)}
                              className="w-4 h-4 rounded text-primary focus:ring-primary border-stone-300 accent-primary cursor-pointer"
                            />
                            <span
                              className={cn(
                                isChecked && "font-bold text-stone-950",
                              )}
                            >
                              {tag}
                            </span>
                          </label>
                        );
                      },
                    )}
                  </div>
                </div>

                <div className="h-px bg-stone-100" />

                {/* Fallback Meal Time */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Meal Time
                  </h4>
                  <div className="space-y-2">
                    {["Breakfast", "SNACKS", "Dinner", "Late Night"].map(
                      (meal) => {
                        const isChecked = selectedMealTime.includes(meal);
                        return (
                          <label
                            key={meal}
                            className="flex items-center gap-2.5 text-xs text-foreground hover:text-stone-950 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleMealTime(meal)}
                              className="w-4 h-4 rounded text-primary focus:ring-primary border-stone-300 accent-primary cursor-pointer"
                            />
                            <span
                              className={cn(
                                isChecked && "font-bold text-stone-950",
                              )}
                            >
                              {meal}
                            </span>
                          </label>
                        );
                      },
                    )}
                  </div>
                </div>

                <div className="h-px bg-stone-100" />
              </>
            )}

            {/* 6. Rating */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Rating
              </h4>
              <div className="space-y-2">
                {[5, 4].map((stars) => (
                  <label
                    key={stars}
                    className="flex items-center gap-2.5 text-xs text-foreground hover:text-stone-950 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="rating"
                      checked={selectedRating === stars}
                      onChange={() => setSelectedRating(stars)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-stone-300 accent-primary cursor-pointer"
                    />
                    <div className="flex items-center gap-1 text-primary">
                      {[...Array(stars)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 fill-primary text-primary"
                        />
                      ))}
                      <span className="text-stone-500 text-xs ml-1 font-medium">
                        & up
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-stone-100" />

            {/* 7. Availability */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Availability
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-foreground hover:text-stone-950 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="avail"
                    checked={availability === "available"}
                    onChange={() => setAvailability("available")}
                    className="w-4 h-4 text-primary focus:ring-primary border-stone-300 accent-primary cursor-pointer"
                  />
                  <span>Available Now</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-foreground hover:text-stone-950 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="avail"
                    checked={availability === "schedule"}
                    onChange={() => setAvailability("schedule")}
                    className="w-4 h-4 text-primary focus:ring-primary border-stone-300 accent-primary cursor-pointer"
                  />
                  <span>Schedule for Later</span>
                </label>
              </div>
            </div>

            {/* Apply Filters Button */}
            <Button
              size="default"
              onClick={() => setCurrentPage(1)}
              style={{ backgroundColor: primaryAccent, color: "#1c1917" }}
              className="w-full font-bold text-xs h-10 rounded-xl transition-all shadow-xs cursor-pointer hover:opacity-90"
            >
              Apply Filters
            </Button>
          </aside>

          {/* ========================================= */}
          {/* RIGHT CONTENT: PRODUCT CATALOG            */}
          {/* ========================================= */}
          <main className="lg:col-span-9 space-y-6">
            {/* Top Bar: Count, View Mode & Sort Dropdown */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
              <h2 className="text-base font-bold text-stone-900">
                {filteredProducts.length} Menu Items
              </h2>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                {/* View Switcher */}
                <div className="flex items-center border border-stone-200 bg-white p-1 rounded-xl select-none shadow-2xs">
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 rounded-lg transition-all cursor-pointer",
                      viewMode === "list"
                        ? "bg-stone-950 text-white shadow-xs"
                        : "text-stone-400 hover:text-stone-950",
                    )}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-1.5 rounded-lg transition-all cursor-pointer",
                      viewMode === "grid"
                        ? "bg-stone-950 text-white shadow-xs"
                        : "text-stone-400 hover:text-stone-950",
                    )}
                    aria-label="Grid view"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-stone-500 font-medium hidden sm:inline">
                    Sort by:
                  </span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="appearance-none bg-white border border-stone-200 text-stone-800 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                    >
                      <option value="popular">Popular</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="newest">Newest</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Loading or Empty State */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-stone-200">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-stone-500 font-medium">
                  Loading delicious creations...
                </p>
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
                        <span className="text-stone-200 font-semibold text-4xl md:text-5xl leading-none hidden sm:block select-none font-serif">
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

        {/* ========================================= */}
        {/* BOTTOM SECTION: RECENTLY VIEWED           */}
        {/* ========================================= */}
        {recentlyViewed.length > 0 && (
          <section className="pt-10 border-t border-stone-200/80 space-y-6">
            <h3 className="text-xl md:text-2xl font-bold font-serif text-stone-900 tracking-tight">
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
