"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Save, Percent, Globe, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserProfileSettingsCard } from "@/components/shared/user-profile-settings-card";
import { toast } from "sonner";
import { PaymentGatewayLogo } from "@/components/shared/payment-gateway-logo";

export default function CoreSettingsPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || "core";

  const [platformFee, setPlatformFee] = useState("2.5");
  const [platformName, setPlatformName] = useState("EcommerceHub");
  const [rootDomain, setRootDomain] = useState("ecommerce-hub.com");
  const [defaultGateway, setDefaultGateway] = useState("paystack");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Platform master settings saved successfully!");
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-8 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-secondary text-foreground">
            Platform Master Settings & Admin Profile
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure global fee percentages, default payment gateway routing,
            and view or edit your super administrator profile.
          </p>
        </div>
      </div>

      <Tabs defaultValue="platform" className="w-full flex flex-col gap-6">
        <TabsList className="bg-muted/60 p-1 border border-border h-10 w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger
            value="platform"
            className="gap-2 text-xs font-semibold cursor-pointer"
          >
            <Globe className="size-3.5" /> Platform & Settlement
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="gap-2 text-xs font-semibold cursor-pointer"
          >
            <UserIcon className="size-3.5" /> Super Admin Profile
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Platform & Policy Configuration */}
        <TabsContent value="platform" className="space-y-6 mt-0">
          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs"
          >
            {/* Platform Identity */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border text-foreground font-bold font-secondary text-sm">
                <Globe className="size-4 text-primary" />
                <span>Platform Identity & Domains</span>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Platform Brand Name
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Root Domain Base
                </label>
                <input
                  type="text"
                  value={rootDomain}
                  onChange={(e) => setRootDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground  focus:outline-none focus:border-primary"
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Used for multi-tenant subdomains: *.ecommerce-hub.com and
                  core.ecommerce-hub.com
                </span>
              </div>
            </div>

            {/* Payment Split Settings */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border text-foreground font-bold font-secondary text-sm">
                <Percent className="size-4 text-emerald-500" />
                <span>Take-Rate & Payment Split Policy</span>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Platform Fee Percentage (%)
                </label>
                <div className="flex items-center rounded-lg border border-border bg-background overflow-hidden">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(e.target.value)}
                    className="flex-1 px-3 py-2 bg-transparent text-foreground focus:outline-none"
                  />
                  <span className="px-3 py-2 bg-muted/50 text-muted-foreground font-bold text-xs border-l border-border">
                    %
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Deducted automatically on checkout prior to subaccount
                  settlement.
                </span>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Default Payment Gateway
                </label>
                <select
                  value={defaultGateway}
                  onChange={(e) => setDefaultGateway(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="paystack">
                    Paystack (Subaccounts & Split Payments)
                  </option>
                  <option value="stripe">
                    Stripe Connect (Express & Custom Splits)
                  </option>
                </select>
                <div className="mt-2.5 flex items-center gap-2 p-2 bg-card border border-border rounded-lg">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Active Gateway:
                  </span>
                  <PaymentGatewayLogo
                    gateway={defaultGateway}
                    imgClassName="h-9"
                  />
                </div>
              </div>
            </div>
          </form>

          <div className="flex justify-end">
            <Button
              size="md"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1.5 h-8 text-xs cursor-pointer"
            >
              <Save className="size-3.5" />
              <span>{isSaving ? "Saving..." : "Save Configuration"}</span>
            </Button>
          </div>
        </TabsContent>

        {/* Tab 2: Super Admin Profile */}
        <TabsContent value="profile" className="mt-0">
          <UserProfileSettingsCard
            tenantSlug={tenantSlug}
            title="Super Administrator Profile"
            description="View and edit your personal super admin credentials, avatar photo, phone number, and gender."
            roleBadgeText="Super Admin"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
