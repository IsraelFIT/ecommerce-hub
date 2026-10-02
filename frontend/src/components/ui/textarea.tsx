"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { sanitizeInput } from "@/utils/helper";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, onChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const sanitizedValue = sanitizeInput(e.target.value, "textarea");
    e.target.value = sanitizedValue;

    if (onChange) {
      onChange(e);
    }
  };

  return (
    <textarea
      className={cn(
        "flex min-h-15 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      ref={ref}
      onChange={handleChange}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
