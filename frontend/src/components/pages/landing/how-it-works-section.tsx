import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-16 bg-background border-t border-border"
    >
      <div className="container text-center flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground shadow-2xs mb-5">
          <span>How It Works</span>
        </div>

        {/* Section Heading */}
        <h2 className="font-secondary font-bold tracking-tight text-foreground max-w-3xl leading-[1.15] mb-2">
          Your{" "}
          <span className="font-secondary italic text-primary font-normal">
            Merchant Journey
          </span>{" "}
          Starts Here
        </h2>

        {/* Subtitle */}
        <p className="text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed mb-16">
          From registration to launching your custom subdomain storefront and
          fulfilling orders — go live in three simple steps.
        </p>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full">
          {/* Card 01 -> 01 */}
          <div className="rounded-3xl border border-border bg-card p-6 transition-all flex flex-col justify-between space-y-6">
            {/* Top Mockup Preview */}
            <div className="rounded-2xl border border-border bg-card-gray p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  ✦ <span>Step 01 → Provision</span>
                </span>
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              </div>
              <div className="bg-card rounded-xl p-3 border border-border shadow-2xs space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Subdomain Provisioning
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-primary/70" />
                  <span className="text-xs font-bold text-foreground font-mono">
                    your-store.ecommercehub.com
                  </span>
                </div>
                <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>SSL Certificate</span>
                  <span className="text-success font-bold">✓ Active</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-secondary font-bold text-lg text-foreground">
                1. Register & Claim Subdomain
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-normal">
                Create your merchant account and claim your unique branded
                subdomain in seconds with instant SSL configuration.
              </p>
            </div>
          </div>

          {/* Card 02 -> 02 */}
          <div className="rounded-3xl border border-border bg-card p-6 transition-all flex flex-col justify-between space-y-6">
            {/* Top Mockup Preview */}
            <div className="rounded-2xl border border-border bg-card-gray p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  ✦ <span>Step 02 → Customize</span>
                </span>
                <span className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div className="bg-card rounded-xl p-3 border border-border shadow-2xs space-y-2 text-center">
                <div className="flex justify-center gap-1 py-1">
                  <span className="h-1.5 w-6 bg-primary/20 rounded-full" />
                  <span className="h-1.5 w-6 bg-primary rounded-full" />
                  <span className="h-1.5 w-6 bg-primary/20 rounded-full" />
                </div>
                <Link href="/signup" className="block w-full">
                  <Button className="w-full h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-lg shadow-xs">
                    Publish Storefront
                  </Button>
                </Link>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-secondary font-bold text-lg text-foreground">
                2. Upload Catalog & Brand
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-normal">
                Add products, organize categories, customize theme colors and
                banners, and set up your merchant payment credentials.
              </p>
            </div>
          </div>

          {/* Card 03 -> 03 */}
          <div className="rounded-3xl border border-border bg-card p-6 transition-all flex flex-col justify-between space-y-6">
            {/* Top Mockup Preview */}
            <div className="rounded-2xl border border-border bg-card-gray p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  ✦ <span>Step 03 → Fulfill</span>
                </span>
                <span className="h-2 w-2 rounded-full bg-success" />
              </div>
              <div className="bg-card rounded-xl p-3 border border-border shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground">
                    Payout & Dispatch
                  </span>
                  <span className="text-success font-semibold">Instant</span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i < 6 ? "bg-success" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-secondary font-bold text-lg text-foreground">
                3. Sell, Track & Scale
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-normal">
                Receive orders directly, track customer payments, manage
                fulfillment statuses, and scale revenue with actionable data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
