"use client";

import { useParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useStoreInvalidPaths } from "@/hooks/invalid-paths";

export function StoreFooter() {
  const isInvalid = useStoreInvalidPaths();
  const params = useParams();
  const tenant = (params?.tenant as string) || "store";

  const formattedStoreName = tenant
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  if (isInvalid) return null;

  return (
    <footer className="mt-auto border-t border-border bg-card py-8 text-xs text-muted-foreground">
      <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Encrypted Checkout via Paystack & Stripe Subaccounts</span>
        </div>
        <p>
          © {new Date().getFullYear()} {formattedStoreName}. Powered by{" "}
          <span className="font-semibold text-foreground">EcommerceHub</span>{" "}
          Multi-Tenant Engine.
        </p>
      </div>
    </footer>
  );
}
