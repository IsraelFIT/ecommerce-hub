import { apiRequest } from "./client";
import { CartItem } from "@/store/cart";

export interface CartResponseData {
  items: CartItem[];
  tenant_id?: string | null;
  tenant_slug?: string | null;
  updated_at?: string | null;
}

/**
 * Fetch saved cart for the authenticated user and tenant store.
 */
export async function fetchUserCart(tenantSlug: string): Promise<CartItem[]> {
  try {
    const slug = tenantSlug || "store";
    const res = await apiRequest<CartResponseData>(`/cart/${slug}`, {
      method: "GET",
    });
    if (res.data && Array.isArray(res.data.items)) {
      return res.data.items;
    }
    return [];
  } catch (err) {
    // If unauthenticated or network error, return empty gracefully
    console.warn("Could not fetch remote cart:", err);
    return [];
  }
}

/**
 * Sync / overwrite saved cart in the database.
 */
export async function syncUserCart(
  tenantSlug: string,
  items: CartItem[],
): Promise<CartItem[]> {
  try {
    const slug = tenantSlug || "store";
    const res = await apiRequest<CartResponseData>(`/cart/${slug}`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    });
    if (res.data && Array.isArray(res.data.items)) {
      return res.data.items;
    }
    return items;
  } catch (err) {
    console.warn("Could not sync remote cart:", err);
    return items;
  }
}

/**
 * Merge local guest cart items with saved database cart upon login.
 */
export async function mergeUserCart(
  tenantSlug: string,
  items: CartItem[],
): Promise<CartItem[]> {
  try {
    const slug = tenantSlug || "store";
    const res = await apiRequest<CartResponseData>(`/cart/${slug}/merge`, {
      method: "POST",
      body: JSON.stringify({ items }),
    });
    if (res.data && Array.isArray(res.data.items)) {
      return res.data.items;
    }
    return items;
  } catch (err) {
    console.warn("Could not merge remote cart:", err);
    return items;
  }
}

/**
 * Clear the user's saved cart in the database (e.g. on order completion).
 */
export async function clearUserCart(tenantSlug: string): Promise<boolean> {
  try {
    const slug = tenantSlug || "store";
    await apiRequest<{ cleared: boolean }>(`/cart/${slug}`, {
      method: "DELETE",
    });
    return true;
  } catch (err) {
    console.warn("Could not clear remote cart:", err);
    return false;
  }
}
