"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Trash2, Plus, Minus, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { formatCurrency, getTenantRoute } from "@/utils/helper";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { getTenantBySlug } from "@/lib/api/tenants";
import { Tenant } from "@/types/users";

export function CartView() {
  const params = useParams();
  const { tenant: contextTenant } = useTenantTheme();
  const paramTenant = params?.tenant as string | undefined;
  const tenantSlug =
    paramTenant &&
    !["store", "cart", "general"].includes(paramTenant.toLowerCase())
      ? paramTenant
      : contextTenant?.slug || "general";
  const [tenantData, setTenantData] = useState<Tenant | null>(null);

  const { items, updateQuantity, removeFromCart, getCartTotal } =
    useCartStore();
  const [shippingMethod, setShippingMethod] = useState<"pickup" | "delivery">(
    "pickup",
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadTenant() {
      try {
        const res = await getTenantBySlug(tenantSlug);
        if (res.data && isMounted) {
          setTenantData(res.data);
        }
      } catch {
        // Fallback to theme context tenant
      }
    }
    loadTenant();
    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  const activeTenant = tenantData || contextTenant;
  const currency = activeTenant?.currency || "NGN";
  const configuredDeliveryFee = Number(
    activeTenant?.delivery_fee ??
      activeTenant?.branding_config?.deliveryFee ??
      45,
  );

  const subtotal = getCartTotal();
  const deliveryFee = shippingMethod === "delivery" ? configuredDeliveryFee : 0;
  const estTax = subtotal * 0.0825; // 8.25% tax
  const total = subtotal + deliveryFee + estTax;

  const pickupInstruction =
    activeTenant?.pickup_instruction ||
    activeTenant?.branding_config?.pickupInstruction ||
    "Pickup available Tuesday–Saturday at our studio. Select your time slot on the checkout page.";

  const deliveryInstruction =
    activeTenant?.delivery_instruction ||
    activeTenant?.branding_config?.deliveryInstruction ||
    "White-Glove climate-controlled delivery is locked for the Tri-State area. Assembly included.";

  if (!mounted) {
    return (
      <div className="w-full py-32 bg-stone-50 flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-full" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-32 bg-stone-50 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-6">
          <ShoppingBagIcon />
        </div>
        <h2 className="font-bold text-stone-950 mb-3">
          Your Cart Studio is Empty
        </h2>
        <p className="text-stone-500 max-w-sm mb-8 font-light">
          You haven&apos;t added any celebration cakes or artisanal pastries
          yet. Let&apos;s design something sweet.
        </p>
        <Link href={getTenantRoute(tenantSlug, "/menu")}>
          <Button>Browse Menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 bg-stone-50 text-foreground">
      <div className="container flex-col">
        {/* Breadcrumb Navigation */}
        <nav className="w-full flex items-center gap-2 text-sm text-foreground font-medium mb-8">
          <Link
            href={getTenantRoute(tenantSlug, "/")}
            className="hover:text-stone-900 transition-colors text-stone-500"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          <Link
            href={getTenantRoute(tenantSlug, "/menu")}
            className="hover:text-stone-900 transition-colors text-stone-500"
          >
            Menu
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          <span className="text-stone-900 font-semibold truncate max-w-xs">
            Cart
          </span>
        </nav>

        {/* Title */}
        <div className="w-full mb-8">
          <h3 className="font-bold text-foreground">Your Cart Studio</h3>
          <p className="text-muted-foreground mt-2 font-light">
            Review your custom confections and choose delivery or studio pickup.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start w-full">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-2 flex flex-col gap-6 w-full">
            <div className="divide-y divide-stone-200 border-b border-stone-200">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="py-6 flex flex-col md:flex-row gap-6 items-start"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square w-24 h-24 bg-stone-100 rounded-md shrink-0 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>

                  {/* Details */}
                  <div className="grow min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-foreground">{item.name}</h4>
                      <span className="font-bold text-foreground">
                        {formatCurrency(
                          (item.price * item.quantity).toFixed(2),
                          currency,
                        )}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 mb-4 text-sm text-stone-500">
                      {item.options && Object.keys(item.options).length > 0 ? (
                        <div className="text-xs text-muted-foreground font-medium">
                          {Object.entries(item.options)
                            .map(
                              ([k, v]) =>
                                `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`,
                            )
                            .join(" • ")}
                        </div>
                      ) : item.description ? (
                        <div className="text-xs text-muted-foreground line-clamp-1 font-medium">
                          {item.description}
                        </div>
                      ) : null}
                      <div className="text-muted-foreground text-xs font-bold mt-1">
                        Unit Price:{" "}
                        {formatCurrency(item.price.toFixed(2), currency)}
                      </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between">
                      {/* Quantity selector */}
                      <div className="flex items-center justify-between border border-border bg-white rounded-md w-24 h-8.5 px-0.5 select-none">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity - 1,
                              item.options,
                              undefined,
                              tenantSlug,
                            )
                          }
                          className="text-stone-500 hover:text-stone-900 hover:bg-secondary rounded-md transition-colors p-2 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1,
                              item.options,
                              undefined,
                              tenantSlug,
                            )
                          }
                          className="text-stone-500 hover:text-stone-900 hover:bg-secondary rounded-md transition-colors p-2 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() =>
                          removeFromCart(
                            item.id,
                            item.options,
                            undefined,
                            tenantSlug,
                          )
                        }
                        className="text-stone-400 hover:text-rose-600 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Gift option helper banner */}
            {/* <div className="flex items-start gap-4 p-5 bg-stone-100/50 border border-stone-200/50">
              <Gift className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold tracking-wider uppercase text-stone-900 mb-1">
                  Ordering as a Gift?
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed font-light">
                  Include a complimentary handwritten card. You will be prompted
                  to enter your message during the checkout process.
                </p>
              </div>
            </div> */}
          </div>

          {/* Right Column: Checkout Summary Box */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 flex flex-col w-full shadow-xs">
            <h4 className="font-bold font-secondary text-foreground mb-4 border-b border-stone-200 pb-4">
              Studio Summary
            </h4>

            {/* Shipping selection tabs */}
            <div className="w-full mb-6">
              <p className="font-bold text-xs tracking-wider uppercase text-stone-400 mb-3">
                Fulfillment Mode
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShippingMethod("pickup")}
                  className={`py-3 text-center text-xs font-bold tracking-wide uppercase cursor-pointer rounded-md border ${
                    shippingMethod === "pickup"
                      ? "border-primary bg-primary text-white"
                      : "border-border hover:border-border/40 bg-card text-foreground"
                  }`}
                >
                  Pickup
                </button>
                <button
                  onClick={() => setShippingMethod("delivery")}
                  className={`py-3 text-center text-xs font-bold tracking-wide uppercase cursor-pointer rounded-md border ${
                    shippingMethod === "delivery"
                      ? "border-primary bg-primary text-white"
                      : "border-border hover:border-border/40 bg-card text-foreground"
                  }`}
                >
                  Delivery
                </button>
              </div>
            </div>

            {/* Summary figures */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex justify-between text-xs text-stone-500 font-medium">
                <span>Items Subtotal</span>
                <span className="font-semibold text-sm text-foreground">
                  {formatCurrency(subtotal.toFixed(2), currency)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-stone-500 font-medium">
                <span>Fulfillment Fee</span>
                {shippingMethod === "pickup" ? (
                  <span className="text-emerald-600 font-semibold uppercase text-xs tracking-wider">
                    Free Pickup
                  </span>
                ) : (
                  <span className="font-semibold text-sm text-foreground">
                    {configuredDeliveryFee > 0
                      ? formatCurrency(
                          configuredDeliveryFee.toFixed(2),
                          currency,
                        )
                      : "Free Delivery"}
                  </span>
                )}
              </div>

              <div className="flex justify-between text-xs text-stone-500 font-medium">
                <span>Estimated Sales Tax</span>
                <span className="font-semibold text-sm text-foreground">
                  {formatCurrency(estTax.toFixed(2), currency)}
                </span>
              </div>

              <div className="w-full h-px bg-stone-200 my-2" />

              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-foreground">
                  Grand Total
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(total.toFixed(2), currency)}
                </span>
              </div>
            </div>

            {/* Checkout Link button */}
            <Link
              href={getTenantRoute(tenantSlug, "/checkout")}
              className="w-full"
            >
              <Button className="w-full">
                <CreditCard className="h-5 w-5" />
                Proceed to Checkout
              </Button>
            </Link>

            {/* Pickup/delivery instructions */}
            <p className="text-[10px] text-stone-400 mt-4 leading-relaxed text-center">
              {shippingMethod === "pickup"
                ? pickupInstruction
                : deliveryInstruction}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon helper
function ShoppingBagIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-shopping-bag"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
