"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ShoppingBag,
  Star,
  Check,
  Heart,
  Download,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart";
import { useUserStore } from "@/store/user";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { formatCurrency } from "@/utils/helper";
import { cn } from "@/lib/utils";
import { toggleProductLike } from "@/lib/api/likes";
import type { Product, ProductClass, ProductVariant } from "@/types/products";
import type { MenuItem } from "@/constants/menu";

export type CardProduct =
  | Product
  | MenuItem
  | {
      id: string;
      price?: number;
      title?: string;
      name?: string;
      description?: string | null;
      image?: string;
      images?: string[];
      category?: string | null;
      currency?: string | null;
      inventory_count?: number | null;
      tags?: ("V" | "VE" | "GF" | string)[];
      slug?: string;
      product_class?: ProductClass;
      variants?: ProductVariant[];
    };

export interface MenuCardProps {
  product: CardProduct;
  tenantSlug?: string;
  className?: string;
  href?: string;
}

export function MenuCard({
  product,
  tenantSlug: explicitSlug,
  className,
  href: explicitHref,
}: MenuCardProps) {
  const params = useParams();
  const tenantSlug = explicitSlug || (params?.tenant as string) || "store";

  const { addToCart } = useCartStore();
  const { user } = useUserStore();
  const { branding, tenant } = useTenantTheme();

  const [isAdded, setIsAdded] = useState(false);
  const [overrideLiked, setOverrideLiked] = useState<{
    id: string;
    liked: boolean;
  } | null>(null);

  const productLikedProp = (product as Product).is_liked;
  const isLiked =
    overrideLiked?.id === product.id
      ? overrideLiked.liked
      : typeof productLikedProp === "boolean"
        ? productLikedProp
        : false;

  const primaryColor = branding?.primaryColor || "#059669";
  const secondaryColor = branding?.secondaryColor || "#10b981";
  const tenantCurrency = tenant?.currency || user?.tenant_currency || "NGN";

  // Product normalized fields
  const raw = product as {
    title?: string;
    name?: string;
    description?: string | null;
    image?: string;
    images?: string[];
    category?: string | null;
    currency?: string;
    inventory_count?: number;
    tags?: string[];
    product_class?: ProductClass;
    variants?: ProductVariant[];
  };

  const title = raw.name || raw.title || "Artisan Creation";
  const description =
    raw.description ||
    "Exquisitely crafted with premium artisanal ingredients and finest quality finishing.";
  const hasImage =
    (raw.images && raw.images.length > 0 && raw.images[0]) || raw.image;
  const imageUrl = hasImage
    ? raw.images && raw.images.length > 0
      ? raw.images[0]
      : (raw.image as string)
    : "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80";

  const categoryBadge = raw.category || "Signature";
  const currency = raw.currency || tenantCurrency;

  // Variants & Pricing in Core + JSONB + Variant architecture
  const variants = raw.variants || [];
  const primaryVariant = variants.length > 0 ? variants[0] : null;
  const price = primaryVariant?.price ?? product.price ?? 0;

  // Determine stock / tag / class badge text
  let stockBadgeText = "In Stock";
  if (raw.product_class === "service") {
    stockBadgeText = "Service";
  } else if (raw.product_class === "digital") {
    stockBadgeText = "Digital";
  } else if (variants.length > 1) {
    stockBadgeText = `${variants.length} Options`;
  } else if (raw.tags && raw.tags.length > 0) {
    stockBadgeText = raw.tags.join(" • ");
  } else if (primaryVariant && !primaryVariant.track_inventory) {
    stockBadgeText = "Unlimited";
  } else if (
    (primaryVariant && primaryVariant.stock_quantity > 0) ||
    (raw.inventory_count && raw.inventory_count > 0)
  ) {
    stockBadgeText = "In Stock";
  } else {
    stockBadgeText = "Exclusive";
  }

  const targetHref = explicitHref || `/${tenantSlug}/menu/${product.id}`;

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const next = !isLiked;
    setOverrideLiked({ id: product.id, liked: next });

    try {
      const storedLikes = localStorage.getItem(`ecommerce_likes_${tenantSlug}`);
      const parsed = storedLikes ? (JSON.parse(storedLikes) as string[]) : [];
      const updated = next
        ? Array.from(new Set([...parsed, product.id]))
        : parsed.filter((id) => id !== product.id);

      localStorage.setItem(
        `ecommerce_likes_${tenantSlug}`,
        JSON.stringify(updated),
      );
    } catch {
      // ignore
    }

    if (next) {
      toast.success(`Added "${title}" to your favorites!`, {
        icon: <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />,
      });
    } else {
      toast.info(`Removed "${title}" from favorites.`);
    }

    try {
      const res = await toggleProductLike(product.id, tenantSlug);
      if (res.status === "success" && typeof res.data?.liked === "boolean") {
        setOverrideLiked({ id: product.id, liked: res.data.liked });
      }
    } catch (err) {
      console.warn("Failed to toggle product like:", err);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart(
      {
        id: primaryVariant ? primaryVariant.id : product.id,
        name: title,
        price: price,
        description: description,
        image: imageUrl,
      },
      1,
    );

    setIsAdded(true);
    toast.success(`Added "${title}" to cart!`, {
      description: `${title} has been added to your order bag.`,
    });
    setTimeout(() => setIsAdded(false), 1800);
  };

  return (
    <Link
      href={targetHref}
      className={cn(
        "snap-start flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-2 shadow-sm hover:shadow-md transition-all group cursor-pointer",
        className,
      )}
    >
      <div>
        {/* Visual Image Header */}
        <div className="relative aspect-square w-full rounded-xl bg-stone-100 mb-2 flex flex-col justify-between p-1.5 overflow-hidden border border-stone-100">
          {/* Product Thumbnail */}
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 288px, 320px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-linear-to-t from-stone-950/40 via-transparent to-transparent pointer-events-none" />

          {/* Floating Badges & Like Button */}
          <div className="relative z-10 flex items-center justify-between gap-1 w-full">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                style={{
                  backgroundColor: `${primaryColor}e6`,
                }}
                className="text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs shadow-xs border-transparent rounded-md px-2 py-0.5"
              >
                {stockBadgeText}
              </Badge>
              <Badge
                variant="outline"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  color: secondaryColor,
                  borderColor: "rgba(255, 255, 255, 0.6)",
                }}
                className="text-[10px] font-semibold uppercase tracking-wider backdrop-blur-xs shadow-xs rounded-md px-2 py-0.5"
              >
                {categoryBadge}
              </Badge>
            </div>

            {/* Favorite / Heart Button */}
            <button
              onClick={handleToggleLike}
              aria-label={isLiked ? "Unlike product" : "Like product"}
              className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs transition-transform hover:scale-110 active:scale-90 cursor-pointer border border-white/80 shrink-0"
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  isLiked
                    ? "fill-rose-500 text-rose-500"
                    : "text-stone-600 hover:text-rose-500",
                )}
              />
            </button>
          </div>

          {/* Rating chip / Specifications indicator */}
          {((product as Product).reviews_count ?? 0) > 0 && (
            <div className="relative z-10 flex items-center gap-1 text-xs text-amber-500 bg-white/90 backdrop-blur-xs px-1.5 py-1 rounded-md self-start shadow-xs">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="font-semibold text-stone-900">
                {Number((product as Product).average_rating || 0).toFixed(1)}
              </span>
              <span className="text-[10px] text-stone-400 font-normal">
                ({(product as Product).reviews_count})
              </span>
            </div>
          )}
        </div>

        {/* Product Title & Details */}
        <div className="block group/title">
          <h5 className="font-secondary font-bold text-stone-950 mb-1 group-hover/title:opacity-80 transition-opacity line-clamp-1">
            {title}
          </h5>
        </div>
        <p className="text-stone-500 text-xs line-clamp-2 mb-2 font-light min-h-8">
          {description}
        </p>
      </div>

      {/* Price & Add to Cart Button */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
        <div>
          <h5 className="font-bold text-stone-950 font-secondary block leading-tight">
            {formatCurrency(price, currency)}
          </h5>
          {variants.length > 1 && (
            <span className="text-[10px] text-stone-400 font-normal block">
              from {variants.length} variants
            </span>
          )}
        </div>

        <Button
          size="default"
          onClick={handleAddToCart}
          style={{
            backgroundColor: isAdded ? secondaryColor : primaryColor,
            color: "#ffffff",
          }}
          className="group/btn text-xs font-semibold rounded-lg transition-all hover:opacity-90 active:scale-95 cursor-pointer px-2.5 py-1.5 h-8.5 flex items-center gap-0 overflow-hidden"
        >
          {isAdded ? (
            <>
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span className="max-w-0 group-hover/btn:pl-1.5 opacity-0 group-hover/btn:max-w-28 group-hover/btn:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">
                Added
              </span>
            </>
          ) : (
            <>
              {raw.product_class === "service" ? (
                <Calendar className="h-3.5 w-3.5 shrink-0" />
              ) : raw.product_class === "digital" ? (
                <Download className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="max-w-0 group-hover/btn:pl-1.5 opacity-0 group-hover/btn:max-w-28 group-hover/btn:opacity-100 transition-all duration-300 overflow-hidden whitespace-nowrap">
                {raw.product_class === "service"
                  ? "Book Now"
                  : raw.product_class === "digital"
                    ? "Get Digital"
                    : "Add to Cart"}
              </span>
            </>
          )}
        </Button>
      </div>
    </Link>
  );
}

export default MenuCard;
