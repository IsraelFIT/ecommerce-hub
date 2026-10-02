"use client";

import { use } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/store/user";

interface SettingsPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function TenantSettingsPage({ params }: SettingsPageProps) {
  use(params);
  const { user } = useUserStore();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full">
      <div className="max-w-2xl space-y-5">
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900">
            Merchant Settlement Account
          </h3>
          <p className="text-xs text-stone-500">
            Bank and payout destination for automatic 97.5% split deposits.
          </p>

          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">
                Connected Payout Method
              </Label>
              <Input
                value="Stripe Direct Deposit •••• 4242"
                readOnly
                className="bg-stone-50 text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">
                Notification Email for Orders
              </Label>
              <Input
                defaultValue={user?.email || "owner@yourstore.com"}
                className="text-xs h-9"
              />
            </div>

            <Button
              size="md"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
              onClick={() => toast.success("Settings updated successfully!")}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
