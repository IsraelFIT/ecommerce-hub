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

export interface PaystackBank {
  name: string;
  code: string;
  slug?: string | null;
  id?: number | null;
}

export interface ResolveAccountInput {
  account_number: string;
  bank_code: string;
}

export interface ResolveAccountResult {
  account_number: string;
  account_name: string;
  bank_id?: number | null;
}

export interface CreateSubaccountInput {
  bank_code: string;
  account_number: string;
  business_name?: string;
}

export interface CreateSubaccountResult {
  subaccount_code: string;
  business_name: string;
  settlement_bank: string;
  account_number: string;
  percentage_charge: number;
}

export interface StripeOnboardInput {
  return_url?: string;
  refresh_url?: string;
}

export interface StripeOnboardResult {
  account_id: string;
  onboarding_url: string;
}
