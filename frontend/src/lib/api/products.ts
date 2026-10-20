import { apiRequest } from "./client";
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "@/types/products";
import { ApiResponse } from "@/types/users";

export interface PaginatedProductsResponse {
  items: Product[];
}

export interface GetProductsOptions {
  tenantSlug?: string;
  page?: number;
  per_page?: number;
  published_only?: boolean;
  category?: string;
  product_class?: string;
  min_price?: number;
  max_price?: number;
  rating?: number;
  availability?: string;
  search?: string;
  filters?: Record<string, string[]>;
}

/**
 * Fetch list of products for a tenant with optional filtering.
 */
export async function getProducts(
  options?: GetProductsOptions,
): Promise<ApiResponse<PaginatedProductsResponse>> {
  const {
    tenantSlug,
    page = 1,
    per_page = 50,
    published_only = false,
    category,
    product_class,
    min_price,
    max_price,
    rating,
    availability,
    search,
    filters,
  } = options || {};

  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: per_page.toString(),
    published_only: published_only.toString(),
  });

  if (category && category.trim() && category.toUpperCase() !== "ALL") {
    queryParams.set("category", category.trim());
  }
  if (
    product_class &&
    product_class.trim() &&
    product_class.toLowerCase() !== "all"
  ) {
    queryParams.set("product_class", product_class.trim().toLowerCase());
  }
  if (min_price !== undefined && min_price !== null) {
    queryParams.set("min_price", min_price.toString());
  }
  if (max_price !== undefined && max_price !== null) {
    queryParams.set("max_price", max_price.toString());
  }
  if (rating !== undefined && rating !== null && rating > 0) {
    queryParams.set("rating", rating.toString());
  }
  if (availability && availability !== "all") {
    queryParams.set("availability", availability);
  }
  if (search && search.trim()) {
    queryParams.set("search", search.trim());
  }
  if (filters && Object.keys(filters).length > 0) {
    const cleanFilters: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(filters)) {
      if (Array.isArray(v) && v.length > 0) {
        cleanFilters[k] = v;
      }
    }
    if (Object.keys(cleanFilters).length > 0) {
      queryParams.set("filters", JSON.stringify(cleanFilters));
    }
  }

  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<PaginatedProductsResponse>(
    `/products?${queryParams.toString()}`,
    {
      method: "GET",
      headers,
    },
  );
}

/**
 * Fetch a single product by URL slug.
 */
export async function getProductBySlug(
  slug: string,
  tenantSlug?: string,
): Promise<ApiResponse<Product>> {
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<Product>(`/products/by-slug/${slug}`, {
    method: "GET",
    headers,
  });
}

/**
 * Fetch a single product by UUID.
 */
export async function getProductById(
  id: string,
  tenantSlug?: string,
): Promise<ApiResponse<Product>> {
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<Product>(`/products/${id}`, {
    method: "GET",
    headers,
  });
}

/**
 * Create a new product in the active tenant's catalog (PostgreSQL or Sanity CMS).
 */
export async function createProduct(
  payload: CreateProductInput,
  tenantSlug?: string,
): Promise<ApiResponse<Product>> {
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<Product>("/products", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing product.
 */
export async function updateProduct(
  id: string,
  payload: UpdateProductInput,
  tenantSlug?: string,
): Promise<ApiResponse<Product>> {
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<Product>(`/products/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a product from tenant catalog.
 */
export async function deleteProduct(
  id: string,
  tenantSlug?: string,
): Promise<ApiResponse<Record<string, unknown>>> {
  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<Record<string, unknown>>(`/products/${id}`, {
    method: "DELETE",
    headers,
  });
}

export interface UploadImageResponse {
  url: string;
  filename: string;
  storage: string;
  size: number;
}

/**
 * Upload an image file to the platform media pipeline (Sanity CDN or local storage).
 */
export async function uploadProductImage(
  file: File,
  tenantSlug?: string,
): Promise<ApiResponse<UploadImageResponse>> {
  const formData = new FormData();
  formData.append("file", file);

  const headers: HeadersInit = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<UploadImageResponse>("/uploads/image", {
    method: "POST",
    headers,
    body: formData,
  });
}

export const uploadImage = uploadProductImage;
