import Image from "next/image";
import { cn } from "@/lib/utils";

interface PaymentGatewayLogoProps {
  gateway?: string | null;
  className?: string;
  imgClassName?: string;
  showFallbackText?: boolean;
}

export function PaymentGatewayLogo({
  gateway,
  className,
  imgClassName,
  showFallbackText = true,
}: PaymentGatewayLogoProps) {
  const clean = (gateway || "").toLowerCase().trim();

  if (clean.includes("paystack")) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center shrink-0",
          className,
        )}
      >
        <Image
          src="/logos/paystack.png"
          alt="Paystack"
          width={80}
          height={20}
          unoptimized
          className={cn("h-4.5 w-auto object-contain", imgClassName)}
        />
      </div>
    );
  }

  if (clean.includes("stripe")) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center shrink-0",
          className,
        )}
      >
        <Image
          src="/logos/stripe.png"
          alt="Stripe"
          width={60}
          height={20}
          unoptimized
          className={cn("h-4 w-auto object-contain", imgClassName)}
        />
      </div>
    );
  }

  if (!showFallbackText) return null;

  return (
    <span
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      {gateway || "Direct"}
    </span>
  );
}
