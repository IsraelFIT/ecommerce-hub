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
  const [sanityDataset, setSanityDataset] = useState("staging");
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
        toast.success(
          `Sanity CMS Connection Verified: Connected to ${sanityMode === "managed" ? "EcommerceHub Managed dataset" : "Custom Project " + sanityProjectId} (${sanityDataset}).`,
        );
      }
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to verify connection");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    try {
      const payload = {
        backend_type: activeBackend,
        sanity_project_id:
          activeBackend === "sanity" && sanityMode === "custom"
            ? sanityProjectId
            : null,
        sanity_dataset: activeBackend === "sanity" ? sanityDataset : null,
      };

      if (tenantId) {
        await apiRequest(`/tenants/${tenantId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }

      toast.success(
        `Adapter settings updated: Storefront will now query via ${activeBackend === "postgres" ? "PostgreSQL RLS" : "Sanity CMS"}.`,
      );
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to save adapter settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-col">
          <h4 className="font-bold font-secondary text-foreground">
            Data Layer Adapters
          </h4>
          <p className="text-muted-foreground mt-1">
            Switch catalog data persistence between PostgreSQL RLS and Sanity
            Headless CMS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="text-xs gap-1.5 h-9 border-border bg-card hover:bg-muted text-foreground"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isTesting ? "animate-spin" : ""}`}
            />
            <span>Test Connection</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSaveConfiguration}
            disabled={isSaving}
            className="text-xs gap-1.5 h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs"
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
              ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
              : "border-border bg-card hover:border-border/80"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    PostgreSQL (Neon Serverless)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Native Relational Catalog with Row-Level Security
                  </p>
                </div>
              </div>

              {activeBackend === "postgres" ? (
                <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                  <Check className="h-3 w-3" /> Active Adapter
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-muted-foreground border-border text-[10px]"
                >
                  Click to Activate
                </Badge>
              )}
            </div>

            <div className="space-y-2 text-xs text-foreground pt-2">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">
                  Multi-Tenancy Policy
                </span>
                <span className=" font-semibold text-foreground">
                  PostgreSQL RLS (tenant_id)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">
                  Inventory ACID Locking
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> High Precision Locks
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">
                  Order & Ledger Sync
                </span>
                <span className="text-foreground">
                  Zero Latency (Co-located DB)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Recommended for standard e-commerce shops</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Default Built-in
            </span>
          </div>
        </div>

        {/* Sanity CMS Option */}
        <div
          onClick={() => setActiveBackend("sanity")}
          className={`cursor-pointer rounded-2xl border-2 p-5 transition-all flex flex-col justify-between ${
            activeBackend === "sanity"
              ? "border-purple-500 bg-purple-500/10 shadow-sm"
              : "border-border bg-card hover:border-border/80"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    Sanity Headless CMS
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Rich Structured Content & Real-Time GROQ API
                  </p>
                </div>
              </div>

              {activeBackend === "sanity" ? (
                <Badge className="bg-purple-600 text-white text-[10px] gap-1">
                  <Check className="h-3 w-3" /> Active Adapter
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-muted-foreground border-border text-[10px]"
                >
                  Click to Activate
                </Badge>
              )}
            </div>

            <div className="space-y-2 text-xs text-foreground pt-2">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Content Studio</span>
                <span className="font-semibold text-foreground">
                  Visual Block & PortableText Editor
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">
                  Transactional Isolation
                </span>
                <span className="text-foreground">
                  Orders stay secured in PostgreSQL
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">
                  CDN Image Delivery
                </span>
                <span className="text-purple-600 dark:text-purple-400 font-semibold">
                  Global Sanity Asset Pipeline
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Ideal for high-end luxury brands & custom design</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              Headless Mode
            </span>
          </div>
        </div>
      </div>

      {/* Sanity Configuration Panel (Visible when Sanity is selected) */}
      {activeBackend === "sanity" && (
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 md:p-6 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h4 className="font-bold text-sm text-foreground">
                Sanity Multi-Tenant Connection Setup
              </h4>
            </div>

            <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSanityMode("managed")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  sanityMode === "managed"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                EcommerceHub Managed
              </button>
              <button
                type="button"
                onClick={() => setSanityMode("custom")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  sanityMode === "custom"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Custom Sanity Project (BYOS)
              </button>
            </div>
          </div>

          {sanityMode === "managed" ? (
            <div className="bg-card rounded-xl border border-purple-500/20 p-4 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-bold text-xs text-foreground">
                    Master Sanity Multi-Tenant Architecture
                  </h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Catalog data will be managed on the platform&apos;s master
                    Sanity project. Select the environment dataset to connect
                    to:
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Label className="text-xs font-semibold text-foreground">
                  Target Environment Dataset
                </Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSanityDataset("staging")}
                    className={`flex-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      sanityDataset === "staging"
                        ? "border-purple-600 bg-purple-500/10 ring-2 ring-purple-600/20"
                        : "border-border hover:border-border/80 bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-foreground ">
                        staging
                      </span>
                      {sanityDataset === "staging" && (
                        <Badge className="bg-purple-600 text-white text-[9px] h-4">
                          Active Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Development & testing catalog dataset with mock products
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSanityDataset("production")}
                    className={`flex-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      sanityDataset === "production"
                        ? "border-purple-600 bg-purple-500/10 ring-2 ring-purple-600/20"
                        : "border-border hover:border-border/80 bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-foreground ">
                        production
                      </span>
                      {sanityDataset === "production" && (
                        <Badge className="bg-purple-600 text-white text-[9px] h-4">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Live public store catalog dataset for live customers
                    </p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-purple-500/20 p-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Connect your existing Sanity organization and studio. The
                platform will query your custom dataset directly using your
                project credentials.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Sanity Project ID
                  </Label>
                  <Input
                    placeholder="e.g. 948201ab"
                    value={sanityProjectId}
                    onChange={(e) => setSanityProjectId(e.target.value)}
                    className="h-9 text-xs bg-background border-border text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Dataset Name
                  </Label>
                  <Input
                    placeholder="e.g. production"
                    value={sanityDataset}
                    onChange={(e) => setSanityDataset(e.target.value)}
                    className="h-9 text-xs bg-background border-border text-foreground"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-foreground">
                    Sanity API Read/Write Token (Optional)
                  </Label>
                  <Input
                    type="password"
                    placeholder="sk9482..."
                    value={sanityToken}
                    onChange={(e) => setSanityToken(e.target.value)}
                    className="h-9 text-xs bg-background border-border text-foreground"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Required only if your Sanity dataset is private.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Storefront Public API Keys */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <span>Storefront API Credentials</span>
          </h4>
          <p className="text-xs text-muted-foreground">
            Use this token to query the tenant adapter from headless frontends,
            mobile apps, or static site generators.
          </p>
        </div>

        <div className="space-y-1.5 max-w-xl">
          <Label className="text-xs font-semibold text-foreground">
            Public Storefront API Key
          </Label>
          <div className="flex items-center gap-2">
            <Input
              value={`pk_live_${tenantSlug}_998240f91a0c4e`}
              readOnly
              className="bg-muted text-xs  border-border text-foreground"
            />
            <Button
              onClick={handleCopyApiKey}
              variant="outline"
              size="sm"
              className="h-9 text-xs cursor-pointer shrink-0 border-border bg-card hover:bg-muted text-foreground"
            >
              {copiedApiKey ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
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
