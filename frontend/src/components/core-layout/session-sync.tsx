"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import useUserStore from "@/store/user";
import { useCartStore } from "@/store/cart";

import { getTenantSubdomainUrl } from "@/utils/helper";

export function SessionSyncWrapper({
  children,
  tenantSlug,
}: {
  children: ReactNode;
  tenantSlug?: string;
}) {
  const router = useRouter();
  const syncSession = useUserStore((state) => state.syncSession);
  const loadUserCart = useCartStore((state) => state.loadUserCart);

  useEffect(() => {
    let isMounted = true;
    syncSession().then((user) => {
      if (user && isMounted) {
        // Core Platform Protection: ONLY super_admin and hub_admin may view core console
        const isCoreAdmin =
          user.role === "super_admin" || user.role === "hub_admin";
        if (!isCoreAdmin) {
          if (user.tenant_slug && user.tenant_slug !== "core") {
            window.location.assign(
              getTenantSubdomainUrl(user.tenant_slug, "/admin"),
            );
          } else {
            router.push("/dashboard");
          }
          return;
        }

        // Hydrate persisted user cart from backend database
        loadUserCart(tenantSlug || user.tenant_slug || "general", false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [syncSession, loadUserCart, tenantSlug, router]);

  return <>{children}</>;
}

export default SessionSyncWrapper;
