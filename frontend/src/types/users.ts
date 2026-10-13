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

export interface BrandingConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  landingPageType?: "default" | "custom" | string;
  customLandingPageStatus?: "none" | "pending" | "in_review" | "in_progress" | "completed" | "rejected" | string;
  logoUrl?: string | null;
  tagline?: string | null;
  storeHeadline?: string | null;
  announcementText?: string | null;
  bannerUrl?: string | null;
}

export interface CustomizationRequest {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  requested_by_email?: string | null;
  request_type: string;
  status: "pending" | "in_review" | "in_progress" | "completed" | "rejected" | string;
  title: string;
  details?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  store_headline?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantBrandingSummary {
  tenant_id: string;
  name: string;
  slug: string;
  category: string;
  country: string;
  currency: string;
  custom_domain?: string | null;
  primary_color: string;
  secondary_color: string;
  landing_page_type: "default" | "custom" | string;
  has_custom_request: boolean;
  custom_request_status?: string | null;
  logo_url?: string | null;
  store_headline?: string | null;
  announcement_text?: string | null;
  is_active: boolean;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  category?: string;
  country?: string;
  currency?: string;
  custom_domain?: string | null;
  backend_type?: "postgres" | "sanity";
  default_gateway?: string;
  branding_config?: BrandingConfig;
  paystack_subaccount_code?: string | null;
  stripe_account_id?: string | null;
  sanity_dataset?: string | null;
  sanity_project_id?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
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
  tenant_currency?: string | null;
  tenant_country?: string | null;
  tenant_branding?: BrandingConfig | null;
  branding_config?: BrandingConfig | null;
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
