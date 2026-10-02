"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { CORE_NAV_ITEMS, EXTRA_CORE_PAGE_INFO } from "@/store/core-sidebar";

export function CoreBreadcrumb({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  // Split pathname into clean segments (ignoring 'core' prefix if present for clean display)
  const rawSegments = pathname.split("/").filter(Boolean);
  const segments = rawSegments.filter((s) => s !== "core");
  const isVisible =
    segments.length > 0 && pathname !== "/core" && pathname !== "/";

  // Find matching nav item
  const currentSegment = segments[0] || "";
  const navItem = CORE_NAV_ITEMS.find(
    (item) =>
      item.href.endsWith(`/${currentSegment}`) || item.id === currentSegment,
  );

  const parentName =
    navItem?.shortLabel ||
    navItem?.title ||
    (currentSegment
      ? currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1)
      : "Overview");

  return (
    <div
      className={cn(
        "grid transition-all duration-300 ease-out z-0 relative shrink-0",
        isVisible
          ? "grid-rows-[1fr] opacity-100 translate-y-0 pointer-events-auto"
          : "grid-rows-[0fr] opacity-0 translate-y-3 pointer-events-none",
        className,
      )}
    >
      <div className="overflow-hidden">
        <div className="flex items-center gap-2 p-1.5 pb-3 mx-3.5 -mb-2 rounded-t-xl border-t border-l border-r border-border bg-card/60 text-xs md:text-sm">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex items-center justify-center size-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer mr-0.5"
          >
            <ChevronLeft className="size-4" />
          </button>

          {/* Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <Link
              href="/"
              className="text-muted-foreground hover:text-primary transition-colors truncate"
            >
              Core
            </Link>

            <span
              className="text-muted-foreground/60 select-none font-normal"
              aria-hidden="true"
            >
              /
            </span>

            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1;
              const href = `/${segments.slice(0, index + 1).join("/")}`;

              let title = segment;
              if (index === 0) {
                title = parentName;
              } else if (isLast) {
                title =
                  navItem?.detailTitle ||
                  EXTRA_CORE_PAGE_INFO[href]?.title ||
                  EXTRA_CORE_PAGE_INFO[`/core${href}`]?.title ||
                  segment.charAt(0).toUpperCase() + segment.slice(1);
              } else {
                title = segment.charAt(0).toUpperCase() + segment.slice(1);
              }

              return (
                <div key={href} className="flex items-center gap-2">
                  {index > 0 && (
                    <span
                      className="text-muted-foreground/60 select-none font-normal"
                      aria-hidden="true"
                    >
                      /
                    </span>
                  )}

                  {isLast ? (
                    <span className="font-semibold text-foreground truncate max-w-50 md:max-w-none">
                      {title}
                    </span>
                  ) : (
                    <Link
                      href={href}
                      className="text-muted-foreground hover:text-primary transition-colors truncate max-w-37.5 md:max-w-none"
                    >
                      {title}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

export default CoreBreadcrumb;
