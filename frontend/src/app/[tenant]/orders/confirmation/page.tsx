"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  Check,
  Download,
  ShoppingBag,
  FileText,
  Package,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { useCartStore } from "@/store/cart";
import { formatCurrency, getTenantRoute } from "@/utils/helper";
import { Order, Tenant } from "@/types";

interface ConfirmationPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function OrderConfirmationPage({
  params,
}: ConfirmationPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || "";
  const sessionId = searchParams.get("session_id") || "";

  const { clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyAndLoadOrder() {
      if (!reference) {
        setIsLoading(false);
        setError("Missing order reference parameter");
        return;
      }

      try {
        setIsLoading(true);

        // 1. Fetch tenant details for currency & branding
        const tenantRes = await apiRequest<Tenant>(
          `/tenants/by-slug/${tenantSlug}`,
        );
        if (tenantRes.data && isMounted) {
          setTenant(tenantRes.data);
        }

        // 2. Verify transaction with payment provider via backend
        const verifyQuery = sessionId
          ? `?session_id=${encodeURIComponent(sessionId)}`
          : "";
        const verifyRes = await apiRequest<{
          status: string;
          order_id: string;
          reference: string;
        }>(`/payments/verify/${reference}${verifyQuery}`);

        if (verifyRes.data) {
          // Clear shopping cart on successful verified order
          clearCart(tenantSlug, true);
        }

        // 3. Fetch full order record by reference
        const orderRes = await apiRequest<Order>(`/orders/${reference}`);
        if (orderRes.data && isMounted) {
          setOrder(orderRes.data);
        }
      } catch (err: unknown) {
        console.error("Order verification error:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to verify transaction. Please check your order history.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verifyAndLoadOrder();
    return () => {
      isMounted = false;
    };
  }, [reference, sessionId, tenantSlug, clearCart]);

  const currency = order?.currency || tenant?.currency || "NGN";

  // Calculate delivery fee
  const shippingFee = Number(order?.metadata_json?.delivery_fee || 0);

  // Format delivery date nicely
  const getFormattedDeliveryDate = () => {
    if (order?.metadata_json?.fulfillment_date) {
      try {
        const rawDate = String(order.metadata_json.fulfillment_date);
        return format(new Date(`${rawDate}T00:00:00`), "dd MMMM yyyy");
      } catch {
        return String(order.metadata_json.fulfillment_date);
      }
    }
    if (order?.created_at) {
      try {
        const d = new Date(order.created_at);
        d.setDate(d.getDate() + 3);
        return format(d, "dd MMMM yyyy");
      } catch {
        // Fallback
      }
    }
    return "3-5 Business Days";
  };

  const formattedDeliveryDate = getFormattedDeliveryDate();

  const formatDeliveryAddress = (raw: unknown): string => {
    if (!raw) return "";
    if (typeof raw === "string") return raw;
    if (typeof raw === "object" && raw !== null) {
      const addr = raw as Record<string, unknown>;
      const street = (addr.address ||
        addr.street ||
        addr.line1 ||
        addr.address1 ||
        "") as string;
      const suite = (addr.apartment ||
        addr.suite ||
        addr.line2 ||
        "") as string;
      const city = (addr.city || "") as string;
      const state = (addr.state ||
        addr.province ||
        addr.region ||
        "") as string;
      const zip = (addr.zip ||
        addr.postal_code ||
        addr.zipCode ||
        "") as string;
      const country = (addr.country || "") as string;

      const line1 = [street, suite].filter(Boolean).join(", ");
      const line2 = city;
      const line3 = [state, zip].filter(Boolean).join(" ");
      const line4 = country;

      return [line1, line2, line3, line4].filter(Boolean).join(", ");
    }
    return String(raw);
  };

  const deliveryAddressRaw =
    order?.metadata_json?.delivery_address ||
    order?.metadata_json?.shipping_address ||
    null;
  const formattedDeliveryAddress = formatDeliveryAddress(deliveryAddressRaw);

  const handleDownloadInvoice = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="py-32 bg-stone-50 min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-bold text-foreground">
          Verifying Your Payment...
        </h2>
        <p className="text-xs text-muted-foreground mt-2 max-w-sm">
          Confirming transaction authorization with the payment gateway and
          preparing your order receipt.
        </p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="py-24 bg-stone-50 min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="font-bold text-foreground">Order Not Found</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">{error}</p>
        <Link href={getTenantRoute(tenantSlug, "/menu")} className="mt-6">
          <Button>Back to Menu</Button>
        </Link>
      </div>
    );
  }

  const orderIdDisplay = order
    ? `#${order.id.slice(0, 8).toUpperCase()}`
    : reference
      ? `#${reference.slice(-8).toUpperCase()}`
      : "#PENDING";

  const transactionIdDisplay = reference || order?.gateway_reference || "N/A";

  const paymentMethodDisplay = order?.payment_gateway
    ? order.payment_gateway.toUpperCase() === "PAYSTACK"
      ? "Paystack"
      : order.payment_gateway.toUpperCase() === "STRIPE"
        ? "Stripe"
        : order.payment_gateway
    : "Online Payment";

  return (
    <>
      <style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          header,
          footer,
          nav,
          .no-print,
          [data-announcement-bar],
          .announcement-banner {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          .print-primary-bg {
            background-color: var(--primary) !important;
            color: var(--primary-foreground, #ffffff) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-full-width {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div className="py-8 bg-stone-50 text-foreground min-h-screen print:bg-white print:py-4 print:min-h-0">
        <div className="container flex-col print:max-w-full print:px-0">
          {/* Breadcrumb Navigation */}
          <nav className="w-full flex items-center gap-2 text-xs md:text-sm text-muted-foreground font-medium mb-8">
            <Link
              href={getTenantRoute(tenantSlug, "/")}
              className="hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <Link
              href={getTenantRoute(tenantSlug, "/cart")}
              className="hover:text-foreground transition-colors"
            >
              Cart
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-semibold">
              Order Confirmation
            </span>
          </nav>

          {/* Top Completion Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary text-primary-foreground print-primary-bg flex items-center justify-center mb-4 shadow-sm">
              <Check className="h-7 w-7 md:h-8 md:w-8 stroke-3" />
            </div>
            <h3 className="font-bold font-secondary text-foreground tracking-tight">
              Your order is completed!
            </h3>
            <p className="text-muted-foreground mt-1.5 font-light">
              Thank you. Your Order has been received.
            </p>
          </div>

          {/* Order Highlight Ribbon Banner */}
          <div className="w-full bg-primary text-primary-foreground print-primary-bg rounded-xl p-5 md:p-6 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:p-5 print:rounded-xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-8 flex-1 print:flex print:flex-col print:gap-2.5">
              <div className="flex flex-col gap-1 print:flex-row print:justify-between print:items-center print:border-b print:border-primary-foreground/20 print:pb-2">
                <span className="text-primary-foreground/75 text-xs uppercase font-bold tracking-wider block shrink-0">
                  Order ID
                </span>
                <p className="font-bold text-primary-foreground select-all print:text-right">
                  {orderIdDisplay}
                </p>
              </div>

              <div className="flex flex-col gap-1 print:flex-row print:justify-between print:items-center print:border-b print:border-primary-foreground/20 print:pb-2">
                <span className="text-primary-foreground/75 text-xs uppercase font-bold tracking-wider block shrink-0">
                  Payment Method
                </span>
                <p className="font-bold text-primary-foreground select-all print:text-right">
                  {paymentMethodDisplay}
                </p>
              </div>

              <div className="flex flex-col gap-1 print:flex-row print:justify-between print:items-center print:border-b print:border-primary-foreground/20 print:pb-2">
                <span className="text-primary-foreground/75 text-xs uppercase font-bold tracking-wider block shrink-0">
                  Transaction ID
                </span>
                <p
                  className="font-bold text-primary-foreground select-all print:text-right break-all max-w-[65%]"
                  title={transactionIdDisplay}
                >
                  {transactionIdDisplay}
                </p>
              </div>

              <div className="flex flex-col gap-1 print:flex-row print:justify-between print:items-center">
                <span className="text-primary-foreground/75 text-xs uppercase font-bold tracking-wider block shrink-0">
                  Estimated Delivery Date
                </span>
                <p className="font-bold text-primary-foreground select-all print:text-right">
                  {formattedDeliveryDate}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-end no-print">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="bg-accent text-white hover:bg-accent/80 transition-all px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Invoice</span>
              </button>
            </div>
          </div>

          {/* Main Order Details Card */}
          <div className="w-full bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-xs mb-8 print-full-width">
            <h4 className="font-bold font-secondary text-foreground mb-4">
              Order Details
            </h4>

            {/* Table Header */}
            <div className="flex justify-between items-center pb-3 border-b border-stone-200 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Products</span>
              <span>Sub Total</span>
            </div>

            {/* Items List */}
            <div className="divide-y divide-stone-100 mb-6">
              {order?.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-stone-50 border border-stone-200/80 overflow-hidden relative shrink-0 flex items-center justify-center">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-stone-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-foreground truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.options && Object.keys(item.options).length > 0
                          ? Object.entries(item.options)
                              .map(
                                ([k, v]) =>
                                  `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`,
                              )
                              .join(" • ") + " • "
                          : null}
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>

                  <span className="font-bold text-sm text-foreground shrink-0">
                    {formatCurrency(item.unit_price * item.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="pt-4 border-t border-stone-100 space-y-3 text-stone-600">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-foreground">
                  {shippingFee > 0
                    ? formatCurrency(shippingFee, currency)
                    : formatCurrency(0, currency)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Taxes</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(0, currency)}
                </span>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-between items-center text-base font-bold text-foreground">
                <span>Total</span>
                <span>
                  {order
                    ? formatCurrency(order.total_amount, currency)
                    : formatCurrency(0, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Fulfillment & Coordinates Card */}
          {order?.metadata_json && (
            <div className="w-full bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-xs mb-8 print-full-width">
              <h5 className="font-bold font-secondary text-foreground mb-4">
                Fulfillment & Customer Details
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-muted-foreground uppercase font-bold text-xs tracking-wider block">
                    Customer Coordinates
                  </span>
                  <p className="font-bold text-foreground">
                    {order.customer_name}
                  </p>
                  <p className="text-muted-foreground">
                    {order.customer_email}
                  </p>
                </div>

                <div className="space-y-1.5 p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-muted-foreground uppercase font-bold text-xs tracking-wider block">
                    Fulfillment Schedule
                  </span>
                  <p className="font-bold text-foreground capitalize">
                    {String(order.metadata_json.fulfillment_type || "Delivery")}
                  </p>
                  <p className="text-muted-foreground">
                    {formattedDeliveryDate}
                    {Boolean(order.metadata_json.fulfillment_time) &&
                      ` • ${String(order.metadata_json.fulfillment_time)}`}
                  </p>
                </div>

                {Boolean(deliveryAddressRaw && formattedDeliveryAddress) && (
                  <div className="md:col-span-2 space-y-1.5 p-4 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-muted-foreground uppercase font-bold text-xs tracking-wider block">
                      Delivery Address
                    </span>
                    <p className="text-foreground">
                      {formattedDeliveryAddress}
                    </p>
                  </div>
                )}

                {Boolean(order.metadata_json.gift_message) && (
                  <div className="md:col-span-2 space-y-1.5 p-4 rounded-xl bg-amber-50/60 border border-amber-200/50">
                    <span className="text-amber-800 uppercase font-bold text-xs tracking-wider block">
                      Complimentary Gift Card Message
                    </span>
                    <p className="text-foreground">
                      &quot;{String(order.metadata_json.gift_message)}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
            <Link
              href={getTenantRoute(tenantSlug, "/profile?tab=orders")}
              className="w-full sm:w-auto"
            >
              <Button size="lg" variant="outline">
                <FileText className="h-4 w-4" />
                <span>View in My Orders</span>
              </Button>
            </Link>
            <Link
              href={getTenantRoute(tenantSlug, "/menu")}
              className="w-full sm:w-auto"
            >
              <Button size="lg">
                <ShoppingBag className="h-4 w-4" />
                <span>Continue Shopping</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
