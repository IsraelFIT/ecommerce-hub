import { apiRequest } from "./client";
import {
  ProductFilter,
  CreateFilterInput,
  UpdateFilterInput,
} from "@/types/products";
import { ApiResponse } from "@/types/users";

/**
 * Fetch all custom product filters for a tenant.
 */
export async function getFilters(options?: {
  tenantSlug?: string;
  active_only?: boolean;
}): Promise<ApiResponse<ProductFilter[]>> {
  const { tenantSlug, active_only = false } = options || {};
  const queryParams = new URLSearchParams();
  if (active_only) {
    queryParams.append("active_only", "true");
  }

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<ProductFilter[]>(`/filters${queryStr}`, {
    method: "GET",
    headers,
  });
}

/**
 * Fetch a single filter by UUID.
 */
export async function getFilterById(
  id: string,
  tenantSlug?: string,
): Promise<ApiResponse<ProductFilter>> {
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<ProductFilter>(`/filters/${id}`, {
    method: "GET",
    headers,
  });
}

/**
 * Create a new custom product filter for a tenant.
 */
export async function createFilter(
  payload: CreateFilterInput,
  tenantSlug?: string,
): Promise<ApiResponse<ProductFilter>> {
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<ProductFilter>("/filters", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

/**
 * Update a filter group.
 */
export async function updateFilter(
  id: string,
  payload: UpdateFilterInput,
  tenantSlug?: string,
): Promise<ApiResponse<ProductFilter>> {
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<ProductFilter>(`/filters/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a filter group.
 */
export async function deleteFilter(
  id: string,
  tenantSlug?: string,
): Promise<ApiResponse<Record<string, unknown>>> {
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<Record<string, unknown>>(`/filters/${id}`, {
    method: "DELETE",
    headers,
  });
}
