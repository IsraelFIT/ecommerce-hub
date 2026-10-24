"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Package,
  CreditCard,
  Percent,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentGatewayLogo } from "@/components/shared/payment-gateway-logo";
import { useUserStore } from "@/store/user";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import {
  getTenantSubdomainUrl,
  getTenantRoute,
  formatCurrency,
} from "@/utils/helper";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { fetchOrders } from "@/lib/api/order";
import { getProducts } from "@/lib/api/products";
import { ApiOrder } from "@/types/order";
import { Product } from "@/types/products";
import CopyableId from "@/components/shared/copyable-id";

interface AdminPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function TenantOverviewPage({ params }: AdminPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";
  const { user } = useUserStore();
  const { branding } = useTenantTheme();
  const primaryColor = branding?.primaryColor;

  const formattedStoreName =
    user?.tenant_name ||
    branding?.storeHeadline ||
    tenantSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const subdomainUrl = getTenantSubdomainUrl(tenantSlug);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Live Database States
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetchOrders({ tenantSlug, per_page: 50 }).catch((err) => {
            console.warn("Could not fetch orders for overview:", err);
            return null;
          }),
          getProducts({ tenantSlug, per_page: 100 }).catch((err) => {
            console.warn("Could not fetch products for overview:", err);
            return null;
          }),
        ]);

        if (!isMounted) return;

        if (ordersRes?.data?.items && Array.isArray(ordersRes.data.items)) {
          setOrders(ordersRes.data.items);
        } else {
          setOrders([]);
        }

        if (productsRes?.data?.items && Array.isArray(productsRes.data.items)) {
          setProducts(productsRes.data.items);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Failed to load live dashboard metrics:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  const handleCopySubdomain = () => {
    navigator.clipboard.writeText(subdomainUrl);
    setCopiedUrl(true);
    toast.success("Subdomain URL copied to clipboard!");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Derive Real KPI Metrics
  const primaryCurrency =
    orders[0]?.currency ||
    products[0]?.currency ||
    user?.tenant_currency ||
    "NGN";

  const totalRevenue = orders.reduce(
    (acc, o) => acc + (Number(o.total_amount) || 0),
    0,
  );
  const totalNetPayout = orders.reduce(
    (acc, o) =>
      acc +
      (Number(o.tenant_payout_amount) || (Number(o.total_amount) || 0) * 0.975),
    0,
  );
  const totalPlatformFees = orders.reduce(
    (acc, o) =>
      acc + (Number(o.platform_fee) || (Number(o.total_amount) || 0) * 0.025),
    0,
  );

  const activeProducts = products.filter((p) => p.is_published !== false);
  const lowStockProducts = products.filter((p) => {
    // Products of class 'service' or 'digital' have unlimited inventory and are never low on stock
    if (p.product_class === "service" || p.product_class === "digital") {
      return false;
    }

    const variantsList = p.variants || [];
    if (variantsList.length > 0) {
      // If ANY variant is unlimited (does not track inventory), the product is not low on stock
      if (variantsList.some((v) => !v.track_inventory)) {
        return false;
      }
      const trackedVariants = variantsList.filter((v) => v.track_inventory);
      if (trackedVariants.length === 0) {
        return false;
      }
      const totalStock = trackedVariants.reduce(
        (acc, v) => acc + (v.stock_quantity ?? 0),
        0,
      );
      return totalStock <= 5;
    }

    // Flat products without variants: only evaluate if track_inventory is not false and inventory_count exists
    const productTracksInventory =
      p.track_inventory !== false &&
      p.inventory_count !== undefined &&
      p.inventory_count !== null;

    if (!productTracksInventory) {
      return false;
    }

    return (p.inventory_count ?? 0) <= 5;
  });

  // Display strictly the latest five orders on the admin overview
  const latestOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6 w-full text-foreground">
      {/* Live Storefront Status Banner */}
      <div
        className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary via-primary/85 to-primary/70 p-6 text-primary-foreground shadow-lg"
        style={{
          background: primaryColor
            ? `linear-gradient(to right, ${primaryColor}, color-mix(in srgb, ${primaryColor} 85%, black), color-mix(in srgb, ${primaryColor} 65%, black))`
            : undefined,
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-xs text-white">
              <span>Storefront Online & Live</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {formattedStoreName} Digital Hub
            </h2>
            <p className="text-xs md:text-sm text-white/85 max-w-xl">
              Your multi-tenant store is live on{" "}
              <span className="underline font-medium text-white">
                {subdomainUrl}
              </span>
              . Multi-currency payments, split settlements, and RLS database
              isolation are active.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              onClick={handleCopySubdomain}
              className="text-xs backdrop-blur-xs cursor-pointer text-stone-200! border-white!"
            >
              {copiedUrl ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy URL</span>
                </>
              )}
            </Button>

            <Button asChild className="text-xs backdrop-blur-xs cursor-pointer">
              <Link href={subdomainUrl} target="_blank">
                Visit Live Storefront
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Gross Volume
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalRevenue, primaryCurrency)}
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>
                {orders.length} order{orders.length === 1 ? "" : "s"} processed
              </span>
            </div>
          </div>
        </div>

        {/* Net Payout (97.5%) */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Merchant Net Payout
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalNetPayout, primaryCurrency)}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              97.5% direct subaccount split
            </div>
          </div>
        </div>

        {/* Platform Fee (2.5%) */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Platform Split Fee
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalPlatformFees, primaryCurrency)}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              2.5% hub transaction routing
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Active Catalog
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {activeProducts.length} / {products.length}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              {isLoading
                ? "Calculating inventory..."
                : lowStockProducts.length > 0
                  ? `${lowStockProducts.length} items low on stock`
                  : "All inventory in healthy stock"}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Recent Orders & Quick System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Overview */}
        <div className="lg:col-span-8 rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h5 className="font-bold text-foreground">
                Recent Storefront Orders
              </h5>
              <p className="text-xs text-muted-foreground">
                Real-time payment settlements through subaccounts
              </p>
            </div>
            <Link
              href={getTenantRoute(tenantSlug, "/orders")}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View all orders</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Table>
            <TableHeader className="bg-muted/60 border-b border-border">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="p-3.5 text-xs text-foreground font-semibold">
                  Order
                </TableHead>
                <TableHead className="p-3.5 text-xs text-foreground font-semibold">
                  Customer
                </TableHead>
                <TableHead className="p-3.5 text-xs text-foreground font-semibold">
                  Gateway
                </TableHead>
                <TableHead className="p-3.5 text-xs text-foreground font-semibold">
                  Gross
                </TableHead>
                <TableHead className="p-3.5 text-xs text-foreground font-semibold">
                  Net (97.5%)
                </TableHead>
                <TableHead className="p-3.5 text-xs text-foreground font-semibold">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRow key={idx} className="border-border">
                    <TableCell className="p-3.5">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="p-3.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-3.5 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-3.5">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="p-3.5">
                      <Skeleton className="h-4 w-14" />
                    </TableCell>
                    <TableCell className="p-3.5">
                      <Skeleton className="h-4 w-14" />
                    </TableCell>
                    <TableCell className="p-3.5">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : latestOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-36 text-center text-muted-foreground text-xs"
                  >
                    No storefront orders received yet. Once customers checkout,
                    orders and automated split settlements will appear here.
                  </TableCell>
                </TableRow>
              ) : (
                latestOrders.map((ord) => {
                  const customerName = ord.customer_name || "Customer";
                  const customerEmail = ord.customer_email || "—";
                  const customerAvatar = ord.customer_avatar_url || undefined;
                  const grossVal = Number(ord.total_amount) || 0;
                  const netVal =
                    Number(ord.tenant_payout_amount) || grossVal * 0.975;
                  const ordCurrency = ord.currency || primaryCurrency;
                  const rawStatus = (ord.status || "pending").toLowerCase();

                  return (
                    <TableRow
                      key={ord.id}
                      className="border-border hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="p-3.5 font-semibold text-foreground text-xs">
                        <CopyableId
                          id={ord.gateway_reference || ord.id}
                          length={7}
                          prefix="#"
                          asLink={getTenantRoute(
                            tenantSlug,
                            `/orders/${ord.id}`,
                          )}
                          textClassName="hover:text-primary font-bold"
                        />
                      </TableCell>
                      <TableCell className="p-3.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={customerAvatar}
                            name={customerName}
                            email={customerEmail}
                            size="sm"
                            shape="rounded"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-foreground text-xs truncate">
                              {customerName}
                            </div>
                            <div className="text-muted-foreground text-[11px] truncate">
                              {customerEmail}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-3.5">
                        <PaymentGatewayLogo gateway={ord.payment_gateway} />
                      </TableCell>
                      <TableCell className="p-3.5 font-semibold text-foreground text-xs">
                        {formatCurrency(grossVal, ordCurrency)}
                      </TableCell>
                      <TableCell className="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatCurrency(netVal, ordCurrency)}
                      </TableCell>
                      <TableCell className="p-3.5">
                        <Badge
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            rawStatus === "delivered" ||
                            rawStatus === "fulfilled"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                              : rawStatus === "shipped"
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                                : rawStatus === "cancelled" ||
                                    rawStatus === "failed"
                                  ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
                                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {rawStatus.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Footer */}
          <div className="p-3.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span className="text-[11px]">
              Showing {orders.length === 0 ? 0 : latestOrders.length} of{" "}
              {orders.length} orders (latest 5)
            </span>
            <Link
              href={getTenantRoute(tenantSlug, "/orders")}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View all orders</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Side Cards: System Health & Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          {/* Multi-Tenant System Health */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Tenant Engine Status
              </h4>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">PostgreSQL RLS</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Isolated
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Subdomain Route</span>
                <span className="text-foreground">
                  {tenantSlug}.ecommerce-hub.com
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Payment Splitting</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  97.5% Direct
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">CMS Sync</span>
                <span className="font-semibold text-foreground">
                  Sanity / Headless
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Card */}
          <div className="rounded-2xl border border-border bg-linear-to-br from-card to-muted p-5 text-foreground space-y-2 shadow-xs">
            <div className="flex items-center gap-2">
              <h5 className="font-bold text-foreground">Merchant Actions</h5>
            </div>
            <p className="text-xs text-muted-foreground">
              Customize your brand theme, set your primary palette, or hook up
              custom domain DNS.
            </p>
            <Link
              href={getTenantRoute(tenantSlug, "/branding")}
              className="block pt-1"
            >
              <Button
                size="sm"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-8 cursor-pointer shadow-xs"
              >
                Customize Storefront
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
