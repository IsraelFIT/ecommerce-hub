"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  ClipboardList,
  CheckCircle2,
  Package,
  Truck,
  Check,
  ChevronLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  MapPin,
  CreditCard,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { formatCurrency, getTenantRoute } from "@/utils/helper";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { cn } from "@/lib/utils";

interface TrackPageProps {
  params: Promise<{
    tenant: string;
    id: string;
  }>;
}

interface OrderItem {
  product_id?: string;
  title?: string;
  product_title?: string;
  quantity?: number;
  unit_price?: number | string;
  image?: string;
  image_url?: string;
  images?: string[];
  options?: Record<string, unknown>;
}

interface OrderDetails {
  id: string;
  gateway_reference?: string;
  customer_name?: string;
  customer_email?: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_gateway: string;
  created_at: string;
  items: OrderItem[];
  metadata_json?: {
    fulfillment_type?: string;
    delivery_fee?: number;
    delivery_address?: unknown;
    fulfillment_date?: string;
    fulfillment_time?: string;
    gift_message?: string;
    tracking_notes?: string;
  };
}

export default function OrderTrackingStatusPage({ params }: TrackPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";
  const orderIdentifier = unwrappedParams.id;
  const { branding } = useTenantTheme();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const primaryColor = branding?.primaryColor || "#059669";

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      if (!orderIdentifier) {
        setIsLoading(false);
        setError("Missing order identifier");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const res = await apiRequest<OrderDetails>(
          `/orders/${orderIdentifier}`,
          {
            headers: {
              "X-Tenant-Slug": tenantSlug,
            },
          },
        );
        if (res.data && isMounted) {
          setOrder(res.data);
        } else if (isMounted) {
          setError("Order not found or does not exist in this store.");
        }
      } catch (err: unknown) {
        console.error("Order tracking load error:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to find order matching this ID. Please verify your receipt.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [orderIdentifier, tenantSlug]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-stone-50/50">
        <Loader2
          className="h-10 w-10 animate-spin mb-4"
          style={{ color: primaryColor }}
        />
        <h2 className="text-xl font-bold text-foreground">
          Locating Your Order...
        </h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Fetching live milestone events and real-time tracking from our
          dispatch network.
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-stone-50/50">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Order Not Found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          {error || "We could not find an order matching that identifier."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link href={getTenantRoute(tenantSlug, "/track")}>
            <Button
              variant="outline"
              className="rounded-full px-5 text-xs font-semibold"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Try Another Order ID
            </Button>
          </Link>
          <Link href={getTenantRoute(tenantSlug, "/menu")}>
            <Button
              className="rounded-full px-6 text-xs font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Browse Menu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const rawStatus = (order.status || "pending").toLowerCase();

  // Status mapping to 5 discrete steps:
  // 1: Order Placed
  // 2: Accepted
  // 3: In Progress
  // 4: On the Way
  // 5: Delivered
  let currentStep = 1;
  if (rawStatus === "delivered" || rawStatus === "fulfilled") {
    currentStep = 5;
  } else if (rawStatus === "shipped") {
    currentStep = 4;
  } else if (rawStatus === "processing" || rawStatus === "in_progress") {
    currentStep = 3;
  } else if (rawStatus === "accepted" || rawStatus === "paid") {
    currentStep = 2;
  } else {
    currentStep = 1;
  }

  // Calculate dates based on created_at and fulfillment date
  const createdDate = order.created_at
    ? new Date(order.created_at)
    : new Date();
  const placedDateStr = format(createdDate, "dd MMM yyyy");
  const placedTimeStr = format(createdDate, "hh:mm a");

  // Step 2: Accepted (typically 15 mins after placed)
  const acceptedDate = new Date(createdDate.getTime() + 15 * 60 * 1000);
  const acceptedDateStr = format(acceptedDate, "dd MMM yyyy");
  const acceptedTimeStr = format(acceptedDate, "hh:mm a");

  // Step 3: In Progress (Next day or +1 day)
  const inProgressDate = new Date(createdDate.getTime() + 24 * 60 * 60 * 1000);
  const inProgressDateStr = format(inProgressDate, "dd MMM yyyy");

  // Step 4: On the Way (+2 days)
  const onTheWayDate = new Date(
    createdDate.getTime() + 2 * 24 * 60 * 60 * 1000,
  );
  const onTheWayDateStr = format(onTheWayDate, "dd, dd MMM yyyy");

  // Step 5: Delivered (+3 to +4 days, or fulfillment_date)
  let deliveredDateStr = "3-5 Business Days";
  if (order.metadata_json?.fulfillment_date) {
    try {
      deliveredDateStr = format(
        new Date(`${order.metadata_json.fulfillment_date}T00:00:00`),
        "dd MMM yyyy",
      );
    } catch {
      deliveredDateStr = String(order.metadata_json.fulfillment_date);
    }
  } else {
    const deliveredDate = new Date(
      createdDate.getTime() + 4 * 24 * 60 * 60 * 1000,
    );
    deliveredDateStr = format(deliveredDate, "dd MMM yyyy");
  }

  const steps = [
    {
      title: "Order Placed",
      icon: ClipboardList,
      primaryText: placedDateStr,
      secondaryText: placedTimeStr,
      stepNumber: 1,
    },
    {
      title: "Accepted",
      icon: CheckCircle2,
      primaryText: currentStep >= 2 ? acceptedDateStr : "Pending",
      secondaryText: currentStep >= 2 ? acceptedTimeStr : "--:--",
      stepNumber: 2,
    },
    {
      title: "In Progress",
      icon: Package,
      primaryText: "Expected",
      secondaryText: inProgressDateStr,
      stepNumber: 3,
    },
    {
      title: "On the Way",
      icon: Truck,
      primaryText: "Expected",
      secondaryText: onTheWayDateStr,
      stepNumber: 4,
    },
    {
      title: "Delivered",
      icon: CheckCircle2,
      primaryText: currentStep === 5 ? "Delivered" : "Expected",
      secondaryText: deliveredDateStr,
      stepNumber: 5,
    },
  ];

  const orderDisplayId =
    order.gateway_reference || `#${order.id.slice(0, 8).toUpperCase()}`;

  const formatDeliveryAddress = (raw: unknown): string => {
    if (!raw) return "Standard Domestic Shipping";
    if (typeof raw === "string") return raw;
    if (typeof raw === "object" && raw !== null) {
      const record = raw as Record<string, unknown>;
      const parts = [
        record.address || record.street || record.line1,
        record.suite || record.apartment || record.line2,
        record.city,
        record.state,
        record.zip || record.postal_code,
        record.country,
      ].filter(Boolean);
      return parts.join(", ");
    }
    return String(raw);
  };

  const deliveryAddressStr = formatDeliveryAddress(
    order.metadata_json?.delivery_address,
  );

  return (
    <div className="min-h-screen bg-stone-50/60 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Link
            href={getTenantRoute(tenantSlug, "/profile")}
            className="inline-flex items-center gap-1.5 hover:text-foreground font-medium transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Orders History
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const ref = order.gateway_reference || order.id;
                window.open(
                  getTenantRoute(
                    tenantSlug,
                    `/orders/confirmation?reference=${encodeURIComponent(ref)}&print=true`,
                  ),
                  "_blank",
                );
              }}
              className="h-8 rounded-full border-border text-foreground hover:bg-muted text-xs font-semibold cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Invoice
            </Button>
          </div>
        </div>

        {/* Title Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Order Status
          </h1>
          <p className="text-sm font-semibold text-muted-foreground mt-1">
            Order ID : <span className="text-foreground">{orderDisplayId}</span>
          </p>
        </div>

        {/* Timeline Status Card (Matches Image 1) */}
        <div className="bg-card rounded-2xl border border-border/80 p-6 sm:p-10 shadow-sm relative overflow-x-auto custom-scrollbar">
          <div className="min-w-140">
            {/* Row 1: Step Icons & Titles */}
            <div className="grid grid-cols-5 gap-2 text-center">
              {steps.map((st) => {
                const isPassed = currentStep >= st.stepNumber;
                const isCurrent = currentStep === st.stepNumber;
                const IconComponent = st.icon;

                return (
                  <div
                    key={st.stepNumber}
                    className="flex flex-col items-center group"
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                        isPassed
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/60 text-muted-foreground/60",
                        isCurrent && "ring-2 ring-primary/40 shadow-xs",
                      )}
                      style={{
                        color: isPassed ? primaryColor : undefined,
                        backgroundColor: isPassed
                          ? `${primaryColor}15`
                          : undefined,
                      }}
                    >
                      <IconComponent className="h-6 w-6 stroke-[1.8]" />
                    </div>

                    <h3
                      className={cn(
                        "text-xs sm:text-sm font-bold mt-2.5 transition-colors",
                        isPassed
                          ? "text-foreground font-extrabold"
                          : "text-muted-foreground",
                      )}
                    >
                      {st.title}
                    </h3>
                  </div>
                );
              })}
            </div>

            {/* Row 2: Checkmark Circles with Connecting Progress Line */}
            <div className="relative my-4">
              {/* Gray Background Track Line */}
              <div className="absolute top-1/2 left-[10%] right-[10%] -translate-y-1/2 h-1 bg-muted rounded-full z-0" />

              {/* Active Filled Progress Line */}
              <div
                className="absolute top-1/2 left-[10%] -translate-y-1/2 h-1 rounded-full transition-all duration-700 ease-out z-0"
                style={{
                  width: `${Math.min(80, Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 80))}%`,
                  backgroundColor: primaryColor,
                }}
              />

              {/* Checkmark Circles Row */}
              <div className="grid grid-cols-5 relative z-10">
                {steps.map((st) => {
                  const isPassed = currentStep >= st.stepNumber;

                  return (
                    <div
                      key={st.stepNumber}
                      className="flex items-center justify-center"
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                          isPassed
                            ? "text-white border-transparent shadow-xs"
                            : "bg-card text-muted-foreground/40 border-muted-foreground/30",
                        )}
                        style={{
                          backgroundColor: isPassed ? primaryColor : undefined,
                        }}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[2.8]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row 3: Date / Time Subtitles */}
            <div className="grid grid-cols-5 gap-2 text-center">
              {steps.map((st) => {
                const isPassed = currentStep >= st.stepNumber;

                return (
                  <div key={st.stepNumber} className="text-[11px] sm:text-xs">
                    <p
                      className={cn(
                        "font-semibold",
                        isPassed
                          ? "text-foreground"
                          : "text-muted-foreground/70",
                      )}
                    >
                      {st.primaryText}
                    </p>
                    <p className="text-muted-foreground text-[10px] sm:text-[11px] mt-0.5">
                      {st.secondaryText}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Products Card (Matches Image 1) */}
        <div className="bg-card rounded-2xl border border-border/80 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-border/60">
            <h2 className="text-lg font-bold text-foreground">Products</h2>
          </div>

          <div className="divide-y divide-border/60">
            {order.items && order.items.length > 0 ? (
              order.items.map((it, idx) => {
                const itemImg =
                  it.image ||
                  it.image_url ||
                  (Array.isArray(it.images) && it.images[0]) ||
                  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80";

                const optionsStr = it.options
                  ? Object.entries(it.options)
                      .map(
                        ([k, v]) =>
                          `${k.charAt(0).toUpperCase() + k.slice(1)} : ${v}`,
                      )
                      .join(" | ")
                  : "";
                const specs = optionsStr
                  ? `${optionsStr} | ${it.quantity || 1} Qty.`
                  : `${it.quantity || 1} Qty.`;

                const priceNum = Number(it.unit_price) || 0;

                return (
                  <div
                    key={`${it.product_id || idx}-${idx}`}
                    className="p-5 sm:p-6 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Product Thumbnail */}
                      <div className="h-18 w-18 sm:h-20 sm:w-20 shrink-0 rounded-xl overflow-hidden border border-border/80 bg-muted/30 relative shadow-2xs">
                        <Image
                          src={itemImg}
                          alt={it.title || it.product_title || "Ordered Item"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      {/* Product Title & Attributes */}
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                          {it.title ||
                            it.product_title ||
                            "Custom Product Item"}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {specs}
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      <p className="text-sm sm:text-base font-bold text-foreground">
                        {formatCurrency(priceNum, order.currency)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Each: {formatCurrency(priceNum, order.currency)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No items recorded for this order.
              </div>
            )}
          </div>
        </div>

        {/* Delivery & Payment Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Delivery Details */}
          <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <MapPin className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                Delivery Information
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-muted-foreground">Recipient:</p>
              <p className="font-bold text-foreground text-sm">
                {order.customer_name || "Valued Customer"}
              </p>
              <p className="text-muted-foreground mt-2">Address:</p>
              <p className="font-medium text-foreground leading-relaxed">
                {deliveryAddressStr}
              </p>
              {order.metadata_json?.fulfillment_time && (
                <p className="text-muted-foreground pt-1">
                  Delivery Window:{" "}
                  <span className="font-semibold text-foreground">
                    {order.metadata_json.fulfillment_time}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <CreditCard className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                Payment Breakdown
              </h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Payment Method</span>
                <span className="font-semibold text-foreground uppercase">
                  {order.payment_gateway || "Online Gateway"}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Payment Status</span>
                <span
                  className={cn(
                    "font-bold uppercase",
                    order.status.toLowerCase() === "paid" ||
                      order.status.toLowerCase() === "delivered"
                      ? "text-emerald-600"
                      : "text-amber-600",
                  )}
                >
                  {order.status}
                </span>
              </div>
              <div className="border-t border-border/60 pt-2.5 flex justify-between font-bold text-sm text-foreground">
                <span>Total Paid</span>
                <span style={{ color: primaryColor }}>
                  {formatCurrency(order.total_amount, order.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Support Banner */}
        <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="text-xs font-bold text-foreground">
              Questions about your delivery?
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Contact our store customer concierge for real-time dispatch
              assistance.
            </p>
          </div>
          <Link href={getTenantRoute(tenantSlug, "/menu")}>
            <Button
              size="sm"
              className="rounded-full px-5 text-xs font-semibold cursor-pointer text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Continue Shopping
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
