"use client";

import { useState, use } from "react";
import { Database, Layers, Key, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdaptersPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function TenantAdaptersPage({ params }: AdaptersPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";

  const [copiedApiKey, setCopiedApiKey] = useState(false);

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(`pk_live_${tenantSlug}_998240f91a0c4e`);
    setCopiedApiKey(true);
    toast.success("Public Storefront API Key copied!");
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* PostgreSQL RLS Adapter */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900">
                  PostgreSQL Database Isolation
                </h4>
                <p className="text-[11px] text-stone-500">
                  Row-Level Security (RLS) Policy
                </p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              Active
            </span>
          </div>

          <div className="space-y-2 text-xs text-stone-600">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-400">Tenant Slug</span>
              <span className="font-mono text-stone-800 font-semibold">
                {tenantSlug}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-400">RLS Tenant Filter</span>
              <span className="font-mono text-stone-800">
                tenant_id = &apos;{tenantSlug}&apos;
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-400">Backup Retention</span>
              <span className="text-stone-800">Daily Snapshots (30 Days)</span>
            </div>
          </div>
        </div>

        {/* Headless CMS Adapter */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900">
                  Sanity / Headless CMS Adapter
                </h4>
                <p className="text-[11px] text-stone-500">
                  Product & Landing Page Sync
                </p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200">
              Connected
            </span>
          </div>

          <div className="space-y-2 text-xs text-stone-600">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-400">Dataset</span>
              <span className="font-mono text-stone-800">
                production-{tenantSlug}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-400">Webhook Sync</span>
              <span className="text-emerald-600 font-semibold">
                Enabled (200 OK)
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-400">Revalidation</span>
              <span className="text-stone-800">On-Demand Tag Purge</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys & Webhooks Card */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4 max-w-2xl">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <Key className="h-4 w-4 text-stone-500" />
            <span>Storefront API Credentials</span>
          </h4>
          <p className="text-xs text-stone-500">
            Use these keys for custom headless storefronts or mobile apps.
          </p>
        </div>

        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-stone-700">
              Public Storefront API Key
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={`pk_live_${tenantSlug}_998240f91a0c4e`}
                readOnly
                className="bg-stone-50 text-xs font-mono"
              />
              <Button
                onClick={handleCopyApiKey}
                variant="outline"
                size="md"
                className="h-9 text-xs cursor-pointer"
              >
                {copiedApiKey ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
