"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Heart,
  Share2,
  Bell,
  Star,
  Plus,
  Minus,
  ShoppingBag,
  Zap,
  Check,
  BadgeCheck,
  Truck,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCartStore } from "@/store/cart";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { useUserStore } from "@/store/user";
import { formatCurrency, getTenantRoute } from "@/utils/helper";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/types/products";
import { getProductById } from "@/lib/api/products";
import { getTenantStats, type TenantSellerStats } from "@/lib/api/tenants";
import { toggleProductLike, getProductLikeStatus } from "@/lib/api/likes";
import {
  getReviews,
  getReviewStats,
  createReview,
  type ReviewItem,
  type ReviewStats,
} from "@/lib/api/reviews";
import { Label } from "@/components/ui/label";

function getColorHex(name: string): string {
  const clean = name.toLowerCase().trim();
  if (clean.startsWith("#") || clean.startsWith("rgb")) return clean;
  const colorMap: Record<string, string> = {
    blue: "#2563eb",
    "light blue": "#38bdf8",
    "dark blue": "#1e3a8a",
    navy: "#0f172a",
    green: "#16a34a",
    "light green": "#4ade80",
    "dark green": "#14532d",
    emerald: "#059669",
    teal: "#0d9488",
    yellow: "#eab308",
    amber: "#f59e0b",
    gold: "#d97706",
    red: "#dc2626",
    crimson: "#991b1b",
    rose: "#e11d48",
    pink: "#ec4899",
    purple: "#9333ea",
    violet: "#7c3aed",
    indigo: "#4f46e5",
    orange: "#ea580c",
    black: "#18181b",
    white: "#ffffff",
    gray: "#71717a",
    grey: "#71717a",
    silver: "#e2e8f0",
    brown: "#78350f",
    chocolate: "#451a03",
    beige: "#f5f5dc",
    cream: "#fef3c7",
    ivory: "#fffff0",
  };
  return colorMap[clean] || "#94a3b8";
}

