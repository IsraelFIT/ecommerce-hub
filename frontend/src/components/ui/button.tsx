"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { useUserStore } from "@/store/user";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent hover:bg-accent/10 hover:text-accent-foreground backdrop-blur-30",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-7 px-2.5 text-xs",
        md: "h-8 px-3",
        lg: "h-10 px-3",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size, asChild = false, style, ...props },
    ref,
  ) => {
    const { tenant, branding } = useTenantTheme();
    const { user } = useUserStore();

    // Only apply dynamic branding when not super_admin and there is an active tenant or tenant admin branding
    const isSuperAdmin = user?.role === "super_admin";

    const activeTenantBranding =
      tenant?.branding_config ||
      (user?.role === "tenant_admin"
        ? user.tenant_branding || user.branding_config
        : null);

    const primaryColor =
      activeTenantBranding?.primaryColor ||
      (tenant ? branding?.primaryColor : undefined);

    const secondaryColor =
      activeTenantBranding?.secondaryColor ||
      (tenant ? branding?.secondaryColor : undefined);

    const hasBranding =
      !isSuperAdmin && Boolean(primaryColor || secondaryColor);

    let dynamicStyle: React.CSSProperties = {};

    if (hasBranding) {
      if (variant === "default" && primaryColor) {
        dynamicStyle = {
          backgroundColor: primaryColor,
          color: "#ffffff",
        };
      } else if (variant === "secondary" && (secondaryColor || primaryColor)) {
        dynamicStyle = {
          backgroundColor: secondaryColor || primaryColor,
          color: "#ffffff",
        };
      } else if (variant === "outline" && (primaryColor || secondaryColor)) {
        const outlineColor = primaryColor || secondaryColor;
        dynamicStyle = {
          color: outlineColor,
        };
      }
    }

    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={{
          ...dynamicStyle,
          ...style,
        }}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
