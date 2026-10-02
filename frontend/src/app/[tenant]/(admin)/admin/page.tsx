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
import { getTenantSubdomainUrl } from "@/utils/helper";
import { Badge } from "@/components/ui/badge";

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
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full">
      {/* Live Storefront Status Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-xs">
              <span>Storefront Online & Live</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              {formattedStoreName} Digital Hub
            </h2>
            <p className="text-xs md:text-sm text-emerald-100 max-w-xl">
              Your multi-tenant store is live on{" "}
              <span className="underline font-medium">{subdomainUrl}</span>.
              Multi-currency payments, split settlements, and RLS database
              isolation are active.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={handleCopySubdomain}
              className="bg-white/10 hover:bg-white/20 text-xs font-semibold text-white backdrop-blur-xs border border-white/20"
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

            <Button
              asChild
              className="bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold"
            >
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
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">
              Gross Volume
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-stone-900">
              ${totalRevenue.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+18.4% vs last period</span>
            </div>
          </div>
        </div>

        {/* Net Payout (97.5%) */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">
              Merchant Net Payout
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-stone-900">
              ${totalNetPayout.toFixed(2)}
            </div>
            <div className="text-xs text-stone-500 mt-1">
              97.5% direct subaccount split
            </div>
          </div>
        </div>

        {/* Platform Fee (2.5%) */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">
              Platform Split Fee
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-stone-900">
              ${totalPlatformFees.toFixed(2)}
            </div>
            <div className="text-xs text-stone-500 mt-1">
              2.5% hub transaction routing
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">
              Active Catalog
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-stone-900">
              {products.filter((p) => p.status === "active").length} /{" "}
              {products.length}
            </div>
            <div className="text-xs text-stone-500 mt-1">
              {products.filter((p) => p.status === "low_stock").length} items
              low on stock
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Recent Orders & Quick System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Overview */}
        <div className="lg:col-span-8 rounded-2xl border border-stone-200/90 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-stone-100">
            <div>
              <h5 className="font-bold text-stone-900">
                Recent Storefront Orders
              </h5>
              <p className="text-stone-500">
                Real-time payment settlements through subaccounts
              </p>
            </div>
            <Link
              href={`/${tenantSlug}/orders`}
              className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View all orders</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Table>
            <TableHeader className="bg-stone-50 border-b border-stone-200/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="p-3.5 text-xs text-stone-500 font-medium">
                  Order
                </TableHead>
                <TableHead className="p-3.5 text-xs text-stone-500 font-medium">
                  Customer
                </TableHead>
                <TableHead className="p-3.5 text-xs text-stone-500 font-medium">
                  Gateway
                </TableHead>
                <TableHead className="p-3.5 text-xs text-stone-500 font-medium">
                  Gross
                </TableHead>
                <TableHead className="p-3.5 text-xs text-stone-500 font-medium">
                  Net (97.5%)
                </TableHead>
                <TableHead className="p-3.5 text-xs text-stone-500 font-medium">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-stone-100">
              {paginatedOrders.map((ord) => (
                <TableRow
                  key={ord.id}
                  className="hover:bg-stone-50/60 transition-colors"
                >
                  <TableCell className="p-3.5 font-semibold text-stone-900">
                    {ord.id}
                  </TableCell>
                  <TableCell className="p-3.5">
                    <div className="font-medium text-stone-900">
                      {ord.customerName}
                    </div>
                    <div className="text-stone-400 text-xs">
                      {ord.customerEmail}
                    </div>
                  </TableCell>
                  <TableCell className="p-3.5">
                    <Badge className="bg-stone-100 px-2 py-1.5 text-xs font-medium text-stone-700">
                      {ord.gateway}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-3.5 font-semibold text-stone-900">
                    ${ord.grossAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className="p-3.5 font-semibold text-emerald-600">
                    ${ord.netPayout.toFixed(2)}
                  </TableCell>
                  <TableCell className="p-3.5">
                    <Badge
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        ord.status === "delivered"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : ord.status === "shipped"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
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
          <div className="p-3.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
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
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Tenant Engine Status
              </h4>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">PostgreSQL RLS</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Isolated
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Subdomain Route</span>
                <span className="font-mono text-stone-700">
                  {tenantSlug}.ecommerce-hub.com
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Payment Splitting</span>
                <span className="font-semibold text-emerald-600">
                  97.5% Direct
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-stone-500">CMS Sync</span>
                <span className="font-semibold text-stone-700">
                  Sanity / Headless
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Card */}
          <div className="rounded-2xl border border-stone-200/90 bg-linear-to-br from-stone-900 to-stone-800 p-5 text-white space-y-1">
            <div className="flex items-center gap-2">
              <h5 className="font-bold">Merchant Actions</h5>
            </div>
            <p className="text-stone-300">
              Customize your brand theme, set your primary palette, or hook up
              custom domain DNS.
            </p>
            <Link href={`/${tenantSlug}/branding`}>
              <Button
                size="md"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-8 cursor-pointer"
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
