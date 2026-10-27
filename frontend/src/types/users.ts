import { PaginationMeta } from ".";

export type UserRole =
  | "super_admin"
  | "admin"
  | "hub_admin"
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
  customLandingPageStatus?:
    | "none"
    | "pending"
    | "in_review"
    | "in_progress"
    | "completed"
    | "rejected"
    | string;
  logoUrl?: string | null;
  tagline?: string | null;
  storeHeadline?: string | null;
  announcementText?: string | null;
  bannerUrl?: string | null;
  pickupLocationName?: string | null;
  pickupAddress?: string | null;
  pickupHours?: string | null;
  deliveryFee?: number | null;
  deliveryInstruction?: string | null;
  pickupInstruction?: string | null;
  settlementBank?: string | null;
  settlementBankName?: string | null;
  settlementAccount?: string | null;
  settlementAccountName?: string | null;
}

export interface CustomizationRequest {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  requested_by_email?: string | null;
  request_type: string;
  status:
    | "pending"
    | "in_review"
    | "in_progress"
    | "completed"
    | "rejected"
    | string;
  title: string;
  details?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  store_headline?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomLandingPageRequestInput {
  tenant_id?: string | null;
  tenant_slug?: string;
  details?: string;
  primary_color?: string;
  secondary_color?: string;
  store_headline?: string;
  contact_email?: string;
}

export interface TenantCustomizationStatusResponse {
  request: CustomizationRequest | null;
  has_custom_request: boolean;
  branding_config: BrandingConfig;
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
  store_address?: string | null;
  store_phone?: string | null;
  store_email?: string | null;
  pickup_location_name?: string | null;
  pickup_address?: string | null;
  pickup_hours?: string | null;
  delivery_fee?: number | null;
  delivery_instruction?: string | null;
  pickup_instruction?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserAddress {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  firstName?: string;
  lastName?: string;
  company?: string | null;
  country: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  zipCode?: string;
  phone?: string | null;
  email?: string | null;
  is_default?: boolean;
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
  phone_number?: string | null;
  gender?: string | null;
  avatar_url?: string | null;
  tenant_slug?: string | null;
  tenant_name?: string | null;
  tenant_currency?: string | null;
  tenant_country?: string | null;
  tenant_branding?: BrandingConfig | null;
  branding_config?: BrandingConfig | null;
  paystack_subaccount_code?: string | null;
  stripe_account_id?: string | null;
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

export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  message: string;
  data: T;
  pagination?: PaginationMeta | Record<string, unknown>;
  filters?: Record<string, unknown>;
  errors?: Record<string, string[] | string>;
}

export interface CoreUserSummary {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  gender?: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  tenant_id?: string | null;
  tenant_name?: string | null;
  tenant_slug?: string | null;
  created_at?: string | null;
  orders_count: number;
  total_spent: number;
}

export interface TenantCustomerSummary {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  orders_count: number;
  total_spent: number;
  last_order_at?: string | null;
  is_registered: boolean;
  is_active: boolean;
  created_at?: string | null;
}

export interface CoreUserOrder {
  id: string;
  order_number: string;
  created_at?: string | null;
  total_amount: number;
  currency: string;
  status: string;
  payment_gateway: string;
  items_count: number;
  items: Array<{
    product_name?: string;
    name?: string;
    quantity?: number;
    price?: number;
    image?: string;
  }>;
  tenant_name?: string | null;
  tenant_slug?: string | null;
}

export interface CoreUserDetailResponse {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  gender?: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at?: string | null;
  tenant?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
    currency?: string;
    country?: string;
    custom_domain?: string | null;
    branding_config?: BrandingConfig;
  } | null;
  stats: {
    total_customers: number;
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    currency: string;
  };
  user_stats?: {
    orders_count: number;
    total_spent: number;
    avg_order_value: number;
    last_order_at?: string | null;
    currency: string;
  };
  customers: TenantCustomerSummary[];
  orders?: CoreUserOrder[];
}

export interface UpdateUserRoleInput {
  role: UserRole | string;
}

export interface UpdateUserStatusInput {
  is_active: boolean;
}

export interface CoreRevenueMetric {
  id: string;
  title: string;
  rawAmount: number;
  value: string;
  change: string;
  subtitle: string;
  color: string;
  bg: string;
}

export interface CoreSplitTransaction {
  id: string;
  orderId: string;
  orderUuid: string;
  tenant: string;
  tenantSlug: string;
  customer: string;
  customerEmail: string;
  gross: number;
  feePercent: string;
  platformFee: number;
  tenantPayout: number;
  gateway: string;
  status: string;
  date: string;
  currency: string;
}

export interface CoreRevenueData {
  metrics: CoreRevenueMetric[];
  transactions: CoreSplitTransaction[];
  total_orders: number;
  primary_currency: string;
}

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  category?: string;
  country?: string;
  currency?: string;
  custom_domain?: string | null;
  backend_type?: "postgres" | "sanity";
  default_gateway?: string;
  paystack_subaccount_code?: string | null;
  stripe_account_id?: string | null;
  product_count?: number;
  orders_count?: number;
  total_volume?: number;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTenantPayload {
  name: string;
  slug: string;
  category?: string;
  country?: string;
  currency?: string;
  backend_type?: "postgres" | "sanity";
  default_gateway?: string;
  custom_domain?: string;
}
