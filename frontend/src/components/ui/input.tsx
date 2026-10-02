"use client";
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { sanitizeInput } from "@/utils/helper";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitizedValue = sanitizeInput(e.target.value, type || "text");
      e.target.value = sanitizedValue;

      if (onChange) {
        onChange(e);
      }
    };

    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    const inputElement = (
      <input
        ref={ref}
        type={inputType}
        data-slot="input"
        onChange={handleChange}
        className={cn(
          "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 font-primary",
          isPassword && "pr-9",
          className,
        )}
        {...props}
      />
    );

    if (isPassword) {
      return (
        <div className="relative w-full flex items-center">
          {inputElement}
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none p-1 rounded-sm"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      );
    }

    return inputElement;
  },
);
Input.displayName = "Input";

export { Input };
