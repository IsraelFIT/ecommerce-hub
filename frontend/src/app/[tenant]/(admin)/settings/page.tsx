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
    <div className="space-y-6 w-full text-foreground">
      <div className="max-w-2xl space-y-5">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-foreground">
            Merchant Settlement Account
          </h3>
          <p className="text-xs text-muted-foreground">
            Bank and payout destination for automatic 97.5% split deposits.
          </p>

          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Connected Payout Method
              </Label>
              <Input
                value="Stripe Direct Deposit •••• 4242"
                readOnly
                className="bg-muted text-xs font-medium border-border text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Notification Email for Orders
              </Label>
              <Input
                defaultValue={user?.email || "owner@yourstore.com"}
                className="text-xs h-9 bg-background border-border text-foreground"
              />
            </div>

            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs cursor-pointer shadow-xs"
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
