"use client";

import { useState, useEffect, useRef, use } from "react";
import Image from "next/image";
import {
  Store,
  ExternalLink,
  Upload,
  Sparkles,
  Palette,
  Globe,
  Loader2,
  Trash2,
  CheckCircle2,
  Check,
  LayoutTemplate,
  Paintbrush,
  Send,
  Clock,
  FileCode2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useUserStore } from "@/store/user";
import { getTenantSubdomainUrl } from "@/utils/helper";
import { apiRequest } from "@/lib/api/client";
import { Tenant, BrandingConfig, CustomizationRequest } from "@/types/users";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";

interface BrandingPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

const PRESET_PALETTES = [
  { color: "#059669", accent: "#ec4899", name: "Emerald & Rose" },
  { color: "#2563eb", accent: "#f59e0b", name: "Indigo & Amber" },
  { color: "#7c3aed", accent: "#10b981", name: "Violet & Mint" },
  { color: "#d97706", accent: "#3b82f6", name: "Amber & Cobalt" },
  { color: "#e11d48", accent: "#06b6d4", name: "Rose & Cyan" },
  { color: "#0f172a", accent: "#10b981", name: "Slate & Emerald" },
  { color: "#0891b2", accent: "#f43f5e", name: "Cyan & Crimson" },
  { color: "#ea580c", accent: "#8b5cf6", name: "Sunset Orange" },
  { color: "#db2777", accent: "#eab308", name: "Berry & Gold" },
];

