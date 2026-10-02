"use client";

import Link from "next/link";
import {
  BarChart3,
  Globe,
  Package,
  Boxes,
  ShieldCheck,
  Workflow,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-16 bg-background relative font-primary"
    >
      <div className="container text-center flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground shadow-2xs mb-5">
          <span>Core Capabilities</span>
        </div>

        {/* Section Heading */}
        <h2 className="font-secondary font-bold tracking-tight text-foreground max-w-3xl leading-[1.15] mb-2">
          Powerful Features to
          <br />
          Elevate Your{" "}
          <span className="font-secondary italic text-primary font-normal">
            eCommerce Platform
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed mb-6">
          Everything you need to launch custom subdomains, manage merchant
          catalogs, process payments, and scale your multi-store network.
        </p>

        {/* Action Button */}
        <Link href="/signup" className="mb-16">
          <Button>Start Free Trial</Button>
        </Link>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left w-full">
          {/* Card 1: Subdomain Storefronts */}
          <div className="rounded-3xl border border-border bg-card p-6 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-card-foreground font-secondary">
                Instant Subdomain Routing
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                Every merchant gets an isolated, high-speed storefront at{" "}
                <code className="text-[11px] bg-card-gray px-1.5 py-0.5 rounded border border-border">
                  brand.yourdomain.com
                </code>{" "}
                automatically.
              </p>
            </div>

            {/* Mini Subdomain Mockup */}
            <div className="bg-card-gray rounded-2xl border border-border p-3.5 space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground">Active Subdomain</span>
                <span className="font-bold text-success text-[10px]">
                  ● Online
                </span>
              </div>
              <div className="bg-card p-2 rounded-xl border border-border flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="font-mono text-foreground text-[11px]">
                  jazz-cakes.ecommercehub.com
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Unified Analytics */}
          <div className="rounded-3xl border border-border bg-card p-6 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-card-foreground font-secondary">
                Real-Time Store Analytics
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                Monitor sales, Gross Merchandise Volume (GMV), customer
                retention, and multi-tenant conversion rates.
              </p>
            </div>

            {/* Mini Chart Mockup */}
            <div className="bg-card-gray rounded-2xl border border-border p-3.5 space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground">Store Revenue</span>
                <span className="font-bold text-foreground">
                  $19,456.50{" "}
                  <span className="text-success text-[10px]">+12%</span>
                </span>
              </div>
              <div className="flex items-end gap-1.5 h-16 pt-2">
                <div className="flex-1 bg-primary/20 rounded-t h-[40%]" />
                <div className="flex-1 bg-primary/20 rounded-t h-[60%]" />
                <div className="flex-1 bg-primary/30 rounded-t h-[80%]" />
                <div className="flex-1 bg-linear-to-t from-primary to-primary-light rounded-t h-full" />
                <div className="flex-1 bg-primary/20 rounded-t h-[65%]" />
                <div className="flex-1 bg-primary/20 rounded-t h-[50%]" />
              </div>
            </div>
          </div>

          {/* Card 3: Easy Order Tracking */}
          <div className="rounded-3xl border border-border bg-card p-6 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-card-foreground font-secondary">
                Automated Order Processing
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                Process customer checkouts, print dispatch labels, and
                synchronize live delivery updates with webhook triggers.
              </p>
            </div>

            {/* Mini Order Table Mockup */}
            <div className="bg-card-gray rounded-2xl border border-border p-3 text-[10px] space-y-1.5">
              <div className="flex justify-between font-bold text-muted-foreground pb-1 border-b border-border">
                <span>Live Orders</span>
                <span className="text-primary font-semibold">View all</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-medium text-foreground">
                  #3656 Jazz Cakes
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 font-semibold">
                  $350.00
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-medium text-foreground">
                  #6524 Artisan Studio
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 font-semibold">
                  $320.00
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Inventory Management */}
          <div className="rounded-3xl border border-border bg-card p-6 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Boxes className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-card-foreground font-secondary">
                Catalog & Inventory Sync
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                Organize categories, product variants, pricing tiers, and
                automated low-stock warnings across all stores.
              </p>
            </div>

            {/* Mini Inventory Progress */}
            <div className="bg-card-gray rounded-2xl border border-border p-3.5 space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground font-medium">
                  Custom Orders
                </span>
                <span className="font-bold text-foreground">84% capacity</span>
              </div>
              <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full w-[84%]" />
              </div>
              <div className="flex justify-between text-[11px] pt-1">
                <span className="text-muted-foreground font-medium">
                  Standard Inventory
                </span>
                <span className="font-bold text-foreground">92% in stock</span>
              </div>
              <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
              </div>
            </div>
          </div>

          {/* Card 5: Secure & Reliable */}
          <div className="rounded-3xl border border-border bg-card p-6 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-card-foreground font-secondary">
                Enterprise Tenant Isolation
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                Strict database isolation, encrypted sessions, JWT
                authentication, and role-based permissions (Super Admin, Tenant
                Admin, User).
              </p>
            </div>

            {/* Checklist items */}
            <div className="bg-card-gray rounded-2xl border border-border p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span>Isolated Merchant Schemas</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span>Role-Based Access Control</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span>SSL & Proxy Subdomain Routing</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span>Automated Data Backups</span>
              </div>
            </div>
          </div>

          {/* Card 6: Integrations & Automation */}
          <div className="rounded-3xl border border-border bg-card p-6 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Workflow className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-card-foreground font-secondary">
                API & Payment Ecosystem
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                Seamlessly connect payment gateways (Stripe, Paystack),
                fulfillment webhooks, and third-party marketing tools.
              </p>
            </div>

            {/* Connected hub circle graphic */}
            <div className="bg-card-gray rounded-2xl border border-border p-4 flex items-center justify-center">
              <div className="relative flex items-center justify-center w-36 h-20">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-md z-10">
                  Hub
                </div>
                <div className="absolute left-2 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shadow-xs">
                  💳
                </div>
                <div className="absolute right-2 w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center text-[10px] font-bold shadow-xs">
                  ⚡
                </div>
                <div className="absolute top-0 w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-bold shadow-xs">
                  ☁
                </div>
                <div className="absolute bottom-0 w-6 h-6 rounded-full bg-card border border-border text-foreground flex items-center justify-center text-[10px] font-bold shadow-xs">
                  ⚙
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
