"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "29",
      cents: ".00",
      period: "/monthly",
      badge: "Save 10%",
      description:
        "Best for solo entrepreneurs launching their first branded subdomain store.",
      isFeatured: false,
      buttonText: "Start Free Trial",
      features: [
        "1 Subdomain Storefront",
        "Up to 100 Products",
        "0% Platform Transaction Fee",
        "Free Automated SSL Certificate",
        "Standard Analytics Dashboard",
        "Community & Email Support",
        "Cancel anytime",
      ],
    },
    {
      name: "Growth",
      price: "79",
      cents: ".00",
      period: "/monthly",
      badge: "Most Popular",
      description:
        "Perfect for scaling brands running multiple store niches with high volume.",
      isFeatured: true,
      buttonText: "Start Free Trial",
      features: [
        "Up to 5 Subdomain Storefronts",
        "Unlimited Products & Categories",
        "Custom Domain & Subdomain Mapping",
        "Advanced Multi-Store Analytics",
        "Automated Webhook Integrations",
        "Role-Based Staff Access (RBAC)",
        "Priority 24/7 Technical Support",
        "Automated Daily Backups",
      ],
    },
    {
      name: "Enterprise",
      price: "199",
      cents: ".00",
      period: "/monthly",
      badge: "Save 35%",
      description:
        "Ultimate capabilities for large retail networks, franchises, and marketplaces.",
      isFeatured: false,
      buttonText: "Contact Sales",
      features: [
        "Unlimited Storefronts & Subdomains",
        "Dedicated Database Isolation",
        "Custom API Rate Limits & SDK",
        "White-Label Admin Experience",
        "Enterprise 99.99% Uptime SLA",
        "Custom Checkout & ERP Connect",
        "Dedicated Solutions Architect",
        "Custom Security Audits",
      ],
    },
  ];

  return (
    <section
      id="pricing"
      className="py-16 bg-background border-t border-border"
    >
      <div className="container text-center flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground shadow-2xs mb-5">
          <span>Pricing Plans</span>
        </div>

        {/* Section Heading */}
        <h2 className="font-secondary font-bold tracking-tight text-foreground max-w-3xl leading-[1.15] mb-2">
          Simple Transparent{" "}
          <span className="font-secondary italic text-primary font-normal">
            Pricing
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed mb-6">
          Choose the ideal plan to launch, manage, and scale your eCommerce
          storefronts.
        </p>

        {/* Action Button */}
        <Link href="/signup" className="mb-16">
          <Button>Get Started Free</Button>
        </Link>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full items-stretch">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-8 flex flex-col justify-between transition-all ${
                plan.isFeatured
                  ? "border border-primary bg-card shadow-md hover:shadow-lg shadow-primary/10 relative"
                  : "border border-border bg-card-gray shadow-xs hover:shadow-md"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-lg text-foreground font-secondary">
                    {plan.name}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-primary-light text-primary font-bold text-[11px]">
                    {plan.badge}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-0.5 mb-3">
                  <span className="text-4xl font-extrabold text-foreground font-secondary">
                    ${plan.price}
                  </span>
                  <span className="text-sm font-bold text-muted-foreground">
                    {plan.cents}
                  </span>
                  <span className="text-xs text-muted-foreground/70 font-medium">
                    {plan.period}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground font-normal leading-relaxed mb-4 min-h-10">
                  {plan.description}
                </p>

                {/* CTA Button */}
                <Link href="/signup" className="block mb-4">
                  <Button
                    className="w-full"
                    variant={plan.isFeatured ? "default" : "outline"}
                  >
                    {plan.buttonText}
                  </Button>
                </Link>

                {/* Features List */}
                <div className="space-y-3 pt-4 border-t border-border">
                  {plan.features.map((feat, fIdx) => (
                    <div
                      key={fIdx}
                      className="flex items-center gap-2.5 text-xs text-muted-foreground"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-border text-primary">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
