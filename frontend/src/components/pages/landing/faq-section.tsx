"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [email, setEmail] = useState("");

  const faqs = [
    {
      q: "How does subdomain routing work on EcommerceHub?",
      a: "Every store receives an instant, isolated subdomain (e.g., yourstore.ecommercehub.com). Our edge proxy automatically resolves the subdomain, binds the tenant context, and presents your branded storefront without manual DNS configuration.",
    },
    {
      q: "Can merchants connect their own custom domain names?",
      a: "Yes! On our Growth and Enterprise plans, merchants can connect their own root or custom domains (e.g., www.jazzcakes.com) alongside their default subdomain with automated SSL certificate provisioning.",
    },
    {
      q: "How are payments and merchant payouts processed?",
      a: "EcommerceHub integrates with top-tier payment gateways including Stripe, Apple Pay, and local gateways. Funds are settled directly into the merchant's connected bank account with automated payout schedules.",
    },
    {
      q: "Is merchant and customer data isolated securely?",
      a: "Yes. Our platform utilizes strict multi-tenant schema isolation, encrypted JWT sessions, and role-based permissions (Super Admin, Tenant Admin, User) to guarantee 100% data confidentiality and protection.",
    },
    {
      q: "Can I manage multiple storefronts from a single admin account?",
      a: "Absolutely. Tenant admins can manage multiple branded subdomains, inventory levels, staff permissions, and order pipelines across diverse niches from a single unified admin dashboard.",
    },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    toast.success("Subscribed to EcommerceHub platform & feature updates!");
    setEmail("");
  };

  return (
    <section id="faq" className="py-16 bg-background border-t border-border">
      <div className="container text-center flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground shadow-2xs mb-5">
          <span>FAQ</span>
        </div>

        {/* Section Heading */}
        <h2 className="font-secondary font-bold tracking-tight text-foreground max-w-3xl leading-[1.15] mb-2">
          Frequently Asked{" "}
          <span className="font-secondary italic text-primary font-normal">
            Questions
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed mb-16">
          Everything you need to know about setting up subdomains, managing
          merchant stores, payment payouts, and multi-tenant architecture.
        </p>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left w-full items-start">
          {/* Left Column: Email Input + Accordions */}
          <div className="space-y-3">
            {/* Email Subscription Box */}
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="you@yourbrand.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-11 px-4 bg-card-gray border-border text-foreground"
              />
              <Button type="submit" className="h-11 px-6 rounded-xl">
                Subscribe
              </Button>
            </form>

            {/* Accordion List */}
            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border bg-card-gray overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left font-semibold text-foreground hover:text-primary gap-4 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 text-muted-foreground font-normal leading-relaxed border-t border-border animate-in fade-in duration-200">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: High Fidelity Revenue Bar Chart Widget */}
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-medium">
                  Multi-Store Revenue Overview
                </span>
                <div className="text-2xl font-bold text-foreground font-secondary">
                  $19,456.50
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs px-3 py-1.5 bg-card-gray border border-border rounded-xl text-foreground font-medium">
                <span>Weekly</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="relative pt-8 pb-4">
              {/* Floating Tooltip */}
              <div className="absolute top-0 right-[25%] bg-card border border-border rounded-xl shadow-lg px-3 py-1.5 text-xs z-10">
                <span className="text-muted-foreground text-[11px]">
                  Peak Revenue:{" "}
                </span>
                <span className="font-bold text-foreground">$19,456.50 </span>
                <span className="text-success font-bold text-[11px]">+12%</span>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-4 items-end h-44 px-2">
                {[
                  { day: "1 May", height: "45%" },
                  { day: "2 May", height: "65%" },
                  { day: "3 May", height: "85%" },
                  { day: "4 May", height: "100%", active: true },
                  { day: "5 May", height: "70%" },
                  { day: "6 May", height: "55%" },
                ].map((bar, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-2 h-full justify-end group"
                  >
                    <div
                      style={{ height: bar.height }}
                      className={`w-full max-w-10 rounded-t-lg transition-all ${
                        bar.active
                          ? "bg-linear-to-t from-primary to-primary/70 shadow-md shadow-primary/30"
                          : "bg-primary/15 group-hover:bg-primary/25"
                      }`}
                    />
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {bar.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
