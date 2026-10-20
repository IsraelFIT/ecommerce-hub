"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 w-70 relative", className)}
      classNames={{
        months: "flex flex-col",
        month: "gap-y-3",
        month_caption: "flex justify-center relative items-center w-full h-8",
        caption_label: "text-sm font-bold text-foreground select-none",
        nav: "flex items-center justify-between absolute inset-x-0 top-1 px-1 w-full pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 flex items-center justify-center rounded-md border border-input shadow-2xs pointer-events-auto transition-opacity",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 flex items-center justify-center rounded-md border border-input shadow-2xs pointer-events-auto transition-opacity",
        ),
        month_grid: "w-full border-collapse table-fixed",
        weekdays: "",
        weekday:
          "text-muted-foreground font-semibold text-[0.75rem] text-center h-8 p-0 align-middle select-none",
        weeks: "",
        week: "",
        day: "h-9 p-0 text-center align-middle relative",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 mx-auto p-0 font-normal rounded-md inline-flex items-center justify-center transition-all text-foreground hover:bg-primary/10 hover:text-primary cursor-pointer text-sm",
        ),
        range_end: "day-range-end",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:font-bold [&>button]:rounded-md [&>button]:shadow-xs [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        today:
          "[&:not([data-selected])>button]:bg-primary/30 [&:not([data-selected])>button]:text-primary [&:not([data-selected])>button]:font-bold [&:not([data-selected])>button]:rounded-md",
        outside: "text-muted-foreground opacity-30 aria-selected:opacity-30",
        disabled:
          "text-muted-foreground opacity-20 cursor-not-allowed pointer-events-none",
        range_middle:
          "aria-selected:bg-accent/40 aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
