"use client";

import { useState } from "react";
import { Database, Layers, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CoreAdaptersPage() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success(
        "Neon database schema and Sanity CMS dataset synchronized successfully!",
      );
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-5 w-full pb-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-secondary text-foreground">
            Data Layer & Interchangeable Storage Adapters
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage Lakebase Postgres (Neon Serverless) and Headless Sanity CMS
            synchronization
          </p>
        </div>

        <Button
          size="md"
          disabled={isSyncing}
          onClick={handleSync}
          className="gap-1.5 h-8 text-xs cursor-pointer self-start md:self-auto"
        >
          <RefreshCw
            className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`}
          />
          <span>{isSyncing ? "Syncing..." : "Sync Schema & Cache"}</span>
        </Button>
      </div>

      {/* Main Adapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Neon Postgres Adapter Card */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Database className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-secondary text-foreground">
                    Neon Serverless Postgres
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Lakebase Architecture • asyncpg Pooler
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1"
              >
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </Badge>
            </div>

            <div className="flex flex-col gap-2.5 mt-4 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card-gray/40 dark:bg-white/5 border border-border">
                <span className="text-muted-foreground">
                  Active Checkout Branch
                </span>
                <span className="font-mono font-bold text-primary">
                  staging
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card-gray/40 dark:bg-white/5 border border-border">
                <span className="text-muted-foreground">Project ID</span>
                <span className="font-mono text-foreground text-[11px]">
                  crimson-paper-76047648
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card-gray/40 dark:bg-white/5 border border-border">
                <span className="text-muted-foreground">Active Endpoint</span>
                <span className="font-mono text-muted-foreground text-[11px] truncate max-w-50">
                  ep-red-silence-b1x919l7
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card-gray/40 dark:bg-white/5 border border-border">
                <span className="text-muted-foreground">Connection Mode</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Pooled (PgBouncer) + Direct Unpooled
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Default Engine for Multi-Tenancy
            </span>
            <Badge
              variant="outline"
              className="text-[10px] bg-primary/10 text-primary border-primary/20"
            >
              Primary Adapter
            </Badge>
          </div>
        </div>

        {/* Sanity CMS Adapter Card */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Layers className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-secondary text-foreground">
                    Sanity Headless CMS
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Structured Content Data Layer
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1"
              >
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Ready
              </Badge>
            </div>

            <div className="flex flex-col gap-2.5 mt-4 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card-gray/40 dark:bg-white/5 border border-border">
                <span className="text-muted-foreground">Dataset Target</span>
                <span className="font-mono font-bold text-foreground">
                  production
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card-gray/40 dark:bg-white/5 border border-border">
                <span className="text-muted-foreground">
                  Dual-Write Support
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Enabled (Syncs to Postgres)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card-gray/40 dark:bg-white/5 border border-border">
                <span className="text-muted-foreground">
                  Content Versioning
                </span>
                <span className="font-mono text-muted-foreground">
                  Drafts & Published
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-card-gray/40 dark:bg-white/5 border border-border">
                <span className="text-muted-foreground">
                  Webhook Invalidation
                </span>
                <span className="font-semibold text-foreground">
                  Instant CDN Revalidation
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Optional Luxury Catalog Adapter
            </span>
            <Badge
              variant="outline"
              className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20"
            >
              CMS Extension
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
