export * from "./users";
export * from "./products";
export * from "./order";
export * from "./payment";

export interface ApiResponse<T = unknown> {
  status?: "success" | "error";
  success?: boolean;
  data?: T;
  message?: string;
  pagination?: PaginationMeta;
  filters?: Record<string, unknown>;
  error?: string;
  errors?: Record<string, string[] | string>;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url?: string | null;
  prev_page_url?: string | null;
}

export interface TenantBranding {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  customDomain?: string;
}
