"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Search,
  RefreshCw,
  Building2,
  ExternalLink,
  ShieldCheck,
  Crown,
  User as UserIcon,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  Calendar,
  Package,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getCoreUserDetail, updateUserRole } from "@/lib/api/users";
import {
  CoreUserDetailResponse,
  CoreUserOrder,
  TenantCustomerSummary,
  UserRole,
} from "@/types/users";
import {
  formatCurrency,
  getTenantRoute,
  getTenantSubdomainUrl,
} from "@/utils/helper";
import CopyableId from "@/components/shared/copyable-id";

interface UserDetailPageProps {
  params: Promise<{
    id: string;
    tenant?: string;
  }>;
}

export default function CoreUserDetailPage({ params }: UserDetailPageProps) {
  const unwrappedParams = use(params);
  const userId = unwrappedParams.id;

  const [data, setData] = useState<CoreUserDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getCoreUserDetail(userId);
      if (res.data) {
        setData(res.data);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load user and store details";
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleRoleChange = async (targetRole: UserRole) => {
    if (!data) return;
    try {
      setIsUpdatingRole(true);
      const res = await updateUserRole(data.id, targetRole);
      if (res.data) {
        toast.success(
          `Role updated to ${targetRole.replace("_", " ").toUpperCase()}`,
        );
        setData((prev) => (prev ? { ...prev, role: targetRole } : null));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role";
      toast.error(msg);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const role = data?.role;
  const isCustomer = role === "customer" || role === "user";
  const isTenantAdmin = role === "tenant_admin" || role === "admin";
  const isHubAdmin = role === "hub_admin";
  const isSuperAdmin = role === "super_admin";

  const orders: CoreUserOrder[] = data?.orders || [];
  const customers: TenantCustomerSummary[] = data?.customers || [];
  const storeCurrency =
    data?.user_stats?.currency || data?.tenant?.currency || "NGN";

  // Filtered orders list (for customer users)
  const filteredOrders = orders.filter((ord: CoreUserOrder) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      !s ||
      ord.order_number.toLowerCase().includes(s) ||
      ord.id.toLowerCase().includes(s) ||
      (ord.tenant_name && ord.tenant_name.toLowerCase().includes(s)) ||
      (ord.items &&
        ord.items.some(
          (it) =>
            (it.product_name && it.product_name.toLowerCase().includes(s)) ||
            (it.name && it.name.toLowerCase().includes(s)),
        ));

    if (!matchesSearch) return false;

    if (statusFilter !== "all") {
      return ord.status.toLowerCase() === statusFilter.toLowerCase();
    }

    return true;
  });

  // Filtered customer roster (for tenant_admin, hub_admin, super_admin)
  const filteredCustomers = customers.filter((c: TenantCustomerSummary) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      !s ||
      c.full_name.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      (c.phone_number && c.phone_number.includes(s));

    if (!matchesSearch) return false;

    if (customerFilter === "with_orders") return c.orders_count > 0;
    if (customerFilter === "registered") return c.is_registered;

    return true;
  });

  const totalCount = isCustomer
    ? filteredOrders.length
    : filteredCustomers.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6 w-full animate-fadeIn pb-12">
      {/* Back Link & Top Header */}
      <div className="flex flex-col gap-3 pb-4 border-b border-border">
        <Link
          href="/core/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to All Users</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shrink-0">
              {(data?.first_name?.[0] || "") + (data?.last_name?.[0] || "") ||
                (isCustomer ? "CU" : "TA")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold font-secondary text-foreground">
                  {data?.full_name ||
                    (isCustomer ? "Customer" : "Administrator")}
                </h2>
                {data && (
                  <Badge
                    className={
                      isSuperAdmin
                        ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300/40 text-xs gap-1"
                        : isHubAdmin
                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300/40 text-xs gap-1"
                          : isTenantAdmin
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 text-xs gap-1"
                            : "bg-stone-500/15 text-stone-700 dark:text-stone-300 border-stone-300/40 text-xs gap-1"
                    }
                  >
                    {isSuperAdmin ? (
                      <>
                        <Crown className="size-3" />
                        <span>Super Admin</span>
                      </>
                    ) : isHubAdmin ? (
                      <>
                        <ShieldCheck className="size-3" />
                        <span>Hub Admin</span>
                      </>
                    ) : isTenantAdmin ? (
                      <>
                        <Building2 className="size-3" />
                        <span>Tenant Admin</span>
                      </>
                    ) : (
                      <>
                        <UserIcon className="size-3" />
                        <span>Customer</span>
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data?.email} •{" "}
                {isCustomer ? (
                  <>
                    Customer of:{" "}
                    <strong className="text-foreground">
                      {data?.tenant?.name || "Jazz Cakes LTD"}
                    </strong>
                  </>
                ) : isTenantAdmin ? (
                  <>
                    Managing store:{" "}
                    <strong className="text-foreground">
                      {data?.tenant?.name || "Independent"}
                    </strong>
                  </>
                ) : (
                  <>
                    Platform Administrator
                    {data?.tenant?.name && (
                      <>
                        {" "}
                        • Associated with:{" "}
                        <strong className="text-foreground">
                          {data.tenant.name}
                        </strong>
                      </>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="gap-1.5 h-9 text-xs cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>

            {/* Quick Role Elevation/Demotion Actions */}
            {data && isCustomer && (
              <Button
                size="md"
                variant="outline"
                onClick={() => handleRoleChange("tenant_admin")}
                disabled={isUpdatingRole}
                className="h-9 text-xs cursor-pointer gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20"
                title="Promote this customer to Tenant Admin"
              >
                <Building2 className="size-3.5" />
                <span>Promote to Tenant Admin</span>
              </Button>
            )}

            {data && isTenantAdmin && (
              <Button
                size="md"
                variant="outline"
                onClick={() => handleRoleChange("hub_admin")}
                disabled={isUpdatingRole}
                className="h-9 text-xs cursor-pointer gap-1.5 bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20"
                title="Elevate this Tenant Admin to Hub Admin"
              >
                <ShieldCheck className="size-3.5" />
                <span>Promote to Hub Admin</span>
              </Button>
            )}

            {data && isHubAdmin && (
              <Button
                size="md"
                variant="outline"
                onClick={() => handleRoleChange("tenant_admin")}
                disabled={isUpdatingRole}
                className="h-9 text-xs cursor-pointer gap-1.5 bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20"
                title="Revert Hub Admin to regular Tenant Admin"
              >
                <ShieldCheck className="size-3.5" />
                <span>Demote to Tenant Admin</span>
              </Button>
            )}

            {data?.tenant?.slug && (
              <Button
                asChild
                size="md"
                className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer gap-1.5"
              >
                <a
                  href={getTenantSubdomainUrl(data.tenant.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Visit Storefront</span>
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Profile & Affiliation Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile Card */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-muted-foreground border-b border-border pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              {isCustomer ? "Customer Profile" : "Administrator Profile"}
            </span>

            <CopyableId
              id={userId}
              length={7}
              prefix="#"
              textClassName="hover:text-primary font-bold"
            />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3.5" /> Email
              </span>

              <CopyableId
                id={data?.email}
                length={40}
                prefix=""
                asLink={`mailto:${data?.email}`}
                textClassName="hover:text-primary font-bold"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Phone className="size-3.5" /> Phone
              </span>
              <span className="text-foreground">
                {data?.phone_number || "Not provided"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5" /> Registered
              </span>
              <span className="text-foreground">
                {data?.created_at
                  ? new Date(data.created_at).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Storefront Affiliation Card */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3 md:col-span-2">
          <div className="flex items-center justify-between text-muted-foreground border-b border-border pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              {isCustomer
                ? "Storefront Affiliation & Details"
                : "Storefront Isolation & Details"}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {storeCurrency}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground text-[11px] block">
                Store Name
              </span>
              <strong className="text-foreground text-sm font-semibold">
                {data?.tenant?.name || "Independent"}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px] block">
                Subdomain Routing
              </span>
              <span className="text-xs text-foreground bg-muted px-1.5 py-0.5 rounded">
                {data?.tenant?.slug
                  ? getTenantSubdomainUrl(data.tenant.slug).replace(
                      /^https?:\/\//,
                      "",
                    )
                  : "store.ecommerce-hub.com"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px] block">
                Account Status
              </span>
              <span className="text-foreground font-medium flex items-center gap-1">
                <span
                  className={`size-2 rounded-full ${
                    data?.is_active ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                {data?.is_active ? "Active Account" : "Disabled Account"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isCustomer ? (
          <>
            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Orders Placed</span>
                <ShoppingBag className="size-4 text-primary" />
              </div>
              <div className="text-2xl font-bold font-secondary text-foreground">
                {data?.user_stats?.orders_count ?? orders.length}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Total checkout orders
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Total Spent</span>
                <DollarSign className="size-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-secondary text-emerald-600 dark:text-emerald-400">
                {formatCurrency(
                  data?.user_stats?.total_spent ?? 0,
                  storeCurrency,
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Cumulative purchases
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Average Order</span>
                <TrendingUp className="size-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold font-secondary text-purple-600 dark:text-purple-400 truncate">
                {formatCurrency(
                  data?.user_stats?.avg_order_value ?? 0,
                  storeCurrency,
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Average basket value
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Last Order Date</span>
                <Calendar className="size-4 text-blue-500" />
              </div>
              <div className="text-base font-bold font-secondary text-foreground truncate mt-1">
                {data?.user_stats?.last_order_at
                  ? new Date(data.user_stats.last_order_at).toLocaleDateString()
                  : "No orders yet"}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Most recent activity
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Unique Customers</span>
                <Users className="size-4 text-primary" />
              </div>
              <div className="text-2xl font-bold font-secondary text-foreground">
                {data?.stats?.total_customers ?? 0}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Customer base for this store
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Orders Processed</span>
                <ShoppingBag className="size-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-secondary text-emerald-600 dark:text-emerald-400">
                {data?.stats?.total_orders ?? 0}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Customer checkout orders
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Store Gross Volume</span>
                <DollarSign className="size-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold font-secondary text-foreground truncate">
                {formatCurrency(data?.stats?.total_revenue ?? 0, storeCurrency)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Cumulative store GMV
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Average Order Value</span>
                <TrendingUp className="size-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold font-secondary text-purple-600 dark:text-purple-400 truncate">
                {formatCurrency(
                  data?.stats?.avg_order_value ?? 0,
                  storeCurrency,
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Average customer basket size
              </p>
            </div>
          </>
        )}
      </div>

      {/* User Orders Table / Store Customers Roster */}
      <div className="space-y-4">
        {isCustomer ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold font-secondary text-foreground flex items-center gap-2">
                  <ShoppingBag className="size-4 text-primary" />
                  <span>
                    Orders Placed by {data?.first_name || "Customer"} (
                    {filteredOrders.length})
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  All checkout purchases, transaction references, item counts,
                  and fulfillment statuses.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by order #, item, store..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8.5 h-8.5 text-xs bg-card border-border text-foreground"
                  />
                </div>

                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8.5 text-xs w-36 bg-card border-border text-foreground">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              <Table>
                <TableHeader className="bg-muted/60">
                  <TableRow className="border-border">
                    <TableHead className="text-xs font-bold text-foreground">
                      Order Reference
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Store / Merchant
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Items Purchased
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Total Amount
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Payment Gateway
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell className="py-3">
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-7 w-16 ml-auto rounded-md" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : paginatedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground text-xs"
                      >
                        <ShoppingBag className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                        No orders found for this user.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedOrders.map((ord) => {
                      const itemsList = ord.items || [];
                      const firstItemName =
                        itemsList[0]?.product_name ||
                        itemsList[0]?.name ||
                        "Product";
                      const extraItemsCount = itemsList.length - 1;

                      return (
                        <TableRow
                          key={ord.id}
                          className="hover:bg-muted/30 transition-colors border-border"
                        >
                          {/* Order Reference */}
                          <TableCell className="py-3">
                            <div className="font-semibold text-xs text-foreground font-mono">
                              {ord.order_number}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              ID: {ord.id.slice(0, 8)}
                            </div>
                          </TableCell>

                          {/* Date */}
                          <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {ord.created_at
                              ? new Date(ord.created_at).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </TableCell>

                          {/* Store */}
                          <TableCell className="py-3 text-xs">
                            <span className="font-medium text-foreground block">
                              {ord.tenant_name || data?.tenant?.name || "Store"}
                            </span>
                            {ord.tenant_slug && (
                              <span className="text-[10px] text-muted-foreground">
                                {ord.tenant_slug}
                              </span>
                            )}
                          </TableCell>

                          {/* Items Purchased */}
                          <TableCell className="py-3 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Package className="size-3.5 text-muted-foreground shrink-0" />
                              <span className="text-foreground truncate max-w-44">
                                {firstItemName}
                                {extraItemsCount > 0 && (
                                  <span className="text-muted-foreground text-[10px] ml-1">
                                    +{extraItemsCount} more
                                  </span>
                                )}
                              </span>
                            </div>
                          </TableCell>

                          {/* Total Amount */}
                          <TableCell className="py-3 font-semibold text-xs text-foreground">
                            {formatCurrency(ord.total_amount, ord.currency)}
                          </TableCell>

                          {/* Payment Gateway */}
                          <TableCell className="py-3 text-xs capitalize text-muted-foreground">
                            {ord.payment_gateway || "Paystack"}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={`capitalize text-[10px] font-semibold ${
                                ord.status === "delivered" ||
                                ord.status === "fulfilled"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : ord.status === "paid"
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                    : ord.status === "processing"
                                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                      : ord.status === "cancelled" ||
                                          ord.status === "failed"
                                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                        : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {ord.status}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-3 text-right">
                            {ord.tenant_slug ? (
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2.5 cursor-pointer gap-1"
                              >
                                <Link
                                  href={getTenantRoute(
                                    ord.tenant_slug,
                                    `/orders/${ord.id}`,
                                  )}
                                  target="_blank"
                                >
                                  <span>View Order</span>
                                  <ExternalLink className="size-3" />
                                </Link>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <>
            {/* Customers Table Section Header & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold font-secondary text-foreground flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  <span>
                    Customer Accounts & Roster ({filteredCustomers.length})
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Individual buyers and registered customers associated with
                  this tenant store.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search customers by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8.5 h-8.5 text-xs bg-card border-border text-foreground"
                  />
                </div>

                <Select
                  value={customerFilter}
                  onValueChange={(val) => {
                    setCustomerFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8.5 text-xs w-36 bg-card border-border text-foreground">
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="with_orders">With Orders</SelectItem>
                    <SelectItem value="registered">
                      Registered Accounts
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customers Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              <Table>
                <TableHeader className="bg-muted/60">
                  <TableRow className="border-border">
                    <TableHead className="text-xs font-bold text-foreground">
                      Customer
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Phone Number
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Orders Count
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Total Spent
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Last Order Date
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Account Type
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                            <div className="space-y-1.5 min-w-0">
                              <Skeleton className="h-3.5 w-28" />
                              <Skeleton className="h-3 w-36" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-7 w-20 ml-auto rounded-md" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : paginatedCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-12 text-muted-foreground text-xs"
                      >
                        <Users className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                        No customers found for this store yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCustomers.map((cust) => {
                      const custInitials =
                        (cust.first_name?.[0] || "") +
                          (cust.last_name?.[0] || "") ||
                        cust.email.slice(0, 2).toUpperCase();

                      return (
                        <TableRow
                          key={cust.id}
                          className="hover:bg-muted/30 transition-colors border-border"
                        >
                          {/* Customer */}
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                                {custInitials}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-foreground truncate">
                                  {cust.full_name || cust.email}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate">
                                  {cust.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Phone Number */}
                          <TableCell className="py-3">
                            <span className="font-mono text-xs text-foreground">
                              {cust.phone_number || "—"}
                            </span>
                          </TableCell>

                          {/* Orders Count */}
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className="text-xs font-semibold"
                            >
                              {cust.orders_count}{" "}
                              {cust.orders_count === 1 ? "order" : "orders"}
                            </Badge>
                          </TableCell>

                          {/* Total Spent */}
                          <TableCell className="py-3">
                            <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(cust.total_spent, storeCurrency)}
                            </span>
                          </TableCell>

                          {/* Last Order Date */}
                          <TableCell className="py-3">
                            <span className="text-xs text-muted-foreground">
                              {cust.last_order_at
                                ? new Date(
                                    cust.last_order_at,
                                  ).toLocaleDateString()
                                : "No orders yet"}
                            </span>
                          </TableCell>

                          {/* Account Type */}
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={
                                cust.is_registered
                                  ? "bg-primary/10 text-primary border-primary/20 text-[10px]"
                                  : "bg-muted text-muted-foreground text-[10px]"
                              }
                            >
                              {cust.is_registered
                                ? "Registered Account"
                                : "Guest Buyer"}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(cust.email, "Customer Email")
                              }
                              className="h-7 text-xs px-2.5 cursor-pointer gap-1"
                            >
                              {copiedText === cust.email ? (
                                <>
                                  <Check className="size-3 text-emerald-500" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3" />
                                  <span>Copy Email</span>
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              Showing{" "}
              <strong className="text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-foreground">
                {Math.min(currentPage * pageSize, totalCount)}
              </strong>{" "}
              of <strong className="text-foreground">{totalCount}</strong>{" "}
              {isCustomer ? "orders" : "customers"}
            </span>

            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={
                      currentPage <= 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === pageNum}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNum);
                        }}
                        className="cursor-pointer text-xs"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages)
                        setCurrentPage(currentPage + 1);
                    }}
                    className={
                      currentPage >= totalPages
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
