import { Star, Quote } from "lucide-react";

interface TenantTestimonialsProps {
  storeName: string;
}

export function TenantTestimonials({ storeName }: TenantTestimonialsProps) {
  const testimonials = [
    {
      title: "Exceeded all expectations",
      quote: `The craftsmanship and presentation from ${storeName} was truly immaculate. The delivery was fast, the quality was top tier, and the attention to detail is evident in every aspect.`,
      author: "Sophia Sterling",
      role: "Verified Buyer",
      date: "September 2026",
      rating: 5,
    },
    {
      title: "Uncompromising quality & service",
      quote: `Finding a brand with this level of customer care and authentic standard is rare. ${storeName} has become our go-to store for all premium orders.`,
      author: "Marcus Vance",
      role: "Loyal Customer",
      date: "August 2026",
      rating: 5,
    },
    {
      title: "Flawless experience from checkout to delivery",
      quote:
        "The checkout was effortless, communication was proactive, and the packaging was luxury grade. Highly recommended!",
      author: "Elena Rostova",
      role: "Corporate Client",
      date: "August 2026",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-stone-50 text-stone-900 border-t border-stone-200">
      <div className="container px-4 md:px-8 flex flex-col">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="font-secondary text-xs font-bold tracking-[0.25em] uppercase text-emerald-700 mb-2">
            Verified Reviews
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-stone-950">
            Voices of Our Customers
          </h2>
          <p className="text-sm text-stone-500 max-w-md mx-auto mt-2 font-light">
            Read what verified patrons say about their purchases from{" "}
            {storeName}.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative"
            >
              <div className="space-y-4">
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

                <h4 className="font-semibold text-stone-950 text-lg leading-snug">
                  &quot;{item.title}&quot;
                </h4>

                <p className="text-stone-600 text-sm leading-relaxed font-light">
                  {item.quote}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="block font-semibold text-xs text-stone-900">
                    {item.author}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {item.role}
                  </span>
                </div>
                <span className="text-[11px] text-stone-400">{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
