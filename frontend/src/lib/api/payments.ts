import { apiRequest } from "./client";
import { ApiResponse } from "@/types/users";
import {
  CheckoutSessionResponse,
  CreateCheckoutSessionInput,
  PaymentVerificationResponse,
  PaystackBank,
  ResolveAccountInput,
  ResolveAccountResult,
  CreateSubaccountInput,
  CreateSubaccountResult,
  StripeOnboardInput,
  StripeOnboardResult,
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

/**
 * Fetch supported settlement banks for automated Paystack subaccount setup.
 * Supported by local database caching with periodic/on-demand sync from Paystack API.
 */
export async function fetchPaystackBanks(
  tenantSlug?: string,
  options?: { country?: string; refresh?: boolean },
): Promise<ApiResponse<PaystackBank[]>> {
  const headers: Record<string, string> = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }
  const queryParams = new URLSearchParams();
  if (options?.country) {
    queryParams.set("country", options.country);
  }
  if (options?.refresh) {
    queryParams.set("refresh", "true");
  }
  const queryStr = queryParams.toString();
  const endpoint = `/payments/paystack/banks${queryStr ? `?${queryStr}` : ""}`;
  return apiRequest<PaystackBank[]>(endpoint, {
    method: "GET",
    headers,
  });
}

/**
 * Real-time verification of a Nigerian NUBAN bank account number.
 */
export async function resolvePaystackAccount(
  payload: ResolveAccountInput,
  tenantSlug?: string,
): Promise<ApiResponse<ResolveAccountResult>> {
  const headers: Record<string, string> = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }
  return apiRequest<ResolveAccountResult>(
    "/payments/paystack/resolve-account",
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Automatically create and link a Paystack subaccount using bank details.
 */
export async function createPaystackSubaccount(
  payload: CreateSubaccountInput,
  tenantSlug?: string,
): Promise<ApiResponse<CreateSubaccountResult>> {
  const headers: Record<string, string> = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }
  return apiRequest<CreateSubaccountResult>(
    "/payments/paystack/create-subaccount",
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Generate a Stripe Express hosted onboarding link for instant merchant onboarding.
 */
export async function createStripeOnboarding(
  payload: StripeOnboardInput,
  tenantSlug?: string,
): Promise<ApiResponse<StripeOnboardResult>> {
  const headers: Record<string, string> = {};
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }
  return apiRequest<StripeOnboardResult>("/payments/stripe/onboard", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch platform-wide revenue, escrow balances, and split transactions (Super Admin).
 */
export async function getCoreRevenueAnalytics(): Promise<
  ApiResponse<import("@/types/users").CoreRevenueData>
> {
  return apiRequest<import("@/types/users").CoreRevenueData>(
    "/payments/core/revenue",
    {
      method: "GET",
    },
  );
}

/**
 * Trigger platform-wide escrow settlement for all merchant subaccounts (Super Admin).
 */
export async function settleAllEscrowBalances(): Promise<
  ApiResponse<{ settled_count: number }>
> {
  return apiRequest<{ settled_count: number }>("/payments/core/settle", {
    method: "POST",
  });
}
