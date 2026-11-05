"use client";

import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { getReviews, type ReviewItem } from "@/lib/api/reviews";
import { Skeleton } from "@/components/ui/skeleton";

interface TenantTestimonialsProps {
  storeName: string;
}

export function TenantTestimonials({ storeName }: TenantTestimonialsProps) {
  const { branding, tenant } = useTenantTheme();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const slug = tenant?.slug;
    if (!slug) return;
    let isMounted = true;

    async function loadFeaturedReviews() {
      try {
        setIsLoading(true);
        // 1. Try fetching up to 3 featured reviews
        const featuredRes = await getReviews({
          tenantSlug: slug,
          is_featured: true,
          perPage: 3,
        });

        if (
          featuredRes.status === "success" &&
          featuredRes.data?.items &&
          featuredRes.data.items.length > 0
        ) {
          if (isMounted) setReviews(featuredRes.data.items.slice(0, 3));
          return;
        }

        // 2. If no featured reviews, fallback to top 3 approved reviews
        const fallbackRes = await getReviews({
          tenantSlug: slug,
          status: "approved",
          perPage: 3,
        });

        if (
          fallbackRes.status === "success" &&
          fallbackRes.data?.items &&
          fallbackRes.data.items.length > 0
        ) {
          if (isMounted) setReviews(fallbackRes.data.items.slice(0, 3));
        } else {
          if (isMounted) setReviews([]);
        }
      } catch (err) {
        console.error("Failed to load featured reviews:", err);
        if (isMounted) setReviews([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFeaturedReviews();

    return () => {
      isMounted = false;
    };
  }, [tenant?.slug]);

  // If loading complete and no reviews exist, hide section entirely
  if (!isLoading && reviews.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <section className="py-20 md:py-32 bg-stone-50 text-stone-900 border-t border-stone-200">
      <div className="container px-4 md:px-8 flex flex-col">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p
            style={{ color: branding?.accentColor || "var(--primary)" }}
            className="font-secondary text-xs font-bold tracking-[0.25em] uppercase mb-1"
          >
            Verified Reviews
          </p>
          <h2 className="font-semibold tracking-tight text-stone-950">
            Voices of Our Customers
          </h2>
          <p className="text-stone-500 max-w-md mx-auto mt-2 font-light">
            Read what verified patrons say about their purchases from{" "}
            {storeName}.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        {isLoading ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                </div>
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-16 w-full rounded-md" />
                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`w-full grid grid-cols-1 ${reviews.length === 1 ? "md:grid-cols-1 max-w-lg mx-auto" : reviews.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-3"} gap-5`}
          >
            {reviews.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-amber-500 text-amber-500"
                        />
                      ))}
                    </div>
                    <Quote className="h-6 w-6 text-stone-300" />
                  </div>

                  <h5 className="font-semibold text-stone-950">
                    &quot;{item.title || "Exceeded all expectations"}&quot;
                  </h5>

                  <p className="text-stone-600 font-light line-clamp-4">
                    {item.comment}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="block font-semibold text-stone-900 truncate text-xs">
                      {item.customer_name}
                    </span>
                    <span
                      style={{
                        color: branding?.accentColor || "var(--primary)",
                      }}
                      className="text-[11px] font-medium truncate"
                    >
                      {item.product_name
                        ? `Verified · ${item.product_name}`
                        : "Verified Buyer"}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 whitespace-nowrap">
                    {formatDate(item.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
