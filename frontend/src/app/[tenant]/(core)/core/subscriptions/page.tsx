"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CoreSubscriptionsPage() {
  const plans = [
    {
      id: "starter",
      name: "Starter Merchant",
      price: "$29",
      period: "/month",
      description:
        "Essential multi-tenant commerce for emerging artisan brands",
      activeCount: 11,
      badge: "Most Popular",
      features: [
        "Single Storefront Subdomain",
        "Up to 100 Products",
        "Neon Lakebase Postgres Data Layer",
        "Paystack & Stripe Split Routing",
        "Standard 2.5% Platform Fee",
        "Community Support",
      ],
    },
    {
      id: "growth",
      name: "Growth Boutique",
      price: "$79",
      period: "/month",
      description:
        "High-volume boutiques requiring custom domains and Sanity CMS",
      activeCount: 5,
      badge: "High Growth",
      features: [
        "Custom Apex Domain Binding",
        "Unlimited Products & Collections",
        "Dual-Write Sanity CMS + Postgres Adapter",
        "Real-time Inventory Webhooks",
        "Discounted 2.0% Platform Fee",
        "Priority Support & SLA",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise Brand",
      price: "$199",
      period: "/month",
      description:
        "Dedicated infrastructure, zero downtime branching, and white-glove onboarding",
      activeCount: 2,
      badge: "Enterprise",
      features: [
        "Dedicated Neon Postgres Branch Isolation",
        "Custom Gateway Routing & Subaccount Split Logic",
        "Full Sanity Studio Integration",
        "Negotiated 1.5% Platform Fee",
        "Dedicated Account Manager",
        "24/7 Phone & Slack Support",
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full pb-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-secondary text-foreground">
            Tenant Subscription Tiers & Billing
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure monthly recurring subscription packages and feature gate
            entitlements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-1"
          >
            Total MRR: $1,112.00 / mo
          </Badge>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between shadow-xs relative overflow-hidden hover:border-primary/50 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {plan.badge}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {plan.activeCount} Stores Active
                </span>
              </div>

              <h3 className="text-lg font-bold font-secondary text-foreground mt-3">
                {plan.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 min-h-9">
                {plan.description}
              </p>

              <div className="flex items-baseline gap-1 mt-4 pb-4 border-b border-border">
                <span className="text-3xl font-black font-secondary text-foreground">
                  {plan.price}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {plan.period}
                </span>
              </div>

              <ul className="flex flex-col gap-2.5 mt-4 text-xs">
                {plan.features.map((feat, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-foreground/90"
                  >
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="md"
                className="w-full text-xs cursor-pointer group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                onClick={() =>
                  toast.info(`Plan settings for "${plan.name}" saved.`)
                }
              >
                Configure Entitlements
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
