"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ShoppingBag, Package, Printer, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PaginationMeta } from "@/types";
import { CopyableId } from "@/components/shared/copyable-id";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { useUserStore } from "@/store/user";
import { OrderDisplay, ApiOrder } from "@/types/order";
import {
  fetchOrders,
  mapApiOrderToDisplay,
  cancelOrder,
} from "@/lib/api/order";
import { formatCurrency, getTenantRoute } from "@/utils/helper";
import {
  downloadInvoicePdf,
  printInvoice,
  buildInvoiceFromOrderDisplay,
} from "@/utils/pdf-download";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function getVisiblePages(
  currentPage: number,
  totalPages: number,
): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

export default function ProfileOrdersPage() {
  const params = useParams();
  const tenant = (params?.tenant as string) || "store";
  const router = useRouter();
  const { branding } = useTenantTheme();
  const { user } = useUserStore();

  const primaryColor = branding?.primaryColor || "#059669";

  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderFilter, setOrderFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const pageSize = 10;

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoadingOrders(true);
      try {
        const res = await fetchOrders({
          tenantSlug: tenant,
          page: currentPage,
          per_page: pageSize,
          customer_email: user?.email,
          user_id: user?.id,
        });

        if (!isMounted) return;

        if (res.pagination) {
          setPagination(res.pagination as PaginationMeta);
        }

        if (res.data?.items && Array.isArray(res.data.items)) {
          const userEmail = (user?.email || "").trim().toLowerCase();
          const userId = user?.id;

          const myOrders = res.data.items.filter((o: ApiOrder) => {
            if (!userEmail && !userId) return true;
            const orderEmail = (
              (o.metadata_json?.customer_email as string) ||
              o.customer_email ||
              ""
            )
              .trim()
              .toLowerCase();
            const orderUserId =
              (o.metadata_json?.user_id as string) || o.user_id || "";
            return (
              (userEmail && orderEmail === userEmail) ||
              (userId && orderUserId === userId) ||
              (!orderEmail && !orderUserId)
            );
          });

          const mapped: OrderDisplay[] = myOrders.map(mapApiOrderToDisplay);
          setOrders(mapped);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.warn("Could not load orders from API:", err);
        setOrders([]);
      } finally {
        if (isMounted) setIsLoadingOrders(false);
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [tenant, user?.email, user?.id, currentPage]);

  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(
    null,
  );
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null,
  );

  const executeCancelOrder = async (order: OrderDisplay) => {
    setCancellingOrderId(order.id);
    try {
      const res = await cancelOrder(order.id, tenant, {
        customer_email: user?.email,
        reason: "Customer requested cancellation from account profile",
      });

      if (res.data) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  status: "Cancelled",
                  statusDescription: "Your order has been cancelled",
                }
              : o,
          ),
        );
        toast.success(`Order #${order.orderNumber} cancelled successfully`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel order";
      toast.error(msg);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handlePromptCancelOrder = (order: OrderDisplay) => {
    toast(`Cancel Order #${order.orderNumber}?`, {
      description:
        "Are you sure you want to cancel this order? This action cannot be undone.",
      action: {
        label: "Yes, Cancel",
        onClick: () => executeCancelOrder(order),
      },
      cancel: {
        label: "Keep Order",
        onClick: () => {},
      },
      duration: 10000,
    });
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "All") return true;
    return o.status === orderFilter;
  });

  const handlePrintOrder = (order: OrderDisplay) => {
    const customerDisplayName = user?.first_name
      ? `${user.first_name} ${user.last_name || ""}`.trim()
      : user?.email;
    const invoice = buildInvoiceFromOrderDisplay(
      order,
      tenant,
      branding?.storeHeadline || tenant,
      customerDisplayName,
      user?.email,
      primaryColor,
      branding?.logoUrl,
    );
    printInvoice(invoice);
  };

  const handleDownloadOrderPdf = async (order: OrderDisplay) => {
    try {
      setDownloadingOrderId(order.id);
      const customerDisplayName = user?.first_name
        ? `${user.first_name} ${user.last_name || ""}`.trim()
        : user?.email;
      const invoice = buildInvoiceFromOrderDisplay(
        order,
        tenant,
        branding?.storeHeadline || tenant,
        customerDisplayName,
        user?.email,
        primaryColor,
        branding?.logoUrl,
      );
      await downloadInvoicePdf(invoice);
      toast.success(`Invoice #${order.orderNumber} downloaded successfully!`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast.error("Failed to download PDF invoice. Please try again.");
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const totalOrders = pagination?.total ?? orders.length;
  const totalPages =
    pagination?.last_page ?? Math.max(1, Math.ceil(totalOrders / pageSize));
  const showPagination = totalOrders > 10;

  return (
    <div>
      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-border">
        <h4 className="font-bold text-foreground">
          Order History (
          {orderFilter === "All" ? totalOrders : filteredOrders.length})
        </h4>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Filter Status:
          </span>
          <Select
            value={orderFilter}
            onValueChange={(val) => {
              setOrderFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders List */}
      {isLoadingOrders ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold text-foreground">
            No orders found
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Browse our store to place your first order.
          </p>
          <Link href={getTenantRoute(tenant, "/menu")}>
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-6">
              Explore Menu
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-border overflow-hidden bg-card shadow-2xs transition-shadow hover:shadow-xs"
            >
              {/* Header Strip */}
              <div
                style={{ backgroundColor: primaryColor }}
                className="px-5 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-white font-semibold text-xs"
              >
                <div className="flex flex-col">
                  <p className="text-[11px] opacity-80 uppercase tracking-wider font-medium">
                    Order ID
                  </p>
                  <CopyableId
                    id={order.gatewayReference || order.id}
                    length={7}
                    prefix="#"
                    uppercase
                    textClassName="text-white font-bold text-xs"
                    iconClassName="text-white/80 hover:text-white hover:bg-white/20"
                  />
                </div>
                <div className="flex flex-col">
                  <p className="text-[11px] opacity-80 uppercase tracking-wider font-medium">
                    Total Payment
                  </p>
                  <p className="font-bold">
                    {formatCurrency(order.totalPayment, order.currency)}
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="text-[11px] opacity-80 uppercase tracking-wider font-medium">
                    Payment Method
                  </p>
                  <p className="font-bold">{order.paymentMethod}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-[11px] opacity-80 uppercase tracking-wider font-medium">
                    {order.dateLabel}
                  </p>
                  <p className="font-bold">{order.dateValue}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-5 divide-y divide-border/60">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-4"
                  >
                    <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-border bg-muted/40 flex items-center justify-center relative">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Package className="w-6 h-6 text-muted-foreground/60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.specs}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {formatCurrency(item.price, order.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status & Actions Footer */}
              <div className="px-5 py-4 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                      order.status === "Delivered"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : order.status === "On the Way"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : order.status === "Accepted"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : order.status === "Cancelled"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    {order.status}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {order.statusDescription}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    size="sm"
                    onClick={() =>
                      router.push(getTenantRoute(tenant, `/track/${order.id}`))
                    }
                    className="h-9 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold cursor-pointer"
                  >
                    Track Order
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintOrder(order)}
                    className="h-9 px-3.5 rounded-full border-border text-foreground hover:bg-muted text-xs font-semibold cursor-pointer gap-1.5"
                    title="Print Invoice"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadOrderPdf(order)}
                    disabled={downloadingOrderId === order.id}
                    className="h-9 px-3.5 rounded-full border-border text-foreground hover:bg-muted text-xs font-semibold cursor-pointer gap-1.5"
                    title="Download PDF Invoice"
                  >
                    {downloadingOrderId === order.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {downloadingOrderId === order.id ? "PDF..." : "PDF"}
                    </span>
                  </Button>

                  {order.status !== "Delivered" &&
                    order.status !== "Cancelled" && (
                      <button
                        type="button"
                        disabled={cancellingOrderId === order.id}
                        onClick={() => handlePromptCancelOrder(order)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors ml-2 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        {cancellingOrderId === order.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Cancelling...</span>
                          </>
                        ) : (
                          <span>Cancel Order</span>
                        )}
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}

          {showPagination && (
            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">
                Showing{" "}
                <strong className="text-foreground">
                  {(currentPage - 1) * pageSize + 1}
                </strong>{" "}
                to{" "}
                <strong className="text-foreground">
                  {Math.min(currentPage * pageSize, totalOrders)}
                </strong>{" "}
                of <strong className="text-foreground">{totalOrders}</strong>{" "}
                orders
              </span>

              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
                      }}
                      className={
                        currentPage <= 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {getVisiblePages(currentPage, totalPages).map((p, idx) => {
                    if (p === "...") {
                      return (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    const pageNum = Number(p);
                    return (
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
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage((prev) => prev + 1);
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
      )}
    </div>
  );
}
