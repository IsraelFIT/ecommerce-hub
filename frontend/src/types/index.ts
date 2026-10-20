export * from "./users";
export * from "./products";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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

export interface OrderItem {
  product_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  image?: string | null;
  options?: Record<string, unknown>;
}

export interface Order {
  id: string;
  tenant_id: string;
  user_id?: string | null;
  customer_email: string;
  customer_name: string;
  total_amount: number;
  platform_fee: number;
  tenant_payout_amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "fulfilled" | "cancelled" | string;
  payment_gateway: "paystack" | "stripe" | string;
  gateway_reference: string;
  items: OrderItem[];
  metadata_json?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface SplitDetails {
  total_amount: number;
  platform_fee: number;
  tenant_payout: number;
  subaccount_code?: string | null;
  currency: string;
}

export interface CheckoutSessionResponse {
  checkout_url: string;
  reference: string;
  gateway: string;
  split_details?: SplitDetails;
}

export interface PaymentVerificationResponse {
  status: string;
  order_id: string;
  reference: string;
  total_amount?: number;
  currency?: string;
  payment_gateway?: string;
}
