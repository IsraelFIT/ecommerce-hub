import { apiRequest } from "./client";
import { ApiResponse } from "@/types/users";

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

export async function getTenantStats(
  slugOrId: string,
): Promise<ApiResponse<TenantSellerStats>> {
  return apiRequest<TenantSellerStats>(`/tenants/${slugOrId}/stats`, {
    method: "GET",
  });
}

export async function getTenantUsers(
  slugOrId: string,
): Promise<ApiResponse<TenantUsersResponse>> {
  return apiRequest<TenantUsersResponse>(`/tenants/${slugOrId}/users`, {
    method: "GET",
  });
}
