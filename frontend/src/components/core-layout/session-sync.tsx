"use client";

import { useEffect, type ReactNode } from "react";
import useUserStore from "@/store/user";

export function SessionSyncWrapper({ children }: { children: ReactNode }) {
  const syncSession = useUserStore((state) => state.syncSession);

  useEffect(() => {
    syncSession();
  }, [syncSession]);

  return <>{children}</>;
}

export default SessionSyncWrapper;
