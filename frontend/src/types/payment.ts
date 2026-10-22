export interface SplitDetails {
  total_amount: number;
  platform_fee: number;
  tenant_payout: number;
  subaccount_code?: string | null;
  currency: string;
}

export interface CreateCheckoutSessionInput {
  order_id: string;
  gateway?: string;
  callback_url: string;
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
