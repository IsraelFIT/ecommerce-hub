import { create } from "zustand";
import {
  PanelsTopLeft,
  Store,
  WalletCards,
  CreditCard,
  Layers,
  Code2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface CoreNavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  href: string;
  title: string;
  subtitle: string;
  detailTitle?: string;
  detailSubtitle?: string;
}

export const CORE_NAV_ITEMS: CoreNavItem[] = [
  {
    id: "overview",
    label: "Platform & Escrow Overview",
    shortLabel: "Overview",
    icon: PanelsTopLeft,
    href: "/core",
    title: "Platform Overview",
    subtitle:
      "Real-time tenant health, fee splits, escrow balances, and ecosystem metrics",
  },
  {
    id: "tenants",
    label: "Tenants & Stores",
    shortLabel: "Tenants",
    icon: Store,
    href: "/core/tenants",
    title: "Tenants & Stores",
    subtitle:
      "Multi-tenant storefront directory, custom domains, and database isolation",
    detailTitle: "Tenant Details",
    detailSubtitle:
      "Manage store configuration, domain bindings, and adapter status",
  },
  {
    id: "revenue",
    label: "Revenue & Escrow",
    shortLabel: "Revenue",
    icon: WalletCards,
    href: "/core/revenue",
    title: "Revenue & Escrow",
    subtitle:
      "2.5% platform fee split earnings, Stripe & Paystack subaccount balances",
    detailTitle: "Transaction & Split Details",
    detailSubtitle: "Audit payment splits and platform fee distribution",
  },
  {
    id: "subscriptions",
    label: "Subscriptions & Billing",
    shortLabel: "Plans",
    icon: CreditCard,
    href: "/core/subscriptions",
    title: "Subscriptions & Billing",
    subtitle:
      "Tenant subscription plans, recurring MRR, and platform feature tiers",
  },
  {
    id: "adapters",
    label: "Data Layer Adapters",
    shortLabel: "Adapters",
    icon: Layers,
    href: "/core/adapters",
    title: "Data Layer Adapters",
    subtitle:
      "Neon Serverless Postgres branches & Sanity CMS interchangeable backends",
  },
  {
    id: "developers",
    label: "Developers & APIs",
    shortLabel: "Developers",
    icon: Code2,
    href: "/core/developers",
    title: "Developers & APIs",
    subtitle:
      "Master API keys, webhook endpoints, and Neon database connection strings",
  },
  {
    id: "security",
    label: "Security & Audit Logs",
    shortLabel: "Security",
    icon: ShieldCheck,
    href: "/core/security",
    title: "Security & Audit Logs",
    subtitle:
      "Super admin access logs, JWT session lifecycle, and compliance policies",
  },
];

export interface PageInfo {
  title: string;
  subtitle: string;
}

export const EXTRA_CORE_PAGE_INFO: Record<string, PageInfo> = {
  "/core/settings": {
    title: "Platform Settings",
    subtitle:
      "Global platform fee %, default payment routing, and master configuration",
  },
  "/settings": {
    title: "Platform Settings",
    subtitle:
      "Global platform fee %, default payment routing, and master configuration",
  },
};

export const DEFAULT_CORE_PAGE_INFO: PageInfo = {
  title: "Core Console",
  subtitle: "EcommerceHub Master Management & Multi-Tenant Infrastructure",
};

export function getCorePageInfo(pathname: string): PageInfo {
  // Normalize path if on subdomain without /core prefix
  const cleanPath = pathname.startsWith("/core")
    ? pathname
    : pathname === "/"
      ? "/core"
      : `/core${pathname}`;

  if (cleanPath === "/core" || cleanPath === "/core/dashboard") {
    const item = CORE_NAV_ITEMS.find((n) => n.id === "overview");
    return {
      title: item?.title || "Platform Overview",
      subtitle:
        item?.subtitle ||
        "Real-time tenant health, fee splits, and ecosystem metrics",
    };
  }

  for (const item of CORE_NAV_ITEMS) {
    if (cleanPath === item.href || pathname === item.href) {
      return { title: item.title, subtitle: item.subtitle };
    }
    if (
      cleanPath.startsWith(`${item.href}/`) ||
      pathname.startsWith(`${item.href}/`)
    ) {
      if (item.detailTitle && item.detailSubtitle) {
        return { title: item.detailTitle, subtitle: item.detailSubtitle };
      }
      return { title: item.title, subtitle: item.subtitle };
    }
  }

  for (const [route, info] of Object.entries(EXTRA_CORE_PAGE_INFO)) {
    if (
      cleanPath === route ||
      pathname === route ||
      cleanPath.startsWith(`${route}/`) ||
      pathname.startsWith(`${route}/`)
    ) {
      return info;
    }
  }

  return DEFAULT_CORE_PAGE_INFO;
}

interface CoreSidebarState {
  isExpanded: boolean;
  isMobileOpen: boolean;
  toggleExpand: () => void;
  setExpanded: (expanded: boolean) => void;
  toggleMobile: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useCoreSidebarStore = create<CoreSidebarState>((set) => ({
  isExpanded: false,
  isMobileOpen: false,
  toggleExpand: () => set((state) => ({ isExpanded: !state.isExpanded })),
  setExpanded: (expanded) => set({ isExpanded: expanded }),
  toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
}));

export default useCoreSidebarStore;
