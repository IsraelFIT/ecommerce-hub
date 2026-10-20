"use client";

import { useEffect, type ReactNode } from "react";
import useUserStore from "@/store/user";
import { useCartStore } from "@/store/cart";

export function SessionSyncWrapper({
  children,
  tenantSlug,
}: {
  children: ReactNode;
  tenantSlug?: string;
}) {
  const syncSession = useUserStore((state) => state.syncSession);
  const loadUserCart = useCartStore((state) => state.loadUserCart);

  useEffect(() => {
    let isMounted = true;
    syncSession().then((user) => {
      if (user && isMounted) {
        // Hydrate persisted user cart from backend database
        loadUserCart(tenantSlug || user.tenant_slug || "general", false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [syncSession, loadUserCart, tenantSlug]);

  return <>{children}</>;
}

export default SessionSyncWrapper;
