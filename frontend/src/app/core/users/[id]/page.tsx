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
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  Copy,
  Check,
  Calendar,
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
  TenantCustomerSummary,
  UserRole,
} from "@/types/users";
import { formatCurrency, getTenantSubdomainUrl } from "@/utils/helper";

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
  const [orderFilter, setOrderFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const pageSize = 12;

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
          : "Failed to load user and store customers";
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

  const handleRoleToggle = async () => {
    if (!data) return;
    const targetRole: UserRole =
      data.role === "tenant_admin" ? "hub_admin" : "tenant_admin";
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

  const customers = data?.customers || [];
  const storeCurrency = data?.tenant?.currency || "NGN";

  // Filtered customer list
  const filteredCustomers = customers.filter((c: TenantCustomerSummary) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone_number && c.phone_number.includes(searchTerm));

    if (!matchesSearch) return false;

    if (orderFilter === "with_orders") return c.orders_count > 0;
    if (orderFilter === "registered") return c.is_registered;

    return true;
  });

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
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
                "TA"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold font-secondary text-foreground">
                  {data?.full_name || "Tenant Administrator"}
                </h2>
                {data && (
                  <Badge
                    className={
                      data.role === "hub_admin"
                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300/40 text-xs gap-1"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 text-xs gap-1"
                    }
                  >
                    {data.role === "hub_admin" ? (
                      <>
                        <ShieldCheck className="size-3" />
                        <span>Hub Admin</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="size-3" />
                        <span>Tenant Admin</span>
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data?.email} • Managing store:{" "}
                <strong className="text-foreground">
                  {data?.tenant?.name || "Independent"}
                </strong>
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

            {data && (
              <Button
                size="md"
                variant="outline"
                onClick={handleRoleToggle}
                disabled={isUpdatingRole}
                className={`h-9 text-xs cursor-pointer gap-1.5 ${
                  data.role === "tenant_admin"
                    ? "bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20"
                    : "bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20"
                }`}
              >
                <ShieldCheck className="size-3.5" />
                <span>
                  {data.role === "tenant_admin"
                    ? "Promote to Hub Admin"
                    : "Demote to Tenant Admin"}
                </span>
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

      {/* Store & Admin Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Admin Details */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-muted-foreground border-b border-border pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Administrator Profile
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              ID: {userId.slice(0, 8)}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3.5" /> Email
              </span>
              <button
                type="button"
                onClick={() =>
                  data?.email && copyToClipboard(data.email, "Email")
                }
                className="font-medium text-foreground hover:underline flex items-center gap-1 cursor-pointer truncate max-w-44"
              >
                <span>{data?.email || "—"}</span>
                {copiedText === data?.email ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3 opacity-60" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Phone className="size-3.5" /> Phone
              </span>
              <span className="font-mono text-foreground">
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

        {/* Tenant Store Info */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3 md:col-span-2">
          <div className="flex items-center justify-between text-muted-foreground border-b border-border pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Storefront Isolation & Details
            </span>
            <Badge variant="outline" className="text-[10px]">
              {data?.tenant?.currency || "NGN"}
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
              <span className="font-mono text-xs text-foreground bg-muted px-1.5 py-0.5 rounded">
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
                Settlement Gateway
              </span>
              <span className="text-foreground font-medium">
                {data?.tenant?.country === "Nigeria"
                  ? "Paystack Subaccount Split"
                  : "Stripe Connect"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Strip (Products style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Unique Customers</span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-secondary text-foreground">
            {data?.stats?.total_customers ?? customers.length}
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
            {formatCurrency(data?.stats?.avg_order_value ?? 0, storeCurrency)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Average customer basket size
          </p>
        </div>
      </div>

      {/* Customers Table Section Header & Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold font-secondary text-foreground">
              Customer Accounts & Roster ({filteredCustomers.length})
            </h4>
            <p className="text-xs text-muted-foreground">
              Individual buyers and registered customers associated with this
              tenant store.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8.5 h-8.5 text-xs bg-card border-border text-foreground"
              />
            </div>

            <Select
              value={orderFilter}
              onValueChange={(val) => {
                setOrderFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8.5 text-xs w-36 bg-card border-border text-foreground">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="with_orders">With Orders</SelectItem>
                <SelectItem value="registered">Registered Accounts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Customers Table (Products style) */}
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
                      <Skeleton className="h-7 w-16 ml-auto rounded-md" />
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
                            ? new Date(cust.last_order_at).toLocaleDateString()
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
                {Math.min(currentPage * pageSize, filteredCustomers.length)}
              </strong>{" "}
              of{" "}
              <strong className="text-foreground">
                {filteredCustomers.length}
              </strong>{" "}
              customers
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
