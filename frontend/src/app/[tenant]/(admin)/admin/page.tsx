"use client";

import { useState, use } from "react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useUserStore } from "@/store/user";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { getTenantSubdomainUrl, getTenantRoute } from "@/utils/helper";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";

interface AdminPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "low_stock";
  sales: number;
}

interface OrderItem {
  id: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  itemsCount: number;
  grossAmount: number;
  netPayout: number;
  platformFee: number;
  gateway: "Stripe Connect" | "Paystack Split";
  status: "paid" | "processing" | "shipped" | "delivered";
  createdAt: string;
}

export default function TenantOverviewPage({ params }: AdminPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";
  const { user } = useUserStore();
  const { branding } = useTenantTheme();
  const primaryColor = branding?.primaryColor;

  const formattedStoreName =
    user?.tenant_name ||
    tenantSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const subdomainUrl = getTenantSubdomainUrl(tenantSlug);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Products
  const products: ProductItem[] = [
    {
      id: "prod-1",
      name: "Minimalist Leather Travel Backpack",
      sku: "SKU-BP-001",
      category: "Fashion & Apparel",
      price: 149.0,
      stock: 34,
      status: "active",
      sales: 128,
    },
    {
      id: "prod-2",
      name: "Studio Wireless Noise-Cancelling Headphones",
      sku: "SKU-HP-002",
      category: "Tech & Electronics",
      price: 299.0,
      stock: 12,
      status: "active",
      sales: 64,
    },
    {
      id: "prod-3",
      name: "Ceramic Matte Artisan Coffee Mug",
      sku: "SKU-MUG-003",
      category: "Home & Living",
      price: 28.0,
      stock: 4,
      status: "low_stock",
      sales: 312,
    },
    {
      id: "prod-4",
      name: "Tactile Mechanical Desk Keyboard (RGB)",
      sku: "SKU-KB-004",
      category: "Tech & Electronics",
      price: 185.0,
      stock: 22,
      status: "active",
      sales: 95,
    },
    {
      id: "prod-5",
      name: "Organic Botanical Face Serum 50ml",
      sku: "SKU-SRM-005",
      category: "Health & Beauty",
      price: 45.0,
      stock: 0,
      status: "draft",
      sales: 42,
    },
  ];

  // Orders
  const orders: OrderItem[] = [
    {
      id: "ORD-9421",
      customerName: "Sarah Jenkins",
      customerEmail: "sarah.j@example.com",
      customerAvatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
      itemsCount: 2,
      grossAmount: 448.0,
      netPayout: 436.8,
      platformFee: 11.2,
      gateway: "Stripe Connect",
      status: "processing",
      createdAt: "10 mins ago",
    },
    {
      id: "ORD-9420",
      customerName: "Tunde Adeyemi",
      customerEmail: "tunde.a@example.com",
      customerAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      itemsCount: 1,
      grossAmount: 149.0,
      netPayout: 145.28,
      platformFee: 3.72,
      gateway: "Paystack Split",
      status: "paid",
      createdAt: "45 mins ago",
    },
    {
      id: "ORD-9419",
      customerName: "Marcus Vance",
      customerEmail: "marcus.v@example.com",
      customerAvatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
      itemsCount: 3,
      grossAmount: 241.0,
      netPayout: 234.97,
      platformFee: 6.03,
      gateway: "Stripe Connect",
      status: "shipped",
      createdAt: "3 hours ago",
    },
    {
      id: "ORD-9418",
      customerName: "Elena Rostova",
      customerEmail: "elena.r@example.com",
      customerAvatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      itemsCount: 1,
      grossAmount: 299.0,
      netPayout: 291.52,
      platformFee: 7.48,
      gateway: "Stripe Connect",
      status: "delivered",
      createdAt: "Yesterday",
    },
  ];

  const [orderPage, setOrderPage] = useState(1);
  const pageSize = 3;
  const totalOrderPages = Math.ceil(orders.length / pageSize);
  const paginatedOrders = orders.slice(
    (orderPage - 1) * pageSize,
    orderPage * pageSize,
  );

  const handleCopySubdomain = () => {
    navigator.clipboard.writeText(subdomainUrl);
    setCopiedUrl(true);
    toast.success("Subdomain URL copied to clipboard!");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const totalRevenue = orders.reduce((acc, o) => acc + o.grossAmount, 0);
  const totalNetPayout = orders.reduce((acc, o) => acc + o.netPayout, 0);
  const totalPlatformFees = orders.reduce((acc, o) => acc + o.platformFee, 0);

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
            <div className="text-2xl font-bold text-foreground">
              ${totalRevenue.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+18.4% vs last period</span>
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
            <div className="text-2xl font-bold text-foreground">
              ${totalNetPayout.toFixed(2)}
            </div>
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
            <div className="text-2xl font-bold text-foreground">
              ${totalPlatformFees.toFixed(2)}
            </div>
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
            <div className="text-2xl font-bold text-foreground">
              {products.filter((p) => p.status === "active").length} /{" "}
              {products.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {products.filter((p) => p.status === "low_stock").length} items
              low on stock
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
              {paginatedOrders.map((ord) => (
                <TableRow
                  key={ord.id}
                  className="border-border hover:bg-muted/40 transition-colors"
                >
                  <TableCell className="p-3.5 font-semibold text-foreground">
                    {ord.id}
                  </TableCell>
                  <TableCell className="p-3.5">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        src={ord.customerAvatar}
                        name={ord.customerName}
                        email={ord.customerEmail}
                        size="sm"
                        shape="rounded"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-foreground text-xs truncate">
                          {ord.customerName}
                        </div>
                        <div className="text-muted-foreground text-[11px] truncate">
                          {ord.customerEmail}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-3.5">
                    <Badge className="bg-muted border border-border px-2 py-1 text-xs font-medium text-foreground">
                      {ord.gateway}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-3.5 font-semibold text-foreground">
                    ${ord.grossAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    ${ord.netPayout.toFixed(2)}
                  </TableCell>
                  <TableCell className="p-3.5">
                    <Badge
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        ord.status === "delivered"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                          : ord.status === "shipped"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {ord.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="p-3.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span className="text-[11px]">
              Showing {Math.min((orderPage - 1) * pageSize + 1, orders.length)}{" "}
              to {Math.min(orderPage * pageSize, orders.length)} of{" "}
              {orders.length} orders
            </span>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (orderPage > 1) setOrderPage(orderPage - 1);
                    }}
                    className={
                      orderPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalOrderPages }, (_, idx) => (
                  <PaginationItem key={idx + 1}>
                    <PaginationLink
                      href="#"
                      isActive={orderPage === idx + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setOrderPage(idx + 1);
                      }}
                      className="cursor-pointer text-xs"
                    >
                      {idx + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (orderPage < totalOrderPages)
                        setOrderPage(orderPage + 1);
                    }}
                    className={
                      orderPage === totalOrderPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
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
                <span className=" text-foreground">
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
