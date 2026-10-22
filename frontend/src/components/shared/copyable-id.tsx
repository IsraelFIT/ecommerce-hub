"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { truncateId, copyToClipboard } from "@/utils/helper";
import { cn } from "@/lib/utils";

interface CopyableIdProps {
  id?: string | null;
  length?: number;
  prefix?: string;
  uppercase?: boolean;
  className?: string;
  textClassName?: string;
  iconClassName?: string;
  asLink?: string;
  showIcon?: boolean;
  toastMessage?: string;
  title?: string;
}

export function CopyableId({
  id,
  length = 7,
  prefix = "",
  uppercase = false,
  className,
  textClassName,
  iconClassName,
  asLink,
  showIcon = true,
  toastMessage,
  title,
}: CopyableIdProps) {
  const [copied, setCopied] = useState(false);

  if (!id) return null;

  const shortId = truncateId(id, length, { prefix, uppercase });

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const success = await copyToClipboard(id);
    if (success) {
      setCopied(true);
      toast.success(toastMessage || `Copied ${shortId} to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy ID to clipboard");
    }
  };

  const idElement = asLink ? (
    <Link
      href={asLink}
      className={cn(
        "hover:underline text-xs font-semibold text-foreground transition-colors",
        textClassName,
      )}
      title={title || `View details for ${id}`}
    >
      {shortId}
    </Link>
  ) : (
    <span
      className={cn("text-xs font-semibold text-foreground", textClassName)}
      title={title || `Full ID: ${id}`}
    >
      {shortId}
    </span>
  );

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 group select-none",
        className,
      )}
    >
      {idElement}

      {showIcon && (
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "text-muted-foreground/70 hover:text-foreground transition-all cursor-pointer",
            copied &&
              "text-emerald-600 dark:text-emerald-400 hover:text-emerald-600",
            iconClassName,
          )}
          title={`Copy full ID: ${id}`}
          aria-label="Copy ID to clipboard"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          ) : (
            <Copy className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
      )}
    </div>
  );
}

export default CopyableId;
