import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonWrapperProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  fallback?: React.ReactNode;
}

export function SkeletonWrapper({
  isLoading,
  children,
  className,
  fallback,
}: SkeletonWrapperProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  if (fallback) {
    return (
      <div className={cn("animate-pulse relative overflow-hidden", className)}>
        {fallback}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-primary/10 relative overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export function TableSkeleton({
  columns = 4,
  rows = 3,
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "border border-border rounded-xl bg-card overflow-hidden",
        className
      )}
    >
      <Table>
        <TableHeader className="bg-transparent">
          <TableRow className="hover:bg-transparent border-border">
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i} className="py-4">
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow
              key={rowIndex}
              className="border-border hover:bg-transparent"
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex} className="py-4">
                  <div className="h-5 w-full max-w-[80%] bg-muted/40 rounded animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
