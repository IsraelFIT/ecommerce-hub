"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api/client";
import { getTenantRoute } from "@/utils/helper";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { toast } from "sonner";

interface TrackOrderPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function TrackOrderSearchPage({ params }: TrackOrderPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";
  const router = useRouter();
  const { branding } = useTenantTheme();

  const [orderId, setOrderId] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const primaryColor = branding?.primaryColor || "#059669";

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanOrderId = orderId.trim().replace(/^#/, "");
    const cleanEmail = billingEmail.trim().toLowerCase();

    if (!cleanOrderId) {
      toast.error("Please enter your Order ID");
      return;
    }
    if (!cleanEmail) {
      toast.error("Please enter your Billing Email");
      return;
    }

    setIsLoading(true);

    try {
      // Look up order by identifier
      const res = await apiRequest<{
        id: string;
        customer_email?: string;
        gateway_reference?: string;
      }>(`/orders/${encodeURIComponent(cleanOrderId)}`, {
        headers: {
          "X-Tenant-Slug": tenantSlug,
        },
      });

      if (!res.data) {
        setErrorMessage(
          "We could not find an order matching that Order ID. Please check the ID on your receipt and try again.",
        );
        return;
      }

      const orderEmail = (res.data.customer_email || "").trim().toLowerCase();
      if (orderEmail && orderEmail !== cleanEmail) {
        setErrorMessage(
          "The billing email does not match the email associated with this Order ID.",
        );
        return;
      }

      // Successfully matched, route to tracking details
      toast.success("Order located!");
      router.push(getTenantRoute(tenantSlug, `/track/${res.data.id}`));
    } catch (err: unknown) {
      console.error("Order search error:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "We could not find an order matching that Order ID. Please verify your receipt.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Breadcrumb / Top Header */}
        <div className="text-center space-y-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
            style={{
              backgroundColor: `${primaryColor}15`,
              color: primaryColor,
            }}
          >
            Live Tracking
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Track Your Order
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            To track your order please enter your Order ID in the box below and
            press the &ldquo;Track Order&rdquo; button. This was given to you on
            your receipt and in the confirmation email you should have received.
          </p>
        </div>

        {/* Tracking Lookup Card (Matches Image 2) */}
        <div className="bg-card rounded-2xl border border-border/80 p-6 sm:p-10 shadow-sm space-y-6">
          {errorMessage && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3 text-destructive text-xs sm:text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleTrackSubmit} className="space-y-6">
            {/* Order ID Input */}
            <div className="space-y-2">
              <Label
                htmlFor="orderId"
                className="text-xs sm:text-sm font-bold text-foreground"
              >
                Order ID <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="orderId"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter Your Order ID"
                required
                className="h-12 rounded-full px-5 text-sm border-border/80 focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
              />
            </div>

            {/* Billing Email Input */}
            <div className="space-y-2">
              <Label
                htmlFor="billingEmail"
                className="text-xs sm:text-sm font-bold text-foreground"
              >
                Billing Email <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="billingEmail"
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="Enter Email Address"
                required
                className="h-12 rounded-full px-5 text-sm border-border/80 focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 rounded-full px-8 font-bold text-sm text-white cursor-pointer transition-transform active:scale-[0.98] shadow-sm w-auto"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Searching Order...
                </>
              ) : (
                "Track Order"
              )}
            </Button>
          </form>
        </div>

        {/* Helpful Shortcut Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Have an account with us?
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sign in to view all your past order receipts and invoices in one
              place.
            </p>
          </div>
          <Link href={getTenantRoute(tenantSlug, "/profile")}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-5 text-xs font-semibold"
            >
              View Profile Orders
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
