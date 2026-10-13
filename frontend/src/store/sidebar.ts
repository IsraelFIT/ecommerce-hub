import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  PanelsTopLeft,
  Package,
  SlidersHorizontal,
  ShoppingBag,
  Sparkles,
  Layers,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface StoreNavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  hrefSegment: string; // e.g. "/admin", "/products", "/orders"
  title: string;
  subtitle: string;
  detailTitle?: string;
  detailSubtitle?: string;
}

export const STORE_NAV_ITEMS: StoreNavItem[] = [
  {
    id: "admin",
    label: "Store Overview",
    shortLabel: "Overview",
    icon: PanelsTopLeft,
    hrefSegment: "/admin",
    title: "Store Overview",
    subtitle:
      "Real-time revenue, product inventory status, order volume, and store health",
  },
  {
    id: "products",
    label: "Products & Catalog",
    shortLabel: "Products",
    icon: Package,
    hrefSegment: "/products",
    title: "Products & Catalog",
    subtitle:
      "Manage merchandise inventory, stock counts, pricing, and multi-currency catalog",
    detailTitle: "Product Details",
    detailSubtitle:
      "Update product title, description, SKU, pricing, and media assets",
  },
  {
    id: "category-filters",
    label: "Categories & Filters",
    shortLabel: "Categories",
    icon: SlidersHorizontal,
    hrefSegment: "/category-filters",
    title: "Categories & Product Filters",
    subtitle:
      "Manage departmental product categories and custom storefront filter groups",
  },
  {
    id: "orders",
    label: "Orders & Sales",
    shortLabel: "Orders",
    icon: ShoppingBag,
    hrefSegment: "/orders",
    title: "Orders & Sales",
    subtitle:
      "Customer checkouts, payment settlement statuses, fulfillment, and payouts",
    detailTitle: "Order Details",
    detailSubtitle:
      "Audit customer transaction, items purchased, and shipping status",
  },
  {
    id: "reviews",
    label: "Reviews & Ratings",
    shortLabel: "Reviews",
    icon: Star,
    hrefSegment: "/reviews",
    title: "Customer Reviews & Ratings",
    subtitle:
      "Moderate customer product reviews, ratings, and customer feedback",
  },
  {
    id: "users",
    label: "Users & Customers",
    shortLabel: "Users",
    icon: Users,
    hrefSegment: "/users",
    title: "Users & Registered Customers",
    subtitle: "Manage staff accounts and view registered store customers",
  },
  {
    id: "branding",
    label: "Storefront & Domain",
    shortLabel: "Branding",
    icon: Sparkles,
    hrefSegment: "/branding",
    title: "Storefront & Branding",
    subtitle:
      "Customize brand identity, accent colors, logo assets, and custom domain DNS",
  },
  {
    id: "adapters",
    label: "Data Layer Adapters",
    shortLabel: "Adapters",
    icon: Layers,
    hrefSegment: "/adapters",
    title: "Data Layer Adapters",
    subtitle:
      "Active Neon PostgreSQL branch & Sanity CMS content synchronization",
  },
];

export interface PageInfo {
  title: string;
  subtitle: string;
}

export const DEFAULT_STORE_PAGE_INFO: PageInfo = {
  title: "Store Admin Portal",
  subtitle: "Manage storefront operations, catalog, and payment settings",
};

export function getStoreAdminPageInfo(
  pathname: string,
  tenantSlug: string,
): PageInfo {
  // Normalize path by stripping tenant prefix if present (e.g. /sasha-clothing/products -> /products)
  let cleanPath = pathname;
  if (
    tenantSlug &&
    (cleanPath === `/${tenantSlug}` || cleanPath.startsWith(`/${tenantSlug}/`))
  ) {
    cleanPath = cleanPath.slice(`/${tenantSlug}`.length) || "/";
  }

  if (
    cleanPath === "/" ||
    cleanPath === "/admin" ||
    cleanPath === "/dashboard"
  ) {
    const item = STORE_NAV_ITEMS.find((n) => n.id === "admin");
    return {
      title: item?.title || "Store Overview",
      subtitle:
        item?.subtitle ||
        "Real-time revenue, product inventory status, and store health",
    };
  }

  for (const item of STORE_NAV_ITEMS) {
    if (cleanPath === item.hrefSegment) {
      return { title: item.title, subtitle: item.subtitle };
    }
    if (cleanPath.startsWith(`${item.hrefSegment}/`)) {
      if (item.detailTitle && item.detailSubtitle) {
        return { title: item.detailTitle, subtitle: item.detailSubtitle };
      }
      return { title: item.title, subtitle: item.subtitle };
    }
  }

  return DEFAULT_STORE_PAGE_INFO;
}

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  isExpanded: boolean;
  isMobileOpen: boolean;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleExpand: () => void;
  setExpanded: (expanded: boolean) => void;
  toggleMobile: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: false,
      isCollapsed: false,
      isExpanded: false,
      isMobileOpen: false,
      toggleOpen: () =>
        set((state) => ({
          isOpen: !state.isOpen,
          isMobileOpen: !state.isMobileOpen,
        })),
      setOpen: (isOpen) => set({ isOpen, isMobileOpen: isOpen }),
      toggleCollapsed: () =>
        set((state) => ({
          isCollapsed: !state.isCollapsed,
          isExpanded: state.isCollapsed, // if was collapsed, now expanded
        })),
      setCollapsed: (isCollapsed) =>
        set({ isCollapsed, isExpanded: !isCollapsed }),
      toggleExpand: () =>
        set((state) => ({
          isExpanded: !state.isExpanded,
          isCollapsed: state.isExpanded,
        })),
      setExpanded: (expanded) =>
        set({ isExpanded: expanded, isCollapsed: !expanded }),
      toggleMobile: () =>
        set((state) => ({
          isMobileOpen: !state.isMobileOpen,
          isOpen: !state.isOpen,
        })),
      setMobileOpen: (open) => set({ isMobileOpen: open, isOpen: open }),
    }),
    {
      name: "tenant-sidebar-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isExpanded: state.isExpanded,
        isCollapsed: state.isCollapsed,
      }),
    },
  ),
);

export default useSidebarStore;
