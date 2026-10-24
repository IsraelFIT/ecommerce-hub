import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  fetchUserCart,
  syncUserCart,
  mergeUserCart,
  clearUserCart,
} from "@/lib/api/cart";
import { useUserStore } from "@/store/user";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  quantity: number;
  options?: Record<string, unknown>;
  stock_quantity?: number;
  track_inventory?: boolean;
  product_id?: string;
}

function matchOptions(
  a?: Record<string, unknown>,
  b?: Record<string, unknown>,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) {
    const nonNull = a || b;
    return Object.keys(nonNull || {}).length === 0;
  }
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}

function resolveOptions(
  arg?: Record<string, unknown> | string,
  secondArg?: string,
): Record<string, unknown> | undefined {
  if (typeof arg === "object" && arg !== null) return arg;
  if (typeof arg === "string" || typeof secondArg === "string") {
    const opts: Record<string, unknown> = {};
    if (arg) opts.size = arg;
    if (secondArg) opts.flavor = secondArg;
    return opts;
  }
  return undefined;
}

function getCurrentTenantSlug(fallback?: string): string {
  const reservedWords = [
    "general",
    "store",
    "none",
    "cart",
    "checkout",
    "menu",
    "orders",
    "profile",
    "login",
    "register",
    "signup",
    "forgot-password",
    "reset-password",
    "dashboard",
    "settings",
    "products",
    "about",
    "contact",
    "admin",
    "core",
    "api",
    "null",
    "undefined",
  ];

  // 1. If explicit valid slug was provided (not generic placeholders or reserved page names)
  if (fallback && !reservedWords.includes(fallback.toLowerCase())) {
    return fallback;
  }

  if (typeof window !== "undefined") {
    // 2. Check subdomain: e.g. jazz-cakes-ltd.localhost:3000 or jazz-cakes-ltd.ecommerce-hub.com
    const host = window.location.hostname.toLowerCase();
    const rootDomain = (
      process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ecommerce-hub.com"
    ).toLowerCase();

    if (host.endsWith(".localhost") && host !== "localhost") {
      const sub = host.replace(".localhost", "");
      if (sub && !["app", "core", "www", "api"].includes(sub)) {
        return sub;
      }
    } else if (
      host.endsWith(`.${rootDomain}`) &&
      host !== rootDomain &&
      !host.startsWith("www.") &&
      !host.startsWith("app.") &&
      !host.startsWith("core.")
    ) {
      const sub = host.replace(`.${rootDomain}`, "");
      if (sub) {
        return sub;
      }
    }

    // 3. Check path segments (e.g. localhost:3000/jazz-cakes-ltd/cart)
    const segments = window.location.pathname.split("/").filter(Boolean);
    if (
      segments.length > 0 &&
      !reservedWords.includes(segments[0].toLowerCase())
    ) {
      return segments[0];
    }

    // 4. Check user store if user is associated with a tenant
    try {
      const user = useUserStore.getState().user;
      if (user?.tenant_slug) {
        return user.tenant_slug;
      }
    } catch {
      // Ignore if user store not ready
    }

    // 5. Check document cookie: tenant_slug
    try {
      const cookieMatch = document.cookie.match(
        /(?:^|;\s*)tenant_slug=([^;]+)/,
      );
      if (cookieMatch && cookieMatch[1]) {
        const val = decodeURIComponent(cookieMatch[1]);
        if (!reservedWords.includes(val.toLowerCase())) {
          return val;
        }
      }
    } catch {
      // Ignore cookie parsing error
    }
  }

  return fallback || "general";
}

function isUserLoggedIn(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.cookie.includes("auth_session=") ||
    document.cookie.includes("auth_token=")
  );
}

// Debounce timer and pending state for background syncing
let syncTimeout: NodeJS.Timeout | null = null;
let pendingSyncSlug: string | null = null;
let pendingSyncItems: CartItem[] | null = null;

async function flushPendingSync(): Promise<void> {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  if (pendingSyncSlug && pendingSyncItems !== null) {
    const slug = pendingSyncSlug;
    const items = pendingSyncItems;
    pendingSyncSlug = null;
    pendingSyncItems = null;
    try {
      await syncUserCart(slug, items);
    } catch (err) {
      console.warn("Failed to flush cart sync:", err);
    }
  }
}