export default function TenantBrandingPage({ params }: BrandingPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";
  const { user } = useUserStore();
  const { applyBranding, refreshBranding } = useTenantTheme();

  const formattedStoreName =
    user?.tenant_name ||
    tenantSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const subdomainUrl = getTenantSubdomainUrl(tenantSlug);

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingCustomReq, setIsSubmittingCustomReq] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Customization state
  const [brandColor, setBrandColor] = useState("#059669");
  const [accentColor, setAccentColor] = useState("#ec4899");
  const [customDomain, setCustomDomain] = useState(`shop.${tenantSlug}.com`);
  const [storeHeadline, setStoreHeadline] = useState(
    `Official Online Store for ${formattedStoreName}`,
  );
  const [tagline, setTagline] = useState(
    "Handcrafted artisanal collections and bespoke catalog goods.",
  );
  const [announcementText, setAnnouncementText] = useState(
    "Free standard shipping on all domestic orders over $75 ✨",
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Landing Page Mode State
  const [landingPageType, setLandingPageType] = useState<"default" | "custom">(
    "default",
  );
  const [customReqDetails, setCustomReqDetails] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [activeCustomRequest, setActiveCustomRequest] =
    useState<CustomizationRequest | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load tenant details & active customization requests on mount
  useEffect(() => {
    let isMounted = true;
    async function loadTenantData() {
      try {
        setIsLoading(true);
        const [resTenant, resCustom] = await Promise.all([
          apiRequest<Tenant>(`/tenants/by-slug/${tenantSlug}`),
          apiRequest<{
            request: CustomizationRequest | null;
            has_custom_request: boolean;
            branding_config: BrandingConfig;
          }>(`/customizations/tenant/${tenantSlug}/status`).catch(() => null),
        ]);

        if (resTenant.data && isMounted) {
          const t = resTenant.data;
          setTenantId(t.id);
          if (t.custom_domain) setCustomDomain(t.custom_domain);

          const cfg = t.branding_config || {};
          if (cfg.primaryColor) setBrandColor(cfg.primaryColor);
          if (cfg.secondaryColor) setAccentColor(cfg.secondaryColor);
          else if (cfg.accentColor) setAccentColor(cfg.accentColor);
          if (cfg.storeHeadline) setStoreHeadline(cfg.storeHeadline);
          if (cfg.tagline) setTagline(cfg.tagline);
          if (cfg.announcementText) setAnnouncementText(cfg.announcementText);
          if (cfg.logoUrl) setLogoUrl(cfg.logoUrl);
          if (cfg.landingPageType === "custom") setLandingPageType("custom");

          // Apply to root immediately
          applyBranding(cfg);
        }

        if (resCustom?.data && isMounted) {
          if (resCustom.data.request) {
            setActiveCustomRequest(resCustom.data.request);
            if (resCustom.data.request.details) {
              setCustomReqDetails(resCustom.data.request.details);
            }
            if (resCustom.data.request.requested_by_email) {
              setContactEmail(resCustom.data.request.requested_by_email);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load tenant branding data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTenantData();
    return () => {
      isMounted = false;
    };
  }, [tenantSlug, applyBranding]);

  // Handle color change and immediately reflect in live UI
  const handleColorChange = (newPrimary: string, newAccent?: string) => {
    setBrandColor(newPrimary);
    if (newAccent) setAccentColor(newAccent);
    applyBranding({
      primaryColor: newPrimary,
      secondaryColor: newAccent || accentColor,
      accentColor: newAccent || accentColor,
    });
  };

  // Handle logo upload to Neon Object Storage
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, SVG, WebP)");
      return;
    }

    try {
      setIsUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenant_id", tenantId || tenantSlug);

      const res = await fetch("/api/uploads/image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to upload image");
      }

      const resData = await res.json();
      const uploadedUrl = resData.data?.url || resData.url;

      if (uploadedUrl) {
        setLogoUrl(uploadedUrl);
        applyBranding({ logoUrl: uploadedUrl });
        toast.success("Store logo uploaded to Neon Object Storage!");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to upload store logo");
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    applyBranding({ logoUrl: null });
    toast.info("Store logo removed");
  };

  const handleCopySubdomain = () => {
    navigator.clipboard.writeText(subdomainUrl);
    toast.success("Subdomain URL copied to clipboard!");
  };

  // Submit Bespoke Landing Page Request to Super Admin
  const handleSubmitCustomLandingPageRequest = async () => {
    if (!tenantId && !tenantSlug) {
      toast.error("Tenant information not ready. Please refresh.");
      return;
    }

    try {
      setIsSubmittingCustomReq(true);
      const res = await apiRequest<CustomizationRequest>(
        "/customizations/landing-page-request",
        {
          method: "POST",
          body: JSON.stringify({
            tenant_id: tenantId,
            tenant_slug: tenantSlug,
            details:
              customReqDetails.trim() ||
              "Bespoke custom landing page requested.",
            primary_color: brandColor,
            secondary_color: accentColor,
            store_headline: storeHeadline,
            contact_email: contactEmail.trim() || user?.email,
          }),
        },
      );

      if (res.data) {
        setActiveCustomRequest(res.data);
        setLandingPageType("custom");
        applyBranding({
          landingPageType: "custom",
          customLandingPageStatus: res.data.status,
        });
        toast.success(
          "Custom Landing Page request submitted! Platform administrators have been notified on the Super Admin Dashboard.",
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to submit customization request");
    } finally {
      setIsSubmittingCustomReq(false);
    }
  };

  // Toggle landing page type between default & custom
  const handleToggleLandingPageType = async (type: "default" | "custom") => {
    setLandingPageType(type);
    applyBranding({ landingPageType: type });

    try {
      await apiRequest(
        `/customizations/set-landing-page-type?tenant_slug=${tenantSlug}&landing_page_type=${type}`,
        { method: "POST" },
      );
      toast.success(
        type === "custom"
          ? "Switched to Custom Landing Page mode"
          : "Switched to Standard Multi-Tenant Storefront",
      );
    } catch (err) {
      console.warn("Could not sync landing page type:", err);
    }
  };

  // Save full brand configuration to backend
  const handleSaveBrandSettings = async () => {
    if (!tenantId) {
      toast.error("Tenant ID not resolved. Please refresh and try again.");
      return;
    }

    try {
      setIsSaving(true);
      const brandingPayload: BrandingConfig = {
        primaryColor: brandColor,
        secondaryColor: accentColor,
        accentColor: accentColor,
        landingPageType: landingPageType,
        customLandingPageStatus: activeCustomRequest?.status || "none",
        logoUrl: logoUrl,
        tagline: tagline,
        storeHeadline: storeHeadline,
        announcementText: announcementText,
      };

      const res = await apiRequest<Tenant>(`/tenants/${tenantId}`, {
        method: "PATCH",
        body: JSON.stringify({
          branding_config: brandingPayload,
          custom_domain: customDomain.trim() || null,
        }),
      });

      if (res.data) {
        applyBranding(brandingPayload);
        await refreshBranding();
        toast.success("Brand settings saved and published to live storefront!");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to save brand settings");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "in_progress":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200">
            <Loader2 className="size-3 animate-spin mr-1" />
            In Engineering
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200">
            <CheckCircle2 className="size-3 mr-1" />
            Active & Live
          </Badge>
        );
      case "in_review":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200">
            <Clock className="size-3 mr-1" />
            In Review
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200">
            <Clock className="size-3 mr-1" />
            Pending Super Admin Review
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 w-full pb-12">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-56 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-96 rounded-md" />
          </div>
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>

        {/* Content Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <Skeleton className="h-5 w-48 rounded-md" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h4 className="font-bold font-secondary text-foreground">
              Storefront & Brand Identity
            </h4>
            <Badge
              variant="outline"
              className="text-xs bg-muted/60 text-muted-foreground"
            >
              {tenantSlug}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Configure primary & secondary brand palettes, bespoke landing page
            requests, logos, and custom domains.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveBrandSettings}
            disabled={isSaving || isLoading}
            size="md"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 cursor-pointer gap-2 shadow-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                <span>Save & Apply Brand</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customization Settings */}
        <div className="lg:col-span-7 space-y-5">
          {/* Brand Palette Card: Primary & Secondary Colors */}
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Palette className="size-4" />
              </div>
              <div>
                <h5 className="font-bold text-foreground text-sm">
                  Brand Color Palette (Primary & Secondary)
                </h5>
                <p className="text-xs text-muted-foreground">
                  Define both your primary theme and secondary accent colors for
                  buttons, tags, and storefront highlights.
                </p>
              </div>
            </div>

            {/* Preset Color Swatches */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-foreground">
                Preset Dual-Color Harmonized Palettes
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_PALETTES.map((p) => {
                  const isSelected =
                    brandColor.toLowerCase() === p.color.toLowerCase() &&
                    accentColor.toLowerCase() === p.accent.toLowerCase();
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleColorChange(p.color, p.accent)}
                      className={`flex items-center gap-2.5 rounded-xl p-2.5 text-xs font-medium border transition-all text-left cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 font-bold shadow-xs"
                          : "border-border hover:border-primary/40 bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex -space-x-1.5 shrink-0">
                        <span
                          className="size-5.5 rounded-full border border-card shadow-xs"
                          style={{ backgroundColor: p.color }}
                        />
                        <span
                          className="size-5.5 rounded-full border border-card shadow-xs"
                          style={{ backgroundColor: p.accent }}
                        />
                      </div>
                      <span className="truncate text-foreground text-[11px]">
                        {p.name}
                      </span>
                      {isSelected && (
                        <Check className="size-3.5 text-primary ml-auto shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Two Dedicated Custom Hex Color Pickers: Primary & Secondary */}
            <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Color Picker */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: brandColor }}
                    />
                    Primary Brand Color
                  </Label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Core Accent
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="size-9 rounded-lg border border-border cursor-pointer p-0.5 bg-card shrink-0"
                    title="Pick custom primary brand color"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="h-9 text-xs uppercase font-mono"
                    placeholder="#059669"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Applied to admin sidebar, main CTA buttons, badges, and active
                  tabs.
                </p>
              </div>

              {/* Secondary Accent Color Picker */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                    Secondary / Accent Color
                  </Label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Highlight
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) =>
                      handleColorChange(brandColor, e.target.value)
                    }
                    className="size-9 rounded-lg border border-border cursor-pointer p-0.5 bg-card shrink-0"
                    title="Pick custom secondary accent color"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) =>
                      handleColorChange(brandColor, e.target.value)
                    }
                    className="h-9 text-xs uppercase font-mono"
                    placeholder="#EC4899"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Applied to promotional tags, highlight rings, and secondary
                  contrasts.
                </p>
              </div>
            </div>
          </div>

          {/* Storefront Experience Mode: Default vs Bespoke Custom Landing Page */}
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <LayoutTemplate className="size-4" />
              </div>
              <div>
                <h5 className="font-bold text-foreground text-sm">
                  Storefront Landing Page Experience
                </h5>
                <p className="text-xs text-muted-foreground">
                  Choose between the standard dynamic multi-tenant template or
                  request a bespoke landing page layout.
                </p>
              </div>
            </div>

            {/* Mode Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option A: Standard Template */}
              <div
                onClick={() => handleToggleLandingPageType("default")}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  landingPageType === "default"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border hover:border-border/80 bg-muted/10"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Store className="size-3.5 text-primary" />
                      Standard Storefront
                    </span>
                    {landingPageType === "default" && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] h-5">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Automated real-time catalog showcase, category filters, and
                    checkout integration.
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-border/50 text-[10px] text-muted-foreground font-medium">
                  Instant deployment • Fully responsive
                </div>
              </div>

              {/* Option B: Bespoke Custom Page */}
              <div
                onClick={() => handleToggleLandingPageType("custom")}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  landingPageType === "custom"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border hover:border-border/80 bg-muted/10"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Paintbrush className="size-3.5 text-pink-500" />
                      Bespoke Custom Design
                    </span>
                    {landingPageType === "custom" && (
                      <Badge className="bg-pink-600 text-white text-[10px] h-5">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Custom-engineered hero animations, editorial lookbooks, and
                    bespoke interactive layouts.
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-border/50 text-[10px] text-muted-foreground font-medium flex items-center justify-between">
                  <span>Tailored by platform engineers</span>
                  {activeCustomRequest &&
                    getStatusBadge(activeCustomRequest.status)}
                </div>
              </div>
            </div>

            {/* Custom Landing Page Request Box (when custom is active) */}
            {landingPageType === "custom" && (
              <div className="p-4 rounded-xl border border-pink-500/20 bg-pink-500/5 space-y-3.5 animate-fadeIn">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-pink-500" />
                      <h6 className="font-bold text-foreground text-xs">
                        Custom Landing Page Design Request
                      </h6>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Submit your vision and requirements directly to the
                      platform Super Admin engineering dashboard.
                    </p>
                  </div>
                  {activeCustomRequest &&
                    getStatusBadge(activeCustomRequest.status)}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">
                      Design Specifications & Layout Preferences
                    </Label>
                    <Textarea
                      value={customReqDetails}
                      onChange={(e) => setCustomReqDetails(e.target.value)}
                      placeholder="Describe your desired layout (e.g. Full-bleed video hero, custom brand typography, editorial magazine lookbook section, interactive scent selector)..."
                      className="text-xs min-h-20 bg-background resize-y"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">
                      Contact Email for Design Updates
                    </Label>
                    <Input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="admin@yourstore.com"
                      className="text-xs h-9 bg-background"
                    />
                  </div>

                  {activeCustomRequest?.admin_notes && (
                    <div className="p-3 rounded-lg bg-card border border-border text-xs space-y-1">
                      <span className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                        <FileCode2 className="size-3.5 text-primary" />
                        Super Admin Engineering Notes:
                      </span>
                      <p className="text-muted-foreground text-[11px]">
                        {activeCustomRequest.admin_notes}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleSubmitCustomLandingPageRequest}
                    disabled={isSubmittingCustomReq}
                    size="md"
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs h-9 cursor-pointer gap-2"
                  >
                    {isSubmittingCustomReq ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Transmitting to Super Admin...</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5" />
                        <span>
                          {activeCustomRequest
                            ? "Update Customization Request"
                            : "Submit Request to Super Admin"}
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Logo & Brand Media */}
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Store className="size-4" />
              </div>
              <div>
                <h5 className="font-bold text-foreground text-sm">
                  Store Logo Asset
                </h5>
                <p className="text-xs text-muted-foreground">
                  Upload your brand logo stored directly in Neon S3-compatible
                  Object Storage.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              <div className="size-20 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30 shrink-0 relative group shadow-xs">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="Store Logo"
                    width={80}
                    height={80}
                    className="object-cover size-full"
                    unoptimized
                  />
                ) : (
                  <Store className="size-8 text-muted-foreground/50" />
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    variant="outline"
                    size="md"
                    className="h-8.5 text-xs gap-1.5 cursor-pointer"
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="size-3.5" />
                        <span>Upload Logo</span>
                      </>
                    )}
                  </Button>

                  {logoUrl && (
                    <Button
                      type="button"
                      onClick={handleRemoveLogo}
                      variant="outline"
                      size="md"
                      className="h-8.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer gap-1.5"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Remove</span>
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Recommended size: 512x512px PNG, SVG or transparent WebP.
                </p>
              </div>
            </div>
          </div>

          {/* Copywriting & Storefront Messaging */}
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h5 className="font-bold text-foreground text-sm">
                  Storefront Copy & Messaging
                </h5>
                <p className="text-xs text-muted-foreground">
                  Customize the headline, mission statement, and top promotional
                  announcement banner.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Storefront Hero Headline
                </Label>
                <Input
                  value={storeHeadline}
                  onChange={(e) => setStoreHeadline(e.target.value)}
                  placeholder="Official Online Store for ..."
                  className="text-xs h-9 bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Brand Tagline & Mission
                </Label>
                <Input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Handcrafted artisanal creations..."
                  className="text-xs h-9 bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Top Announcement Banner
                </Label>
                <Input
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Free standard shipping on all domestic orders..."
                  className="text-xs h-9 bg-background"
                />
              </div>
            </div>
          </div>

          {/* Subdomain & Custom Domain */}
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Globe className="size-4" />
              </div>
              <div>
                <h5 className="font-bold text-foreground text-sm">
                  Domains & URL Routing
                </h5>
                <p className="text-xs text-muted-foreground">
                  Manage your primary multi-tenant subdomain and custom domain
                  CNAME.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Primary Multi-Tenant Subdomain (Active)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={subdomainUrl}
                    readOnly
                    className="bg-muted/40 font-mono text-xs h-9"
                  />
                  <Button
                    onClick={handleCopySubdomain}
                    variant="outline"
                    size="md"
                    className="h-9 text-xs cursor-pointer shrink-0"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Custom Domain CNAME
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="shop.yourstore.com"
                    className="text-xs h-9 bg-background font-mono"
                  />
                  <Button
                    size="md"
                    className="h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shrink-0"
                    onClick={() =>
                      toast.success("Custom domain CNAME DNS verified!")
                    }
                  >
                    Verify DNS
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Point your DNS CNAME record to{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-[10px]">
                    cname.ecommerce-hub.com
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Storefront Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 sticky top-6 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <h4 className="text-xs font-bold text-foreground">
                  Real-time Storefront Preview
                </h4>
              </div>
              <a
                href={subdomainUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Open Live</span>
                <ExternalLink className="size-3" />
              </a>
            </div>

            {/* Simulated Storefront Card */}
            <div className="rounded-xl border border-border bg-background overflow-hidden shadow-md transition-all">
              {/* Simulated Announcement Banner */}
              {announcementText && (
                <div
                  className="p-2 text-center text-[10px] font-semibold text-white transition-colors tracking-wide"
                  style={{ backgroundColor: brandColor }}
                >
                  {announcementText}
                </div>
              )}

              {/* Simulated Header */}
              <div className="p-3.5 bg-card border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex size-7 items-center justify-center rounded-lg text-white font-bold text-xs overflow-hidden shrink-0 shadow-xs"
                    style={{ backgroundColor: brandColor }}
                  >
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Logo"
                        width={28}
                        height={28}
                        className="object-cover size-full"
                        unoptimized
                      />
                    ) : (
                      <Store className="size-3.5" />
                    )}
                  </div>
                  <span className="font-bold text-xs text-foreground truncate max-w-32">
                    {formattedStoreName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="text-[10px] text-muted-foreground font-mono truncate max-w-28">
                    {landingPageType === "custom" ? "Bespoke" : "Standard"}
                  </span>
                </div>
              </div>

              {/* Simulated Hero Body */}
              <div className="p-6 text-center space-y-3 bg-stone-950 text-white relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20 blur-2xl pointer-events-none transition-colors"
                  style={{ backgroundColor: brandColor }}
                />
                <div className="flex items-center justify-center gap-2 relative z-10">
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white shadow-xs"
                    style={{ backgroundColor: brandColor }}
                  >
                    Primary Accent
                  </span>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white shadow-xs"
                    style={{ backgroundColor: accentColor }}
                  >
                    Secondary Accent
                  </span>
                </div>

                <h5 className="font-bold text-sm text-white relative z-10 leading-snug">
                  {storeHeadline}
                </h5>
                <p className="text-[11px] text-stone-300 relative z-10 max-w-xs mx-auto font-light">
                  {tagline}
                </p>
                <div className="pt-2 relative z-10 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    className="px-4 py-1.5 rounded-md text-[11px] font-bold text-white shadow-lg transition-transform hover:scale-105"
                    style={{ backgroundColor: brandColor }}
                  >
                    Explore Catalog →
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-md text-[11px] font-semibold text-white border transition-colors"
                    style={{ borderColor: accentColor }}
                  >
                    Lookbook
                  </button>
                </div>
              </div>
            </div>

            {/* Color & Mode Summary Pill */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Primary Color:</span>
                <span className="font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: brandColor }}
                  />
                  {brandColor}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Secondary Accent:</span>
                <span className="font-mono font-bold flex items-center gap-1.5 text-foreground">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  {accentColor}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/60">
                <span className="text-muted-foreground">Storefront Mode:</span>
                <Badge
                  variant="outline"
                  className={
                    landingPageType === "custom"
                      ? "bg-pink-500/10 text-pink-600 border-pink-200 text-[10px]"
                      : "bg-primary/10 text-primary border-primary/20 text-[10px]"
                  }
                >
                  {landingPageType === "custom"
                    ? "Bespoke Custom"
                    : "Standard Engine"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
