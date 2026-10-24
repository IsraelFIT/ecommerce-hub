export interface OrderItemDisplay {
  id: string;
  title: string;
  specs: string;
  image: string | null;
  price: number;
}

export type OrderDisplayStatus =
  | "Accepted"
  | "Delivered"
  | "Processing"
  | "On the Way"
  | "Cancelled";

export interface OrderDisplay {
  id: string;
  gatewayReference: string;
  orderNumber: string;
  totalPayment: number;
  currency: string;
  paymentMethod: string;
  dateLabel: string;
  dateValue: string;
  status: OrderDisplayStatus;
  statusDescription: string;
  items: OrderItemDisplay[];
}

export interface ApiOrderItem {
  product_id?: string;
  product_title?: string;
  title?: string;
  quantity?: number;
  image?: string | null;
  image_url?: string | null;
  images?: string[];
  unit_price?: number | string;
  options?: Record<string, unknown>;
}

export interface OrderItem {
  product_id?: string;
  product_title?: string;
  title: string;
  quantity: number;
  unit_price: number;
  image?: string | null;
  image_url?: string | null;
  images?: string[];
  options?: Record<string, unknown>;
}

export interface ApiOrder {
  id: string;
  tenant_id: string;
  user_id?: string | null;
  customer_email: string;
  customer_name: string;
  customer_avatar_url?: string | null;
  total_amount: number;
  platform_fee: number;
  tenant_payout_amount: number;
  currency: string;
  status: string;
  payment_gateway: string;
  gateway_reference: string;
  created_at: string;
  updated_at: string;
  subtotal?: number;
  delivery_fee?: number;
  tax_rate?: number;
  tax_title?: string;
  tax_amount?: number;
  items: OrderItem[];
  metadata_json?: {
    tenant_slug?: string;
    subaccount_used?: string | null;
    fulfillment_type?: string;
    subtotal?: number;
    delivery_fee?: number;
    tax_rate?: number;
    tax_title?: string;
    tax_amount?: number;
    delivery_address?: {
      address?: string;
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zip?: string;
      postal_code?: string;
      phone?: string;
      additional_info?: string;
      [key: string]: unknown;
    };
    fulfillment_date?: string;
    fulfillment_time?: string;
    gift_message?: string;
    tracking_notes?: string;
    paid_at?: string;
    verified_via?: string;
    [key: string]: unknown;
  };
}

export type OrderDetail = ApiOrder;
export type Order = ApiOrder;

export interface CreateOrderItemInput {
  product_id: string;
  title?: string;
  quantity: number;
  unit_price?: number;
  image?: string | null;
  options?: Record<string, unknown>;
}

export interface CreateOrderInput {
  customer_name: string;
  customer_email: string;
  user_id?: string | null;
  items: CreateOrderItemInput[];
  payment_gateway?: string;
  currency?: string;
  delivery_fee?: number;
  fulfillment_type?: "pickup" | "delivery" | string;
  delivery_address?: Record<string, unknown> | null;
  fulfillment_date?: string | null;
  fulfillment_time?: string | null;
  gift_message?: string | null;
}

export interface OrderCalculateItemInput {
  product_id?: string;
  variant_id?: string;
  title?: string;
  quantity: number;
  options?: Record<string, unknown>;
}

export interface OrderCalculateInput {
  fulfillment_type?: "pickup" | "delivery" | string;
  items: OrderCalculateItemInput[];
}

export interface OrderCalculateItemResult {
  product_id?: string;
  title?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  image?: string | null;
  options?: Record<string, unknown>;
}

export interface OrderCalculateResult {
  items: OrderCalculateItemResult[];
  subtotal: number;
  delivery_fee: number;
  tax_rate: number;
  tax_title: string;
  tax_amount: number;
  total_amount: number;
  currency: string;
}

export interface UpdateOrderStatusInput {
  status: string;
  tracking_notes?: string;
}

export interface GetOrdersOptions {
  tenantSlug?: string;
  page?: number;
  per_page?: number;
  customer_email?: string;
  user_id?: string;
  product_id?: string;
  sort_by?: "created_at" | "date" | "total_amount" | "product" | "product_name" | string;
  sort_order?: "asc" | "desc";
}

export interface PaginatedOrdersResponse {
  items: ApiOrder[];
}

export interface CancelOrderInput {
  reason?: string;
  customer_email?: string;
}

