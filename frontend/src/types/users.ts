export type UserRole =
  | "super_admin"
  | "admin"
  | "tenant_admin"
  | "customer"
  | "user";

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: string | number;
  custom_token?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role: UserRole;
  tenant_slug?: string | null;
  tenant_name?: string | null;
  tenantId?: string;
  avatarUrl?: string;
  createdAt?: string;
  auth?: AuthTokens;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url?: string | null;
  prev_page_url?: string | null;
}

export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  message: string;
  data: T;
  pagination?: PaginationMeta | Record<string, unknown>;
  filters?: Record<string, unknown>;
  errors?: Record<string, string[] | string>;
}
