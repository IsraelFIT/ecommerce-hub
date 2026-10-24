"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { PaymentGatewayLogo } from "@/components/shared/payment-gateway-logo";
import {
  CreditCard,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Truck,
  ChevronRight,
  ShoppingBag,
  Plus,
  ShieldCheck,
  Loader2,
  ExternalLink,
  Check,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CopyableId } from "@/components/shared/copyable-id";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/store/cart";
import { useUserStore } from "@/store/user";
import { formatCurrency, getTenantRoute } from "@/utils/helper";
import { getTenantBySlug } from "@/lib/api/tenants";
import { createOrder, calculateOrderPricing } from "@/lib/api/order";
import { createCheckoutSession, verifyPayment } from "@/lib/api/payments";
import { getUserAddresses, addUserAddress } from "@/lib/api/auth";
import { Tenant, UserAddress } from "@/types/users";
import { Order, CheckoutSessionResponse, OrderCalculateResult } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = (params?.tenant as string) || "store";
  const { user } = useUserStore();
  const { items, getCartTotal, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [tenantData, setTenantData] = useState<Tenant | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    getTenantBySlug(tenantSlug)
      .then((res) => {
        if (isMounted && res.data) {
          setTenantData(res.data);
        }
      })
      .catch(() => null);
    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  // Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user) {
      if (user.first_name)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFirstName((prev) => prev || user.first_name || "");
      if (user.last_name) setLastName((prev) => prev || user.last_name || "");
      if (user.email) setEmail((prev) => prev || user.email || "");
      if (user.phone_number)
        setPhone((prev) => prev || user.phone_number || "");
    }
  }, [user]);

  const [fulfillmentType, setFulfillmentType] = useState<"pickup" | "delivery">(
    () => {
      const mode = searchParams?.get("fulfillment") || searchParams?.get("tab");
      return mode === "delivery" ? "delivery" : "pickup";
    },
  );

  useEffect(() => {
    const mode = searchParams?.get("fulfillment") || searchParams?.get("tab");
    if (mode === "delivery") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFulfillmentType("delivery");
    } else if (mode === "pickup") {
      setFulfillmentType("pickup");
    }
  }, [searchParams]);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");

  // Customer Profile Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">(
    "",
  );
  const [, setIsLoadingAddresses] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadAddresses() {
      if (!user?.id) return;
      try {
        setIsLoadingAddresses(true);
        const addrs = await getUserAddresses();
        if (addrs && Array.isArray(addrs) && isMounted) {
          setSavedAddresses(addrs);
          if (addrs.length > 0) {
            // Pick default address or first saved address
            const defaultAddr = addrs.find((a) => a.is_default) || addrs[0];
            setSelectedAddressId(defaultAddr.id);
            setAddress(defaultAddr.street || "");
            setCity(defaultAddr.city || "");
            setState(defaultAddr.state || "");
            setZip(defaultAddr.zip_code || defaultAddr.zipCode || "");
            setCountry(defaultAddr.country || "");
            if (defaultAddr.first_name || defaultAddr.firstName) {
              setFirstName(
                (prev) =>
                  prev || defaultAddr.first_name || defaultAddr.firstName || "",
              );
            }
            if (defaultAddr.last_name || defaultAddr.lastName) {
              setLastName(
                (prev) =>
                  prev || defaultAddr.last_name || defaultAddr.lastName || "",
              );
            }
            if (defaultAddr.phone) {
              setPhone((prev) => prev || defaultAddr.phone || "");
            }
          }
        }
      } catch (err) {
        console.error(
          "Failed to load customer profile addresses in checkout:",
          err,
        );
      } finally {
        if (isMounted) setIsLoadingAddresses(false);
      }
    }
    loadAddresses();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleSelectSavedAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setAddress(addr.street || "");
    setCity(addr.city || "");
    setState(addr.state || "");
    setZip(addr.zip_code || addr.zipCode || "");
    setCountry(addr.country || "");
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId("new");
    setAddress("");
    setCity("");
    setState("");
    setZip("");
  };

  const [giftMessage, setGiftMessage] = useState("");

  // Payment Gateway & Checkout States
  const [paymentGateway, setPaymentGateway] = useState<"paystack" | "stripe">(
    "paystack",
  );
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [checkoutSession, setCheckoutSession] =
    useState<CheckoutSessionResponse | null>(null);

  // Initialize payment gateway choice from tenant's default or currency
  useEffect(() => {
    if (tenantData) {
      if (
        tenantData.default_gateway === "stripe" ||
        tenantData.default_gateway === "paystack"
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPaymentGateway(tenantData.default_gateway as "paystack" | "stripe");
      } else if (
        tenantData.currency === "USD" ||
        tenantData.currency === "EUR" ||
        tenantData.currency === "GBP"
      ) {
        setPaymentGateway("stripe");
      } else {
        setPaymentGateway("paystack");
      }
    }
  }, [tenantData]);

  // Server Pricing & Nigerian VAT calculation state
  const [serverPricing, setServerPricing] =
    useState<OrderCalculateResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (items.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServerPricing(null);
      return;
    }
    async function fetchPricingQuote() {
      try {
        const res = await calculateOrderPricing(
          {
            fulfillment_type: fulfillmentType,
            items: items.map((it) => ({
              product_id: it.id,
              quantity: it.quantity,
              options: it.options,
            })),
          },
          tenantSlug,
        );
        if (isMounted && res.data) {
          setServerPricing(res.data);
        }
      } catch (err) {
        console.warn("Server pricing calculation error, using fallback:", err);
      }
    }
    fetchPricingQuote();
    return () => {
      isMounted = false;
    };
  }, [items, fulfillmentType, tenantSlug]);

  const storeCurrency = tenantData?.currency || "NGN";
  const isNigeria =
    (tenantData?.country || "").toLowerCase().includes("nigeria") ||
    storeCurrency.toUpperCase() === "NGN";

  const configuredDeliveryFee = Number(
    tenantData?.delivery_fee ?? tenantData?.branding_config?.deliveryFee ?? 45,
  );

  const subtotal = serverPricing?.subtotal ?? getCartTotal();
  const deliveryFee =
    serverPricing?.delivery_fee ??
    (fulfillmentType === "delivery" ? configuredDeliveryFee : 0);
  const taxRate = serverPricing?.tax_rate ?? 0.075;
  const taxTitle =
    serverPricing?.tax_title ?? (isNigeria ? "VAT (7.5%)" : "VAT (7.5%)");
  const taxAmount =
    serverPricing?.tax_amount ?? Number((subtotal * taxRate).toFixed(2));
  const total =
    serverPricing?.total_amount ??
    Number((subtotal + deliveryFee + taxAmount).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    if (!firstName || !lastName || !email || !phone || !date || !timeSlot) {
      toast.error("Please fill in all contact and timing information.");
      return;
    }

    if (fulfillmentType === "delivery" && (!address || !city || !zip)) {
      toast.error("Please fill in your delivery address.");
      return;
    }

    // If customer selected delivery and is logged in, save address to profile if they don't have one or if it's a new address
    if (fulfillmentType === "delivery" && user?.id && address.trim()) {
      const isAlreadySaved = savedAddresses.some(
        (a) =>
          a.street?.trim().toLowerCase() === address.trim().toLowerCase() &&
          a.city?.trim().toLowerCase() === city.trim().toLowerCase() &&
          (a.zip_code || a.zipCode)?.trim() === zip.trim(),
      );

      if (!isAlreadySaved || savedAddresses.length === 0) {
        try {
          const newAddr = await addUserAddress({
            first_name: firstName.trim() || user.first_name || "Valued",
            last_name: lastName.trim() || user.last_name || "Customer",
            street: address.trim(),
            city: city.trim(),
            state: state.trim() || city.trim(),
            zip_code: zip.trim(),
            country: country.trim() || tenantData?.country || "United States",
            phone: phone.trim() || user.phone_number || undefined,
            email: email.trim() || user.email || undefined,
            is_default: savedAddresses.length === 0,
          });
          setSavedAddresses((prev) => [newAddr, ...prev]);
        } catch (err) {
          console.error("Could not save address to customer profile:", err);
        }
      }
    }

    try {
      setIsProcessingPayment(true);

      // 1. Create order in PostgreSQL database with 2.5% platform split & subaccount allocation
      const orderPayload = {
        customer_email: email.trim().toLowerCase(),
        customer_name: `${firstName} ${lastName}`.trim(),
        payment_gateway: paymentGateway,
        currency: storeCurrency,
        delivery_fee: deliveryFee,
        fulfillment_type: fulfillmentType,
        delivery_address:
          fulfillmentType === "delivery"
            ? {
                address: address.trim(),
                city: city.trim(),
                state: state.trim(),
                zip: zip.trim(),
                country:
                  country.trim() || tenantData?.country || "United States",
              }
            : null,
        fulfillment_date: date,
        fulfillment_time: timeSlot,
        gift_message: giftMessage.trim() || null,
        items: items.map((item) => ({
          product_id: item.id,
          title: item.name,
          quantity: item.quantity,
          unit_price: Number(item.price),
          image: item.image || null,
          ...(item.options && Object.keys(item.options).length > 0
            ? { options: item.options }
            : {}),
        })),
      };

      const orderRes = await createOrder(
        orderPayload as unknown as Parameters<typeof createOrder>[0],
        tenantSlug,
      );

      if (!orderRes.data) {
        throw new Error(orderRes.message || "Failed to create order");
      }

      const createdOrder = orderRes.data as unknown as Order;
      setActiveOrder(createdOrder);

      // 2. Initialize checkout session via chosen provider (Paystack or Stripe)
      const callbackUrl = `${window.location.origin}/${tenantSlug}/orders/confirmation?reference=${createdOrder.gateway_reference}`;
      const sessionRes = await createCheckoutSession(
        {
          order_id: createdOrder.id,
          gateway: paymentGateway,
          callback_url: callbackUrl,
        },
        tenantSlug,
      );

      if (!sessionRes.data) {
        throw new Error(
          sessionRes.message || "Failed to initialize payment session",
        );
      }

      const session = sessionRes.data;
      setCheckoutSession(session);

      // 3. Determine if live hosted redirect or sandbox modal
      const isLiveRedirect =
        session.checkout_url &&
        !session.checkout_url.includes(createdOrder.gateway_reference) &&
        (session.checkout_url.startsWith(
          "https://checkout.stripe.com/c/pay/cs_",
        ) ||
          (session.checkout_url.startsWith("https://checkout.paystack.com/") &&
            !session.checkout_url.includes("ECH-")));

      if (isLiveRedirect) {
        toast.info(
          `Redirecting to secure ${
            paymentGateway === "stripe" ? "Stripe" : "Paystack"
          } checkout...`,
        );
        window.location.href = session.checkout_url;
      } else {
        // Open Interactive Payment Gateway Sandbox modal for local test / simulation
        setIsMockModalOpen(true);
      }
    } catch (err: unknown) {
      console.error("Checkout submission failed:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Checkout error occurred. Please try again.",
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleAuthorizeMockPayment = async () => {
    if (!activeOrder && !checkoutSession) return;
    const reference =
      checkoutSession?.reference || activeOrder?.gateway_reference;
    if (!reference) return;

    try {
      setIsVerifyingPayment(true);
      const verifyRes = await verifyPayment(reference, undefined, tenantSlug);

      if (verifyRes.data && verifyRes.data.status === "paid") {
        toast.success("Payment authorized successfully!");
        clearCart(tenantSlug, true);
        setIsMockModalOpen(false);
        router.push(
          getTenantRoute(
            tenantSlug,
            `/orders/confirmation?reference=${reference}`,
          ),
        );
      } else {
        toast.error("Payment authorization could not be verified.");
      }
    } catch (err: unknown) {
      console.error("Verification failed:", err);
      toast.error(
        err instanceof Error ? err.message : "Payment verification failed",
      );
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  if (!mounted) {
    return (
      <div className="py-32 bg-stone-50 flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-full" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // If cart is empty and no modal open, show redirect button
  if (items.length === 0 && !isMockModalOpen) {
    return (
      <div className="py-32 bg-stone-50 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-6">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="font-bold text-stone-950 mb-3">No Items to Checkout</h2>
        <p className="text-stone-500 max-w-sm mb-8 font-light">
          Your cart is empty. Please add confections from our menu before
          checking out.
        </p>
        <Link href={getTenantRoute(tenantSlug, "/menu")}>
          <Button>Browse Menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 bg-stone-50 text-foreground min-h-screen relative">
      <div className="container flex-col">
        {/* Breadcrumb Navigation */}
        <nav className="w-full flex items-center gap-2 text-sm text-foreground font-medium mb-8">
          <Link
            href={getTenantRoute(tenantSlug, "/")}
            className="hover:text-stone-900 transition-colors text-foreground"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          <Link
            href={getTenantRoute(tenantSlug, "/cart")}
            className="hover:text-stone-900 transition-colors text-foreground"
          >
            Cart
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          <span className="text-stone-900 font-semibold truncate max-w-xs">
            Checkout
          </span>
        </nav>

        {/* Title */}
        <div className="w-full mb-8">
          <h3 className="font-bold text-foreground">Secure Checkout</h3>
          <p className="text-muted-foreground mt-2 font-light">
            Enter your fulfillment timeline, billing coordinates, and select
            your preferred payment gateway.
          </p>
        </div>

        {/* Interactive Payment Gateway Sandbox Modal */}
        {isMockModalOpen && activeOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 border border-stone-200">
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm",
                  paymentGateway === "stripe"
                    ? "bg-indigo-600 text-white"
                    : "bg-emerald-600 text-white",
                )}
              >
                <CreditCard className="h-7 w-7" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 bg-stone-100 text-stone-700">
                <PaymentGatewayLogo
                  gateway={paymentGateway}
                  imgClassName="h-6"
                />
                <span>Payment Sandbox</span>
              </div>

              <h3 className="text-xl font-bold text-foreground text-center mb-1">
                Authorize Checkout Payment
              </h3>
              <p className="text-xs text-muted-foreground text-center mb-5 max-w-xs">
                Simulate a live customer authorization to verify split payout
                settlement and mark the order as paid.
              </p>

              {/* Order Breakdown Card */}
              <div className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 mb-6 space-y-2.5 text-xs text-stone-700">
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/70">
                  <span className="text-muted-foreground">
                    Order Reference:
                  </span>
                  <CopyableId
                    id={
                      checkoutSession?.reference ||
                      activeOrder.gateway_reference
                    }
                    length={10}
                    textClassName="font-mono font-bold text-stone-900"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium text-stone-900">
                    {activeOrder.customer_name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-stone-900">
                    {activeOrder.customer_email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Gateway Selected:
                  </span>
                  <span className="font-semibold text-stone-900 uppercase">
                    {paymentGateway}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Platform Fee (2.5%):
                  </span>
                  <span className="font-medium text-amber-700">
                    {formatCurrency(activeOrder.platform_fee, storeCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Tenant Subaccount Payout:
                  </span>
                  <span className="font-medium text-emerald-700">
                    {formatCurrency(
                      activeOrder.tenant_payout_amount,
                      storeCurrency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-200/70 text-sm font-bold text-stone-950">
                  <span>Grand Total:</span>
                  <span className="text-base text-stone-900">
                    {formatCurrency(activeOrder.total_amount, storeCurrency)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full flex flex-col gap-2.5">
                <Button
                  onClick={handleAuthorizeMockPayment}
                  disabled={isVerifyingPayment}
                  className={cn(
                    "w-full h-11 text-white font-semibold cursor-pointer shadow-sm transition-all",
                    paymentGateway === "stripe"
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-emerald-600 hover:bg-emerald-700",
                  )}
                >
                  {isVerifyingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verifying Transaction with Provider...
                    </>
                  ) : (
                    <>Simulate Successful Payment & Confirm Order</>
                  )}
                </Button>

                {checkoutSession?.checkout_url && (
                  <a
                    href={checkoutSession.checkout_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 text-xs border-stone-200 hover:bg-stone-50 text-stone-700 cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Open Provider Hosted Page
                    </Button>
                  </a>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsMockModalOpen(false)}
                  disabled={isVerifyingPayment}
                  className="w-full h-9 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Cancel / Return to Checkout
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Columns Grid */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start w-full"
        >
          {/* Left Columns: Checkout Fields */}
          <div className="lg:col-span-2 flex flex-col gap-6 w-full">
            {/* 1. Client details */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-xs">
              <h4 className="font-bold font-secondary text-foreground mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
                <span className="inline-flex w-6 h-6 rounded-full bg-stone-100 text-foreground items-center justify-center text-xs font-bold">
                  1
                </span>
                Contact Coordinates
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="firstName"
                    className="text-xs font-bold text-foreground"
                  >
                    First Name
                  </Label>
                  <Input
                    type="text"
                    id="firstName"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="lastName"
                    className="text-xs font-bold text-foreground"
                  >
                    Last Name
                  </Label>
                  <Input
                    type="text"
                    id="lastName"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-bold text-foreground"
                  >
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="phone"
                    className="text-xs font-bold text-foreground"
                  >
                    Phone Number
                  </Label>
                  <Input
                    type="tel"
                    id="phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* 2. Fulfillment selection */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-xs">
              <h4 className="font-bold font-secondary text-foreground mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
                <span className="inline-flex w-6 h-6 rounded-full bg-stone-100 text-foreground items-center justify-center text-xs font-bold">
                  2
                </span>
                Fulfillment Logistics
              </h4>

              {/* Selector */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setFulfillmentType("pickup")}
                  className={`py-3 text-center text-xs font-bold tracking-wide uppercase cursor-pointer rounded-md border flex items-center justify-center gap-2 ${
                    fulfillmentType === "pickup"
                      ? "border-primary bg-primary text-white"
                      : "border-border hover:border-border/40 bg-card text-foreground"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentType("delivery")}
                  className={`py-3 text-center text-xs font-bold tracking-wide uppercase cursor-pointer rounded-md border flex items-center justify-center gap-2 ${
                    fulfillmentType === "delivery"
                      ? "border-primary bg-primary text-white"
                      : "border-border hover:border-border/40 bg-card text-foreground"
                  }`}
                >
                  <Truck className="h-4 w-4" />
                  Delivery
                </button>
              </div>

              {/* Delivery Address fields */}
              {fulfillmentType === "delivery" ? (
                <div className="space-y-4 mb-6">
                  {/* Saved Addresses quick-selector if user has saved addresses */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-2 pb-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-foreground">
                          Delivery Address
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          Loaded from your profile
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {savedAddresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => handleSelectSavedAddress(addr)}
                              className={cn(
                                "p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between text-xs",
                                isSelected
                                  ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-xs"
                                  : "border-stone-200 hover:border-stone-300 bg-stone-50/50 text-muted-foreground",
                              )}
                            >
                              <div className="font-semibold text-foreground flex items-center justify-between gap-1">
                                <span className="truncate">{addr.street}</span>
                                {addr.is_default && (
                                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-medium shrink-0">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-500 mt-1">
                                {addr.city}, {addr.state}{" "}
                                {addr.zip_code || addr.zipCode}
                              </div>
                            </button>
                          );
                        })}

                        {/* Add new address option button */}
                        <button
                          type="button"
                          onClick={handleSelectNewAddress}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-medium border-dashed",
                            selectedAddressId === "new"
                              ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                              : "border-stone-300 hover:border-stone-400 bg-transparent text-stone-600",
                          )}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Use a different address</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <Label
                        htmlFor="address"
                        className="text-xs font-bold text-foreground"
                      >
                        Street Address *
                      </Label>
                      <Input
                        type="text"
                        id="address"
                        required={fulfillmentType === "delivery"}
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          if (selectedAddressId !== "new")
                            setSelectedAddressId("new");
                        }}
                        placeholder="e.g. 123 Broadway, Apt 4B"
                        className="h-10"
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-1">
                      <Label
                        htmlFor="city"
                        className="text-xs font-bold text-foreground"
                      >
                        City *
                      </Label>
                      <Input
                        type="text"
                        id="city"
                        required={fulfillmentType === "delivery"}
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          if (selectedAddressId !== "new")
                            setSelectedAddressId("new");
                        }}
                        placeholder="e.g. New York"
                        className="h-10"
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-1">
                      <Label
                        htmlFor="state"
                        className="text-xs font-bold text-foreground"
                      >
                        State / Region *
                      </Label>
                      <Input
                        type="text"
                        id="state"
                        required={fulfillmentType === "delivery"}
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          if (selectedAddressId !== "new")
                            setSelectedAddressId("new");
                        }}
                        placeholder="e.g. NY"
                        className="h-10"
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-1">
                      <Label
                        htmlFor="zip"
                        className="text-xs font-bold text-foreground"
                      >
                        Zip Code *
                      </Label>
                      <Input
                        type="text"
                        id="zip"
                        required={fulfillmentType === "delivery"}
                        value={zip}
                        onChange={(e) => {
                          setZip(e.target.value);
                          if (selectedAddressId !== "new")
                            setSelectedAddressId("new");
                        }}
                        placeholder="e.g. 10001"
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 p-4 border border-stone-200 rounded-md mb-6 text-foreground font-light">
                  <p className="font-semibold mb-1">Pickup Location:</p>
                  <p className="font-medium text-stone-900">
                    {tenantData?.pickup_location_name ||
                      tenantData?.branding_config?.pickupLocationName ||
                      `${tenantData?.name || "Store"} Studio`}
                  </p>
                  <p>
                    {tenantData?.pickup_address ||
                      tenantData?.branding_config?.pickupAddress ||
                      "Address"}
                  </p>
                  <p className="mt-2 text-xs text-stone-400">
                    {tenantData?.pickup_hours ||
                      tenantData?.branding_config?.pickupHours ||
                      "Available: Tuesday–Saturday, 10:00 – 18:00"}
                  </p>
                </div>
              )}

              {/* Date & Time slots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="date"
                    className="text-xs font-bold text-foreground flex items-center gap-1"
                  >
                    <CalendarIcon className="h-3.5 w-3.5" /> Date Needed
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-10 w-full justify-start text-left font-normal border-stone-200 bg-background text-foreground shadow-2xs hover:bg-stone-50 transition-colors",
                          !date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? (
                          format(new Date(`${date}T00:00:00`), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-popover"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={
                          date ? new Date(`${date}T00:00:00`) : undefined
                        }
                        onSelect={(selectedDate) => {
                          if (selectedDate) {
                            setDate(format(selectedDate, "yyyy-MM-dd"));
                          }
                        }}
                        disabled={(d) =>
                          d < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="timeSlot"
                    className="text-xs font-bold text-foreground flex items-center gap-1"
                  >
                    <Clock className="h-3.5 w-3.5" /> Delivery / Collection Time
                  </Label>
                  <Select value={timeSlot} onValueChange={setTimeSlot}>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Select a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10:00 AM - 12:00 PM">
                        Morning (10:00 AM - 12:00 PM)
                      </SelectItem>
                      <SelectItem value="12:00 PM - 02:00 PM">
                        Midday (12:00 PM - 02:00 PM)
                      </SelectItem>
                      <SelectItem value="02:00 PM - 04:00 PM">
                        Afternoon (02:00 PM - 04:00 PM)
                      </SelectItem>
                      <SelectItem value="04:00 PM - 06:00 PM">
                        Late Afternoon (04:00 PM - 06:00 PM)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 3. Payment Gateway Selection */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
                <h4 className="font-bold font-secondary text-foreground flex items-center gap-2">
                  <span className="inline-flex w-6 h-6 rounded-full bg-stone-100 text-foreground items-center justify-center text-xs font-bold">
                    3
                  </span>
                  Payment Gateway
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Split Payouts Protected</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Paystack Option */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setPaymentGateway("paystack")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setPaymentGateway("paystack");
                    }
                  }}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 outline-none min-h-18.5",
                    paymentGateway === "paystack"
                      ? "border-blue-400 bg-blue-50/20 ring-1 ring-blue-400/30 shadow-xs"
                      : "border-stone-200 hover:border-stone-300 bg-card text-foreground",
                  )}
                >
                  <div className="relative h-12 w-36">
                    <Image
                      src="/logos/paystack.png"
                      alt="Paystack"
                      fill
                      unoptimized
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0",
                      paymentGateway === "paystack"
                        ? "border-blue-400 bg-blue-400 text-white"
                        : "border-stone-300 bg-white",
                    )}
                  >
                    {paymentGateway === "paystack" && (
                      <Check className="h-3 w-3 stroke-3" />
                    )}
                  </div>
                </div>

                {/* Stripe Option */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setPaymentGateway("stripe")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setPaymentGateway("stripe");
                    }
                  }}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 outline-none min-h-18.5",
                    paymentGateway === "stripe"
                      ? "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600/30 shadow-xs"
                      : "border-stone-200 hover:border-stone-300 bg-card text-foreground",
                  )}
                >
                  <div className="relative h-7 w-32">
                    <Image
                      src="/logos/stripe.png"
                      alt="Stripe"
                      fill
                      unoptimized
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0",
                      paymentGateway === "stripe"
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-stone-300 bg-white",
                    )}
                  >
                    {paymentGateway === "stripe" && (
                      <Check className="h-3 w-3 stroke-3" />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-stone-50 border border-stone-200/80 rounded-md text-xs text-muted-foreground flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                <span className="flex items-center flex-wrap gap-1.5">
                  Payments are processed securely via
                  <PaymentGatewayLogo gateway={paymentGateway} />. Platform fees
                  (2.5%) are retained and net proceeds route straight to the
                  merchant.
                </span>
              </div>
            </div>

            {/* 4. Gift Options */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-xs">
              <h4 className="font-bold font-secondary text-foreground mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
                <span className="inline-flex w-6 h-6 rounded-full bg-stone-100 text-foreground items-center justify-center text-xs font-bold">
                  4
                </span>
                Gift Message & Custom Requests (Optional)
              </h4>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="giftMessage"
                  className="text-xs font-bold text-foreground"
                >
                  Message for Complimentary Card
                </Label>
                <Textarea
                  id="giftMessage"
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="E.g., 'Happy Anniversary Sarah! With love, Mark.' or write any special instructions for cake presentation..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Summary Box */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 flex flex-col w-full shadow-xs sticky top-24">
            <h4 className="font-bold font-secondary text-foreground mb-4 border-b border-stone-200 pb-4">
              Order Summary
            </h4>

            {/* Items Summary list */}
            <div className="flex flex-col gap-4 mb-6 max-h-60 overflow-y-auto no-scrollbar">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="relative aspect-square w-12 h-12 bg-stone-100 rounded-md shrink-0 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0 grow">
                    <h6 className="font-bold text-foreground truncate">
                      {item.name}
                    </h6>
                    <p className="text-xs text-muted-foreground font-medium">
                      Qty: {item.quantity}
                      {item.options?.size ? ` • ${item.options.size}` : ""}
                    </p>
                  </div>
                  <h6 className="font-bold text-foreground shrink-0">
                    {formatCurrency(
                      (item.price * item.quantity).toFixed(2),
                      storeCurrency,
                    )}
                  </h6>
                </div>
              ))}
            </div>

            <div className="w-full h-px bg-stone-200 mb-6" />

            {/* Summary figures */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex justify-between text-xs text-foreground font-medium">
                <span>Items Subtotal</span>
                <span className="font-semibold text-sm text-foreground">
                  {formatCurrency(subtotal.toFixed(2), storeCurrency)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-foreground font-medium">
                <span>Fulfillment Fee</span>
                {fulfillmentType === "pickup" ? (
                  <span className="text-emerald-600 font-semibold uppercase text-xs tracking-wider">
                    Free Pickup
                  </span>
                ) : (
                  <span className="font-semibold text-sm text-foreground">
                    {formatCurrency(deliveryFee.toFixed(2), storeCurrency)}
                  </span>
                )}
              </div>

              <div className="flex justify-between text-xs text-foreground font-medium">
                <span>{taxTitle}</span>
                <span className="font-semibold text-sm text-foreground">
                  {formatCurrency(taxAmount.toFixed(2), storeCurrency)}
                </span>
              </div>

              <div className="w-full h-px bg-stone-200 my-2" />

              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-foreground">
                  Grand Total
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(total.toFixed(2), storeCurrency)}
                </span>
              </div>
            </div>

            {/* Place Order CTA button */}
            <Button type="submit" disabled={isProcessingPayment}>
              {isProcessingPayment ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Initializing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Pay {formatCurrency(
                    total.toFixed(2),
                    storeCurrency,
                  )} with {paymentGateway === "stripe" ? "Stripe" : "Paystack"}
                </>
              )}
            </Button>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-muted-foreground font-medium">
              <Lock className="h-3 w-3 text-stone-400" />
              <span className="flex items-center gap-1">
                Encrypted via{" "}
                <PaymentGatewayLogo
                  gateway={paymentGateway}
                  imgClassName="h-4"
                />
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
