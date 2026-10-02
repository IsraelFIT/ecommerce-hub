"use client";

import { useEffect, type ReactNode } from "react";
import useUserStore from "@/store/user";

export function SessionSyncWrapper({ children }: { children: ReactNode }) {
  const { user, setUser } = useUserStore();

  useEffect(() => {
    // If no user is populated in client store, establish default super admin session details
    if (!user) {
      setUser({
        id: "super-admin-root",
        email: "israelfolaranmi01@gmail.com",
        name: "Israel Folaranmi",
        first_name: "Israel",
        last_name: "Folaranmi",
        full_name: "Israel Folaranmi",
        role: "super_admin",
      });
    }
  }, [user, setUser]);

  return <>{children}</>;
}

export default SessionSyncWrapper;