function getOptionValues(
  options: Record<string, unknown> | undefined,
  targetKey: string,
): string[] {
  if (!options) return [];
  const normalizedTarget = targetKey.toLowerCase();
  for (const [k, v] of Object.entries(options)) {
    const normK = k.toLowerCase().trim();
    if (normK === normalizedTarget || normK.startsWith(normalizedTarget)) {
      if (Array.isArray(v)) {
        return v
          .map(String)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (typeof v === "string") {
        return v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (v !== undefined && v !== null) {
        return [String(v).trim()];
      }
    }
  }
  return [];
}

export interface ItemDetails {
  id: string;
  name: string;
  category: string;
  price: number;
  compare_at_price?: number | null;
  currency?: string;
  image: string;
  images?: string[];
  description: string;
  longDescription: string;
  tags?: string[];
  sizes: string[];
  flavors: string[];
  allergenInfo: string;
  specifications?: Record<string, unknown>;
  filters?: Record<string, string[]>;
  availability?: string;
  variants?: ProductVariant[];
  product_class?: string;
  sku?: string;
  stock_quantity?: number;
  average_rating?: number;
  reviews_count?: number;
  is_liked?: boolean;
  likes_count?: number;
}

interface ItemDetailsClientProps {
  item: ItemDetails;
}

export function ItemDetailsClient({
  item: initialItem,
}: ItemDetailsClientProps) {
  const [item, setItem] = useState<ItemDetails>(initialItem);
  const [isLiked, setIsLiked] = useState(initialItem.is_liked ?? false);

  const params = useParams();
  const tenantSlug = (params?.tenant as string) || "store";

  useEffect(() => {
    let isMounted = true;
    if (initialItem?.id) {
      getProductById(initialItem.id, tenantSlug)
        .then((res) => {
          if (isMounted && res.status === "success" && res.data) {
            const p = res.data;
            const pVariants =
              p.variants && p.variants.length > 0
                ? p.variants
                : [
                    {
                      id: `${p.id}-default`,
                      sku: p.sku || "Standard",
                      price: p.price ?? 0,
                      compare_at_price: null,
                      track_inventory: true,
                      stock_quantity: p.inventory_count ?? 0,
                      options: {},
                    },
                  ];
            const pImages =
              p.images && p.images.length > 0
                ? p.images
                : ["/images/placeholder.jpg"];
            const pSpecs = (p.specifications || {}) as Record<string, unknown>;
            const pDietaryInfo =
              (typeof pSpecs.dietary === "string" && pSpecs.dietary) ||
              (typeof pSpecs.allergens === "string" && pSpecs.allergens) ||
              (typeof pSpecs.material === "string" && pSpecs.material) ||
              "";

            setItem({
              id: p.id,
              name: p.name || p.title || "Product",
              category: (p.category || "General") as string,
              price: pVariants[0]?.price ?? p.price ?? 0,
              compare_at_price: pVariants[0]?.compare_at_price || null,
              currency: p.currency,
              image: pImages[0],
              images: pImages,
              description: p.description || "",
              longDescription: p.description || "",
              tags: Array.isArray(pSpecs.tags) ? (pSpecs.tags as string[]) : [],
              sizes: [],
              flavors: Array.isArray(pSpecs.flavors)
                ? (pSpecs.flavors as string[])
                : [],
              allergenInfo: pDietaryInfo,
              specifications: pSpecs,
              filters: (p.filters || {}) as Record<string, string[]>,
              availability:
                p.availability ||
                (pSpecs.availability as string) ||
                "available",
              variants: pVariants,
              product_class: p.product_class,
              sku: pVariants[0]?.sku || p.sku || undefined,
              stock_quantity:
                pVariants[0]?.stock_quantity ?? p.inventory_count ?? 0,
              average_rating: p.average_rating,
              reviews_count: p.reviews_count,
              is_liked: p.is_liked,
              likes_count: p.likes_count,
            });
            if (typeof p.is_liked === "boolean") {
              setIsLiked(p.is_liked);
            }
          }
        })
        .catch((err) => {
          console.warn("Client fetch for product failed:", err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [initialItem.id, tenantSlug]);

  const { tenant, branding } = useTenantTheme();
  const [logoError, setLogoError] = useState(false);
  const [sellerStats, setSellerStats] = useState<TenantSellerStats | null>(
    null,
  );

  const tenantLogo =
    branding?.logoUrl ||
    (tenant?.branding_config as Record<string, unknown> | undefined)?.logoUrl ||
    null;

  useEffect(() => {
    let isMounted = true;
    if (tenantSlug) {
      getTenantStats(tenantSlug)
        .then((res) => {
          if (isMounted && res.status === "success" && res.data) {
            setSellerStats(res.data);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  const [isAdded, setIsAdded] = useState(false);

  // Product Reviews State
  const [productReviews, setProductReviews] = useState<ReviewItem[]>([]);
  const [productReviewStats, setProductReviewStats] =
    useState<ReviewStats | null>(null);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);

  // Write Review Dialog State
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewEmail, setNewReviewEmail] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadProductReviews = useCallback(async () => {
    if (!item.id || !tenantSlug) return;
    try {
      setIsReviewsLoading(true);
      const [reviewsRes, statsRes] = await Promise.all([
        getReviews({
          tenantSlug,
          productId: item.id,
          status: "approved",
          perPage: 50,
        }),
        getReviewStats({ tenantSlug, productId: item.id }),
      ]);
      if (reviewsRes.status === "success" && reviewsRes.data?.items) {
        setProductReviews(reviewsRes.data.items);
      }
      if (statsRes.status === "success" && statsRes.data) {
        setProductReviewStats(statsRes.data);
      }
    } catch (err) {
      console.error("Failed to load product reviews:", err);
    } finally {
      setIsReviewsLoading(false);
    }
  }, [item.id, tenantSlug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProductReviews();
  }, [loadProductReviews]);

  useEffect(() => {
    let isMounted = true;
    if (item.id) {
      getProductLikeStatus(item.id, tenantSlug)
        .then((res) => {
          if (isMounted && res.status === "success") {
            setIsLiked(res.data.liked);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [item.id, tenantSlug]);

  const { user } = useUserStore();
  const tenantCurrency =
    item.currency || tenant?.currency || user?.tenant_currency || "NGN";

  const router = useRouter();
  const addToCart = useCartStore((state) => state.addToCart);

  // Gallery state: extract all unique, non-empty image URLs
  const images = useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(item.images) && item.images.length > 0) {
      item.images.forEach((img) => {
        if (img && typeof img === "string" && img.trim().length > 0) {
          const trimmed = img.trim();
          if (!list.includes(trimmed)) {
            list.push(trimmed);
          }
        }
      });
    }
    if (
      item.image &&
      typeof item.image === "string" &&
      item.image.trim().length > 0
    ) {
      const trimmed = item.image.trim();
      if (!list.includes(trimmed)) {
        list.push(trimmed);
      }
    }
    return list.length > 0 ? list : ["/images/placeholder.jpg"];
  }, [item.images, item.image]);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  // Derive safe index without needing an effect or causing cascading renders
  const activeImageIdx =
    selectedImageIdx < images.length ? selectedImageIdx : 0;

  // Variant / Option states
  const variants =
    item.variants && item.variants.length > 0 ? item.variants : [];
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Active pricing derived from selected variant or base item
  const currentVariant = variants[selectedVariantIdx];
  const currentPrice = currentVariant?.price ?? item.price;
  const compareAtPrice =
    currentVariant?.compare_at_price ?? item.compare_at_price;
  const currentStock =
    currentVariant?.stock_quantity ?? item.stock_quantity ?? 0;
  const tracksInventory =
    currentVariant?.track_inventory ??
    (item.product_class !== "service" && item.product_class !== "digital");
  const isOutOfStock =
    item.availability === "out_of_stock" ||
    (tracksInventory && currentStock <= 0);
  const isLowStock =
    !isOutOfStock &&
    (item.availability === "low_stock" ||
      (tracksInventory && currentStock > 0 && currentStock < 5));

  // Options attached to the selected variant
  const colorOptions = useMemo(() => {
    const vColors = getOptionValues(currentVariant?.options, "color");
    if (vColors.length > 0) return vColors;
    return getOptionValues(item.specifications, "color");
  }, [currentVariant?.options, item.specifications]);

  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (item.filters && typeof item.filters === "object") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFilters((prev) => {
        const next = { ...prev };
        Object.entries(item.filters || {}).forEach(
          ([filterKey, filterOptions]) => {
            if (Array.isArray(filterOptions) && filterOptions.length > 0) {
              if (!next[filterKey]) {
                next[filterKey] = String(filterOptions[0]);
              }
            }
          },
        );
        return next;
      });
    }
  }, [item.filters]);

  const sizeOptions = useMemo(() => {
    if (item.filters) {
      const filterSizes =
        item.filters.sizes ||
        item.filters.size ||
        item.filters.Sizes ||
        item.filters.Size;
      if (Array.isArray(filterSizes) && filterSizes.length > 0) {
        return filterSizes.map(String);
      }
    }
    const vSizes = getOptionValues(currentVariant?.options, "size");
    if (vSizes.length > 0) return vSizes;
    return getOptionValues(item.specifications, "size");
  }, [item.filters, currentVariant?.options, item.specifications]);

  const otherFilterEntries = useMemo(() => {
    if (!item.filters || typeof item.filters !== "object") return [];
    return Object.entries(item.filters).filter(([k, opts]) => {
      const norm = k.toLowerCase().trim();
      return (
        norm !== "sizes" &&
        norm !== "size" &&
        Array.isArray(opts) &&
        opts.length > 0
      );
    });
  }, [item.filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedColorIdx(0);
    setSelectedSizeIdx(0);
  }, [selectedVariantIdx]);

  const handleToggleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    try {
      const res = await toggleProductLike(item.id, tenantSlug);
      if (res.status === "success") {
        if (res.data.liked) {
          toast.success(`Saved "${item.name}" to your wishlist!`, {
            icon: <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />,
          });
        } else {
          toast.info(`Removed "${item.name}" from wishlist.`);
        }
      }
    } catch {
      // Keep optimistic update
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied to clipboard!");
    }
  };

  const handleAddToCart = (redirectAfter = false) => {
    if (isOutOfStock) {
      toast.error(
        `The item '${item.name}' is out of stock and is not available.`,
      );
      return;
    }
    const selectedSizeLabel =
      selectedFilters["sizes"] ||
      selectedFilters["size"] ||
      sizeOptions[selectedSizeIdx] ||
      "";
    const selectedColorLabel = colorOptions[selectedColorIdx] || "";

    const otherFilterDescriptions = otherFilterEntries
      .map(([k]) => {
        const val = selectedFilters[k];
        return val ? `${k.charAt(0).toUpperCase() + k.slice(1)}: ${val}` : null;
      })
      .filter(Boolean);

    const descParts = [
      selectedSizeLabel ? `Size: ${selectedSizeLabel}` : null,
      selectedColorLabel ? `Color: ${selectedColorLabel}` : null,
      ...otherFilterDescriptions,
    ].filter(Boolean);

    const selectedOptions: Record<string, string> = {};
    if (selectedSizeLabel) selectedOptions.size = selectedSizeLabel;
    if (selectedColorLabel) selectedOptions.color = selectedColorLabel;
    otherFilterEntries.forEach(([k]) => {
      const val = selectedFilters[k];
      if (val) selectedOptions[k] = val;
    });

    addToCart(
      {
        id: currentVariant ? currentVariant.id : item.id,
        name: item.name,
        price: currentPrice,
        image: images[activeImageIdx] || item.image,
        description:
          descParts.length > 0 ? descParts.join(" • ") : item.description,
        ...(Object.keys(selectedOptions).length > 0
          ? { options: selectedOptions }
          : {}),
      },
      quantity,
    );

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);

    toast.success(`Added ${quantity}x "${item.name}" to cart!`, {
      description: descParts.length > 0 ? descParts.join(" • ") : undefined,
      action: {
        label: "View Cart",
        onClick: () => router.push(getTenantRoute(tenantSlug, "/cart")),
      },
    });

    if (redirectAfter) {
      router.push(getTenantRoute(tenantSlug, "/cart"));
    }
  };

  // Extract all dynamic specifications grouped by key / category
  const specCategories = useMemo<{ title: string; items: string[] }[]>(() => {
    const specs = item.specifications || {};
    const categories: { title: string; items: string[] }[] = [];

    for (const [key, val] of Object.entries(specs)) {
      if (key.toLowerCase() === "filters") continue;

      const items: string[] = [];
      if (Array.isArray(val)) {
        val.forEach((v) => {
          if (v !== undefined && v !== null && String(v).trim()) {
            items.push(String(v).trim());
          }
        });
      } else if (typeof val === "object" && val !== null) {
        Object.entries(val).forEach(([subK, subV]) => {
          if (subV !== undefined && subV !== null) {
            items.push(`${subK}: ${String(subV).trim()}`);
          }
        });
      } else if (val !== undefined && val !== null && String(val).trim()) {
        items.push(String(val).trim());
      }

      if (items.length > 0) {
        categories.push({
          title: key,
          items,
        });
      }
    }

    return categories;
  }, [item.specifications]);

  return (
    <div className="py-5">
      <div className="container flex-col items-start gap-5">
        {/* 1. Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-foreground font-medium">
          <Link
            href={getTenantRoute(tenantSlug, "/")}
            className="hover:text-stone-900 transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          <Link
            href={getTenantRoute(tenantSlug, "/menu")}
            className="hover:text-stone-900 transition-colors"
          >
            {item.category || "Catalog"}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          <span className="text-stone-900 font-semibold truncate max-w-xs">
            {item.name}
          </span>
        </nav>

        {/* 2. Main Product Grid (Left: Image Gallery, Right: Details) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Gallery (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Big Main Image Preview */}
            <div className="relative w-fit max-w-full rounded-lg bg-card border border-border overflow-hidden">
              <Image
                src={
                  images[activeImageIdx] ||
                  images[0] ||
                  "/images/placeholder.jpg"
                }
                alt={item.name}
                width={1200}
                height={800}
                priority
                className="object-contain block transition-all duration-300"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Thumbnail Carousel / Row */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={cn(
                      "relative w-20 h-20 rounded-xl overflow-hidden bg-card border-2 transition-all cursor-pointer shrink-0",
                      activeImageIdx === idx
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-stone-200/90 hover:border-stone-300",
                    )}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover transition-all"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information & Actions (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Header Title & Actions */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-bold text-foreground">{item.name}</h2>

                {/* Top Action Icons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toast.info("Price alert enabled")}
                    aria-label="Price Alert"
                    className="p-2 rounded-full text-stone-400 hover:text-foreground hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Bell className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleShare}
                    aria-label="Share product"
                    className="p-2 rounded-full text-stone-400 hover:text-foreground hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleToggleLike}
                    aria-label="Wishlist"
                    className="p-2 rounded-full text-stone-400 hover:text-rose-500 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        isLiked && "fill-rose-500 text-rose-500",
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Subtitle / Rating / Class */}
              <div className="flex items-center gap-3 text-sm text-stone-500 mt-2 flex-wrap">
                <span className="font-semibold text-foreground">
                  {item.category}
                </span>
                <span>•</span>
                <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                  Sold 500+
                </span>
                <span>•</span>
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-stone-900 font-semibold">
                    {(
                      productReviewStats?.average_rating ??
                      item.average_rating ??
                      0.0
                    ).toFixed(1)}
                  </span>
                  <span className="text-stone-400 font-normal">
                    (
                    {productReviewStats?.total_reviews ??
                      item.reviews_count ??
                      productReviews.length}
                    )
                  </span>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <h3 className="font-bold text-foreground font-secondary">
                  {formatCurrency(currentPrice, tenantCurrency)}
                </h3>
                {compareAtPrice && compareAtPrice > currentPrice && (
                  <h5 className="text-foreground/70 line-through">
                    {formatCurrency(compareAtPrice, tenantCurrency)}
                  </h5>
                )}
              </div>
            </div>

            <div className="w-full h-px bg-border" />

            {/* Variant Pills (only if more than 1 variant exists) */}
            {variants.length > 1 && (
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider block">
                  Variant
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {variants.map((v, idx) => {
                    const isSelected = selectedVariantIdx === idx;
                    const optEntries = Object.entries(v.options || {});
                    const optText = optEntries
                      .map(([, val]) =>
                        Array.isArray(val) ? val.join(", ") : val,
                      )
                      .join(" / ");
                    const label = optText || v.sku || `Variant ${idx + 1}`;
                    return (
                      <button
                        key={v.id || idx}
                        type="button"
                        onClick={() => setSelectedVariantIdx(idx)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer",
                          isSelected
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-stone-50 dark:bg-stone-900 text-foreground border-border hover:border-primary hover:bg-white dark:hover:bg-stone-800",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Swatches, Sizes & Quantity */}
            <div className="space-y-5">
              {/* Color Swatches (only displays if attached to the selected variant) */}
              {colorOptions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider block">
                    Color{colorOptions[selectedColorIdx] ? `: ` : ""}
                    <span className="font-normal text-muted-foreground capitalize">
                      {colorOptions[selectedColorIdx] || ""}
                    </span>
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {colorOptions.map((colorName, idx) => {
                      const hex = getColorHex(colorName);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedColorIdx(idx)}
                          title={colorName}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center p-0.5",
                            selectedColorIdx === idx
                              ? "border-primary scale-105"
                              : "border-stone-200 dark:border-stone-700 hover:border-stone-400",
                          )}
                        >
                          <span
                            className="w-full h-full rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: hex }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sizes (derived from item.filters or variants) */}
              {sizeOptions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider block">
                    Size:{" "}
                    <span className="font-normal text-muted-foreground">
                      {selectedFilters["sizes"] ||
                        selectedFilters["size"] ||
                        sizeOptions[selectedSizeIdx] ||
                        ""}
                    </span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {sizeOptions.map((sizeName, idx) => {
                      const isSelected =
                        selectedFilters["sizes"] === sizeName ||
                        selectedFilters["size"] === sizeName ||
                        (!selectedFilters["sizes"] &&
                          !selectedFilters["size"] &&
                          selectedSizeIdx === idx);

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedSizeIdx(idx);
                            setSelectedFilters((prev) => ({
                              ...prev,
                              sizes: sizeName,
                              size: sizeName,
                            }));
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer min-w-9 text-center",
                            isSelected
                              ? "bg-primary text-white border-primary shadow-xs"
                              : "bg-stone-50 dark:bg-stone-900 text-foreground border-border hover:border-primary hover:bg-white dark:hover:bg-stone-800",
                          )}
                        >
                          {sizeName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Other Custom Filter Groups (e.g. dietary, etc.) */}
              {otherFilterEntries.map(([fKey, fOptions]) => {
                const label =
                  fKey.charAt(0).toUpperCase() +
                  fKey.slice(1).replace(/_/g, " ");
                const currentVal = selectedFilters[fKey] || fOptions[0];

                return (
                  <div key={fKey} className="space-y-2">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider block">
                      {label}:{" "}
                      <span className="font-normal text-muted-foreground">
                        {currentVal}
                      </span>
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {fOptions.map((optName, optIdx) => {
                        const isSelected =
                          (selectedFilters[fKey] || fOptions[0]) === optName;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() =>
                              setSelectedFilters((prev) => ({
                                ...prev,
                                [fKey]: optName,
                              }))
                            }
                            className={cn(
                              "px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer min-w-9 text-center",
                              isSelected
                                ? "bg-primary text-white border-primary shadow-xs"
                                : "bg-stone-50 dark:bg-stone-900 text-foreground border-border hover:border-primary hover:bg-white dark:hover:bg-stone-800",
                            )}
                          >
                            {optName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Quantity Counter */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider block">
                  Quantity
                </span>
                <div className="inline-flex items-center border border-border bg-stone-50 dark:bg-stone-900 rounded-xl px-3 py-1.5 gap-4">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-stone-400 hover:text-foreground transition-colors p-0.5 cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs font-bold text-foreground w-4 text-center select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => {
                      if (
                        tracksInventory &&
                        currentStock > 0 &&
                        quantity >= currentStock
                      ) {
                        toast.error(`Only ${currentStock} units available.`);
                        return;
                      }
                      setQuantity(quantity + 1);
                    }}
                    className="text-stone-400 hover:text-foreground transition-colors p-0.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Product Description
              </h4>
              <p className="text-foreground font-light">
                {item.longDescription || item.description}
              </p>
            </div>

            {/* Specifications */}
            {specCategories.length > 0 && (
              <div className="space-y-3.5 pt-1">
                {specCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      {cat.title}
                    </h4>
                    <ul className="space-y-0.5 text-stone-600 font-light">
                      {cat.items.map((itemVal, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                          <span className="leading-relaxed">{itemVal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Availability */}
            {isOutOfStock ? (
              <div className="flex items-center gap-2 text-xs font-medium text-rose-700 bg-rose-50/80 border border-rose-200/70 px-3.5 py-2.5 rounded-xl">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Out of Stock: This item is currently not available</span>
              </div>
            ) : isLowStock ? (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50/80 border border-amber-200/70 px-3.5 py-2.5 rounded-xl">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Low Quantity: Only {currentStock} left in stock - order soon!
                </span>
              </div>
            ) : item.availability === "preorder" ? (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50/80 border border-amber-200/70 px-3.5 py-2.5 rounded-xl">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Preorder: Made to order / Schedule for later</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50/70 border border-emerald-200/60 px-3.5 py-2.5 rounded-xl">
                <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  In Stock: Ships in 1–2 business days
                  {tracksInventory && currentStock > 0
                    ? ` (${currentStock} available)`
                    : ""}
                </span>
              </div>
            )}

            {/* Store Seller Profile Card */}
            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80">
              <div className="flex items-center gap-3">
                {tenantLogo && !logoError ? (
                  <div className="w-10 h-10 rounded-xl bg-card border border-stone-200/80 flex items-center justify-center overflow-hidden shrink-0 relative">
                    <Image
                      src={String(tenantLogo)}
                      alt={tenant?.name || "Store Logo"}
                      width={40}
                      height={40}
                      className="w-full h-full object-contain p-1 rounded-xl"
                      onError={() => setLogoError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary text-white font-bold flex items-center justify-center shrink-0">
                    <h4>{tenant?.name?.charAt(0) || "S"}</h4>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">
                      {tenant?.name || "Verified Store"}
                    </span>
                    <BadgeCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                    <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-amber-500" />
                      {(sellerStats?.rating ?? 5.0).toFixed(1)} (
                      {(sellerStats?.review_count ?? 0).toLocaleString()})
                    </span>
                    <span>•</span>
                    <span>
                      {(sellerStats?.orders_fulfilled ?? 0) > 0
                        ? `${(sellerStats?.orders_fulfilled ?? 0).toLocaleString()}+ Orders Fulfilled`
                        : "Orders Fulfilled"}
                    </span>
                    <span>•</span>
                    <span>
                      Since{" "}
                      {sellerStats?.member_since ||
                        (tenant?.created_at
                          ? new Date(tenant.created_at).getFullYear()
                          : 2026)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dual Action Buttons: Add to Cart & Buy Now */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                disabled={isOutOfStock}
                onClick={() => handleAddToCart(false)}
                className={isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}
              >
                {isOutOfStock ? (
                  <>
                    <ShoppingBag className="h-4 w-4 text-stone-400" />
                    <span>Out of Stock</span>
                  </>
                ) : isAdded ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4 text-stone-600" />
                    <span>Add to Cart</span>
                  </>
                )}
              </Button>

              <Button
                size="lg"
                disabled={isOutOfStock}
                onClick={() => handleAddToCart(true)}
                className={isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Zap className="h-4 w-4" />
                <span>{isOutOfStock ? "Unavailable" : "Buy Now"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 3. Reviews & Ratings Section */}
        <div className="pt-12 border-t border-stone-200 dark:border-stone-800 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">
                Customer Reviews & Ratings
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Verified customer reviews for {item.name}
              </p>
            </div>

            {/* Write a Review Button & Dialog */}
            <Dialog
              open={isReviewDialogOpen}
              onOpenChange={setIsReviewDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs h-9 cursor-pointer self-start sm:self-auto"
                >
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>Write a Review</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card p-6 rounded-2xl border border-border">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Write a Review for {item.name}
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!item.id) return;
                    if (!newReviewComment.trim()) {
                      toast.error("Please enter your review feedback.");
                      return;
                    }
                    try {
                      setIsSubmittingReview(true);
                      const res = await createReview(
                        {
                          product_id: item.id,
                          rating: newRating,
                          title: newReviewTitle.trim() || undefined,
                          comment: newReviewComment.trim(),
                          customer_name:
                            newReviewName.trim() ||
                            user?.full_name ||
                            (user?.first_name
                              ? `${user.first_name} ${user.last_name || ""}`.trim()
                              : undefined) ||
                            "Verified Customer",
                          customer_email:
                            newReviewEmail.trim() || user?.email || undefined,
                        },
                        tenantSlug,
                      );

                      if (res.status === "success") {
                        toast.success(
                          "Thank you! Your review has been submitted.",
                        );
                        setIsReviewDialogOpen(false);
                        setNewReviewTitle("");
                        setNewReviewComment("");
                        setNewRating(5);
                        loadProductReviews();
                      }
                    } catch (err) {
                      console.error(err);
                      toast.error("Failed to submit review.");
                    } finally {
                      setIsSubmittingReview(false);
                    }
                  }}
                  className="space-y-4 pt-2"
                >
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Your Rating *
                    </Label>
                    <div className="flex items-center justify-between gap-1.5">
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setNewRating(starVal)}
                          className="p-1 cursor-pointer hover:scale-110 transition-transform"
                        >
                          <Star
                            className={cn(
                              "h-8 w-8 transition-colors",
                              starVal <= newRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-stone-300 dark:text-stone-600",
                            )}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-foreground ml-2">
                        {newRating} / 5 Stars
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Review Title
                    </Label>
                    <Input
                      placeholder="e.g. Delicious cake, highly recommend!"
                      value={newReviewTitle}
                      onChange={(e) => setNewReviewTitle(e.target.value)}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Your Feedback *
                    </Label>
                    <Textarea
                      placeholder="Share details about the quality, flavor, packaging, or customer service..."
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      required
                      rows={3}
                      className="text-xs resize-none"
                    />
                  </div>

                  {!user && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Your Name
                        </Label>
                        <Input
                          placeholder="e.g. Sarah J."
                          value={newReviewName}
                          onChange={(e) => setNewReviewName(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Email (Optional)
                        </Label>
                        <Input
                          type="email"
                          placeholder="e.g. sarah@example.com"
                          value={newReviewEmail}
                          onChange={(e) => setNewReviewEmail(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsReviewDialogOpen(false)}
                      className="text-xs h-8 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmittingReview}
                      className="text-xs h-8 bg-primary text-white font-semibold cursor-pointer"
                    >
                      {isSubmittingReview ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Score Card (4 cols) */}
            <div className="lg:col-span-4 p-6 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-stone-950 dark:text-stone-100">
                  {(
                    productReviewStats?.average_rating ??
                    (productReviews.length > 0
                      ? productReviews.reduce((a, b) => a + b.rating, 0) /
                        productReviews.length
                      : 5.0)
                  ).toFixed(1)}
                </span>
                <span className="text-sm font-semibold text-stone-400">
                  / 5
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {productReviewStats?.total_reviews ?? productReviews.length}{" "}
                reviews
              </p>

              {/* Breakdown Bars */}
              <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                {[5, 4, 3, 2, 1].map((star) => {
                  const total =
                    productReviewStats?.total_reviews ?? productReviews.length;
                  const count =
                    productReviewStats?.rating_breakdown?.[star] ??
                    productReviews.filter((r) => r.rating === star).length;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-0.5 w-6 shrink-0 text-amber-500 font-semibold">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <span>{star}</span>
                      </div>
                      <div className="grow h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-stone-500 w-28 text-right shrink-0">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Reviews Summary Card (8 cols) */}
            <div className="lg:col-span-8 p-6 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 space-y-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <span>Customer Sentiment & Insights</span>
              </div>
              <p className="text-xs md:text-sm text-foreground leading-relaxed font-light">
                {productReviews.length > 0
                  ? `Based on ${productReviews.length} verified customer review${productReviews.length === 1 ? "" : "s"} for ${item.name}, buyers highlight the quality, craftsmanship, and satisfaction with their purchase.`
                  : `Be the first to share your experience with ${item.name}! Your verified review will help other shoppers discover this item.`}
              </p>
            </div>
          </div>

          {/* User Review Testimonial Cards from Database */}
          <div className="pt-2">
            {isReviewsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={`rev-skel-${n}`}
                    className="p-5 bg-card rounded-2xl border border-border space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-3.5 w-16 rounded-md" />
                    </div>
                    <Skeleton className="h-3.5 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-full rounded-md" />
                    <Skeleton className="h-3 w-5/6 rounded-md" />
                    <div className="pt-2 border-t border-border flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-3.5 w-24 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : productReviews.length === 0 ? (
              <div className="p-8 text-center space-y-2 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
                <Star className="h-8 w-8 text-stone-300 dark:text-stone-700 mx-auto" />
                <h4 className="text-sm font-semibold text-foreground">
                  No reviews yet
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  There are no reviews for {item.name} yet. Order this item and
                  be the first to leave your feedback!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productReviews.map((rev) => {
                  let formattedDate = "";
                  if (rev.created_at) {
                    try {
                      formattedDate = new Date(
                        rev.created_at,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    } catch {
                      formattedDate = rev.created_at;
                    }
                  }

                  return (
                    <div
                      key={rev.id}
                      className="p-5 bg-card rounded-2xl border border-border space-y-3 shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-400">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star
                                key={i}
                                className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                              />
                            ))}
                          </div>
                          {formattedDate && (
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {formattedDate}
                            </span>
                          )}
                        </div>
                        {rev.title && (
                          <h4 className="text-xs font-bold text-foreground">
                            {rev.title}
                          </h4>
                        )}
                        <p className="text-xs text-muted-foreground leading-relaxed font-light">
                          {rev.comment}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-2 border-t border-border">
                        <span className="font-semibold text-foreground truncate">
                          {rev.customer_name}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetailsClient;
