import { apiRequest } from "./client";
import {
  ApiOrder,
  ApiOrderItem,
  OrderDisplay,
  OrderItemDisplay,
  CreateOrderInput,
  UpdateOrderStatusInput,
  CancelOrderInput,
  GetOrdersOptions,
  PaginatedOrdersResponse,
  OrderCalculateInput,
  OrderCalculateResult,
} from "@/types/order";
import { ApiResponse } from "@/types/users";

/**
 * Fetch a paginated list of orders for a tenant, with optional status/user/email/sorting filters.
 */
export async function fetchOrders(
  options?: GetOrdersOptions,
): Promise<ApiResponse<PaginatedOrdersResponse>> {
  const {
    tenantSlug,
    page = 1,
    per_page = 50,
    customer_email,
    user_id,
    product_id,
    status,
    search,
    sort_by,
    sort_order,
    include_items,
  } = options || {};

  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: per_page.toString(),
  });

  if (customer_email && customer_email.trim()) {
    queryParams.set("customer_email", customer_email.trim().toLowerCase());
  }
  if (user_id && user_id.trim()) {
    queryParams.set("user_id", user_id.trim());
  }
  if (product_id && product_id.trim()) {
    queryParams.set("product_id", product_id.trim());
  }
  if (status && status.trim() && status.toLowerCase() !== "all") {
    queryParams.set("status", status.trim().toLowerCase());
  }
  if (search && search.trim()) {
    queryParams.set("search", search.trim());
  }
  if (sort_by && sort_by.trim()) {
    queryParams.set("sort_by", sort_by.trim());
  }
  if (sort_order && sort_order.trim()) {
    queryParams.set("sort_order", sort_order.trim());
  }
  if (include_items) {
    queryParams.set("include_items", "true");
  }

  const headers: Record<string, string> = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<PaginatedOrdersResponse>(
    `/orders?${queryParams.toString()}`,
    {
      method: "GET",
      headers,
    },
  );
}

// Alias for fetchOrders
export const getOrders = fetchOrders;

/**
 * Fetch a single order by ID, gateway reference, or customer email.
 */
export async function fetchOrderById(
  orderIdentifier: string,
  email?: string,
  tenantSlug?: string,
): Promise<ApiResponse<ApiOrder>> {
  const queryParams = new URLSearchParams();
  if (email && email.trim()) {
    queryParams.set("email", email.trim().toLowerCase());
  }

  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : "";
  const headers: Record<string, string> = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<ApiOrder>(
    `/orders/${encodeURIComponent(orderIdentifier)}${queryString}`,
    {
      method: "GET",
      headers,
    },
  );
}

// Alias for fetchOrderById
export const getOrder = fetchOrderById;

/**
 * Create a new order with split platform fees.
 */
export async function createOrder(
  orderData: CreateOrderInput,
  tenantSlug?: string,
): Promise<ApiResponse<ApiOrder>> {
  const headers: Record<string, string> = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<ApiOrder>("/orders", {
    method: "POST",
    headers,
    body: JSON.stringify(orderData),
  });
}

/**
 * Calculate verified server-side order pricing including delivery fee and statutory Nigerian VAT (7.5%).
 */
export async function calculateOrderPricing(
  payload: OrderCalculateInput,
  tenantSlug?: string,
): Promise<ApiResponse<OrderCalculateResult>> {
  const headers: Record<string, string> = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<OrderCalculateResult>("/orders/calculate", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

/**
 * Update the status and tracking notes of an order (Admin).
 */
export async function updateOrderStatus(
  orderId: string,
  payload: UpdateOrderStatusInput,
  tenantSlug?: string,
): Promise<ApiResponse<ApiOrder>> {
  const headers: Record<string, string> = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<ApiOrder>(`/orders/${encodeURIComponent(orderId)}/status`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
}

/**
 * Soft-delete an order (Admin).
 */
export async function deleteOrder(
  orderId: string,
  tenantSlug?: string,
): Promise<ApiResponse<{ id: string }>> {
  const headers: Record<string, string> = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<{ id: string }>(`/orders/${encodeURIComponent(orderId)}`, {
    method: "DELETE",
    headers,
  });
}

/**
 * Cancel an order (Customer or Tenant Admin).
 */
export async function cancelOrder(
  orderId: string,
  tenantSlug?: string,
  payload?: CancelOrderInput,
): Promise<ApiResponse<ApiOrder>> {
  const headers: Record<string, string> = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<ApiOrder>(`/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload || { reason: "Cancelled by user" }),
  });
}

/**
 * Helper mapper to convert an API order payload into an OrderDisplay object for UI presentation.
 */
export function mapApiOrderToDisplay(o: ApiOrder): OrderDisplay {
  const rawStatus = (o.status || "pending").toLowerCase();
  let displayStatus: OrderDisplay["status"] = "Pending";
  let statusDesc = "Awaiting payment completion";

  if (rawStatus === "delivered" || rawStatus === "fulfilled") {
    displayStatus = "Delivered";
    statusDesc = "Your order has been delivered";
  } else if (rawStatus === "shipped" || rawStatus === "on the way") {
    displayStatus = "Shipped";
    statusDesc = "Your order is on the way";
  } else if (rawStatus === "processing" || rawStatus === "in_progress") {
    displayStatus = "Processing";
    statusDesc = "Your order is currently processing";
  } else if (rawStatus === "accepted") {
    displayStatus = "Accepted";
    statusDesc = "Your order has been accepted";
  } else if (rawStatus === "paid") {
    displayStatus = "Paid";
    statusDesc = "Payment confirmed, awaiting fulfillment";
  } else if (rawStatus === "cancelled" || rawStatus === "failed") {
    displayStatus = "Cancelled";
    statusDesc = "Your order has been cancelled";
  } else if (rawStatus === "pending") {
    displayStatus = "Pending";
    statusDesc = "Awaiting payment completion";
  }

  const items: OrderItemDisplay[] = (o.items || []).map(
    (it: ApiOrderItem, idx: number) => {
      const itemImg =
        it.image ||
        it.image_url ||
        (Array.isArray(it.images) && it.images[0]) ||
        null;

      const optionsStr = it.options
        ? Object.entries(it.options)
            .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
            .join(" | ")
        : "";
      const specs = optionsStr
        ? `${optionsStr} | ${it.quantity || 1} Qty.`
        : `${it.quantity || 1} Qty.`;

      return {
        id: `${o.id}-${idx}`,
        title: it.product_title || it.title || "Product Item",
        specs,
        image: itemImg,
        price: Number(it.unit_price) || 0,
      };
    },
  );

  return {
    id: o.id,
    gatewayReference: o.gateway_reference || o.id,
    orderNumber: o.gateway_reference || o.id.slice(0, 8).toUpperCase(),
    totalPayment: Number(o.total_amount) || 0,
    currency: o.currency || "NGN",
    paymentMethod: (o.payment_gateway || "Online").toUpperCase(),
    dateLabel:
      displayStatus === "Delivered"
        ? "Delivered Date"
        : "Estimated Delivery Date",
    dateValue: o.created_at
      ? new Date(o.created_at).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "3-5 Business Days",
    status: displayStatus,
    statusDescription: statusDesc,
    items,
    createdAt: o.created_at,
    paymentGateway: o.payment_gateway,
    rawStatus,
  };
}
