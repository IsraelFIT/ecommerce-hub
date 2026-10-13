import { apiRequest } from "./client";
import {
  ProductCategory,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types/products";
import { ApiResponse } from "@/types/users";

/**
 * Fetch all categories for a tenant.
 */
export async function getCategories(options?: {
  tenantSlug?: string;
}): Promise<ApiResponse<ProductCategory[]>> {
  const { tenantSlug } = options || {};
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<ProductCategory[]>("/categories", {
    method: "GET",
    headers,
  });
}

/**
 * Fetch a single category by UUID.
 */
export async function getCategoryById(
  id: string,
  tenantSlug?: string,
): Promise<ApiResponse<ProductCategory>> {
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<ProductCategory>(`/categories/${id}`, {
    method: "GET",
    headers,
  });
}

/**
 * Create a new product category for a tenant.
 */
export async function createCategory(
  payload: CreateCategoryInput,
  tenantSlug?: string,
): Promise<ApiResponse<ProductCategory>> {
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<ProductCategory>("/categories", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing category.
 */
export async function updateCategory(
  id: string,
  payload: UpdateCategoryInput,
  tenantSlug?: string,
): Promise<ApiResponse<ProductCategory>> {
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<ProductCategory>(`/categories/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a category.
 */
export async function deleteCategory(
  id: string,
  tenantSlug?: string,
): Promise<ApiResponse<Record<string, unknown>>> {
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<Record<string, unknown>>(`/categories/${id}`, {
    method: "DELETE",
    headers,
  });
}
