import { apiRequest } from "./client";
import { User, UserRole, ApiResponse } from "@/types/users";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  store_name: string;
  store_slug: string;
  store_category?: string;
  password: string;
  confirm_password: string;
  consent_to_terms: boolean;
}

export interface TenantCustomerRegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  tenant_slug: string;
  password: string;
  confirm_password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  new_password: string;
  confirm_password: string;
}

export interface ApiAuthResponseData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  tenant_slug?: string | null;
  tenant_name?: string | null;
  auth: {
    access_token: string;
    refresh_token: string;
    expires_in: string | number;
    custom_token?: string;
  };
}

export interface UserProfileData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: UserRole;
  tenant_slug?: string | null;
  tenant_name?: string | null;
  tenant_id?: string;
  created_at?: string;
}

/**
 * Log in with email and password.
 */
export async function loginUser(
  payload: LoginPayload,
): Promise<ApiAuthResponseData> {
  const response = await apiRequest<ApiAuthResponseData>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

/**
 * Register a new merchant tenant and store owner.
 */
export async function registerTenantUser(
  payload: RegisterPayload,
): Promise<ApiAuthResponseData> {
  const response = await apiRequest<ApiAuthResponseData>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

/**
 * Register a customer under a specific tenant store.
 */
export async function registerTenantCustomer(
  payload: TenantCustomerRegisterPayload,
): Promise<ApiAuthResponseData> {
  const response = await apiRequest<ApiAuthResponseData>(
    "/auth/tenant-register",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return response.data;
}

/**
 * Refresh access token helper used by client.ts.
 */
export async function refreshToken(payload: {
  refresh_token: string;
}): Promise<ApiResponse<ApiAuthResponseData>> {
  return await apiRequest<ApiAuthResponseData>("/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Legacy/named refresh token method.
 */
export async function refreshAuthToken(
  token: string,
): Promise<ApiAuthResponseData> {
  const res = await refreshToken({ refresh_token: token });
  return res.data;
}

/**
 * Request OTP for password reset.
 */
export async function requestPasswordReset(
  email: string,
): Promise<{ dev_otp?: string }> {
  const response = await apiRequest<{ dev_otp?: string }>(
    "/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
  return response.data || {};
}

/**
 * Reset password using OTP code.
 */
export async function resetPasswordWithOtp(
  payload: ResetPasswordPayload,
): Promise<void> {
  await apiRequest<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Get current authenticated user profile.
 */
export async function getCurrentUserProfile(token?: string): Promise<User> {
  const options: RequestInit = {
    method: "GET",
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  };

  const response = await apiRequest<UserProfileData>("/auth/me", options);
  const data = response.data;

  return {
    id: data.id,
    email: data.email,
    name: data.full_name || `${data.first_name} ${data.last_name}`,
    first_name: data.first_name,
    last_name: data.last_name,
    full_name: data.full_name,
    role: data.role,
    tenant_slug: data.tenant_slug,
    tenant_name: data.tenant_name,
    tenantId: data.tenant_id,
    createdAt: data.created_at,
  };
}
