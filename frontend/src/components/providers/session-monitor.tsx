"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  getSessionTokenClient,
  getJwtExpirationMs,
  createSession,
  deleteSession,
  ACCESS_TOKEN_MAX_AGE,
} from "@/lib/session";
import { clearAuthSession, getRefreshToken } from "@/lib/auth";
import { refreshToken as apiRefreshToken } from "@/lib/api/auth";
import {
  setupActivityListeners,
  isUserRecentlyActive,
} from "@/lib/activity-tracker";
import useUserStore from "@/store/user";

// Refresh 5 minutes before expiration
const PRE_EXPIRY_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes (300,000 ms)

// Periodic evaluation interval
const HEARTBEAT_INTERVAL_MS = 15 * 1000; // 15 seconds

export function SessionMonitor() {
  const router = useRouter();
  const currentPathname = usePathname();
  const isRefreshingRef = useRef<boolean>(false);
  const isLoggingOutRef = useRef<boolean>(false);
  const lastRefreshedExpRef = useRef<number | null>(null);

  useEffect(() => {
    // 1. Start global user interaction listeners
    const cleanupListeners = setupActivityListeners();

    // 2. Core evaluation routine
    const evaluateSession = async () => {
      // Don't evaluate if currently refreshing or logging out
      if (isRefreshingRef.current || isLoggingOutRef.current) return;

      const token = getSessionTokenClient();
      const refreshTokenValue = getRefreshToken();
      if (!token && !refreshTokenValue) return; // Unauthenticated guest

      const expMs = getJwtExpirationMs(token);
      const now = Date.now();
      const remainingMs = expMs ? expMs - now : 0;

      // Case A: Access token has completely expired or is missing
      if (remainingMs <= 0 || !token) {
        if (refreshTokenValue && isUserRecentlyActive(12 * 60 * 60 * 1000)) {
          console.log(
            "🔄 Access token expired. Attempting automatic token refresh...",
          );
          isRefreshingRef.current = true;
          try {
            const res = await apiRefreshToken({
              refresh_token: refreshTokenValue,
            });

            if (res.status === "success" && res.data) {
              const authData = res.data;
              const newAccessToken =
                authData.auth?.access_token ||
                (authData as unknown as { access_token?: string }).access_token;
              const newRefreshToken =
                authData.auth?.refresh_token ||
                (authData as unknown as { refresh_token?: string })
                  .refresh_token ||
                refreshTokenValue;

              if (newAccessToken) {
                await createSession(
                  newAccessToken,
                  newRefreshToken,
                  authData.role,
                  ACCESS_TOKEN_MAX_AGE,
                );

                const newExpMs = getJwtExpirationMs(newAccessToken);
                lastRefreshedExpRef.current = newExpMs;

                console.log(
                  "✅ Token refreshed successfully, session continued.",
                );
                return;
              }
            }
          } catch (err) {
            console.error("❌ SessionMonitor refresh failed:", err);
          } finally {
            isRefreshingRef.current = false;
          }
        }

        // Only log out if refresh token is missing or refresh failed
        console.warn(
          "🔒 Session has expired. Logging out due to inactivity...",
        );
        isLoggingOutRef.current = true;
        try {
          await deleteSession();
          clearAuthSession();
          useUserStore.getState().clearUser();
          toast.error("Your session has expired. Please log in again.", {
            id: "session-expired-inactivity",
          });
          // Redirect to login page if on protected/admin routes
          const pathname = currentPathname || window.location.pathname;
          if (
            pathname.includes("/admin") ||
            pathname.includes("/dashboard") ||
            pathname.includes("/core") ||
            pathname.includes("/settings") ||
            pathname.includes("/products") ||
            pathname.includes("/orders") ||
            pathname.includes("/category-filters")
          ) {
            router.replace(
              `/login?reason=inactivity&redirect=${encodeURIComponent(pathname)}`,
            );
          }
        } catch (err) {
          console.error("Error during inactivity logout:", err);
        }
        return;
      }

      // Case B: Access token is within 5 minutes of expiry
      if (remainingMs <= PRE_EXPIRY_REFRESH_BUFFER_MS) {
        // Prevent duplicate refresh for the exact same token expiration
        if (lastRefreshedExpRef.current === expMs) return;

        // Check if user has demonstrated frontend activity
        const userActive = isUserRecentlyActive(30 * 60 * 1000);

        if (userActive && refreshTokenValue) {
          console.log(
            `🔄 Proactively refreshing access token (${Math.round(remainingMs / 1000)}s remaining, user active)...`,
          );
          isRefreshingRef.current = true;

          try {
            const res = await apiRefreshToken({
              refresh_token: refreshTokenValue,
            });

            if (res.status === "success" && res.data) {
              const authData = res.data;
              const newAccessToken =
                authData.auth?.access_token ||
                (authData as unknown as { access_token?: string }).access_token;
              const newRefreshToken =
                authData.auth?.refresh_token ||
                (authData as unknown as { refresh_token?: string })
                  .refresh_token ||
                refreshTokenValue;

              if (newAccessToken) {
                await createSession(
                  newAccessToken,
                  newRefreshToken,
                  authData.role,
                  ACCESS_TOKEN_MAX_AGE,
                );

                const newExpMs = getJwtExpirationMs(newAccessToken);
                lastRefreshedExpRef.current = newExpMs;

                console.log(
                  "✅ Access token proactively refreshed! New expiry in 30 minutes.",
                );
              }
            }
          } catch (err) {
            console.error("❌ Failed proactive token refresh:", err);
          } finally {
            isRefreshingRef.current = false;
          }
        }
      }
    };

    // 3. Set interval heartbeat check
    const intervalId = setInterval(evaluateSession, HEARTBEAT_INTERVAL_MS);

    // 4. Also evaluate immediately on visibility change or window focus (e.g. waking laptop)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        evaluateSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    // Initial check on mount
    evaluateSession();

    return () => {
      cleanupListeners();
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default SessionMonitor;