function scheduleBackendSync(
  tenantSlug: string,
  items: CartItem[],
  immediate = false,
) {
  if (!isUserLoggedIn()) return;

  pendingSyncSlug = tenantSlug;
  pendingSyncItems = items;

  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }

  if (immediate) {
    flushPendingSync();
    return;
  }

  syncTimeout = setTimeout(() => {
    flushPendingSync();
  }, 100);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (pendingSyncSlug && pendingSyncItems !== null) {
      syncUserCart(pendingSyncSlug, pendingSyncItems).catch(() => {});
      pendingSyncSlug = null;
      pendingSyncItems = null;
    }
  });
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  addToCart: (
    item: Omit<CartItem, "quantity"> & { size?: string; flavor?: string },
    quantity?: number,
    tenantSlug?: string,
  ) => void;
  removeFromCart: (
    id: string,
    optionsOrSize?: Record<string, unknown> | string,
    flavorOrTenantSlug?: string,
    tenantSlug?: string,
  ) => void;
  updateQuantity: (
    id: string,
    quantity: number,
    optionsOrSize?: Record<string, unknown> | string,
    flavorOrTenantSlug?: string,
    tenantSlug?: string,
  ) => void;
  clearCart: (tenantSlug?: string, clearRemote?: boolean) => void;
  loadUserCart: (
    tenantSlug: string,
    mergeWithLocal?: boolean,
  ) => Promise<CartItem[]>;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addToCart: (item, quantity = 1, tenantSlug) => {
        const slug = getCurrentTenantSlug(tenantSlug);
        let updatedItems: CartItem[] = [];

        // Extract subfields if passed via legacy props
        const { size, flavor, ...cleanProps } = item;
        const options =
          item.options ||
          (size || flavor
            ? { ...(size ? { size } : {}), ...(flavor ? { flavor } : {}) }
            : undefined);

        const normalizedItem: CartItem = {
          id: cleanProps.id,
          name: cleanProps.name,
          price: cleanProps.price,
          image: cleanProps.image || "",
          description: cleanProps.description || "",
          quantity,
          options:
            options && Object.keys(options).length > 0 ? options : undefined,
          stock_quantity: cleanProps.stock_quantity,
          track_inventory: cleanProps.track_inventory,
          product_id: cleanProps.product_id,
        };

        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (i) =>
              i.id === normalizedItem.id &&
              matchOptions(i.options, normalizedItem.options),
          );

          if (existingItemIndex > -1) {
            updatedItems = [...state.items];
            const existing = updatedItems[existingItemIndex];
            updatedItems[existingItemIndex] = {
              ...existing,
              quantity: existing.quantity + quantity,
              stock_quantity:
                normalizedItem.stock_quantity !== undefined
                  ? normalizedItem.stock_quantity
                  : existing.stock_quantity,
              track_inventory:
                normalizedItem.track_inventory !== undefined
                  ? normalizedItem.track_inventory
                  : existing.track_inventory,
              product_id: normalizedItem.product_id || existing.product_id,
            };
          } else {
            updatedItems = [...state.items, normalizedItem];
          }

          return { items: updatedItems };
        });

        scheduleBackendSync(slug, updatedItems);
      },

      removeFromCart: (
        id,
        optionsOrSize,
        flavorOrTenantSlug,
        tenantSlugParam,
      ) => {
        const hasOptionsArg = optionsOrSize !== undefined;
        const options = resolveOptions(optionsOrSize, flavorOrTenantSlug);
        const slugParam =
          typeof flavorOrTenantSlug === "string" && !tenantSlugParam
            ? flavorOrTenantSlug
            : tenantSlugParam;
        const slug = getCurrentTenantSlug(slugParam);
        let updatedItems: CartItem[] = [];

        set((state) => {
          updatedItems = state.items.filter(
            (i) =>
              !(
                i.id === id &&
                (!hasOptionsArg || matchOptions(i.options, options))
              ),
          );
          return { items: updatedItems };
        });

        scheduleBackendSync(slug, updatedItems, true);
      },

      updateQuantity: (
        id,
        quantity,
        optionsOrSize,
        flavorOrTenantSlug,
        tenantSlugParam,
      ) => {
        if (quantity <= 0) {
          get().removeFromCart(
            id,
            optionsOrSize,
            flavorOrTenantSlug,
            tenantSlugParam,
          );
          return;
        }

        const options = resolveOptions(optionsOrSize, flavorOrTenantSlug);
        const slugParam =
          typeof flavorOrTenantSlug === "string" && !tenantSlugParam
            ? flavorOrTenantSlug
            : tenantSlugParam;
        const slug = getCurrentTenantSlug(slugParam);
        let updatedItems: CartItem[] = [];

        set((state) => {
          updatedItems = state.items.map((i) =>
            i.id === id && matchOptions(i.options, options)
              ? { ...i, quantity }
              : i,
          );
          return { items: updatedItems };
        });

        scheduleBackendSync(slug, updatedItems, true);
      },

      clearCart: (tenantSlug, clearRemote = false) => {
        const slug = getCurrentTenantSlug(tenantSlug);
        set({ items: [] });
        if (clearRemote && isUserLoggedIn()) {
          clearUserCart(slug).catch((err) =>
            console.warn("Could not clear remote cart:", err),
          );
        }
      },

      loadUserCart: async (tenantSlug: string, mergeWithLocal = false) => {
        const slug = getCurrentTenantSlug(tenantSlug);
        if (!isUserLoggedIn()) {
          return get().items;
        }

        // Flush any pending unsynced local mutations before fetching authoritative DB state
        await flushPendingSync();

        try {
          set({ isLoading: true });
          const currentLocalItems = get().items;

          let finalItems: CartItem[] = [];
          if (mergeWithLocal && currentLocalItems.length > 0) {
            finalItems = await mergeUserCart(slug, currentLocalItems);
          } else {
            finalItems = await fetchUserCart(slug);
          }

          set({ items: finalItems, isLoading: false });
          return finalItems;
        } catch (err) {
          console.warn("Error loading user cart from database:", err);
          set({ isLoading: false });
          return get().items;
        }
      },

      getCartTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );
      },

      getCartCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
