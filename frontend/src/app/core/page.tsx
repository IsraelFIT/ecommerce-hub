"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DollarSign,
  Store,
  Database,
  TrendingUp,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getTenantSubdomainUrl } from "@/utils/helper";
import { getCoreRevenueAnalytics } from "@/lib/api/payments";
import { getTenants } from "@/lib/api/tenants";
import { CoreRevenueData, TenantRecord } from "@/types";
import { useUserStore } from "@/store/user";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function CoreDashboardPage() {
  const [selectedRange, setSelectedRange] = useState("30d");
  const { user } = useUserStore();

  const [revenueData, setRevenueData] = useState<CoreRevenueData | null>(null);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [revRes, tenantRes] = await Promise.all([
        getCoreRevenueAnalytics().catch(() => null),
        getTenants().catch(() => null),
      ]);

      if (revRes?.data) {
        setRevenueData(revRes.data);
      }
      if (tenantRes?.data?.items) {
        setTenants(tenantRes.data.items);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  // Derive metrics from real database data
  const primaryCurrency = revenueData?.primary_currency || "NGN";
  const transactions = revenueData?.transactions || [];

  const totalGMV =
    revenueData?.metrics?.find((m) => m.id === "gmv")?.rawAmount ??
    transactions.reduce((acc, tx) => acc + (tx.gross || 0), 0);

  const platformFee =
    revenueData?.metrics?.find((m) => m.id === "fees")?.rawAmount ??
    transactions.reduce((acc, tx) => acc + (tx.platformFee || 0), 0);

  const totalStores = tenants.length;

  const stats = [
    {
      title: "Gross Platform Volume (GMV)",
      value: formatCurrency(totalGMV, primaryCurrency),
      change: `${transactions.length} total orders recorded`,
      trend: "up",
      subtitle: `Across ${totalStores} multi-tenant stores`,
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Platform Fee Revenue (2.5%)",
      value: formatCurrency(platformFee, primaryCurrency),
      change: "Automatic 2.5% take-rate",
      trend: "up",
      subtitle: "Paystack & Stripe automated split",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      title: "Active Tenants & Stores",
      value: String(totalStores),
      change: `${totalStores} stores provisioned`,
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

  // Top stores sorted by total volume or orders
  const topTenants = [...tenants].sort(
    (a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0),
  );

  const [txPage, setTxPage] = useState(1);
  const txPageSize = 5;
  const totalTxPages = Math.ceil(transactions.length / txPageSize) || 1;
  const paginatedTransactions = transactions.slice(
    (txPage - 1) * txPageSize,
    txPage * txPageSize,
  );

  const [storesPage, setStoresPage] = useState(1);
  const storesPageSize = 5;
  const totalStoresPages = Math.ceil(topTenants.length / storesPageSize) || 1;
  const paginatedTenants = topTenants.slice(
    (storesPage - 1) * storesPageSize,
    storesPage * storesPageSize,
  );

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
              {user?.email || "Super Administrator"}
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

          <Button
            variant="outline"
            size="md"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="gap-1.5 h-8 text-xs cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>

          <Link href="/core/tenants">
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
                {isLoading ? (
                  <Skeleton className="h-7 w-32 my-1" />
                ) : (
                  <h3 className="text-xl md:text-2xl font-bold font-secondary text-foreground tracking-tight">
                    {stat.value}
                  </h3>
                )}
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
                  <span className="text-[10px] text-muted-foreground">
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
                <span className="font-semibold text-primary font-mono">
                  staging (checked out)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card-gray/50 dark:bg-white/5 border border-border">
                <span className="text-muted-foreground">Production Branch</span>
                <span className="text-foreground font-mono">
                  production (protected)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card-gray/50 dark:bg-white/5 border border-border">
                <span className="text-muted-foreground">Connection Pooler</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
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
                href="/core/tenants"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>Store Directory</span>
                <ArrowRight className="size-3" />
              </Link>
              <Link
                href="/core/settings"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Settings & Registry →
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
                href="/core/tenants"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card-gray/30 dark:bg-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-medium text-foreground group"
              >
                <Store className="size-4 text-primary group-hover:scale-110 transition-transform" />
                <span>Store Directory</span>
              </Link>
              <Link
                href="/core/users"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card-gray/30 dark:bg-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-medium text-foreground group"
              >
                <ShieldCheck className="size-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span>Users & Roles</span>
              </Link>
              <Link
                href="/core/revenue"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card-gray/30 dark:bg-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-medium text-foreground group"
              >
                <DollarSign className="size-4 text-purple-500 group-hover:scale-110 transition-transform" />
                <span>Escrow & Revenue</span>
              </Link>
              <Link
                href="/core/settings"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card-gray/30 dark:bg-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-medium text-foreground group"
              >
                <Zap className="size-4 text-sky-500 group-hover:scale-110 transition-transform" />
                <span>Registry Config</span>
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
              <Link href="/core/revenue">
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

            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader className="bg-muted/40 border-b border-border">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
                      Tx ID / Date
                    </TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
                      Tenant Store
                    </TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
                      Gross Total
                    </TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-primary">
                      Fee (2.5%)
                    </TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Tenant Payout
                    </TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell className="py-2.5">
                          <Skeleton className="h-4 w-20 mb-1" />
                          <Skeleton className="h-3 w-14" />
                        </TableCell>
                        <TableCell className="py-2.5">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </TableCell>
                        <TableCell className="py-2.5">
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="py-2.5">
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="py-2.5">
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="py-2.5">
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-muted-foreground text-xs"
                      >
                        No platform split transactions recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransactions.map((tx) => (
                      <TableRow
                        key={tx.id}
                        className="hover:bg-muted/40 transition-colors border-border"
                      >
                        <TableCell className="py-2.5">
                          <div className="font-semibold text-foreground font-mono text-xs">
                            {tx.id}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {tx.date}
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="font-medium text-foreground text-xs">
                            {tx.tenant}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {tx.gateway}
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 font-semibold text-foreground text-xs">
                          {formatCurrency(tx.gross, tx.currency)}
                        </TableCell>
                        <TableCell className="py-2.5 font-semibold text-primary text-xs">
                          +{formatCurrency(tx.platformFee, tx.currency)}
                        </TableCell>
                        <TableCell className="py-2.5 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                          {formatCurrency(tx.tenantPayout, tx.currency)}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              tx.status === "Settled"
                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                : "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                            }`}
                          >
                            <CheckCircle2 className="size-2.5" />
                            {tx.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Split Transactions Pagination */}
            {totalTxPages > 1 && (
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border mt-3">
                <span className="text-[11px] text-muted-foreground">
                  Page {txPage} of {totalTxPages} ({transactions.length}{" "}
                  transactions)
                </span>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (txPage > 1) setTxPage(txPage - 1);
                        }}
                        className={
                          txPage <= 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalTxPages }, (_, i) => i + 1).map(
                      (p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            href="#"
                            isActive={txPage === p}
                            onClick={(e) => {
                              e.preventDefault();
                              setTxPage(p);
                            }}
                            className="cursor-pointer text-xs"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (txPage < totalTxPages) setTxPage(txPage + 1);
                        }}
                        className={
                          txPage >= totalTxPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Multi-Tenant Stores from Database */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h4 className="text-sm font-bold font-secondary text-foreground">
              Multi-Tenant Storefront Directory
            </h4>
            <span className="text-[10px] text-muted-foreground">
              Active tenant storefronts with live merchandise volume and
              database isolation
            </span>
          </div>
          <Link href="/core/tenants">
            <Button
              variant="outline"
              size="md"
              className="text-xs gap-1 h-7 cursor-pointer"
            >
              <span>Manage Stores</span>
              <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
                  Store & Subdomain
                </TableHead>
                <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
                  Data Adapter
                </TableHead>
                <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
                  Payment Gateway
                </TableHead>
                <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
                  Orders / Catalog
                </TableHead>
                <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
                  Total Volume (GMV)
                </TableHead>
                <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-28 mb-1" />
                      <Skeleton className="h-3 w-36" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Skeleton className="h-7 w-12 ml-auto rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : topTenants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8 text-center text-muted-foreground text-xs"
                  >
                    No tenant stores registered yet.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTenants.map((t) => (
                  <TableRow
                    key={t.id}
                    className="hover:bg-muted/40 transition-colors border-border"
                  >
                    <TableCell className="py-3">
                      <div className="font-semibold text-foreground text-xs">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {t.slug}.localhost:3000
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-muted-foreground text-xs">
                        {t.category || "General Retail"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      {t.backend_type === "sanity" ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Sanity CMS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          Neon Postgres
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-muted-foreground capitalize text-xs">
                      {t.default_gateway || "paystack"} Subaccount
                    </TableCell>
                    <TableCell className="py-3 text-foreground font-medium text-xs">
                      {t.orders_count ?? 0} orders / {t.product_count ?? 0}{" "}
                      items
                    </TableCell>
                    <TableCell className="py-3 font-semibold text-foreground text-xs">
                      {formatCurrency(t.total_volume ?? 0, t.currency || "NGN")}
                    </TableCell>
                    <TableCell className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          t.is_active !== false
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                            : "text-rose-600 dark:text-rose-400 bg-rose-500/10"
                        }`}
                      >
                        <CheckCircle2 className="size-2.5" />
                        {t.is_active !== false ? "Active" : "Suspended"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <a
                        href={getTenantSubdomainUrl(t.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                      >
                        <span>Visit</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Storefronts Pagination */}
        {totalStoresPages > 1 && (
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border mt-3">
            <span className="text-[11px] text-muted-foreground">
              Showing {(storesPage - 1) * storesPageSize + 1} to{" "}
              {Math.min(storesPage * storesPageSize, topTenants.length)} of{" "}
              {topTenants.length} stores
            </span>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (storesPage > 1) setStoresPage(storesPage - 1);
                    }}
                    className={
                      storesPage <= 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalStoresPages }, (_, i) => i + 1).map(
                  (p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={storesPage === p}
                        onClick={(e) => {
                          e.preventDefault();
                          setStoresPage(p);
                        }}
                        className="cursor-pointer text-xs"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (storesPage < totalStoresPages)
                        setStoresPage(storesPage + 1);
                    }}
                    className={
                      storesPage >= totalStoresPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
