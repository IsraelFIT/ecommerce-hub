import { apiRequest } from "./client";
import {
  ApiResponse,
  CustomizationRequest,
  CustomLandingPageRequestInput,
  TenantCustomizationStatusResponse,
  TenantBrandingSummary,
} from "@/types/users";

/**
 * Submit or update a bespoke landing page request for a tenant.
 */
export async function submitLandingPageRequest(
  payload: CustomLandingPageRequestInput,
): Promise<ApiResponse<CustomizationRequest>> {
  return apiRequest<CustomizationRequest>(
    "/customizations/landing-page-request",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Toggle landing page mode between default multi-tenant storefront and custom bespoke landing page.
 */
export async function setLandingPageType(
  tenantSlug: string,
  landingPageType: "default" | "custom",
): Promise<ApiResponse<unknown>> {
  const query = new URLSearchParams({
    tenant_slug: tenantSlug,
    landing_page_type: landingPageType,
  });

  return apiRequest(
    `/customizations/set-landing-page-type?${query.toString()}`,
    {
      method: "POST",
    },
  );
}

/**
 * Fetch active customization request and status for a given tenant slug or ID.
 */
export async function getTenantCustomizationStatus(
  tenantSlugOrId: string,
): Promise<ApiResponse<TenantCustomizationStatusResponse>> {
  return apiRequest<TenantCustomizationStatusResponse>(
    `/customizations/tenant/${encodeURIComponent(tenantSlugOrId)}/status`,
    {
      method: "GET",
    },
  );
}

/**
 * List all customization and bespoke landing page requests (Super Admin).
 */
export async function getCustomizationRequests(params?: {
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<ApiResponse<{ items: CustomizationRequest[] }>> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  const qs = query.toString();

  return apiRequest<{ items: CustomizationRequest[] }>(
    `/customizations/requests${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
    },
  );
}

/**
 * Update status and admin notes for a customization request (Super Admin).
 */
export async function updateCustomizationRequest(
  requestId: string,
  payload: {
    status?: string;
    admin_notes?: string;
  },
): Promise<ApiResponse<CustomizationRequest>> {
  return apiRequest<CustomizationRequest>(
    `/customizations/requests/${encodeURIComponent(requestId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Directory of all tenant branding configurations (Super Admin).
 */
export async function getTenantBrandings(params?: {
  landing_type?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<ApiResponse<{ items: TenantBrandingSummary[] }>> {
  const query = new URLSearchParams();
  if (params?.landing_type) query.set("landing_type", params.landing_type);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  const qs = query.toString();

  return apiRequest<{ items: TenantBrandingSummary[] }>(
    `/customizations/tenant-brandings${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
    },
  );
}
