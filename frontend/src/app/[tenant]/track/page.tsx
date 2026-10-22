"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchOrderById } from "@/lib/api/order";
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

    if (!cleanOrderId && !cleanEmail) {
      toast.error("Please enter your Order ID or Billing Email");
      setErrorMessage(
        "Please provide your Order ID or Billing Email to track your order.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const searchTarget = cleanOrderId || cleanEmail;
      const emailFilter = cleanOrderId && cleanEmail ? cleanEmail : undefined;

      const res = await fetchOrderById(searchTarget, emailFilter, tenantSlug);

      if (!res.data) {
        setErrorMessage(
          "We could not find an order matching that information. Please check your details and try again.",
        );
        return;
      }

      toast.success("Order located!");
      router.push(getTenantRoute(tenantSlug, `/track/${res.data.id}`));
    } catch (err: unknown) {
      console.error("Order search error:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "We could not find an order matching that information. Please verify your receipt and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="container flex-col gap-6">
        {/* Breadcrumb / Top Header */}
        <div className="w-full text-center space-y-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
            style={{
              backgroundColor: `${primaryColor}15`,
              color: primaryColor,
            }}
          >
            Live Tracking
          </span>
          <h2 className="font-extrabold tracking-tight text-foreground">
            Track Your Order
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            To track your order, enter your Order ID or Billing Email in the box
            below and press the &ldquo;Track Order&rdquo; button.
          </p>
        </div>

        {/* Tracking Lookup Card (Matches Image 2) */}
        <div className="w-full lg:w-[70%] bg-card rounded-xl border border-border/80 p-6 md:p-10 space-y-6">
          {errorMessage && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3 text-destructive">
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
                Order ID
              </Label>
              <Input
                id="orderId"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter Your Order ID (e.g. #ORD-1234 or ECH-...)"
                className="h-10"
              />
            </div>

            {/* Billing Email Input */}
            <div className="space-y-2">
              <Label
                htmlFor="billingEmail"
                className="text-xs sm:text-sm font-bold text-foreground"
              >
                Billing Email
              </Label>
              <Input
                id="billingEmail"
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="Enter Email Address (e.g. name@example.com)"
                className="h-10"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
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
        <div className="w-full lg:w-[70%] rounded-xl border border-border/80 bg-card p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="font-bold text-foreground">
              Have an account with us?
            </h4>
            <p className="text-muted-foreground mt-1.5">
              Sign in to view all your past order receipts and invoices in one
              place.
            </p>
          </div>
          <Link href={getTenantRoute(tenantSlug, "/profile")}>
            <Button size="lg" variant="outline">
              View Profile Orders
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
