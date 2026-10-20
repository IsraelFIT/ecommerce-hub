"use client";

import { Star, Loader2 } from "lucide-react";
import { ProductFilter } from "@/types/products";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/utils/helper";
import { cn } from "@/lib/utils";

export interface MenuSidebarProps {
  isLoading: boolean;
  isFiltering: boolean;
  availableCategories: { name: string; count?: number }[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedClass?: string;
  setSelectedClass?: (cls: string) => void;
  classCounts?: Record<string, number>;
  setCurrentPage?: (page: number) => void;
  priceRange: [number, number];
  setPriceRange: (val: [number, number]) => void;
  minPrice: number;
  maxCatalogPrice: number;
  tenantCurrency?: string;
  tenantFilters: ProductFilter[];
  selectedCustomFilters: Record<string, string[]>;
  toggleCustomFilter: (slug: string, option: string) => void;
  selectedRating: number;
  setSelectedRating: (rating: number) => void;
  availability: "all" | "available" | "schedule";
  setAvailability: (avail: "all" | "available" | "schedule") => void;
  handleClearAll: () => void;
  onApplyFilters?: () => void;
  className?: string;
}

const CLASS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Physical", value: "physical" },
  { label: "Digital", value: "digital" },
  { label: "Service", value: "service" },
];

export function MenuSidebar({
  isLoading,
  isFiltering,
  availableCategories,
  selectedCategory,
  setSelectedCategory,
  selectedClass = "all",
  setSelectedClass,
  classCounts,
  setCurrentPage,
  priceRange,
  setPriceRange,
  minPrice,
  maxCatalogPrice,
  tenantCurrency = "NGN",
  tenantFilters,
  selectedCustomFilters,
  toggleCustomFilter,
  selectedRating,
  setSelectedRating,
  availability,
  setAvailability,
  handleClearAll,
  onApplyFilters,
  className,
}: MenuSidebarProps) {
  return (
    <aside
      className={cn(
        "lg:col-span-3 bg-white rounded-2xl border border-stone-200/90 p-5 space-y-6 sticky top-24",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <h5 className="font-bold text-stone-900">Filters</h5>
        <button
          type="button"
          onClick={handleClearAll}
          className="text-xs text-stone-500 hover:text-stone-900 font-medium transition-colors cursor-pointer"
        >
          Clear all
        </button>
      </div>

      {/* Class */}
      <div className="space-y-3 pb-4 border-b border-stone-100">
        <h6 className="font-bold text-stone-900">Class</h6>
        <div className="space-y-2">
          {CLASS_OPTIONS.map((opt) => {
            const isChecked =
              (selectedClass || "all").toLowerCase() ===
              opt.value.toLowerCase();
            const count = classCounts?.[opt.value];
            return (
              <label
                key={opt.value}
                className="flex items-center justify-between text-xs text-foreground hover:text-stone-950 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="product_class"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedClass?.(opt.value);
                      setCurrentPage?.(1);
                    }}
                    className="w-4 h-4 text-primary focus:ring-primary border-stone-300 accent-primary cursor-pointer"
                  />
                  <span className={cn(isChecked && "font-bold text-stone-950")}>
                    {opt.label}
                  </span>
                </div>
                {count !== undefined && (
                  <span className="text-[11px] text-stone-400">({count})</span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* 1. Category Checkboxes */}
      <div className="space-y-3">
        <h6 className="font-bold text-stone-900">Category</h6>
        <div className="space-y-2">
          {isLoading && availableCategories.length === 0 ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-3.5 w-24 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2.5 text-xs text-foreground hover:text-stone-950 cursor-pointer select-none">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === "ALL"}
                  onChange={() => {
                    setSelectedCategory("ALL");
                    setCurrentPage?.(1);
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
                        setCurrentPage?.(1);
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
            </>
          )}
        </div>
      </div>

      <div className="h-px bg-stone-100" />

      {/* 2. Price Range Slider (With Tenant Currency) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h6 className="font-bold text-stone-900">Price Range</h6>
          <span className="text-xs font-bold text-primary">
            {formatCurrency(priceRange[0], tenantCurrency)} –{" "}
            {formatCurrency(priceRange[1], tenantCurrency)}
          </span>
        </div>

        <div className="pt-2 pb-1">
          <Slider
            min={minPrice}
            max={maxCatalogPrice > minPrice ? maxCatalogPrice : minPrice + 100}
            step={1}
            value={[priceRange[0], priceRange[1]]}
            onValueChange={(val) => {
              if (Array.isArray(val) && val.length === 2) {
                setPriceRange([val[0], val[1]]);
                setCurrentPage?.(1);
              }
            }}
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
          <span>{formatCurrency(minPrice, tenantCurrency)}</span>
          <span>{formatCurrency(maxCatalogPrice, tenantCurrency)}</span>
        </div>
      </div>

      <div className="h-px bg-stone-100" />

      {/* 3. Dynamic Filters configured by tenant admin */}
      {isLoading && tenantFilters.length === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-24 rounded" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-3.5 w-20 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        tenantFilters.length > 0 &&
        tenantFilters.map((filter) => (
          <div key={filter.id} className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              {filter.name}
            </h4>
            <div className="space-y-2">
              {filter.options.map((opt) => {
                const isChecked =
                  selectedCustomFilters[filter.slug]?.includes(opt) || false;
                return (
                  <label
                    key={opt}
                    className="flex items-center gap-2.5 text-xs text-foreground hover:text-stone-950 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCustomFilter(filter.slug, opt)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-stone-300 accent-primary cursor-pointer"
                    />
                    <span
                      className={cn(isChecked && "font-bold text-stone-950")}
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
      )}

      {/* 4. Rating */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
          Rating
        </h4>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => (
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

      {/* 5. Availability */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
          Availability
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 text-xs text-foreground hover:text-stone-950 cursor-pointer select-none">
            <input
              type="radio"
              name="avail"
              checked={availability === "all"}
              onChange={() => {
                setAvailability("all");
                setCurrentPage?.(1);
              }}
              className="w-4 h-4 text-primary focus:ring-primary border-stone-300 accent-primary cursor-pointer"
            />
            <span>All Items</span>
          </label>
          <label className="flex items-center gap-2.5 text-xs text-foreground hover:text-stone-950 cursor-pointer select-none">
            <input
              type="radio"
              name="avail"
              checked={availability === "available"}
              onChange={() => {
                setAvailability("available");
                setCurrentPage?.(1);
              }}
              className="w-4 h-4 text-primary focus:ring-primary border-stone-300 accent-primary cursor-pointer"
            />
            <span>Available Now</span>
          </label>
          <label className="flex items-center gap-2.5 text-xs text-foreground hover:text-stone-950 cursor-pointer select-none">
            <input
              type="radio"
              name="avail"
              checked={availability === "schedule"}
              onChange={() => {
                setAvailability("schedule");
                setCurrentPage?.(1);
              }}
              className="w-4 h-4 text-primary focus:ring-primary border-stone-300 accent-primary cursor-pointer"
            />
            <span>Preorder</span>
          </label>
        </div>
      </div>

      {/* Apply Filters Button */}
      {onApplyFilters && (
        <Button
          size="default"
          onClick={onApplyFilters}
          disabled={isFiltering}
          className="w-full"
        >
          {isFiltering ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              Applying...
            </>
          ) : (
            "Apply Filters"
          )}
        </Button>
      )}
    </aside>
  );
}
