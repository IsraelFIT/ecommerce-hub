"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentGatewayLogo } from "@/components/shared/payment-gateway-logo";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CopyableId } from "@/components/shared/copyable-id";
import { ApiOrder, PaginationMeta } from "@/types";
import { fetchOrders, updateOrderStatus } from "@/lib/api/order";
import { formatCurrency, formatDate, getTenantRoute } from "@/utils/helper";

interface OrdersPageProps {
  params?: Promise<{
    tenant: string;
  }>;
}

export default function TenantOrdersPage({ params }: OrdersPageProps) {
  const unwrappedParams = params ? use(params) : null;
  const routeParams = useParams();

  const tenantSlug =
    unwrappedParams?.tenant || (routeParams?.tenant as string) || "store";

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters & Search
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        const res = await fetchOrders({
          tenantSlug,
          per_page: 10,
        });
        if (isMounted) {
          setOrders(res.data?.items || []);
          if (res.pagination) {
            setPagination(res.pagination as PaginationMeta);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error ? err.message : "Failed to load orders";
          toast.error(msg);
          setOrders([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  const handleSearchChange = (val: string) => {
    setOrderSearch(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    nextStatus: string,
  ) => {
    setUpdatingId(orderId);
    try {
      const res = await updateOrderStatus(
        orderId,
        { status: nextStatus },
        tenantSlug,
      );

      if (res.data) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: nextStatus } : o,
          ),
        );
        toast.success(`Order status updated to ${nextStatus}`);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update order status";
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusSelect = (order: ApiOrder, nextStatus: string) => {
    if (nextStatus.toLowerCase() === "cancelled") {
      const displayRef =
        order.gateway_reference || order.id.slice(0, 8).toUpperCase();
      toast(`Cancel Order #${displayRef}?`, {
        description:
          "Are you sure you want to cancel this order? This will mark it as cancelled.",
        action: {
          label: "Yes, Cancel",
          onClick: () => handleUpdateOrderStatus(order.id, "cancelled"),
        },
        cancel: {
          label: "Keep Order",
          onClick: () => {},
        },
        duration: 8000,
      });
      return;
    }
    handleUpdateOrderStatus(order.id, nextStatus);
  };

  const filteredOrders = orders.filter((o) => {
    const q = orderSearch.toLowerCase();
    const matchesSearch =
      o.id.toLowerCase().includes(q) ||
      (o.gateway_reference && o.gateway_reference.toLowerCase().includes(q)) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_email.toLowerCase().includes(q) ||
      o.payment_gateway.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" ||
      o.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 w-full text-foreground">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground z-10 pointer-events-none" />
            <Input
              placeholder="Search order ID, reference, customer or gateway..."
              value={orderSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => handleStatusChange(val)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="processing">In Progress</SelectItem>
              <SelectItem value="shipped">On the Way</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold px-2 py-3">
            Auto-Payout: Active
          </Badge>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/60 border-b border-border">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="p-4 text-xs font-semibold text-foreground">
                Order ID / Ref
              </TableHead>
              <TableHead className="p-4 text-xs font-semibold text-foreground">
                Customer
              </TableHead>
              <TableHead className="p-4 text-xs font-semibold text-foreground">
                Gateway
              </TableHead>
              <TableHead className="p-4 text-xs font-semibold text-foreground">
                Total Amount
              </TableHead>
              <TableHead className="p-4 text-xs font-semibold text-foreground">
                Merchant Net (97.5%)
              </TableHead>
              <TableHead className="p-4 text-xs font-semibold text-foreground">
                Platform Fee (2.5%)
              </TableHead>
              <TableHead className="p-4 text-xs font-semibold text-foreground">
                Fulfillment Status
              </TableHead>
              <TableHead className="p-4 text-xs font-semibold text-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <TableRow key={idx} className="border-border">
                  <TableCell className="p-4">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </TableCell>
                  <TableCell className="p-4">
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="p-4">
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="p-4">
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell className="p-4">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="p-4 text-right">
                    <Skeleton className="h-8 w-28 ml-auto rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredOrders.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={8}
                  className="p-12 text-center text-muted-foreground"
                >
                  No orders found matching your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((ord) => {
                  const orderDetailUrl = getTenantRoute(
                    tenantSlug,
                    `/orders/${ord.id}`,
                  );

                  return (
                    <TableRow
                      key={ord.id}
                      className="border-border hover:bg-muted/40 transition-colors group"
                    >
                      <TableCell className="p-4 text-xs font-semibold text-foreground">
                        <CopyableId
                          id={ord.gateway_reference || ord.id}
                          length={7}
                          prefix="#"
                          asLink={orderDetailUrl}
                          textClassName="hover:text-primary font-bold"
                        />
                        <span className="text-[10px] text-muted-foreground font-normal block mt-0.5">
                          {formatDate(ord.created_at)}
                        </span>
                      </TableCell>

                      <TableCell className="p-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={ord.customer_avatar_url || undefined}
                            name={ord.customer_name}
                            email={ord.customer_email}
                            size="sm"
                            shape="rounded"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-xs truncate">
                              {ord.customer_name}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {ord.customer_email}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="p-4">
                        <PaymentGatewayLogo gateway={ord.payment_gateway} />
                      </TableCell>

                      <TableCell className="p-4 font-bold text-foreground text-xs">
                        {formatCurrency(ord.total_amount, ord.currency)}
                      </TableCell>

                      <TableCell className="p-4 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatCurrency(ord.tenant_payout_amount, ord.currency)}
                      </TableCell>

                      <TableCell className="p-4 text-muted-foreground text-xs">
                        {formatCurrency(ord.platform_fee, ord.currency)}
                      </TableCell>

                      <TableCell className="p-4">
                        <Badge
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                            ord.status === "delivered" ||
                            ord.status === "fulfilled"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                              : ord.status === "shipped"
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                                : ord.status === "cancelled" ||
                                    ord.status === "failed"
                                  ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
                                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {ord.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={ord.status.toLowerCase()}
                            disabled={updatingId === ord.id}
                            onValueChange={(val) =>
                              handleStatusSelect(ord, val)
                            }
                          >
                            <SelectTrigger className="h-8 w-28 text-xs bg-background border-border text-foreground">
                              {updatingId === ord.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                              ) : (
                                <SelectValue placeholder="Status" />
                              )}
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                              <SelectItem value="processing">
                                Processing
                              </SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">
                                Delivered
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                          >
                            <Link href={orderDetailUrl} title="View Details">
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {filteredOrders.length > 0 && (
          <div className="p-4 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Showing{" "}
              {Math.min(
                (currentPage - 1) * pageSize + 1,
                filteredOrders.length,
              )}{" "}
              to {Math.min(currentPage * pageSize, filteredOrders.length)} of{" "}
              {filteredOrders.length} orders
            </span>
            {(pagination?.total !== undefined
              ? pagination.total >= 10
              : filteredOrders.length >= 10) && (
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
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from(
                    {
                      length: Math.ceil(filteredOrders.length / pageSize) || 1,
                    },
                    (_, idx) => (
                      <PaginationItem key={idx + 1}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === idx + 1}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(idx + 1);
                          }}
                          className="cursor-pointer text-xs"
                        >
                          {idx + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (
                          currentPage <
                          Math.ceil(filteredOrders.length / pageSize)
                        )
                          setCurrentPage(currentPage + 1);
                      }}
                      className={
                        currentPage >=
                        Math.ceil(filteredOrders.length / pageSize)
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
