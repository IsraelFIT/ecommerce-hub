"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Printer,
  ExternalLink,
  Mail,
  User as UserIcon,
  MapPin,
  Calendar,
  CreditCard,
  AlertCircle,
  Save,
  Loader2,
  FileText,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CopyableId } from "@/components/shared/copyable-id";
import { OrderDetail } from "@/types/order";
import { fetchOrderById, updateOrderStatus } from "@/lib/api/order";
import { formatCurrency, formatDate, getTenantRoute } from "@/utils/helper";

interface OrderDetailPageProps {
  params: Promise<{
    tenant: string;
    id: string;
  }>;
}

const TIMELINE_STEPS = [
  { key: "placed", label: "Order Placed", icon: FileText },
  { key: "accepted", label: "Accepted", icon: CheckCircle2 },
  { key: "in_progress", label: "In Progress", icon: Package },
  { key: "on_the_way", label: "On the Way", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function getStatusStepIndex(status: string): number {
  const s = status.toLowerCase();
  switch (s) {
    case "pending":
      return 0;
    case "paid":
    case "accepted":
      return 1;
    case "processing":
    case "in_progress":
      return 2;
    case "shipped":
    case "on_the_way":
      return 3;
    case "delivered":
    case "fulfilled":
      return 4;
    case "cancelled":
    case "failed":
      return -1;
    default:
      return 1;
  }
}

export default function TenantAdminOrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const unwrappedParams = use(params);
  const routeParams = useParams();
  const router = useRouter();

  const tenantSlug =
    unwrappedParams?.tenant || (routeParams?.tenant as string) || "store";
  const orderId = unwrappedParams?.id || (routeParams?.id as string) || "";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status & Tracking update states
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [trackingNotes, setTrackingNotes] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchOrder() {
      if (!orderId) {
        if (isMounted) setIsLoading(false);
        return;
      }
      try {
        const res = await fetchOrderById(orderId, undefined, tenantSlug);
        if (isMounted) {
          if (res.data) {
            setOrder(res.data);
            setSelectedStatus(res.data.status.toLowerCase());
            setTrackingNotes(res.data.metadata_json?.tracking_notes || "");
          } else {
            setError("Order not found");
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error ? err.message : "Failed to load order details";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId, tenantSlug]);

  const executeUpdateStatus = async (statusToApply: string) => {
    if (!order) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updateOrderStatus(
        order.id,
        {
          status: statusToApply,
          tracking_notes: trackingNotes.trim() || undefined,
        },
        tenantSlug,
      );

      if (res.data) {
        setOrder(res.data);
        setSelectedStatus(res.data.status.toLowerCase());
        setTrackingNotes(res.data.metadata_json?.tracking_notes || "");
        toast.success(`Order updated to "${statusToApply}"`);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update order status";
      toast.error(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!order) return;
    if (
      selectedStatus === "cancelled" &&
      order.status.toLowerCase() !== "cancelled"
    ) {
      const displayRef =
        order.gateway_reference || order.id.slice(0, 8).toUpperCase();
      toast(`Cancel Order #${displayRef}?`, {
        description:
          "Are you sure you want to cancel this order? This will mark it as cancelled.",
        action: {
          label: "Yes, Cancel",
          onClick: () => executeUpdateStatus("cancelled"),
        },
        cancel: {
          label: "Keep Order",
          onClick: () => {},
        },
        duration: 8000,
      });
      return;
    }
    await executeUpdateStatus(selectedStatus);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 w-full text-foreground pb-12">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-40 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-12 text-center bg-card rounded-xl border border-border  my-8 max-w-xl mx-auto">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">
          Order Not Found
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          {error || `Unable to retrieve order details for ID "${orderId}".`}
        </p>
        <Button
          onClick={() => router.push(getTenantRoute(tenantSlug, "/orders"))}
          className="bg-primary text-primary-foreground font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
        </Button>
      </div>
    );
  }

  const activeStepIdx = getStatusStepIndex(order.status);
  const isCancelled =
    order.status.toLowerCase() === "cancelled" ||
    order.status.toLowerCase() === "failed";
  const itemsSubtotal = (order.items || []).reduce(
    (acc, it) => acc + (it.unit_price || 0) * (it.quantity || 1),
    0,
  );
  const deliveryFee = order.metadata_json?.delivery_fee || 0;
  const address = order.metadata_json?.delivery_address;
  const fulfillmentType = order.metadata_json?.fulfillment_type || "delivery";

  return (
    <div className="w-full flex flex-col gap-5 pb-16 text-foreground">
      {/* Top Navigation & Actions */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(getTenantRoute(tenantSlug, "/orders"))}
            className="h-8 w-8 p-0 bg-muted hover:bg-muted/80 text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="font-bold font-secondary text-foreground text-lg">
                  Order
                </span>
                <CopyableId
                  id={order.gateway_reference || order.id}
                  length={7}
                  prefix="#"
                  textClassName="text-lg font-bold font-secondary text-foreground"
                />
              </div>
              <Badge
                className={`text-xs font-semibold capitalize ${
                  order.status === "delivered" || order.status === "fulfilled"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    : order.status === "shipped"
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                      : isCancelled
                        ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                }`}
              >
                {order.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintSlip}
            className="text-xs h-8 gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-muted-foreground" />
            Print Packing Slip
          </Button>

          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs h-8 gap-1.5"
          >
            <Link
              href={getTenantRoute(tenantSlug, `/track/${order.id}`)}
              target="_blank"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              Public Tracking
            </Link>
          </Button>
        </div>
      </div>

      {/* Fulfillment Status Banner & Timeline */}
      <div className="bg-card border border-border rounded-xl p-6  space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fulfillment Status
            </span>
            <p className="text-foreground mt-0.5">
              Placed on {formatDate(order.created_at)} • Updated on{" "}
              {formatDate(order.updated_at)}
            </p>
          </div>

          {/* Quick status update control */}
          <div className="flex items-center gap-2">
            <Select
              value={selectedStatus}
              onValueChange={(val) => setSelectedStatus(val)}
            >
              <SelectTrigger className="h-9 w-40 text-foreground">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="processing">In Progress</SelectItem>
                <SelectItem value="shipped">On the Way</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleUpdateStatus}
              disabled={
                isUpdatingStatus ||
                selectedStatus === order.status.toLowerCase()
              }
            >
              {isUpdatingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* 5-step Horizontal Progress Timeline */}
        {!isCancelled ? (
          <div className="py-2">
            <div className="grid grid-cols-5 text-center relative">
              {/* Connector line behind circles */}
              <div
                className="absolute top-4.5 left-[10%] right-[10%] h-1 -translate-y-1/2 bg-muted rounded-full"
                style={{ zIndex: 0 }}
              >
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${(Math.max(0, activeStepIdx) / 4) * 100}%`,
                  }}
                />
              </div>

              {TIMELINE_STEPS.map((step, idx) => {
                const isCompleted = activeStepIdx >= idx;
                const isCurrent = activeStepIdx === idx;
                const StepIcon = step.icon;

                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center relative z-10"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? "bg-primary text-white border-primary"
                          : "bg-background text-muted-foreground border-muted-foreground/30"
                      }`}
                    >
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium truncate max-w-22.5 ${
                        isCurrent
                          ? "text-foreground font-bold"
                          : isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="text-sm font-medium">
              This order has been cancelled or marked as failed.
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2): Products and Cost Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ordered Products Card */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <h6 className="font-secondary font-semibold text-foreground">
                  Ordered Products ({order.items?.length || 0})
                </h6>
              </div>
              <span className="text-xs text-muted-foreground">
                Pricing in {order.currency}
              </span>
            </div>

            <div className="divide-y divide-border">
              {(order.items || []).map((item, idx) => {
                const itemImg =
                  item.image ||
                  item.image_url ||
                  (Array.isArray(item.images) && item.images[0]) ||
                  null;

                return (
                  <div
                    key={idx}
                    className="py-4 first:pt-2 last:pb-2 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-14 rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center relative shrink-0">
                        {itemImg ? (
                          <Image
                            src={itemImg}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-muted-foreground/60" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h6 className="font-semibold text-foreground truncate">
                          {item.title}
                        </h6>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                          <span>Qty: {item.quantity}</span>
                          <span>•</span>
                          <span>
                            {formatCurrency(item.unit_price, order.currency)}{" "}
                            each
                          </span>
                          {item.options &&
                            Object.entries(item.options).map(([k, v]) => (
                              <span
                                key={k}
                                className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-medium"
                              >
                                {k}: {String(v)}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground">
                        {formatCurrency(
                          item.unit_price * item.quantity,
                          order.currency,
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Breakdown Card */}
          <div className="bg-card border border-border rounded-xl p-6  space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <h6 className="font-secondary font-semibold text-foreground">
                  Financial & Payout Breakdown
                </h6>
              </div>
              <Badge className="bg-muted border border-border px-2 py-1.5 text-xs font-medium text-foreground capitalize">
                {order.payment_gateway}
              </Badge>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(itemsSubtotal, order.currency)}
                </span>
              </div>

              {deliveryFee > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(deliveryFee, order.currency)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>Platform Processing Fee (2.5%)</span>
                <span className="font-medium text-muted-foreground">
                  {formatCurrency(order.platform_fee, order.currency)}
                </span>
              </div>

              <div className="border-t border-border pt-2.5 flex justify-between items-center text-base">
                <span className="font-semibold text-foreground">
                  Total Paid by Customer
                </span>
                <span className="font-bold text-lg text-foreground">
                  {formatCurrency(order.total_amount, order.currency)}
                </span>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mt-3 flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                    Merchant Net Payout (97.5%)
                  </span>
                  <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                    Direct split to your connected payout account
                  </span>
                </div>
                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(order.tenant_payout_amount, order.currency)}
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2 flex items-center justify-between border-t border-border">
              <span>Gateway Reference:</span>
              <CopyableId
                id={order.gateway_reference}
                length={12}
                textClassName="bg-muted px-2 py-0.5 rounded font-mono text-[11px] text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Delivery Details */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <div className="bg-card border border-border rounded-xl p-6  space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <UserIcon className="w-4 h-4 text-primary" />
              <h6 className="font-secondary font-semibold text-foreground">
                Customer Details
              </h6>
            </div>

            <div className="flex items-center gap-3">
              <UserAvatar
                src={order.customer_avatar_url || undefined}
                name={order.customer_name}
                email={order.customer_email}
                size="md"
                shape="rounded"
              />
              <div className="min-w-0">
                <div className="font-semibold text-foreground text-sm truncate">
                  {order.customer_name}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <Link
                    href={`mailto:${order.customer_email}`}
                    className="hover:text-primary text-xs transition-colors truncate"
                  >
                    {order.customer_email}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery & Fulfillment Details Card */}
          <div className="bg-card border border-border rounded-xl p-6  space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Truck className="w-4 h-4 text-primary" />
              <h6 className="font-secondary font-semibold text-foreground">
                Fulfillment & Destination
              </h6>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-muted-foreground font-medium">
                  Method:
                </span>
                <span className="ml-2 font-semibold text-foreground capitalize">
                  {fulfillmentType === "pickup"
                    ? "In-Store Pickup"
                    : "Door Delivery"}
                </span>
              </div>

              {address && (
                <div className="flex items-start gap-2 text-foreground">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <p className="font-medium">
                      {address.street || address.address || "Street address"}
                    </p>
                    <p className="text-muted-foreground">
                      {[
                        address.city,
                        address.state,
                        address.zip || address.postal_code,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {address.country && (
                      <p className="text-muted-foreground">{address.country}</p>
                    )}
                    {address.phone && (
                      <p className="text-muted-foreground mt-1">
                        Phone: {address.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {order.metadata_json?.fulfillment_date && (
                <div className="flex items-start gap-2 text-foreground pt-2 border-t border-border">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span>
                    Requested Schedule: {order.metadata_json.fulfillment_date}{" "}
                    {order.metadata_json.fulfillment_time || ""}
                  </span>
                </div>
              )}

              {order.metadata_json?.gift_message && (
                <div className="p-3 bg-muted/60 border border-border rounded-xl">
                  <span className="font-semibold text-[11px] text-foreground block mb-1">
                    Gift / Special Message:
                  </span>
                  <p className="text-muted-foreground text-[11px]">
                    &quot;{order.metadata_json.gift_message}&quot;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Courier & Tracking Notes */}
          <div className="bg-card border border-border rounded-xl p-6  space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <FileText className="w-4 h-4 text-primary" />
              <h6 className="font-secondary font-semibold text-foreground">
                Tracking Notes & Courier Info
              </h6>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">
                Tracking Notes (Visible to Customer)
              </Label>
              <Textarea
                placeholder="e.g. Dispatched via DHL Express. Tracking code: DHL-9481923"
                value={trackingNotes}
                onChange={(e) => setTrackingNotes(e.target.value)}
                rows={3}
                className="bg-background border-border"
              />
              <Button
                variant="outline"
                onClick={handleUpdateStatus}
                disabled={isUpdatingStatus}
                className="w-full"
              >
                {isUpdatingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                )}
                Update Tracking Notes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
