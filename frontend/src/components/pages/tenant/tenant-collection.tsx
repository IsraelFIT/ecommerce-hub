"use client";

import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Star,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  rating: number;
  badge: string;
}

interface TenantCollectionProps {
  storeName: string;
  tenantSlug: string;
}

export function TenantCollection({ storeName }: TenantCollectionProps) {
  const { addToCart } = useCartStore();
  const [addedId, setAddedId] = useState<string | null>(null);

  const products: ProductItem[] = [
    {
      id: "prod-1",
      name: "Signature Artisan Edition",
      price: 145.0,
      category: "Bespoke Collection",
      description:
        "Handcrafted with premium materials, immaculate finishing, and timeless aesthetic design.",
      rating: 4.9,
      badge: "Best Seller",
    },
    {
      id: "prod-2",
      name: "Executive Heritage Series",
      price: 195.0,
      category: "Limited Reserve",
      description:
        "Engineered for excellence. Impeccable attention to detail and durable craftsmanship.",
      rating: 5.0,
      badge: "Signature",
    },
    {
      id: "prod-3",
      name: "Minimalist Studio Choice",
      price: 89.0,
      category: "Daily Essentials",
      description:
        "Sophisticated minimalism combined with superior functionality and understated elegance.",
      rating: 4.8,
      badge: "Popular",
    },
    {
      id: "prod-4",
      name: "Premier Noir Custom Tier",
      price: 260.0,
      category: "Ultra Luxury",
      description:
        "Our highest tier offering, curated in limited batches for discerning connoisseurs.",
      rating: 5.0,
      badge: "Exclusive",
    },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);

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

  const handleAddToCart = (product: ProductItem) => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: "/img/cake_eton_mess.jpg",
      },
      1,
    );
    setAddedId(product.id);
    toast.success(`Added "${product.name}" to cart!`);
    setTimeout(() => setAddedId(null), 1800);
  };

  return (
    <section
      id="collection"
      className="py-20 md:py-32 bg-stone-50 text-stone-900 overflow-hidden relative border-b border-stone-200"
    >
      <div className="container px-4 md:px-8">
        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs font-secondary font-bold tracking-[0.25em] uppercase text-emerald-700 mb-1">
              Curated Catalog
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-stone-950">
              Featured Creations from {storeName}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              aria-label="Previous products"
              className="w-10 h-10 rounded-full border border-stone-300 bg-white hover:bg-stone-900 hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Next products"
              className="w-10 h-10 rounded-full border border-stone-300 bg-white hover:bg-stone-900 hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Carousel Content */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6"
          style={{ scrollbarWidth: "none" }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-none w-72 md:w-80 snap-start flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div>
                {/* Visual Header */}
                <div className="relative aspect-square w-full rounded-xl bg-linear-to-br from-stone-100 to-stone-200 mb-4 flex flex-col justify-between p-4 overflow-hidden border border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-stone-900/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                      {product.badge}
                    </span>
                    <span className="text-[11px] font-medium text-stone-500">
                      {product.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-center py-6">
                    <ShoppingBag className="h-14 w-14 text-stone-400/40 group-hover:scale-110 group-hover:text-emerald-600 transition-all duration-300" />
                  </div>

                  <div className="flex items-center gap-1 text-xs text-amber-500 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md self-start shadow-xs">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span className="font-semibold text-stone-900">
                      {product.rating}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <h4 className="font-secondary font-bold text-base text-stone-950 mb-1 group-hover:text-emerald-700 transition-colors">
                  {product.name}
                </h4>
                <p className="text-stone-500 text-xs leading-relaxed line-clamp-2 mb-4 font-light">
                  {product.description}
                </p>
              </div>

              {/* Price & Add Action */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="font-bold text-lg text-stone-950 font-secondary">
                  ${product.price.toFixed(2)}
                </span>
                <Button
                  size="md"
                  onClick={() => handleAddToCart(product)}
                  className={`h-9 px-4 text-xs font-semibold rounded-lg gap-1.5 transition-all ${
                    addedId === product.id
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-900 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {addedId === product.id ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
