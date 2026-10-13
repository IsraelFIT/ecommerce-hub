"use client";

import { useParams } from "next/navigation";
import { useStoreInvalidPaths } from "@/hooks/invalid-paths";
import { getRootAppUrl } from "@/utils/helper";

export function StoreFooter() {
  const isInvalid = useStoreInvalidPaths();
  const params = useParams();
  const tenant = (params?.tenant as string) || "store";

  const formattedStoreName = tenant
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  if (isInvalid) return null;

  return (
    <footer className="mt-auto border-t border-border bg-card py-5 text-xs text-muted-foreground">
      <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          © {new Date().getFullYear()} {formattedStoreName}.
        </div>
        <p>
          Powered by{" "}
          <span className="font-semibold text-foreground">
            <a
              href={getRootAppUrl("/")}
              className="hover:underline hover:text-primary transition-colors"
            >
              EcommerceHub
            </a>
          </span>{" "}
          Multi-Tenant Engine.
        </p>
      </div>
    </footer>
  );
}
