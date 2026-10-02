"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Store,
  Database,
  TrendingUp,
  Activity,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/helper";

export default function CoreDashboardPage() {
  const [selectedRange, setSelectedRange] = useState("30d");

  // Sample real-time platform ecosystem metrics
  const stats = [
    {
      title: "Gross Platform Volume (GMV)",
      value: "$284,520.00",
      change: "+18.4%",
      trend: "up",
      subtitle: "Across 18 multi-tenant stores",
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Platform Fee Revenue (2.5%)",
      value: "$7,113.00",
      change: "+22.1%",
      trend: "up",
      subtitle: "Automatic split take-rate",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      title: "Active Tenants & Stores",
      value: "18",
      change: "+3 this month",
      trend: "up",
      subtitle: "100% database isolated",
      icon: Store,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
    },
    {
      title: "Neon Compute Units (CU)",
      value: "0.25 / 1.0 CU",
      change: "Scale-to-Zero Active",
      trend: "neutral",
      subtitle: "Branch: staging (Healthy)",
      icon: Database,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  const recentTenants = [
    {
      id: "t-1",
      name: "Jazz Cakes LTD",
      slug: "jazz-cakes",
      domain: "cakes.jazz-luxury.com",
      category: "Bakery & Confectionery",
      backend: "Postgres (Neon)",
      splitStatus: "Paystack Split Active",
      revenue: "$48,920.00",
      status: "Active",
    },
    {
      id: "t-2",
      name: "Velvet Couture Atelier",
      slug: "velvet-couture",
      domain: "velvetcouture.io",
      category: "Luxury Fashion",
      backend: "Sanity CMS + Postgres",
      splitStatus: "Stripe Connect",
      revenue: "$92,400.00",
      status: "Active",
    },
    {
      id: "t-3",
      name: "Nordic Minimalist Home",
      slug: "nordic-home",
      domain: "nordichome.store",
      category: "Interior Design",
      backend: "Postgres (Neon)",
      splitStatus: "Paystack Split Active",
      revenue: "$34,150.00",
      status: "Active",
    },
    {
      id: "t-4",
      name: "Aura Artisan Coffee",
      slug: "aura-coffee",
      domain: "aura.coffee",
      category: "Specialty Cafe",
      backend: "Postgres (Neon)",
      splitStatus: "Stripe Connect",
      revenue: "$21,800.00",
      status: "Active",
    },
  ];

  const recentTransactions = [
    {
      id: "TX-9482",
      tenant: "Jazz Cakes LTD",
      customer: "Amara Johnson",
      gross: 185.0,
      fee: 4.63,
      payout: 180.37,
      gateway: "Paystack Subaccount",
      status: "Settled",
      time: "4 mins ago",
    },
    {
      id: "TX-9481",
      tenant: "Velvet Couture Atelier",
      customer: "Kelechi Obi",
      gross: 650.0,
      fee: 16.25,
      payout: 633.75,
      gateway: "Stripe Split",
      status: "Settled",
      time: "18 mins ago",
    },
    {
      id: "TX-9480",
      tenant: "Nordic Minimalist Home",
      customer: "Sarah Jenkins",
      gross: 320.0,
      fee: 8.0,
      payout: 312.0,
      gateway: "Paystack Subaccount",
      status: "Settled",
      time: "42 mins ago",
    },
    {
      id: "TX-9479",
      tenant: "Aura Artisan Coffee",
      customer: "David Chen",
      gross: 45.0,
      fee: 1.13,
      payout: 43.87,
      gateway: "Stripe Split",
      status: "Settled",
      time: "1 hour ago",
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full pb-8">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-secondary text-foreground">
            Platform Operations & Infrastructure
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Super Administrator Control Plane • Logged in as{" "}
            <span className="text-primary font-medium">
              israelfolaranmi01@gmail.com
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Range Selector */}
          <div className="flex items-center bg-card-gray/80 dark:bg-white/5 border border-border rounded-lg p-0.5 text-xs">
            {["24h", "7d", "30d", "90d"].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setSelectedRange(range)}
                className={`px-2.5 py-1 rounded-md transition-all text-xs font-medium cursor-pointer ${
                  selectedRange === range
                    ? "bg-card text-primary shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <Link href="/tenants">
            <Button size="md" className="gap-1.5 h-8 text-xs cursor-pointer">
              <Store className="size-3.5" />
              <span>Manage Stores</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-xs relative overflow-hidden transition-all hover:border-primary/40 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </span>
                <div
                  className={`size-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}
                >
                  <Icon className="size-4" />
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-xl md:text-2xl font-bold font-secondary text-foreground tracking-tight">
                  {stat.value}
                </h3>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {stat.change}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-37.5">
                    {stat.subtitle}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Data Layer Health + Real-Time Split Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 Cols): Neon & Infrastructure Health */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Database className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-secondary text-foreground">
                    Neon Postgres Infrastructure
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    eu-central-1 (Frankfurt)
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[10px]"
              >
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Healthy
              </Badge>
            </div>

            <div className="flex flex-col gap-3 mt-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card-gray/50 dark:bg-white/5 border border-border">
                <span className="text-muted-foreground">Active Branch</span>
                <span className="font-mono font-semibold text-primary">
                  staging (checked out)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card-gray/50 dark:bg-white/5 border border-border">
                <span className="text-muted-foreground">Production Branch</span>
                <span className="font-mono text-foreground">
                  production (protected)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card-gray/50 dark:bg-white/5 border border-border">
                <span className="text-muted-foreground">Connection Pooler</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  PgBouncer / asyncpg Active
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card-gray/50 dark:bg-white/5 border border-border">
                <span className="text-muted-foreground">
                  Tenant Storage Model
                </span>
                <span className="font-medium text-foreground">
                  Shared Database / Tenant UUID Key
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <Link
                href="/adapters"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>Adapter Configuration</span>
                <ArrowRight className="size-3" />
              </Link>
              <Link
                href="/developers"
                className="text-xs text-muted-foreground hover:text-foreground font-mono"
              >
                View Connection String →
              </Link>
            </div>
          </div>

          {/* Quick Platform Actions */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Super Admin Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/tenants"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card-gray/30 dark:bg-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-medium text-foreground group"
              >
                <Store className="size-4 text-primary group-hover:scale-110 transition-transform" />
                <span>Add Storefront</span>
              </Link>
              <Link
                href="/revenue"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card-gray/30 dark:bg-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-medium text-foreground group"
              >
                <DollarSign className="size-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span>Audit Escrow</span>
              </Link>
              <Link
                href="/developers"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card-gray/30 dark:bg-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-medium text-foreground group"
              >
                <Zap className="size-4 text-purple-500 group-hover:scale-110 transition-transform" />
                <span>API Keys</span>
              </Link>
              <Link
                href="/security"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card-gray/30 dark:bg-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-medium text-foreground group"
              >
                <ShieldCheck className="size-4 text-sky-500 group-hover:scale-110 transition-transform" />
                <span>Audit Logs</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Real-time Split Transactions Stream */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Activity className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-secondary text-foreground">
                    Live Split & Fee Transactions
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    Automatic 2.5% platform take-rate & 97.5% subaccount payout
                  </span>
                </div>
              </div>
              <Link href="/revenue">
                <Button
                  variant="ghost"
                  size="md"
                  className="text-xs text-primary gap-1 h-7"
                >
                  <span>View All</span>
                  <ArrowRight className="size-3" />
                </Button>
              </Link>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] text-muted-foreground">
                    <th className="py-2 font-medium">Tx ID / Time</th>
                    <th className="py-2 font-medium">Tenant Store</th>
                    <th className="py-2 font-medium">Gross Total</th>
                    <th className="py-2 font-medium text-primary">
                      Fee (2.5%)
                    </th>
                    <th className="py-2 font-medium text-emerald-600 dark:text-emerald-400">
                      Tenant Payout
                    </th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-2.5 font-mono">
                        <div className="font-semibold text-foreground">
                          {tx.id}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {tx.time}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <div className="font-medium text-foreground">
                          {tx.tenant}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {tx.gateway}
                        </div>
                      </td>
                      <td className="py-2.5 font-semibold text-foreground font-mono">
                        {formatCurrency(tx.gross)}
                      </td>
                      <td className="py-2.5 font-semibold text-primary font-mono">
                        +{formatCurrency(tx.fee)}
                      </td>
                      <td className="py-2.5 font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(tx.payout)}
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="size-2.5" />
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Performing Multi-Tenant Stores */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h4 className="text-sm font-bold font-secondary text-foreground">
              Multi-Tenant Storefront Directory
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Live tenants routing through custom subdomains (*.localhost:3000 /
              *.ecommerce-hub.com)
            </span>
          </div>
          <Link href="/tenants">
            <Button size="md" variant="outline" className="text-xs gap-1.5 h-8">
              <span>View All 18 Stores</span>
              <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-3.5">
          {recentTenants.map((tenant) => (
            <div
              key={tenant.id}
              className="p-3.5 rounded-xl border border-border bg-card-gray/20 dark:bg-white/5 flex flex-col justify-between hover:border-primary/40 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-primary/10 text-primary border-primary/30"
                  >
                    {tenant.category}
                  </Badge>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {tenant.status}
                  </span>
                </div>

                <h5 className="font-bold font-secondary text-sm text-foreground mt-2">
                  {tenant.name}
                </h5>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                  {tenant.slug}.ecommerce-hub.com
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  GMV:{" "}
                  <strong className="text-foreground">{tenant.revenue}</strong>
                </span>
                <Link
                  href={`/${tenant.slug}`}
                  target="_blank"
                  className="text-primary hover:text-primary-light flex items-center gap-1 text-[11px] font-semibold group-hover:underline"
                >
                  <span>Preview</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
