"use client";

import { use, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Store,
  MapPin,
  Clock,
  Mail,
  Phone,
  Building,
  CreditCard,
  Save,
  Loader2,
  User as UserIcon,
  Truck,
  CheckCircle2,
  ExternalLink,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserProfileSettingsCard } from "@/components/shared/user-profile-settings-card";
import { useUserStore } from "@/store/user";
import { getTenantBySlug, updateTenantBySlug } from "@/lib/api/tenants";
import {
  fetchPaystackBanks,
  resolvePaystackAccount,
  createPaystackSubaccount,
  createStripeOnboarding,
  PaystackBank,
} from "@/lib/api/payments";
import { Tenant } from "@/types/users";
import { getCurrencySymbol } from "@/utils/helper";

interface SettingsPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function TenantSettingsPage({ params }: SettingsPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";
  const { user, updateUser } = useUserStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tenantData, setTenantData] = useState<Tenant | null>(null);

  // Store profile & contact state
  const [storeName, setStoreName] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");

  // Pickup location & hours
  const [pickupLocationName, setPickupLocationName] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupHours, setPickupHours] = useState("");
  const [pickupInstruction, setPickupInstruction] = useState("");

  // Delivery & shipping parameters
  const [deliveryFee, setDeliveryFee] = useState<string>("45");
  const [deliveryInstruction, setDeliveryInstruction] = useState("");

  // Subaccount payout configurations
  const [paystackSubaccountCode, setPaystackSubaccountCode] = useState(
    () => user?.paystack_subaccount_code || "",
  );
  const [stripeAccountId, setStripeAccountId] = useState(
    () => user?.stripe_account_id || "",
  );

  // Automated Banking & Subaccount States
  const [banks, setBanks] = useState<PaystackBank[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedAccountName, setResolvedAccountName] = useState("");
  const [isResolvingAccount, setIsResolvingAccount] = useState(false);
  const [isCreatingSubaccount, setIsCreatingSubaccount] = useState(false);
  const [isCreatingStripeOnboarding, setIsCreatingStripeOnboarding] =
    useState(false);
  const [showManualPaystack, setShowManualPaystack] = useState(false);
  const [showManualStripe, setShowManualStripe] = useState(false);

  // In-memory cache to avoid duplicate bank resolves
  const lastVerifiedRef = useRef<{
    bank: string;
    account: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    fetchPaystackBanks(tenantSlug)
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setBanks(res.data);
        }
      })
      .catch(() => null);
  }, [tenantSlug]);

  useEffect(() => {
    let isMounted = true;
    const cleanNum = accountNumber.trim();
    if (cleanNum.length === 10 && selectedBank) {
      // If this account has already been verified for this bank, reuse without calling Paystack API
      if (
        lastVerifiedRef.current &&
        lastVerifiedRef.current.bank === selectedBank &&
        lastVerifiedRef.current.account === cleanNum &&
        lastVerifiedRef.current.name
      ) {
        setResolvedAccountName(lastVerifiedRef.current.name);
        return;
      }

      setIsResolvingAccount(true);
      setResolvedAccountName("");
      resolvePaystackAccount(
        { account_number: cleanNum, bank_code: selectedBank },
        tenantSlug,
      )
        .then((res) => {
          if (isMounted && res.data?.account_name) {
            setResolvedAccountName(res.data.account_name);
            lastVerifiedRef.current = {
              bank: selectedBank,
              account: cleanNum,
              name: res.data.account_name,
            };
          }
        })
        .catch((err) => {
          if (isMounted) {
            const msg = err instanceof Error ? err.message : "";
            if (msg.includes("limit of 3 live bank resolves exceeded")) {
              toast.warning(
                "Paystack test limit reached. Use test bank code 001 or link bank directly.",
              );
            }
            setResolvedAccountName("");
          }
        })
        .finally(() => {
          if (isMounted) setIsResolvingAccount(false);
        });
    } else {
      setResolvedAccountName("");
    }
    return () => {
      isMounted = false;
    };
  }, [accountNumber, selectedBank, tenantSlug]);

  const handleAutoCreatePaystackSubaccount = async () => {
    if (!selectedBank || accountNumber.trim().length !== 10) {
      toast.error("Please select a bank and enter a 10-digit account number.");
      return;
    }
    try {
      setIsCreatingSubaccount(true);
      const res = await createPaystackSubaccount(
        {
          bank_code: selectedBank,
          account_number: accountNumber.trim(),
          business_name:
            storeName.trim() || tenantData?.name || "Store Merchant",
        },
        tenantSlug,
      );
      if (res.data?.subaccount_code) {
        const newCode = res.data.subaccount_code;
        const currentBankName =
          banks.find((b) => b.code === selectedBank)?.name || "";
        setPaystackSubaccountCode(newCode);
        setShowManualPaystack(false);
        setTenantData((prev) =>
          prev
            ? {
                ...prev,
                paystack_subaccount_code: newCode,
                branding_config: {
                  ...(prev.branding_config || {}),
                  settlementBank: selectedBank,
                  settlementBankName: currentBankName,
                  settlementAccount: accountNumber.trim(),
                  settlementAccountName: resolvedAccountName,
                },
              }
            : prev,
        );
        lastVerifiedRef.current = {
          bank: selectedBank,
          account: accountNumber.trim(),
          name: resolvedAccountName,
        };
        updateUser({ paystack_subaccount_code: newCode });
        toast.success(
          `Paystack subaccount (${newCode}) created and linked successfully!`,
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to create Paystack subaccount";
      toast.error(msg);
    } finally {
      setIsCreatingSubaccount(false);
    }
  };

  const handleStartStripeOnboarding = async () => {
    try {
      setIsCreatingStripeOnboarding(true);
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const returnUrl = `${origin}/${tenantSlug}/settings?stripe=success`;
      const refreshUrl = `${origin}/${tenantSlug}/settings?stripe=refresh`;
      const res = await createStripeOnboarding(
        { return_url: returnUrl, refresh_url: refreshUrl },
        tenantSlug,
      );
      if (res.data?.onboarding_url) {
        if (res.data.account_id) {
          setStripeAccountId(res.data.account_id);
        }
        window.location.assign(res.data.onboarding_url);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to generate Stripe onboarding link";
      toast.error(msg);
    } finally {
      setIsCreatingStripeOnboarding(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadTenant() {
      try {
        setIsLoading(true);
        const res = await getTenantBySlug(tenantSlug);
        if (res.data && isMounted) {
          const t = res.data;
          setTenantData(t);
          setStoreName(t.name || "");
          setStoreEmail(t.store_email || user?.email || "");
          setStorePhone(t.store_phone || "");
          setStoreAddress(t.store_address || "");
          setPickupLocationName(
            t.pickup_location_name ||
              t.branding_config?.pickupLocationName ||
              `${t.name || "Store"} Studio`,
          );
          setPickupAddress(
            t.pickup_address ||
              t.branding_config?.pickupAddress ||
              "742 Designer Row, New York, NY 10011",
          );
          setPickupHours(
            t.pickup_hours ||
              t.branding_config?.pickupHours ||
              "Tuesday–Saturday, 10:00 – 18:00",
          );
          setPickupInstruction(
            t.pickup_instruction ||
              t.branding_config?.pickupInstruction ||
              "Pickup available Tuesday–Saturday at our studio. Select your time slot on the checkout page.",
          );
          setDeliveryFee(
            String(t.delivery_fee ?? t.branding_config?.deliveryFee ?? 45),
          );
          setDeliveryInstruction(
            t.delivery_instruction ||
              t.branding_config?.deliveryInstruction ||
              "White-Glove climate-controlled delivery is locked for the Tri-State area. Assembly included.",
          );
          const activeSubCode =
            t.paystack_subaccount_code || user?.paystack_subaccount_code || "";
          setPaystackSubaccountCode(activeSubCode);
          setStripeAccountId(
            t.stripe_account_id || user?.stripe_account_id || "",
          );

          const storedBank =
            (t.branding_config?.settlementBank as string | undefined) ||
            ((user?.tenant_branding as Record<string, unknown> | undefined)
              ?.settlementBank as string | undefined) ||
            "";
          const storedAccount =
            (t.branding_config?.settlementAccount as string | undefined) ||
            ((user?.tenant_branding as Record<string, unknown> | undefined)
              ?.settlementAccount as string | undefined) ||
            "";
          const storedAccountName =
            (t.branding_config?.settlementAccountName as string | undefined) ||
            ((user?.tenant_branding as Record<string, unknown> | undefined)
              ?.settlementAccountName as string | undefined) ||
            "";

          if (storedBank) setSelectedBank(storedBank);
          if (storedAccount) setAccountNumber(storedAccount);
          if (storedAccountName) {
            setResolvedAccountName(storedAccountName);
            lastVerifiedRef.current = {
              bank: storedBank,
              account: storedAccount,
              name: storedAccountName,
            };
          }

          if (t.paystack_subaccount_code || t.stripe_account_id) {
            updateUser({
              paystack_subaccount_code: t.paystack_subaccount_code || undefined,
              stripe_account_id: t.stripe_account_id || undefined,
            });
          }
        }
      } catch {
        toast.error("Failed to load store settings");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadTenant();
    return () => {
      isMounted = false;
    };
  }, [
    tenantSlug,
    user?.email,
    user?.paystack_subaccount_code,
    user?.stripe_account_id,
    user?.tenant_branding,
    updateUser,
  ]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const parsedDeliveryFee = parseFloat(String(deliveryFee));
      const validDeliveryFee = isNaN(parsedDeliveryFee)
        ? 45
        : Math.max(0, parsedDeliveryFee);

      const payload = {
        name: storeName.trim() || undefined,
        store_email: storeEmail.trim() || null,
        store_phone: storePhone.trim() || null,
        store_address: storeAddress.trim() || null,
        pickup_location_name: pickupLocationName.trim() || null,
        pickup_address: pickupAddress.trim() || null,
        pickup_hours: pickupHours.trim() || null,
        pickup_instruction: pickupInstruction.trim() || null,
        delivery_fee: validDeliveryFee,
        delivery_instruction: deliveryInstruction.trim() || null,
        paystack_subaccount_code: paystackSubaccountCode.trim() || null,
        stripe_account_id: stripeAccountId.trim() || null,
        branding_config: {
          ...(tenantData?.branding_config || {}),
          pickupLocationName: pickupLocationName.trim() || undefined,
          pickupAddress: pickupAddress.trim() || undefined,
          pickupHours: pickupHours.trim() || undefined,
          pickupInstruction: pickupInstruction.trim() || undefined,
          deliveryFee: validDeliveryFee,
          deliveryInstruction: deliveryInstruction.trim() || undefined,
          settlementBank: selectedBank || undefined,
          settlementBankName:
            banks.find((b) => b.code === selectedBank)?.name ||
            tenantData?.branding_config?.settlementBankName ||
            undefined,
          settlementAccount: accountNumber.trim() || undefined,
          settlementAccountName:
            resolvedAccountName ||
            tenantData?.branding_config?.settlementAccountName ||
            undefined,
        },
      };

      const res = await updateTenantBySlug(tenantSlug, payload);

      if (res.data) {
        setTenantData(res.data);
        updateUser({
          paystack_subaccount_code: paystackSubaccountCode.trim() || null,
          stripe_account_id: stripeAccountId.trim() || null,
        });
      }
      toast.success(
        "Store details, delivery fee & fulfillment settings saved successfully!",
      );
    } catch {
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full text-foreground max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Store & Admin Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your business profile, checkout pickup parameters, and view
          or edit your personal administrator profile.
        </p>
      </div>

      <Tabs defaultValue="store" className="w-full flex flex-col gap-6">
        <TabsList className="bg-muted/60 p-1 border border-border h-10 w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger
            value="store"
            className="gap-2 text-xs font-semibold cursor-pointer"
          >
            <Store className="h-4 w-4" /> Store & Pickup Locations
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="gap-2 text-xs font-semibold cursor-pointer"
          >
            <UserIcon className="h-4 w-4" /> Admin Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="mt-0 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Store Information & Contact Details */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Store className="h-5 w-5 text-primary" />
                <h6 className="font-secondary font-bold text-foreground">
                  Business Profile & Contact Details
                </h6>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="storeName"
                    className="text-xs font-semibold text-foreground"
                  >
                    Storefront Name *
                  </Label>
                  <Input
                    id="storeName"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Cakes by Bode"
                    required
                    className="h-10 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="storeEmail"
                    className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                  >
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                    Contact & Order Email *
                  </Label>
                  <Input
                    id="storeEmail"
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    placeholder="hello@yourstore.com"
                    required
                    className="h-10 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="storePhone"
                    className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                    Contact Phone
                  </Label>
                  <Input
                    id="storePhone"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    className="h-10 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="storeSubdomain"
                    className="text-xs font-semibold text-foreground"
                  >
                    Subdomain Slug (Read-only)
                  </Label>
                  <Input
                    id="storeSubdomain"
                    value={tenantSlug}
                    readOnly
                    className="h-10 text-xs bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="storeAddress"
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                >
                  <Building className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                  Registered Business / Studio Address
                </Label>
                <Textarea
                  id="storeAddress"
                  rows={2}
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="e.g. 742 Designer Row, Suite 400, New York, NY 10011"
                  className="text-xs bg-background"
                />
              </div>
            </div>

            {/* 2. In-Store / Studio Pickup Configuration */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <div className="flex flex-col">
                  <h6 className="font-secondary font-bold text-foreground">
                    In-Store / Studio Pickup Parameters
                  </h6>
                  <p className="text-xs text-muted-foreground">
                    Displayed dynamically to customers during checkout when they
                    select Local Pickup.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="pickupLocationName"
                    className="text-xs font-semibold text-foreground"
                  >
                    Pickup Location Title
                  </Label>
                  <Input
                    id="pickupLocationName"
                    value={pickupLocationName}
                    onChange={(e) => setPickupLocationName(e.target.value)}
                    placeholder="e.g. Cakes by Bode Studio"
                    className="h-10 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="pickupAddress"
                    className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                  >
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                    Full Pickup Address
                  </Label>
                  <Input
                    id="pickupAddress"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="e.g. 742 Designer Row, New York, NY 10011"
                    className="h-10 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="pickupHours"
                    className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                    Operating Days & Collection Hours
                  </Label>
                  <Input
                    id="pickupHours"
                    value={pickupHours}
                    onChange={(e) => setPickupHours(e.target.value)}
                    placeholder="e.g. Tuesday–Saturday, 10:00 – 18:00"
                    className="h-10 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="pickupInstruction"
                      className="text-xs font-semibold text-foreground"
                    >
                      Cart & Checkout Pickup Notice
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Displayed to customers when Pickup is selected
                    </span>
                  </div>
                  <Textarea
                    id="pickupInstruction"
                    rows={2}
                    value={pickupInstruction}
                    onChange={(e) => setPickupInstruction(e.target.value)}
                    placeholder="e.g. Pickup available Tuesday–Saturday at our studio. Select your time slot on the checkout page."
                    className="text-xs bg-background"
                  />
                </div>
              </div>
            </div>

            {/* 3. Delivery & Shipping Parameters */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Truck className="h-5 w-5 text-indigo-500" />
                <div className="flex flex-col">
                  <h6 className="font-secondary font-bold text-foreground">
                    Delivery & Fulfillment Parameters
                  </h6>
                  <p className="text-xs text-muted-foreground">
                    Configure your standard delivery rate and custom
                    instructions presented in the Cart and Checkout.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="deliveryFee"
                      className="text-xs font-semibold text-foreground"
                    >
                      Standard Delivery Fee ({tenantData?.currency || "NGN"}) *
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Set 0 for free delivery
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      {getCurrencySymbol(tenantData?.currency || "NGN")}
                    </span>
                    <Input
                      id="deliveryFee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      placeholder="45.00"
                      required
                      className="h-10 text-xs bg-background pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="deliveryInstruction"
                      className="text-xs font-semibold text-foreground"
                    >
                      Cart & Checkout Delivery Notice
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Displayed to customers when Delivery is selected
                    </span>
                  </div>
                  <Textarea
                    id="deliveryInstruction"
                    rows={2}
                    value={deliveryInstruction}
                    onChange={(e) => setDeliveryInstruction(e.target.value)}
                    placeholder="e.g. White-Glove climate-controlled delivery is locked for the Tri-State area. Assembly included."
                    className="text-xs bg-background"
                  />
                </div>
              </div>
            </div>

            {/* 4. Automated Merchant Settlement Account */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="h-5 w-5 text-indigo-500" />
                  <div className="flex flex-col">
                    <h6 className="font-secondary font-bold text-foreground">
                      Automated Merchant Settlement & Payouts
                    </h6>
                    <p className="text-xs text-muted-foreground">
                      Direct automated payouts to your bank account with zero
                      manual dashboard setup.
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold self-start sm:self-auto">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Split Payouts: 97.5% Net</span>
                </div>
              </div>

              {/* Paystack Automated Bank Settlement */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-12 w-24">
                      <Image
                        src="/logos/paystack.png"
                        alt="Paystack"
                        fill
                        unoptimized
                        className="object-contain object-left"
                      />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Direct Bank Settlement (NGN)
                    </span>
                  </div>
                  <span className="text-muted-foreground font-medium text-xs">
                    Fees charged to subaccount (1.5% + ₦100)
                  </span>
                </div>

                {paystackSubaccountCode && !showManualPaystack ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="font-bold text-primary">
                          Active Linked Subaccount
                        </span>
                        <div className="bg-background/80 px-2 py-0.5 rounded font-bold text-foreground">
                          <p>{paystackSubaccountCode}</p>
                        </div>
                      </div>
                      <p className="text-primary">
                        Customer payments are automatically routed to your
                        verified bank account
                        {selectedBank ||
                        tenantData?.branding_config?.settlementBank
                          ? ` (${banks.find((b) => b.code === selectedBank)?.name || tenantData?.branding_config?.settlementBankName || "Bank"}${accountNumber ? ` ••••${accountNumber.slice(-4)}` : ""}${resolvedAccountName || tenantData?.branding_config?.settlementAccountName ? ` • ${resolvedAccountName || tenantData?.branding_config?.settlementAccountName}` : ""})`
                          : ""}
                        .
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowManualPaystack(true)}
                      className="h-8 cursor-pointer shrink-0"
                    >
                      Change Account / Edit Code
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    <p className="text-muted-foreground">
                      Select your bank and enter your 10-digit NUBAN account
                      number. We will verify your account name in real time and
                      automatically create your Paystack subaccount.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bank Selector */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Settlement Bank *
                        </Label>
                        <Select
                          value={selectedBank}
                          onValueChange={(val) => setSelectedBank(val)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your Nigerian bank" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {banks.map((b) => (
                              <SelectItem key={b.code} value={b.code}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Account Number */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-foreground">
                            10-Digit Account Number *
                          </Label>
                          {isResolvingAccount && (
                            <span className="text-xs text-primary flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />{" "}
                              Verifying...
                            </span>
                          )}
                        </div>
                        <Input
                          type="text"
                          maxLength={10}
                          value={accountNumber}
                          onChange={(e) =>
                            setAccountNumber(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="0123456789"
                        />
                      </div>
                    </div>

                    {/* Verified Account Name Badge */}
                    {resolvedAccountName && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <div className="text-xs">
                          <span className="font-medium text-muted-foreground">
                            Account Holder:{" "}
                          </span>
                          <span className="font-bold tracking-wide">
                            {resolvedAccountName}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          disabled={
                            !selectedBank ||
                            accountNumber.trim().length !== 10 ||
                            !resolvedAccountName ||
                            isCreatingSubaccount
                          }
                          onClick={handleAutoCreatePaystackSubaccount}
                        >
                          {isCreatingSubaccount ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Linking Bank & Creating Subaccount...
                            </>
                          ) : (
                            <>Link Bank & Activate Automated Payouts</>
                          )}
                        </Button>
                        {paystackSubaccountCode && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowManualPaystack(false)}
                            className="cursor-pointer"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setShowManualPaystack(!showManualPaystack)
                        }
                        className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors text-left sm:text-right cursor-pointer"
                      >
                        {showManualPaystack
                          ? "Hide manual code entry"
                          : "Or enter existing ACCT_xxxx code manually"}
                      </button>
                    </div>

                    {showManualPaystack && (
                      <div className="pt-3 border-t border-border/60 space-y-2">
                        <Label className="text-xs font-semibold text-foreground">
                          Manual Paystack Subaccount Code
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={paystackSubaccountCode}
                            onChange={(e) =>
                              setPaystackSubaccountCode(e.target.value)
                            }
                            placeholder="ACCT_xxxxxxxxxxxxxxx"
                          />
                          {paystackSubaccountCode && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowManualPaystack(false)}
                              className="text-xs h-10 cursor-pointer"
                            >
                              Done
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stripe Connect Express Automated Onboarding (Temporarily hidden for Nigerian accounts) */}
              {false && (
                <div className="rounded-xl border border-border/80 bg-background/50 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-8 w-12">
                        <Image
                          src="/logos/stripe.png"
                          alt="Stripe"
                          fill
                          unoptimized
                          className="object-contain object-left"
                        />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        Connect Express (USD / EUR / GBP / Global)
                      </span>
                    </div>
                    <span className="text-muted-foreground font-medium text-xs">
                      Direct Charge (2.9% + 30¢ billed to merchant)
                    </span>
                  </div>

                  {stripeAccountId && !showManualStripe ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-indigo-600" />
                          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                            Active Stripe Connected Account
                          </span>
                          <code className="text-[11px] bg-background/80 px-2 py-0.5 rounded font-bold text-foreground">
                            {stripeAccountId}
                          </code>
                        </div>
                        <p className="text-[11px] text-indigo-800/80 dark:text-indigo-400">
                          Direct Charge active: Customer payments settle
                          directly to your Stripe account.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleStartStripeOnboarding}
                          disabled={isCreatingStripeOnboarding}
                          className="text-xs h-8 cursor-pointer gap-1"
                        >
                          {isCreatingStripeOnboarding ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ExternalLink className="h-3 w-3" />
                          )}
                          Stripe Dashboard
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowManualStripe(true)}
                          className="text-xs h-8 cursor-pointer"
                        >
                          Edit ID
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Complete express onboarding with Stripe to accept
                        payments in USD, EUR, and GBP. Stripe will verify your
                        identity and bank details securely.
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <Button
                          type="button"
                          onClick={handleStartStripeOnboarding}
                          disabled={isCreatingStripeOnboarding}
                        >
                          {isCreatingStripeOnboarding ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Connecting to Stripe Express...
                            </>
                          ) : (
                            <>Connect with Stripe Express</>
                          )}
                        </Button>

                        <button
                          type="button"
                          onClick={() => setShowManualStripe(!showManualStripe)}
                          className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors text-left sm:text-right"
                        >
                          {showManualStripe
                            ? "Hide manual entry"
                            : "Or enter existing Stripe acct_xxxx ID"}
                        </button>
                      </div>

                      {showManualStripe && (
                        <div className="pt-3 border-t border-border/60 space-y-2">
                          <Label className="text-xs font-semibold text-foreground">
                            Manual Stripe Connected Account ID
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              value={stripeAccountId}
                              onChange={(e) =>
                                setStripeAccountId(e.target.value)
                              }
                              placeholder="acct_xxxxxxxxxxxxxxx"
                            />
                            {stripeAccountId && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowManualStripe(false)}
                              >
                                Done
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Operational Currency */}
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <Label className="text-xs font-semibold text-foreground">
                  Operational Currency
                </Label>
                <Input
                  value={tenantData?.currency || "NGN"}
                  readOnly
                  className="bg-muted text-xs font-medium border-border text-foreground uppercase cursor-not-allowed max-w-xs"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving
                    Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Store Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="profile" className="mt-0">
          <UserProfileSettingsCard
            tenantSlug={tenantSlug}
            title="Tenant Administrator Profile"
            description="View and edit your personal profile information, avatar, phone number, and gender."
            roleBadgeText="Tenant Admin"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
