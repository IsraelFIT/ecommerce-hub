import { apiRequest } from "./client";
import { ApiResponse } from "@/types/users";
import {
  CheckoutSessionResponse,
  CreateCheckoutSessionInput,
  PaymentVerificationResponse,
} from "@/types/payment";

export * from "@/types/payment";

/**
 * Initialize a hosted payment checkout session (Paystack Standard or Stripe Checkout)
 * with subaccount split routing and platform fee retention.
 */
export async function createCheckoutSession(
  payload: CreateCheckoutSessionInput,
  tenantSlug?: string,
): Promise<ApiResponse<CheckoutSessionResponse>> {
  const headers: Record<string, string> = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return apiRequest<CheckoutSessionResponse>("/payments/checkout-session", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

/**
 * Verify payment status with the payment gateway (Paystack or Stripe),
 * transitioning the order to PAID status upon verification.
 */
export async function verifyPayment(
  reference: string,
  sessionId?: string,
  tenantSlug?: string,
): Promise<ApiResponse<PaymentVerificationResponse>> {
  const headers: Record<string, string> = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  const queryParams = new URLSearchParams();
  if (sessionId) {
    queryParams.set("session_id", sessionId);
  }
  const queryString = queryParams.toString();
  const endpoint = `/payments/verify/${encodeURIComponent(reference)}${
    queryString ? `?${queryString}` : ""
  }`;

  return apiRequest<PaymentVerificationResponse>(endpoint, {
    method: "GET",
    headers,
  });
}
