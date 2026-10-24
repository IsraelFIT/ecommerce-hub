import { apiRequest } from "./client";
import {
  ApiResponse,
  CoreUserSummary,
  CoreUserDetailResponse,
  UserRole,
} from "@/types/users";

export interface GetCoreUsersOptions {
  search?: string;
  role?: string;
  tenant_id?: string;
  page?: number;
  per_page?: number;
}

/**
 * Fetch platform-wide directory of users for Super Admin.
 */
export async function getCoreUsers(
  options?: GetCoreUsersOptions,
): Promise<ApiResponse<{ items: CoreUserSummary[] }>> {
  const query = new URLSearchParams();
  if (options?.search) query.set("search", options.search.trim());
  if (options?.role && options.role !== "all") query.set("role", options.role);
  if (options?.tenant_id && options.tenant_id !== "all")
    query.set("tenant_id", options.tenant_id);
  if (options?.page) query.set("page", String(options.page));
  if (options?.per_page) query.set("per_page", String(options.per_page));

  const qs = query.toString();
  return apiRequest<{ items: CoreUserSummary[] }>(
    `/users/core/directory${qs ? `?${qs}` : ""}`,
    { method: "GET" },
  );
}

/**
 * Fetch single user details including their associated tenant store and customer table.
 */
export async function getCoreUserDetail(
  userId: string,
): Promise<ApiResponse<CoreUserDetailResponse>> {
  return apiRequest<CoreUserDetailResponse>(
    `/users/core/${encodeURIComponent(userId)}`,
    { method: "GET" },
  );
}

/**
 * Update user role (e.g. promote tenant_admin to hub_admin).
 */
export async function updateUserRole(
  userId: string,
  role: UserRole | string,
): Promise<
  ApiResponse<{
    id: string;
    email: string;
    old_role: string;
    new_role: string;
    role: string;
  }>
> {
  return apiRequest(`/users/core/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

/**
 * Update user active status (activate/deactivate).
 */
export async function updateUserStatus(
  userId: string,
  isActive: boolean,
): Promise<ApiResponse<{ id: string; email: string; is_active: boolean }>> {
  return apiRequest(`/users/core/${encodeURIComponent(userId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
}
