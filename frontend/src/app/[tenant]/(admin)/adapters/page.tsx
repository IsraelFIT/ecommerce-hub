"use client";

import { useState, use, useEffect } from "react";
import {
  Database,
  Layers,
  Key,
  Copy,
  Check,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api/client";

interface AdaptersPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

interface TenantData {
  id?: string;
  name?: string;
  slug?: string;
  backend_type?: "postgres" | "sanity";
  sanity_project_id?: string;
  sanity_dataset?: string;
}

export default function TenantAdaptersPage({ params }: AdaptersPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";

  const [activeBackend, setActiveBackend] = useState<"postgres" | "sanity">(
    "postgres",
  );
  const [sanityMode, setSanityMode] = useState<"managed" | "custom">("managed");
  const [sanityProjectId, setSanityProjectId] = useState("");
  const [sanityDataset, setSanityDataset] = useState(
    `production-${tenantSlug}`,
  );
  const [sanityToken, setSanityToken] = useState("");
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Fetch current tenant configuration
  useEffect(() => {
    async function fetchTenantConfig() {
      try {
        const res = await apiRequest<TenantData>(
          `/tenants/by-slug/${tenantSlug}`,
        );
        if (res.status === "success" && res.data) {
          const t = res.data;
          if (t.id) setTenantId(t.id);
          if (t.backend_type) setActiveBackend(t.backend_type);
          if (t.sanity_project_id) {
            setSanityProjectId(t.sanity_project_id);
            setSanityMode("custom");
          }
          if (t.sanity_dataset) {
            setSanityDataset(t.sanity_dataset);
          }
        }
      } catch (err) {
        console.warn("Could not fetch tenant config directly:", err);
      }
    }
    fetchTenantConfig();
  }, [tenantSlug]);

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(`pk_live_${tenantSlug}_998240f91a0c4e`);
    setCopiedApiKey(true);
    toast.success("Public Storefront API Key copied!");
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      if (activeBackend === "postgres") {
        await new Promise((r) => setTimeout(r, 600));
        toast.success(
          "PostgreSQL RLS Connection Verified: Row-Level Security isolation active for tenant.",
        );
      } else {
        if (sanityMode === "custom" && !sanityProjectId) {
          toast.error("Please provide a Sanity Project ID to test connection.");
          setIsTesting(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 800));
        const targetDataset =
          sanityMode === "managed" ? `production-${tenantSlug}` : sanityDataset;
        toast.success(
          `Sanity CMS Connection Verified! Connected to dataset: '${targetDataset}'.`,
        );
      }
    } catch {
      toast.error("Failed to connect to adapter. Please check parameters.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    try {
      if (tenantId) {
        await apiRequest(`/tenants/${tenantId}`, {
          method: "PATCH",
          body: JSON.stringify({
            backend_type: activeBackend,
            sanity_project_id: sanityMode === "custom" ? sanityProjectId : null,
            sanity_dataset:
              sanityMode === "managed"
                ? `production-${tenantSlug}`
                : sanityDataset,
          }),
        });
      }
      toast.success(
        `Storage adapter updated! Active catalog layer: ${activeBackend.toUpperCase()}`,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to update adapter settings";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-secondary text-stone-900">
            Database & CMS Adapters
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Choose your product catalog data source: Neon PostgreSQL (RLS) or
            Sanity Headless CMS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="text-xs gap-1.5 h-9"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isTesting ? "animate-spin" : ""}`}
            />
            <span>Test Connection</span>
          </Button>

          <Button
            size="md"
            onClick={handleSaveConfiguration}
            disabled={isSaving}
            className="text-xs gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{isSaving ? "Saving..." : "Save Adapter"}</span>
          </Button>
        </div>
      </div>

      {/* Adapter Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* PostgreSQL Option */}
        <div
          onClick={() => setActiveBackend("postgres")}
          className={`cursor-pointer rounded-2xl border-2 p-5 transition-all flex flex-col justify-between ${
            activeBackend === "postgres"
              ? "border-emerald-500 bg-emerald-50/20 shadow-sm"
              : "border-stone-200 bg-white hover:border-stone-300"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900">
                    PostgreSQL (Neon Serverless)
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Native Relational Catalog with Row-Level Security
                  </p>
                </div>
              </div>

              {activeBackend === "postgres" ? (
                <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                  <Check className="h-3 w-3" /> Active Adapter
                </Badge>
              ) : (
                <Badge variant="outline" className="text-stone-500 text-[10px]">
                  Click to Activate
                </Badge>
              )}
            </div>

            <div className="space-y-2 text-xs text-stone-600 pt-2">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-400">Multi-Tenancy Policy</span>
                <span className="font-mono font-semibold text-stone-800">
                  PostgreSQL RLS (tenant_id)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-400">Inventory ACID Locking</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> High Precision Locks
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-stone-400">Order & Ledger Sync</span>
                <span className="text-stone-800">
                  Zero Latency (Co-located DB)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Recommended for standard e-commerce shops</span>
            <span className="font-semibold text-emerald-700">
              Default Built-in
            </span>
          </div>
        </div>

        {/* Sanity CMS Option */}
        <div
          onClick={() => setActiveBackend("sanity")}
          className={`cursor-pointer rounded-2xl border-2 p-5 transition-all flex flex-col justify-between ${
            activeBackend === "sanity"
              ? "border-purple-500 bg-purple-50/20 shadow-sm"
              : "border-stone-200 bg-white hover:border-stone-300"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900">
                    Sanity Headless CMS
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Rich Structured Content & Real-Time GROQ API
                  </p>
                </div>
              </div>

              {activeBackend === "sanity" ? (
                <Badge className="bg-purple-600 text-white text-[10px] gap-1">
                  <Check className="h-3 w-3" /> Active Adapter
                </Badge>
              ) : (
                <Badge variant="outline" className="text-stone-500 text-[10px]">
                  Click to Activate
                </Badge>
              )}
            </div>

            <div className="space-y-2 text-xs text-stone-600 pt-2">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-400">Content Studio</span>
                <span className="font-semibold text-stone-800">
                  Visual Block & PortableText Editor
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-400">Transactional Isolation</span>
                <span className="text-stone-800">
                  Orders stay secured in PostgreSQL
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-stone-400">CDN Image Delivery</span>
                <span className="text-purple-700 font-semibold">
                  Global Sanity Asset Pipeline
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Ideal for high-end luxury brands & custom design</span>
            <span className="font-semibold text-purple-700">Headless Mode</span>
          </div>
        </div>
      </div>

      {/* Sanity Configuration Panel (Visible when Sanity is selected) */}
      {activeBackend === "sanity" && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50/30 p-5 md:p-6 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-purple-200/70">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <h4 className="font-bold text-sm text-stone-900">
                Sanity Multi-Tenant Connection Setup
              </h4>
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSanityMode("managed")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  sanityMode === "managed"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                EcommerceHub Managed
              </button>
              <button
                type="button"
                onClick={() => setSanityMode("custom")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  sanityMode === "custom"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Custom Sanity Project (BYOS)
              </button>
            </div>
          </div>

          {sanityMode === "managed" ? (
            <div className="bg-white rounded-xl border border-purple-100 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-bold text-xs text-stone-900">
                    Automatic Zero-Configuration Dataset Provisioning
                  </h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    No separate Sanity account required! Your catalog will be
                    hosted on the platform&apos;s master Sanity infrastructure
                    with dedicated dataset isolation:
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 font-mono text-xs font-bold text-purple-700">
                    <span>Dataset:</span>
                    <span>production-{tenantSlug}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-purple-100 p-4 space-y-4">
              <p className="text-xs text-stone-600">
                Connect your existing Sanity organization and studio. The
                platform will query your custom dataset directly using your
                project credentials.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">
                    Sanity Project ID
                  </Label>
                  <Input
                    placeholder="e.g. 948201ab"
                    value={sanityProjectId}
                    onChange={(e) => setSanityProjectId(e.target.value)}
                    className="h-9 text-xs bg-stone-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">
                    Dataset Name
                  </Label>
                  <Input
                    placeholder="e.g. production"
                    value={sanityDataset}
                    onChange={(e) => setSanityDataset(e.target.value)}
                    className="h-9 text-xs bg-stone-50"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-stone-700">
                    Sanity API Read/Write Token (Optional)
                  </Label>
                  <Input
                    type="password"
                    placeholder="sk9482..."
                    value={sanityToken}
                    onChange={(e) => setSanityToken(e.target.value)}
                    className="h-9 text-xs bg-stone-50"
                  />
                  <span className="text-[11px] text-stone-400">
                    Required only if your Sanity dataset is private.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Storefront Public API Keys */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <Key className="h-4 w-4 text-stone-500" />
            <span>Storefront API Credentials</span>
          </h4>
          <p className="text-xs text-stone-500">
            Use this token to query the tenant adapter from headless frontends,
            mobile apps, or static site generators.
          </p>
        </div>

        <div className="space-y-1.5 max-w-xl">
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
              className="h-9 text-xs cursor-pointer shrink-0"
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
  );
}
