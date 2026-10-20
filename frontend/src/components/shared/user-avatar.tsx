"use client";

import { useState } from "react";
import Image from "next/image";
import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "rounded";
  className?: string;
  fallbackClassName?: string;
  alt?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-base",
};

const iconSizes = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().charAt(0).toUpperCase();
  }
  return "";
}

export function UserAvatar({
  src,
  name,
  email,
  size = "md",
  shape = "rounded",
  className,
  fallbackClassName,
  alt,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = getInitials(name, email);
  const roundedClass = shape === "circle" ? "rounded-full" : "rounded-lg";

  const hasValidImage = Boolean(src && src.trim() && !imageError);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden border border-border bg-muted/60 flex items-center justify-center font-bold select-none",
        sizeClasses[size],
        roundedClass,
        className,
      )}
    >
      {hasValidImage ? (
        <Image
          src={src!}
          alt={alt || name || "User Avatar"}
          fill
          unoptimized
          sizes="64px"
          className="object-cover w-full h-full"
          onError={() => setImageError(true)}
        />
      ) : initials ? (
        <span
          className={cn(
            "font-semibold text-primary/90 flex items-center justify-center uppercase tracking-wider",
            fallbackClassName,
          )}
        >
          {initials}
        </span>
      ) : (
        <UserIcon
          className={cn(
            "text-muted-foreground",
            iconSizes[size],
            fallbackClassName,
          )}
        />
      )}
    </div>
  );
}
