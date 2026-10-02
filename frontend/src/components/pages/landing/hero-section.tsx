"use client";

import Link from "next/link";
import {
  Play,
  TrendingUp,
  DollarSign,
  Users,
  Download,
  Search,
  ChevronDown,
  MoreVertical,
  CheckSquare,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export function HeroSection() {
  return (
    <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-background font-primary">
      {/* Soft Ambient Radial Background Glows matching primary brand theme */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-250 h-175 bg-radial from-primary/12 via-primary/5 to-transparent blur-3xl opacity-70" />
      <div className="pointer-events-none absolute top-40 right-10 w-125 h-125 bg-radial from-primary/8 to-transparent blur-3xl opacity-50" />
      <div className="pointer-events-none absolute top-40 left-10 w-125 h-125 bg-radial from-primary-light/40 to-transparent blur-3xl opacity-50" />

      <div className="relative z-10 container text-center flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground mb-6 backdrop-blur-xs">
          <span>Multi-Tenant eCommerce Platform</span>
        </div>

        {/* Main Headline with Serif Italic Accents */}
        <h1 className="font-secondary font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.12] mb-6">
          Power Your{" "}
          <span className="font-secondary italic text-primary font-normal">
            Online Stores
          </span>
          <br className="hidden md:inline" />
          Across Every{" "}
          <span className="font-secondary italic text-primary font-normal">
            Subdomain
          </span>{" "}
          With Ease
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed mb-8">
          Launch standalone merchant storefronts with custom subdomains, manage
          unified product catalogs, automate order processing, and scale your
          multi-store ecosystem in one elegant dashboard.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link href="/signup">
            <Button size="lg">Start Free Trial</Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg">
              <Play className="h-4 w-4" />
              Explore Platform
            </Button>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* High Fidelity Dashboard Preview Card */}
        {/* ========================================================================= */}
        <div className="w-full bg-card rounded-3xl border border-border p-4 md:p-6 lg:p-8 text-left space-y-6">
          {/* Dashboard Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-border">
            {/* Left: Brand & Nav Tabs */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                  <Store className="h-4 w-4" />
                </div>
                <span className="font-secondary font-bold text-base text-foreground">
                  Ecommerce<span className="text-primary">Hub</span>
                </span>
              </div>

              <div className="hidden md:flex items-center gap-1 text-xs">
                <span className="px-3 py-1.5 rounded-lg bg-primary-light text-primary font-bold">
                  Dashboard
                </span>
                <span className="px-3 py-1.5 text-muted-foreground font-medium hover:text-foreground cursor-pointer">
                  Storefronts
                </span>
                <span className="px-3 py-1.5 text-muted-foreground font-medium hover:text-foreground cursor-pointer">
                  Products
                </span>
                <span className="px-3 py-1.5 text-muted-foreground font-medium hover:text-foreground cursor-pointer">
                  Orders
                </span>
                <span className="px-3 py-1.5 text-muted-foreground font-medium hover:text-foreground cursor-pointer">
                  Analytics
                </span>
              </div>
            </div>

            {/* Right: User Profile & Actions */}
            <div className="flex items-center gap-3">
              <div className="relative hidden lg:block">
                <Search className="absolute left-2.5 top-3 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search stores, orders..."
                  className="h-8 pl-8 pr-3 text-xs bg-card-gray border-border rounded-lg w-40 text-foreground"
                  readOnly
                />
              </div>

              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs bg-card-gray border border-border rounded-lg text-foreground font-medium">
                <span>All Stores</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>

              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-2xs transition-colors">
                <Download className="h-3.5 w-3.5" />
                <span>Export Report</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  AM
                </div>
                <div className="hidden xl:block text-left text-[11px] leading-tight">
                  <span className="block font-bold text-foreground">
                    Alex Morgan
                  </span>
                  <span className="text-muted-foreground">@admin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome User Banner */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-secondary font-bold text-lg text-foreground">
                Welcome back, Alex Morgan
              </h3>
              <p className="text-xs text-muted-foreground">
                Multi-tenant store operations, subdomain routing, and real-time
                revenue analytics.
              </p>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          {/* 4 Metric KPI Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Orders */}
            <div className="bg-card-gray rounded-2xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Total Orders
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-xs">
                  <TrendingUp className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-2xl font-bold font-secondary text-foreground">
                25,455
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-600 font-semibold">
                  ▲ +14.2% vs last month
                </span>
                <span className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Details &gt;
                </span>
              </div>
            </div>

            {/* Card 2: Total Revenue */}
            <div className="bg-card-gray rounded-2xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Total Revenue
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-light text-primary text-xs">
                  <DollarSign className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-2xl font-bold font-secondary text-foreground">
                $128,450.00
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-primary font-semibold">
                  ▲ +18.7% vs last month
                </span>
                <span className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Details &gt;
                </span>
              </div>
            </div>

            {/* Card 3: Active Stores */}
            <div className="bg-card-gray rounded-2xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Active Stores
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 text-xs">
                  <Store className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-2xl font-bold font-secondary text-foreground">
                1,420
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-amber-600 font-semibold">
                  ▲ +32 new this week
                </span>
                <span className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Details &gt;
                </span>
              </div>
            </div>

            {/* Card 4: Customer Base */}
            <div className="bg-card-gray rounded-2xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Total Customers
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 text-xs">
                  <Users className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-2xl font-bold font-secondary text-foreground">
                84,920
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-sky-600 font-semibold">
                  ▲ +9.4% active users
                </span>
                <span className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Details &gt;
                </span>
              </div>
            </div>
          </div>

          {/* Middle Analytics Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Revenue Over View Bar Chart */}
            <div className="lg:col-span-2 bg-card-gray rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-medium">
                    Store Network Revenue
                  </span>
                  <div className="text-xl font-bold text-foreground font-secondary">
                    $19,456.50
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs px-3 py-1.5 bg-card border border-border rounded-xl text-foreground font-medium">
                  <span>Weekly</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>

              {/* Bar Chart Visual */}
              <div className="relative pt-6 pb-2">
                {/* Floating Metric Bubble */}
                <div className="absolute top-0 right-1/4 bg-card border border-border rounded-xl shadow-lg px-3 py-1.5 text-xs z-10 hidden md:block">
                  <span className="text-muted-foreground text-[11px]">
                    Peak Sales:{" "}
                  </span>
                  <span className="font-bold text-foreground">$19,456.50 </span>
                  <span className="text-success font-bold text-[11px]">
                    +12%
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-3 md:gap-6 items-end h-40 px-2">
                  {[
                    { day: "Mon", height: "45%" },
                    { day: "Tue", height: "65%" },
                    { day: "Wed", height: "85%" },
                    { day: "Thu", height: "100%", active: true },
                    { day: "Fri", height: "70%" },
                    { day: "Sat", height: "55%" },
                  ].map((bar, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-2 h-full justify-end group"
                    >
                      <div
                        style={{ height: bar.height }}
                        className={`w-full max-w-8 rounded-t-md transition-all ${
                          bar.active
                            ? "bg-linear-to-t from-primary to-primary-light shadow-sm shadow-primary/40"
                            : "bg-primary/20 group-hover:bg-primary/30"
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

            {/* Right 1 Col: Sales By Channel Donut */}
            <div className="bg-card-gray rounded-2xl border border-border p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  Sales By Channel
                </span>
                <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
              </div>

              {/* Donut Chart Simulation */}
              <div className="relative flex items-center justify-center my-4">
                <div className="w-28 h-28 rounded-full border-8 border-primary border-r-amber-500 border-b-sky-500 border-l-primary flex items-center justify-center bg-card shadow-inner">
                  <div className="text-center">
                    <span className="block text-[10px] text-muted-foreground font-medium uppercase">
                      Total
                    </span>
                    <span className="block text-sm font-bold text-foreground">
                      100%
                    </span>
                  </div>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Subdomain Stores
                  </span>
                  <span className="font-bold text-foreground">58%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Direct Marketplace
                  </span>
                  <span className="font-bold text-foreground">26%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    Mobile App / POS
                  </span>
                  <span className="font-bold text-foreground">16%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Operational Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Left 2 Cols: Recent Orders Table */}
            <div className="lg:col-span-2 bg-card-gray rounded-2xl border border-border p-5 space-y-3">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold text-foreground">
                  Recent Multi-Store Orders
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-muted-foreground">Search</span>
                  <span className="px-2 py-0.5 bg-card border border-border rounded text-foreground">
                    All Stores ▾
                  </span>
                  <span className="px-2 py-0.5 bg-card border border-border rounded text-foreground">
                    Filter ▾
                  </span>
                </div>
              </div>

              <Table>
                <TableHeader className="border-b border-border">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-2 pr-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      #Order
                    </TableHead>
                    <TableHead className="py-2 px-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Store / Item
                    </TableHead>
                    <TableHead className="py-2 px-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Customer
                    </TableHead>
                    <TableHead className="py-2 px-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Payment
                    </TableHead>
                    <TableHead className="py-2 px-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Amount
                    </TableHead>
                    <TableHead className="py-2 pl-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border text-foreground">
                  <TableRow className="hover:bg-card transition-colors">
                    <TableCell className="py-2.5 pr-2 font-mono text-muted-foreground text-xs flex items-center gap-1">
                      <CheckSquare className="h-3 w-3 text-muted-foreground" />
                      #3656
                    </TableCell>
                    <TableCell className="py-2.5 px-2 font-semibold text-foreground text-xs">
                      Jazz Cakes - 3-Tier
                    </TableCell>
                    <TableCell className="py-2.5 px-2 text-muted-foreground text-xs">
                      Emma Rose
                    </TableCell>
                    <TableCell className="py-2.5 px-2 text-muted-foreground text-xs">
                      Stripe
                    </TableCell>
                    <TableCell className="py-2.5 px-2 font-bold text-foreground text-xs">
                      $350.00
                    </TableCell>
                    <TableCell className="py-2.5 pl-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 text-[10px] font-semibold">
                        Completed
                      </span>
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-card transition-colors">
                    <TableCell className="py-2.5 pr-2 font-mono text-muted-foreground text-xs flex items-center gap-1">
                      <CheckSquare className="h-3 w-3 text-muted-foreground" />
                      #6524
                    </TableCell>
                    <TableCell className="py-2.5 px-2 font-semibold text-foreground text-xs">
                      Artisan Studio - Ceramic
                    </TableCell>
                    <TableCell className="py-2.5 px-2 text-muted-foreground text-xs">
                      Sradha Roy
                    </TableCell>
                    <TableCell className="py-2.5 px-2 text-muted-foreground text-xs">
                      Apple Pay
                    </TableCell>
                    <TableCell className="py-2.5 px-2 font-bold text-foreground text-xs">
                      $320.00
                    </TableCell>
                    <TableCell className="py-2.5 pl-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 text-[10px] font-semibold">
                        Completed
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Right 1 Col: Store Category Overview Progress Bars */}
            <div className="bg-card-gray rounded-2xl border border-border p-5 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block mb-2">
                  Top Merchant Niches
                </span>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground font-medium">
                        Food & Bakeries
                      </span>
                      <span className="font-bold text-foreground">56.58%</span>
                    </div>
                    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full w-[56.58%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground font-medium">
                        Fashion & Boutique
                      </span>
                      <span className="font-bold text-foreground">32.99%</span>
                    </div>
                    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-[32.99%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground font-medium">
                        Electronics & Gear
                      </span>
                      <span className="font-bold text-foreground">10.43%</span>
                    </div>
                    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full w-[10.43%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Category</span>
                <span>Active Stores</span>
                <span>GMV Share</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
