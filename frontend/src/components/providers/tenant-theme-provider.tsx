"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { BrandingConfig, Tenant } from "@/types/users";
import { apiRequest } from "@/lib/api/client";
import { useUserStore } from "@/store/user";

export const DEFAULT_BRANDING: BrandingConfig = {
  primaryColor: "#5f34db",
  accentColor: "#ec4899",
  logoUrl: null,
  tagline: "Welcome to our store",
  storeHeadline: "Official Online Store",
  announcementText: "Free standard shipping on all domestic orders over $75 ✨",
  bannerUrl: null,
};

interface TenantThemeContextType {
  tenant: Tenant | null;
  branding: BrandingConfig;
  isLoading: boolean;
  applyBranding: (newBranding: Partial<BrandingConfig>) => void;
  refreshBranding: () => Promise<void>;
}

const TenantThemeContext = createContext<TenantThemeContextType>({
  tenant: null,
  branding: DEFAULT_BRANDING,
  isLoading: false,
  applyBranding: () => {},
  refreshBranding: async () => {},
});

/**
 * Injects CSS variables onto document.documentElement to dynamically recolor the UI.
 */
export function injectBrandCssVariables(branding: BrandingConfig) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const primary =
    branding.primaryColor || DEFAULT_BRANDING.primaryColor || "#059669";
  const accent =
    branding.accentColor || DEFAULT_BRANDING.accentColor || "#ec4899";

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--color-primary", primary);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--color-ring", primary);

  if (accent) {
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--color-accent", accent);
  }
}

interface TenantThemeProviderProps {
  tenantSlug: string;
  initialBranding?: BrandingConfig | null;
  initialTenant?: Tenant | null;
  children: ReactNode;
}

export function TenantThemeProvider({
  tenantSlug,
  initialBranding,
  initialTenant,
  children,
}: TenantThemeProviderProps) {
  const { user } = useUserStore();
  const [tenant, setTenant] = useState<Tenant | null>(initialTenant || null);
  const [branding, setBranding] = useState<BrandingConfig>(() => ({
    ...DEFAULT_BRANDING,
    ...(initialBranding || {}),
  }));
  const [isLoading, setIsLoading] = useState(false);

  const primaryColor =
    branding.primaryColor || DEFAULT_BRANDING.primaryColor || "#059669";
  const accentColor =
    branding.accentColor || DEFAULT_BRANDING.accentColor || "#ec4899";

  const applyBranding = useCallback(
    (newBranding: Partial<BrandingConfig>) => {
      setBranding((prev) => {
        const updated = { ...prev, ...newBranding };
        injectBrandCssVariables(updated);
        if (typeof window !== "undefined" && tenantSlug) {
          try {
            localStorage.setItem(
              `tenant_branding_${tenantSlug}`,
              JSON.stringify(updated),
            );
          } catch {
            // ignore
          }
        }
        return updated;
      });
    },
    [tenantSlug],
  );

  const refreshBranding = useCallback(async () => {
    if (!tenantSlug || tenantSlug === "core" || tenantSlug === "store") return;

    try {
      setIsLoading(true);
      const res = await apiRequest<Tenant>(`/tenants/by-slug/${tenantSlug}`);
      if (res.data) {
        setTenant(res.data);
        const resolvedBranding = {
          ...DEFAULT_BRANDING,
          ...(res.data.branding_config || {}),
        };
        setBranding(resolvedBranding);
        injectBrandCssVariables(resolvedBranding);

        if (typeof window !== "undefined") {
          localStorage.setItem(
            `tenant_branding_${tenantSlug}`,
            JSON.stringify(resolvedBranding),
          );
        }
      }
    } catch {
      // Fallback to user session branding if available
      if (user?.branding_config || user?.tenant_branding) {
        const fallback = {
          ...DEFAULT_BRANDING,
          ...(user.branding_config || user.tenant_branding || {}),
        };
        setBranding(fallback);
        injectBrandCssVariables(fallback);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug, user]);

  useEffect(() => {
    injectBrandCssVariables(branding);
  }, [branding]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshBranding();
  }, [refreshBranding]);

  return (
    <TenantThemeContext.Provider
      value={{
        tenant,
        branding,
        isLoading,
        applyBranding,
        refreshBranding,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `:root { --primary: ${primaryColor}; --color-primary: ${primaryColor}; --ring: ${primaryColor}; --color-ring: ${primaryColor}; ${
            accentColor
              ? `--accent: ${accentColor}; --color-accent: ${accentColor};`
              : ""
          }}`,
        }}
      />
      {children}
    </TenantThemeContext.Provider>
  );
}

export function useTenantTheme() {
  return useContext(TenantThemeContext);
}

export default TenantThemeProvider;
