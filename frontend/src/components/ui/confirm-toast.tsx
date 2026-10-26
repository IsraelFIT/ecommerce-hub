"use client";

import { ReactNode } from "react";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConfirmToastOptions {
  title: string;
  subtitle?: string;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "default";
  duration?: number;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function confirmToast({
  title,
  subtitle,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  duration = 10000,
  onConfirm,
  onCancel,
}: ConfirmToastOptions) {
  return toast.custom(
    (t) => (
      <div className="w-full sm:w-105 bg-card text-card-foreground border border-border shadow-md rounded-xl p-4 flex flex-col gap-3 font-sans">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                variant === "destructive"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm text-foreground">{title}</h4>
              {subtitle && (
                <p className="text-xs font-mono text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t);
              onCancel?.();
            }}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {typeof description === "string" ? (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        ) : (
          description
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium w-full sm:w-auto"
            onClick={() => {
              toast.dismiss(t);
              onCancel?.();
            }}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            className="h-8 text-xs font-medium w-full sm:w-auto"
            onClick={() => {
              toast.dismiss(t);
              onConfirm();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    ),
    { duration },
  );
}
