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
  options?: {
    page?: number;
    per_page?: number;
    search?: string;
    role?: string;
  },
): Promise<ApiResponse<TenantUsersResponse>> {
  const queryParams = new URLSearchParams();
  if (options?.page) queryParams.set("page", options.page.toString());
  if (options?.per_page)
    queryParams.set("per_page", options.per_page.toString());
  if (options?.search && options.search.trim())
    queryParams.set("search", options.search.trim());
  if (options?.role && options.role !== "all")
    queryParams.set("role", options.role);

  const qs = queryParams.toString();
  const url = `/tenants/${encodeURIComponent(slugOrId)}/users${qs ? `?${qs}` : ""}`;

  return apiRequest<TenantUsersResponse>(url, {
    method: "GET",
  });
}

/**
 * Fetch all platform tenants with live metrics (Super Admin / Hub Admin).
 */
export async function getTenants(options?: {
  page?: number;
  per_page?: number;
  search?: string;
}): Promise<ApiResponse<{ items: import("@/types").TenantRecord[] }>> {
  const query = new URLSearchParams();
  if (options?.page) query.set("page", String(options.page));
  if (options?.per_page) query.set("per_page", String(options.per_page));
  if (options?.search && options.search.trim())
    query.set("search", options.search.trim());
  const qs = query.toString();
  return apiRequest<{ items: import("@/types").TenantRecord[] }>(
    `/tenants${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
    },
  );
}

/**
 * Provision / create a new tenant store (Super Admin).
 */
export async function createTenant(
  payload: import("@/types").CreateTenantPayload,
): Promise<ApiResponse<import("@/types").TenantRecord>> {
  return apiRequest<import("@/types").TenantRecord>("/tenants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
