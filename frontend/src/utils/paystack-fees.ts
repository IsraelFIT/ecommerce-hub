export type PaystackCardChannel =
  | "local"
  | "international"
  | "amex"
  | "google_pay";

export interface PaystackFeeBreakdown {
  channel: PaystackCardChannel;
  channelLabel: string;
  channelDescription: string;
  rateDescription: string;
  feeAmount: number;
  totalWithFee: number;
}

/**
 * Authoritative Paystack customer markup calculator.
 *
 * Formula:
 *   Total = (BaseAmount + FlatFee) / (1 - PercentageFee)
 *   Fee = Total - BaseAmount
 *
 * Rules:
 * 1. Local Cards (Visa, Mastercard, Verve, Bank Transfer, USSD):
 *    - 1.5% + NGN 100
 *    - The NGN 100 flat fee is waived if BaseAmount < NGN 2,500
 *    - Capped at NGN 2,000 maximum fee (cap is hit at BaseAmount >= NGN 126,667)
 * 2. International Visa & Mastercard:
 *    - 3.9% + NGN 100 (uncapped)
 * 3. American Express (Amex):
 *    - 4.5% uncapped (no flat fee)
 * 4. Google Pay:
 *    - Tokenized card processing (calculated using international card rate 3.9% + NGN 100 by default)
 */
export function calculatePaystackFee(
  baseAmount: number,
  channel: PaystackCardChannel,
  currency: string = "NGN",
): PaystackFeeBreakdown {
  if (baseAmount <= 0) {
    return {
      channel,
      channelLabel: getChannelLabel(channel),
      channelDescription: getChannelDescription(channel),
      rateDescription: getRateDescription(channel),
      feeAmount: 0,
      totalWithFee: 0,
    };
  }

  const isNGN = currency.toUpperCase() === "NGN";
  let totalCharged = baseAmount;

  switch (channel) {
    case "local": {
      const flatFee = isNGN ? (baseAmount < 2500 ? 0 : 100) : 0;
      totalCharged = (baseAmount + flatFee) / (1 - 0.015);
      const calculatedFee = totalCharged - baseAmount;
      if (isNGN && calculatedFee > 2000) {
        totalCharged = baseAmount + 2000;
      }
      break;
    }
    case "international": {
      const flatFee = isNGN ? 100 : 0;
      totalCharged = (baseAmount + flatFee) / (1 - 0.039);
      break;
    }
    case "amex": {
      totalCharged = baseAmount / (1 - 0.045);
      break;
    }
    case "google_pay": {
      const flatFee = isNGN ? 100 : 0;
      totalCharged = (baseAmount + flatFee) / (1 - 0.039);
      break;
    }
  }

  const finalTotal = Math.round(totalCharged * 100) / 100;
  const finalFee = Math.round((finalTotal - baseAmount) * 100) / 100;

  return {
    channel,
    channelLabel: getChannelLabel(channel),
    channelDescription: getChannelDescription(channel),
    rateDescription: getRateDescription(channel),
    feeAmount: finalFee,
    totalWithFee: finalTotal,
  };
}

export function getAllPaystackFeeBreakdowns(
  baseAmount: number,
  currency: string = "NGN",
): Record<PaystackCardChannel, PaystackFeeBreakdown> {
  return {
    local: calculatePaystackFee(baseAmount, "local", currency),
    international: calculatePaystackFee(baseAmount, "international", currency),
    amex: calculatePaystackFee(baseAmount, "amex", currency),
    google_pay: calculatePaystackFee(baseAmount, "google_pay", currency),
  };
}

function getChannelLabel(channel: PaystackCardChannel): string {
  switch (channel) {
    case "local":
      return "Local Cards / Bank Transfer";
    case "international":
      return "International Visa & Mastercard";
    case "amex":
      return "American Express (Amex)";
    case "google_pay":
      return "Google Pay";
  }
}

function getChannelDescription(channel: PaystackCardChannel): string {
  switch (channel) {
    case "local":
      return "Nigerian Visa, Mastercard, Verve, Transfer & USSD";
    case "international":
      return "US, UK, Canadian & European Cards";
    case "amex":
      return "US & Global American Express Cards";
    case "google_pay":
      return "Google Pay (Android / Chrome browser)";
  }
}

function getRateDescription(channel: PaystackCardChannel): string {
  switch (channel) {
    case "local":
      return "1.5% + ₦100 (Max ₦2,000)";
    case "international":
      return "3.9% + ₦100";
    case "amex":
      return "4.5%";
    case "google_pay":
      return "3.9% + ₦100";
  }
}
