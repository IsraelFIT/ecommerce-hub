"use client";

import { useEffect, useState, useMemo } from "react";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { getTenantStats, type TenantSellerStats } from "@/lib/api/tenants";
import type { StatConfigItem } from "@/types";

interface TenantStatsProps {
  storeName?: string;
}

export function TenantStats({}: TenantStatsProps) {
  const { branding, tenant } = useTenantTheme();
  const [dbStats, setDbStats] = useState<TenantSellerStats | null>(null);

  useEffect(() => {
    if (!tenant?.slug) return;
    let isMounted = true;
    getTenantStats(tenant.slug)
      .then((res) => {
        if (isMounted && res.status === "success" && res.data) {
          setDbStats(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load seller stats:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [tenant?.slug]);

  const displayStats = useMemo(() => {
    const rawConfig = branding?.statsConfig;
    const configItems: StatConfigItem[] =
      rawConfig && Array.isArray(rawConfig) && rawConfig.length > 0
        ? rawConfig.filter((item) => item.enabled !== false).slice(0, 4)
        : [
            {
              id: "satisfaction",
              type: "satisfaction",
              label: "Satisfaction Rate",
            },
            {
              id: "orders",
              type: "orders",
              label: "Orders Delivered",
            },
            {
              id: "authentic",
              type: "custom",
              label: "Authentic Materials",
              value: "100%",
            },
            {
              id: "support",
              type: "custom",
              label: "Client Support",
              value: "24/7",
            },
          ];

    return configItems.map((item) => {
      if (item.type === "satisfaction") {
        if (dbStats && typeof dbStats.rating === "number") {
          const pct = Math.round((dbStats.rating / 5) * 100);
          return {
            label: item.label || "Satisfaction Rate",
            value: `${pct}%`,
          };
        }
        return {
          label: item.label || "Satisfaction Rate",
          value: item.value || "99.8%",
        };
      }

      if (item.type === "orders") {
        if (dbStats && typeof dbStats.orders_fulfilled === "number") {
          const orders = dbStats.orders_fulfilled;
          const formatted =
            orders >= 1000
              ? `${(orders / 1000).toFixed(1)}k+`
              : orders > 0
                ? `${orders}+`
                : "0+";
          return {
            label: item.label || "Orders Delivered",
            value: formatted,
          };
        }
        return {
          label: item.label || "Orders Delivered",
          value: item.value || "5k+",
        };
      }

      if (item.type === "products") {
        if (dbStats && typeof dbStats.total_products === "number") {
          return {
            label: item.label || "Curated Products",
            value: `${dbStats.total_products}+`,
          };
        }
        return {
          label: item.label || "Curated Products",
          value: item.value || "20+",
        };
      }

      return {
        label: item.label || "Custom Metric",
        value: item.customValue || item.value || "-",
      };
    });
  }, [branding?.statsConfig, dbStats]);

  if (!displayStats || displayStats.length === 0) {
    return null;
  }

  const gridColsClass =
    displayStats.length === 1
      ? "grid-cols-1"
      : displayStats.length === 2
        ? "grid-cols-2"
        : displayStats.length === 3
          ? "grid-cols-3"
          : "grid-cols-2 lg:grid-cols-4";

  return (
    <section className="bg-stone-900 text-stone-100 py-16 border-t border-b border-stone-800">
      <div className="container px-4 md:px-8">
        <div className={`w-full grid ${gridColsClass} gap-12 lg:gap-8`}>
          {displayStats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center gap-3"
            >
              <h1 className="font-secondary font-semibold text-3xl md:text-4xl lg:text-5xl leading-none tracking-tight text-white">
                {stat.value}
              </h1>
              <span className="text-[10px] md:text-xs tracking-[0.2em] uppercase font-medium text-stone-400">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
