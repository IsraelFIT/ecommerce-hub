import { Button } from "@/components/ui/button";
import Link from "next/link";

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="py-16 bg-background border-t border-border"
    >
      <div className="container text-center flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground shadow-2xs mb-5">
          <span>Merchant Stories</span>
        </div>

        {/* Section Heading */}
        <h2 className="font-secondary font-bold tracking-tight text-foreground max-w-3xl leading-[1.15] mb-2">
          What Store Owners are{" "}
          <span className="font-secondary italic text-primary font-normal">
            Saying
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed mb-16">
          Real experiences from entrepreneurs, bakeries, boutique founders, and
          retail brands scaling with EcommerceHub.
        </p>

        {/* Masonry / Multi-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left w-full items-start">
          {/* Column 1 */}
          <div className="space-y-6">
            {/* Card 1: Sara John */}
            <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-normal">
                &quot;EcommerceHub made launching our bakery storefront
                effortless. The subdomain routing and instant checkout increased
                our custom orders by 140%.&quot;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center font-bold text-xs text-primary">
                  SJ
                </div>
                <div>
                  <span className="block font-bold text-xs text-foreground font-secondary">
                    Sara John
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Owner, Jazz Cakes
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Amelia Foster */}
            <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-normal">
                &quot;Managing product variants, payment gateways, and order
                dispatches across multiple subdomains is seamless. The merchant
                dashboard gives me total control.&quot;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center font-bold text-xs text-primary">
                  AF
                </div>
                <div>
                  <span className="block font-bold text-xs text-foreground font-secondary">
                    Amelia Foster
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Founder, Artisan Studio
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Olivia Bennett (Visual Photo Card) */}
            <div className="relative rounded-3xl overflow-hidden aspect-4/5 bg-foreground text-background p-6 flex flex-col justify-end">
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
              <div className="relative z-10 space-y-3">
                <p className="text-xs text-stone-200 font-normal leading-relaxed">
                  &quot;The speed, reliability, and automated payout system
                  makes EcommerceHub the gold standard for multi-store
                  brands.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-primary-foreground">
                    OB
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-white font-secondary">
                      Olivia Bennett
                    </span>
                    <span className="text-[10px] text-stone-300">
                      eCommerce Director, LuxeLiving
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            {/* Card 4: David Kingston (Large Featured Photo Card) */}
            <div className="relative rounded-3xl overflow-hidden aspect-4/5 bg-foreground text-background p-6 flex flex-col justify-end">
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />
              <div className="relative z-10 space-y-3">
                <p className="text-xs text-stone-200 font-normal leading-relaxed">
                  &quot;An absolute triumph for multi-tenant retail. Our team
                  manages 12 distinct merchant storefronts from one unified
                  portal.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-primary-foreground">
                    DK
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-white font-secondary">
                      David Kingston
                    </span>
                    <span className="text-[10px] text-stone-300">
                      VP of Retail Operations
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Ryan Mitchell */}
            <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-normal">
                &quot;Setting up staff roles, inventory webhooks, and custom
                domain names took minutes instead of days. Truly impressive
                technology.&quot;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center font-bold text-xs text-primary">
                  RM
                </div>
                <div>
                  <span className="block font-bold text-xs text-foreground font-secondary">
                    Ryan Mitchell
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Brand & Tech Advisor
                  </span>
                </div>
              </div>
            </div>

            {/* Card 6: Daniel Patterson */}
            <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-normal">
                &quot;From mobile responsive storefronts to real-time order
                notifications, our buyers love the lightning-fast checkout
                flow.&quot;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center font-bold text-xs text-primary">
                  DP
                </div>
                <div>
                  <span className="block font-bold text-xs text-foreground font-secondary">
                    Daniel Patterson
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Merchant & Co-founder
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-6">
            {/* Card 7: Ella Watson */}
            <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-normal">
                &quot;The transparent analytics and automated reporting saved
                our operations team over 15 hours every single week.&quot;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center font-bold text-xs text-primary">
                  EW
                </div>
                <div>
                  <span className="block font-bold text-xs text-foreground font-secondary">
                    Ella Watson
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Founder, EcoCraft Goods
                  </span>
                </div>
              </div>
            </div>

            {/* Card 8: Henry Wilson (Visual Photo Card) */}
            <div className="relative rounded-3xl overflow-hidden aspect-4/5 bg-foreground text-background p-6 flex flex-col justify-end">
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
              <div className="relative z-10 space-y-3">
                <p className="text-xs text-stone-200 font-normal leading-relaxed">
                  &quot;I recommend EcommerceHub to every merchant who needs a
                  robust, multi-tenant architecture with custom
                  subdomains.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-primary-foreground">
                    HW
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-white font-secondary">
                      Henry Wilson
                    </span>
                    <span className="text-[10px] text-stone-300">
                      Commerce Consultant
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 9: Marcus Bennett Quote */}
            <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-normal">
                &quot;Having tenant data isolated securely while maintaining
                centralized analytics gives our management team peace of
                mind.&quot;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center font-bold text-xs text-primary">
                  MB
                </div>
                <div>
                  <span className="block font-bold text-xs text-foreground font-secondary">
                    Marcus Bennett
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Retail Operations Specialist
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center CTA Button */}
        <div className="mt-12">
          <Link href="/signup">
            <Button>Join 1,200+ Growing Merchants &gt;</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
