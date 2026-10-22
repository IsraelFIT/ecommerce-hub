import { apiRequest } from "./client";
import { ApiResponse, Tenant } from "@/types/users";

export * from "./customizations";
export * from "./uploads";

export interface TenantSellerStats {
  rating: number;
  review_count: number;
  orders_fulfilled: number;
  member_since: number;
}

export interface TenantUserItem {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  gender?: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at?: string | null;
  orders_count: number;
  total_spent: number;
}

export interface TenantUsersResponse {
  items: TenantUserItem[];
  total: number;
}

/**
 * Fetch tenant profile and configuration by tenant slug.
 */
export async function getTenantBySlug(
  slug: string,
): Promise<ApiResponse<Tenant>> {
  return apiRequest<Tenant>(
    `/tenants/by-slug/${encodeURIComponent(slug.toLowerCase())}`,
    {
      method: "GET",
    },
  );
}

/**
 * Fetch tenant profile and configuration by tenant ID.
 */
export async function getTenantById(id: string): Promise<ApiResponse<Tenant>> {
  return apiRequest<Tenant>(`/tenants/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

/**
 * Update tenant settings, configuration, and branding.
 */
export async function updateTenant(
  tenantId: string,
  payload: Partial<Tenant>,
): Promise<ApiResponse<Tenant>> {
  return apiRequest<Tenant>(`/tenants/${encodeURIComponent(tenantId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Update tenant settings and configuration by tenant slug.
 */
export async function updateTenantBySlug(
  slug: string,
  payload: Partial<Tenant>,
): Promise<ApiResponse<Tenant>> {
  return apiRequest<Tenant>(
    `/tenants/by-slug/${encodeURIComponent(slug.toLowerCase())}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function getTenantStats(
  slugOrId: string,
): Promise<ApiResponse<TenantSellerStats>> {
  return apiRequest<TenantSellerStats>(
    `/tenants/${encodeURIComponent(slugOrId)}/stats`,
    {
      method: "GET",
    },
  );
}

export async function getTenantUsers(
  slugOrId: string,
): Promise<ApiResponse<TenantUsersResponse>> {
  return apiRequest<TenantUsersResponse>(
    `/tenants/${encodeURIComponent(slugOrId)}/users`,
    {
      method: "GET",
    },
  );
}
