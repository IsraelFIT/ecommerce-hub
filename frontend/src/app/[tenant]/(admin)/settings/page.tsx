"use client";

import { use, useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserProfileSettingsCard } from "@/components/shared/user-profile-settings-card";
import { useUserStore } from "@/store/user";
import { apiRequest } from "@/lib/api/client";
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
  const { user } = useUserStore();

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

  useEffect(() => {
    let isMounted = true;
    async function loadTenant() {
      try {
        setIsLoading(true);
        const res = await apiRequest<Tenant>(`/tenants/by-slug/${tenantSlug}`);
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
  }, [tenantSlug, user?.email]);

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
        branding_config: {
          ...(tenantData?.branding_config || {}),
          pickupLocationName: pickupLocationName.trim() || undefined,
          pickupAddress: pickupAddress.trim() || undefined,
          pickupHours: pickupHours.trim() || undefined,
          pickupInstruction: pickupInstruction.trim() || undefined,
          deliveryFee: validDeliveryFee,
          deliveryInstruction: deliveryInstruction.trim() || undefined,
        },
      };

      const res = await apiRequest<Tenant>(`/tenants/by-slug/${tenantSlug}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (res.data) {
        setTenantData(res.data);
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
                <h3 className="text-base font-bold text-foreground">
                  Business Profile & Contact Details
                </h3>
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
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    In-Store / Studio Pickup Parameters
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
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
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Delivery & Fulfillment Parameters
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
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

            {/* 4. Merchant Settlement Account */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <CreditCard className="h-5 w-5 text-indigo-500" />
                <h3 className="text-base font-bold text-foreground">
                  Merchant Settlement Account
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Bank and payout destination for automated multi-tenant split
                deposits (Platform fee: 2.5%, Net: 97.5%).
              </p>

              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Connected Payout Method
                  </Label>
                  <Input
                    value={
                      tenantData?.stripe_account_id
                        ? `Stripe Connected (${tenantData.stripe_account_id})`
                        : tenantData?.paystack_subaccount_code
                          ? `Paystack Subaccount (${tenantData.paystack_subaccount_code})`
                          : "Stripe Direct Deposit •••• 4242"
                    }
                    readOnly
                    className="bg-muted text-xs font-medium border-border text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Operational Currency
                  </Label>
                  <Input
                    value={tenantData?.currency || "NGN"}
                    readOnly
                    className="bg-muted text-xs font-medium border-border text-foreground uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 h-10 text-xs font-semibold cursor-pointer shadow-sm"
              >
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
