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
  ImageIcon,
  BookOpen,
  MessageSquareText,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  HeartHandshake,
  FileText,
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
import {
  getTenantBySlug,
  updateTenant,
  uploadImage,
  submitLandingPageRequest,
  setLandingPageType as apiSetLandingPageType,
  getTenantCustomizationStatus,
} from "@/lib/api/tenants";
import { BrandingConfig, CustomizationRequest } from "@/types/users";
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

  // Background Media State
  const [heroBackgroundUrl, setHeroBackgroundUrl] = useState<string | null>(
    null,
  );
  const [aboutBackgroundUrl, setAboutBackgroundUrl] = useState<string | null>(
    null,
  );
  const [contactBackgroundUrl, setContactBackgroundUrl] = useState<
    string | null
  >(null);

  // About Content State
  const [aboutBadge, setAboutBadge] = useState("Our Story & Standards");
  const [aboutTitle, setAboutTitle] = useState(
    "A devotion to craftsmanship & authentic quality",
  );
  const [aboutDescription, setAboutDescription] = useState(
    `At ${formattedStoreName}, we believe exceptional products begin with intentional curation — uncompromising standards, premium raw materials, and genuine passion.`,
  );
  const [aboutSecondaryDescription, setAboutSecondaryDescription] = useState(
    "Whether you are discovering something new or ordering a signature favorite, our store offers secure checkout, direct tracking, and dedicated client assistance.",
  );
  const [aboutMission, setAboutMission] = useState(
    "To bring authentic excellence, artisanal beauty, and seamless digital commerce together in an experience built for discerning clients.",
  );
  const [aboutImageUrl, setAboutImageUrl] = useState<string | null>(null);
  const [aboutCardBadge, setAboutCardBadge] = useState(
    "Crafted With Precision",
  );
  const [aboutCardTitle, setAboutCardTitle] = useState(
    "Designed For Discerning Clients",
  );
  const [aboutCardDescription, setAboutCardDescription] = useState(
    `Enjoy seamless multi-currency checkout, tracked global fulfilment, and instant payment settlement on ${formattedStoreName}.`,
  );
  const [aboutFeature1Title, setAboutFeature1Title] = useState("Authentic");
  const [aboutFeature1Desc, setAboutFeature1Desc] = useState("100% Verified");
  const [aboutFeature2Title, setAboutFeature2Title] = useState("Guaranteed");
  const [aboutFeature2Desc, setAboutFeature2Desc] =
    useState("Top Craftsmanship");
  const [aboutFeature3Title, setAboutFeature3Title] = useState("Bespoke");
  const [aboutFeature3Desc, setAboutFeature3Desc] = useState(
    "Care in Every Order",
  );

  // Contact Content State
  const [contactBadge, setContactBadge] = useState("Custom Orders & Inquiries");
  const [contactHeading, setContactHeading] = useState(
    "Request Bespoke Customizations",
  );
  const [contactSubheading, setContactSubheading] = useState(
    `Need custom volume orders, personalized modifications, or tailored corporate bundles from ${formattedStoreName}? Connect directly with our team for personalized quotes and expedited fulfilment.`,
  );
  const [storeContactEmail, setStoreContactEmail] = useState(
    `hello@${tenantSlug}.com`,
  );
  const [storeContactPhone, setStoreContactPhone] = useState(
    "+234 (0) 800 000 0000",
  );
  const [storeContactAddress, setStoreContactAddress] = useState(
    "Flagship Atelier & Storefront • Central Business District",
  );
  const [storeContactHours, setStoreContactHours] = useState(
    "Monday – Saturday: 9:00 AM – 7:00 PM",
  );

  // Active uploading field indicator & tab switchers
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [contentTab, setContentTab] = useState<"hero" | "about" | "contact">(
    "hero",
  );
  const [previewTab, setPreviewTab] = useState<"hero" | "about" | "contact">(
    "hero",
  );

  const handleSwitchContentTab = (tab: "hero" | "about" | "contact") => {
    setContentTab(tab);
    setPreviewTab(tab);
  };

  // Landing Page Mode State
  const [landingPageType, setLandingPageType] = useState<"default" | "custom">(
    "default",
  );
  const [customReqDetails, setCustomReqDetails] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [activeCustomRequest, setActiveCustomRequest] =
    useState<CustomizationRequest | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroBgInputRef = useRef<HTMLInputElement>(null);
  const aboutBgInputRef = useRef<HTMLInputElement>(null);
  const aboutImageInputRef = useRef<HTMLInputElement>(null);
  const contactBgInputRef = useRef<HTMLInputElement>(null);

  // Load tenant details & active customization requests on mount
  useEffect(() => {
    let isMounted = true;
    async function loadTenantData() {
      try {
        setIsLoading(true);
        const [resTenant, resCustom] = await Promise.all([
          getTenantBySlug(tenantSlug),
          getTenantCustomizationStatus(tenantSlug).catch(() => null),
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

          if (cfg.heroBackgroundUrl)
            setHeroBackgroundUrl(cfg.heroBackgroundUrl);
          if (cfg.aboutBackgroundUrl)
            setAboutBackgroundUrl(cfg.aboutBackgroundUrl);
          if (cfg.contactBackgroundUrl)
            setContactBackgroundUrl(cfg.contactBackgroundUrl);

          if (cfg.aboutBadge) setAboutBadge(cfg.aboutBadge);
          if (cfg.aboutTitle) setAboutTitle(cfg.aboutTitle);
          if (cfg.aboutDescription) setAboutDescription(cfg.aboutDescription);
          if (cfg.aboutSecondaryDescription)
            setAboutSecondaryDescription(cfg.aboutSecondaryDescription);
          if (cfg.aboutMission) setAboutMission(cfg.aboutMission);
          if (cfg.aboutImageUrl) setAboutImageUrl(cfg.aboutImageUrl);
          if (cfg.aboutCardBadge) setAboutCardBadge(cfg.aboutCardBadge);
          if (cfg.aboutCardTitle) setAboutCardTitle(cfg.aboutCardTitle);
          if (cfg.aboutCardDescription)
            setAboutCardDescription(cfg.aboutCardDescription);
          if (cfg.aboutFeature1Title)
            setAboutFeature1Title(cfg.aboutFeature1Title);
          if (cfg.aboutFeature1Desc)
            setAboutFeature1Desc(cfg.aboutFeature1Desc);
          if (cfg.aboutFeature2Title)
            setAboutFeature2Title(cfg.aboutFeature2Title);
          if (cfg.aboutFeature2Desc)
            setAboutFeature2Desc(cfg.aboutFeature2Desc);
          if (cfg.aboutFeature3Title)
            setAboutFeature3Title(cfg.aboutFeature3Title);
          if (cfg.aboutFeature3Desc)
            setAboutFeature3Desc(cfg.aboutFeature3Desc);

          if (cfg.contactBadge) setContactBadge(cfg.contactBadge);
          if (cfg.contactHeading) setContactHeading(cfg.contactHeading);
          if (cfg.contactSubheading)
            setContactSubheading(cfg.contactSubheading);
          if (cfg.contactEmail) setStoreContactEmail(cfg.contactEmail);
          else if (t.store_email) setStoreContactEmail(t.store_email);
          if (cfg.contactPhone) setStoreContactPhone(cfg.contactPhone);
          else if (t.store_phone) setStoreContactPhone(t.store_phone);
          if (cfg.contactAddress) setStoreContactAddress(cfg.contactAddress);
          else if (t.store_address || t.pickup_address)
            setStoreContactAddress(t.store_address || t.pickup_address || "");
          if (cfg.contactHours) setStoreContactHours(cfg.contactHours);
          else if (t.pickup_hours) setStoreContactHours(t.pickup_hours);

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
      const res = await uploadImage(file, tenantId || tenantSlug);
      const uploadedUrl = res.data?.url;

      if (uploadedUrl) {
        setLogoUrl(uploadedUrl);
        applyBranding({ logoUrl: uploadedUrl });
        toast.success("Store logo uploaded to Neon Object Storage!");
      } else {
        throw new Error(res.message || "Failed to upload store logo");
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

  // Reusable helper for uploading storefront images directly to Neon Object Storage
  const handleGenericImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
    onSuccess: (url: string | null) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, SVG, WebP)");
      return;
    }

    try {
      setUploadingField(fieldName);
      const res = await uploadImage(file, tenantId || tenantSlug);
      const uploadedUrl = res.data?.url;

      if (uploadedUrl) {
        onSuccess(uploadedUrl);
        toast.success(`${fieldName} uploaded to Neon Object Storage!`);
      } else {
        throw new Error(res.message || `Failed to upload ${fieldName}`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || `Failed to upload ${fieldName}`);
    } finally {
      setUploadingField(null);
      e.target.value = "";
    }
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
      const res = await submitLandingPageRequest({
        tenant_id: tenantId,
        tenant_slug: tenantSlug,
        details:
          customReqDetails.trim() || "Bespoke custom landing page requested.",
        primary_color: brandColor,
        secondary_color: accentColor,
        store_headline: storeHeadline,
        contact_email: contactEmail.trim() || user?.email,
      });

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
      await apiSetLandingPageType(tenantSlug, type);
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

        heroBackgroundUrl: heroBackgroundUrl,
        aboutBackgroundUrl: aboutBackgroundUrl,
        contactBackgroundUrl: contactBackgroundUrl,

        aboutBadge: aboutBadge,
        aboutTitle: aboutTitle,
        aboutDescription: aboutDescription,
        aboutSecondaryDescription: aboutSecondaryDescription,
        aboutMission: aboutMission,
        aboutImageUrl: aboutImageUrl,
        aboutCardBadge: aboutCardBadge,
        aboutCardTitle: aboutCardTitle,
        aboutCardDescription: aboutCardDescription,
        aboutFeature1Title: aboutFeature1Title,
        aboutFeature1Desc: aboutFeature1Desc,
        aboutFeature2Title: aboutFeature2Title,
        aboutFeature2Desc: aboutFeature2Desc,
        aboutFeature3Title: aboutFeature3Title,
        aboutFeature3Desc: aboutFeature3Desc,

        contactBadge: contactBadge,
        contactHeading: contactHeading,
        contactSubheading: contactSubheading,
        contactEmail: storeContactEmail,
        contactPhone: storeContactPhone,
        contactAddress: storeContactAddress,
        contactHours: storeContactHours,
      };

      const res = await updateTenant(tenantId, {
        branding_config: brandingPayload,
        custom_domain: customDomain.trim() || null,
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
                  <span className="text-sm  text-muted-foreground">
                    Core Accent
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="size-9 rounded-lg cursor-pointer p-0.5 bg-card shrink-0"
                    title="Pick custom primary brand color"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="h-9 uppercase"
                    placeholder="#059669"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
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
                  <span className="text-sm  text-muted-foreground">
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
                    className="size-9 rounded-lg cursor-pointer p-0.5 bg-card shrink-0"
                    title="Pick custom secondary accent color"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) =>
                      handleColorChange(brandColor, e.target.value)
                    }
                    className="h-9 uppercase"
                    placeholder="#EC4899"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
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
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Store className="size-4 text-primary" />
                      Standard Storefront
                    </span>
                    {landingPageType === "default" && (
                      <Badge className="bg-primary text-primary-foreground text-sm h-5">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    Automated real-time catalog showcase, category filters, and
                    checkout integration.
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-border/50 text-sm text-muted-foreground font-medium">
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
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Paintbrush className="size-4 text-pink-500" />
                      Bespoke Custom Design
                    </span>
                    {landingPageType === "custom" && (
                      <Badge className="bg-pink-600 text-white text-sm h-5">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    Custom-engineered hero animations, editorial lookbooks, and
                    bespoke interactive layouts.
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-border/50 text-sm text-muted-foreground font-medium flex items-center justify-between">
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
                    className="bg-muted/40  text-xs h-9"
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
                    className="text-xs h-9 bg-background "
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
                  <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-xs">
                    cname.ecommerce-hub.com
                  </code>
                </p>
              </div>
            </div>
          </div>

          {/* Page Specific Content */}
          <div className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div>
                <h5 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  Page-Specific Content & Customization
                </h5>
                <p className="text-xs text-muted-foreground">
                  Switch between pages below to configure custom copywriting, imagery, and contact information without scrolling through a long form.
                </p>
              </div>
            </div>

            {/* Page Content Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border text-xs">
              <button
                type="button"
                onClick={() => handleSwitchContentTab("hero")}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer text-center text-xs flex items-center justify-center gap-1.5 ${
                  contentTab === "hero"
                    ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="size-3.5 text-primary" />
                <span>Hero / Landing</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchContentTab("about")}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer text-center text-xs flex items-center justify-center gap-1.5 ${
                  contentTab === "about"
                    ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="size-3.5 text-primary" />
                <span>About Page</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchContentTab("contact")}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer text-center text-xs flex items-center justify-center gap-1.5 ${
                  contentTab === "contact"
                    ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquareText className="size-3.5 text-primary" />
                <span>Contact Page</span>
              </button>
            </div>

            {/* Storefront Hero & Background Media */}
            {contentTab === "hero" && (
              <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h5 className="font-bold text-foreground text-sm">
                  Storefront Hero & Background Media
                </h5>
                <p className="text-xs text-muted-foreground">
                  Customize your storefront hero typography and high-resolution
                  background imagery.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
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

              {/* Hero Background Image */}
              <div className="pt-2 border-t border-border space-y-2">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-primary" />
                  Hero Section Background Image
                </Label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-32 h-20 rounded-xl border border-border bg-muted/30 overflow-hidden relative group shrink-0">
                    {heroBackgroundUrl ? (
                      <Image
                        src={heroBackgroundUrl}
                        alt="Hero Background"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="size-full flex flex-col items-center justify-center text-muted-foreground/50 text-[10px]">
                        <ImageIcon className="size-5 mb-1" />
                        <span>No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5 w-full">
                    <input
                      type="file"
                      ref={heroBgInputRef}
                      onChange={(e) =>
                        handleGenericImageUpload(
                          e,
                          "Hero Background",
                          setHeroBackgroundUrl,
                        )
                      }
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => heroBgInputRef.current?.click()}
                        disabled={uploadingField === "Hero Background"}
                        variant="outline"
                        size="md"
                        className="h-8.5 text-xs gap-1.5 cursor-pointer"
                      >
                        {uploadingField === "Hero Background" ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="size-3.5" />
                            <span>Upload Hero Background</span>
                          </>
                        )}
                      </Button>
                      {heroBackgroundUrl && (
                        <Button
                          type="button"
                          onClick={() => setHeroBackgroundUrl(null)}
                          variant="outline"
                          size="md"
                          className="h-8.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer gap-1"
                        >
                          <Trash2 className="size-3" />
                          <span>Remove</span>
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Full-bleed image for the main landing page hero section.
                      Recommended 1920x1080px.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* About Section & Page Content */}
        {contentTab === "about" && (
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="size-4" />
              </div>
              <div>
                <h5 className="font-bold text-foreground text-sm">
                  About Section & Dedicated Page Content
                </h5>
                <p className="text-xs text-muted-foreground">
                  Update the story, craft philosophy, and showcase cards on your
                  landing page and /{tenantSlug}/about page.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Section Top Badge
                  </Label>
                  <Input
                    value={aboutBadge}
                    onChange={(e) => setAboutBadge(e.target.value)}
                    placeholder="Our Story & Standards"
                    className="text-xs h-9 bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    About Headline Title
                  </Label>
                  <Input
                    value={aboutTitle}
                    onChange={(e) => setAboutTitle(e.target.value)}
                    placeholder="A devotion to craftsmanship..."
                    className="text-xs h-9 bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Primary Story Paragraph
                </Label>
                <Textarea
                  value={aboutDescription}
                  onChange={(e) => setAboutDescription(e.target.value)}
                  placeholder="At our store, we believe exceptional products begin with intentional curation..."
                  className="text-xs min-h-20 bg-background resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Secondary Assurance Paragraph
                </Label>
                <Textarea
                  value={aboutSecondaryDescription}
                  onChange={(e) => setAboutSecondaryDescription(e.target.value)}
                  placeholder="Whether you are discovering something new or ordering a signature favorite..."
                  className="text-xs min-h-16 bg-background resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Brand Mission Statement
                </Label>
                <Input
                  value={aboutMission}
                  onChange={(e) => setAboutMission(e.target.value)}
                  placeholder="To bring authentic excellence and artisanal beauty together..."
                  className="text-xs h-9 bg-background"
                />
              </div>

              {/* Showcase Card Configuration & Image */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  Showcase Card (Right Side of About Section)
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-foreground">
                      Card Badge
                    </Label>
                    <Input
                      value={aboutCardBadge}
                      onChange={(e) => setAboutCardBadge(e.target.value)}
                      placeholder="Crafted With Precision"
                      className="text-xs h-8.5 bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-foreground">
                      Card Title
                    </Label>
                    <Input
                      value={aboutCardTitle}
                      onChange={(e) => setAboutCardTitle(e.target.value)}
                      placeholder="Designed For Discerning Clients"
                      className="text-xs h-8.5 bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-foreground">
                    Card Description
                  </Label>
                  <Textarea
                    value={aboutCardDescription}
                    onChange={(e) => setAboutCardDescription(e.target.value)}
                    placeholder="Enjoy seamless checkout, tracked fulfilment, and instant payment settlement..."
                    className="text-xs min-h-14 bg-background resize-y"
                  />
                </div>

                {/* Showcase Card Image Upload */}
                <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-28 h-20 rounded-lg border border-border bg-muted/40 overflow-hidden relative shrink-0">
                    {aboutImageUrl ? (
                      <Image
                        src={aboutImageUrl}
                        alt="About Showcase"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="size-full flex flex-col items-center justify-center text-muted-foreground/50 text-[10px]">
                        <ImageIcon className="size-5 mb-1" />
                        <span>No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      ref={aboutImageInputRef}
                      onChange={(e) =>
                        handleGenericImageUpload(
                          e,
                          "About Showcase Image",
                          setAboutImageUrl,
                        )
                      }
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => aboutImageInputRef.current?.click()}
                        disabled={uploadingField === "About Showcase Image"}
                        variant="outline"
                        size="md"
                        className="h-8 text-xs gap-1 cursor-pointer"
                      >
                        {uploadingField === "About Showcase Image" ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="size-3" />
                            <span>Upload Showcase Image</span>
                          </>
                        )}
                      </Button>
                      {aboutImageUrl && (
                        <Button
                          type="button"
                          onClick={() => setAboutImageUrl(null)}
                          variant="outline"
                          size="md"
                          className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Photo displayed inside the About feature card on your
                      storefront and about page.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Core Pillars */}
              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="text-xs font-semibold text-foreground">
                  Core Pillars / Standards Badges
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <ShieldCheck className="size-3.5 text-primary" />
                      <span>Pillar 1</span>
                    </div>
                    <Input
                      value={aboutFeature1Title}
                      onChange={(e) => setAboutFeature1Title(e.target.value)}
                      placeholder="Authentic"
                      className="text-xs h-7.5 bg-background font-semibold"
                    />
                    <Input
                      value={aboutFeature1Desc}
                      onChange={(e) => setAboutFeature1Desc(e.target.value)}
                      placeholder="100% Verified"
                      className="text-[11px] h-7 bg-background text-muted-foreground"
                    />
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Award className="size-3.5 text-primary" />
                      <span>Pillar 2</span>
                    </div>
                    <Input
                      value={aboutFeature2Title}
                      onChange={(e) => setAboutFeature2Title(e.target.value)}
                      placeholder="Guaranteed"
                      className="text-xs h-7.5 bg-background font-semibold"
                    />
                    <Input
                      value={aboutFeature2Desc}
                      onChange={(e) => setAboutFeature2Desc(e.target.value)}
                      placeholder="Top Craftsmanship"
                      className="text-[11px] h-7 bg-background text-muted-foreground"
                    />
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <HeartHandshake className="size-3.5 text-primary" />
                      <span>Pillar 3</span>
                    </div>
                    <Input
                      value={aboutFeature3Title}
                      onChange={(e) => setAboutFeature3Title(e.target.value)}
                      placeholder="Bespoke"
                      className="text-xs h-7.5 bg-background font-semibold"
                    />
                    <Input
                      value={aboutFeature3Desc}
                      onChange={(e) => setAboutFeature3Desc(e.target.value)}
                      placeholder="Care in Every Order"
                      className="text-[11px] h-7 bg-background text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* About Background Image */}
              <div className="pt-2 border-t border-border space-y-2">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-primary" />
                  About Section Ambient Background Image (Optional)
                </Label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-28 h-16 rounded-lg border border-border bg-muted/30 overflow-hidden relative shrink-0">
                    {aboutBackgroundUrl ? (
                      <Image
                        src={aboutBackgroundUrl}
                        alt="About Background"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="size-full flex flex-col items-center justify-center text-muted-foreground/50 text-[10px]">
                        <ImageIcon className="size-4 mb-0.5" />
                        <span>No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 w-full">
                    <input
                      type="file"
                      ref={aboutBgInputRef}
                      onChange={(e) =>
                        handleGenericImageUpload(
                          e,
                          "About Background",
                          setAboutBackgroundUrl,
                        )
                      }
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => aboutBgInputRef.current?.click()}
                        disabled={uploadingField === "About Background"}
                        variant="outline"
                        size="md"
                        className="h-8 text-xs gap-1 cursor-pointer"
                      >
                        {uploadingField === "About Background" ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="size-3" />
                            <span>Upload Background</span>
                          </>
                        )}
                      </Button>
                      {aboutBackgroundUrl && (
                        <Button
                          type="button"
                          onClick={() => setAboutBackgroundUrl(null)}
                          variant="outline"
                          size="md"
                          className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Section & Page Content */}
        {contentTab === "contact" && (
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <MessageSquareText className="size-4" />
              </div>
              <div>
                <h5 className="font-bold text-foreground text-sm">
                  Contact Section & Dedicated Page Content
                </h5>
                <p className="text-xs text-muted-foreground">
                  Update your contact details, inquiry headlines, hours, and
                  background imagery for /{tenantSlug}/contact and the
                  storefront CTA banner.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Section Top Badge
                  </Label>
                  <Input
                    value={contactBadge}
                    onChange={(e) => setContactBadge(e.target.value)}
                    placeholder="Custom Orders & Inquiries"
                    className="text-xs h-9 bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Contact Main Headline
                  </Label>
                  <Input
                    value={contactHeading}
                    onChange={(e) => setContactHeading(e.target.value)}
                    placeholder="Request Bespoke Customizations"
                    className="text-xs h-9 bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Contact Description / Subheading
                </Label>
                <Textarea
                  value={contactSubheading}
                  onChange={(e) => setContactSubheading(e.target.value)}
                  placeholder="Need custom volume orders, personalized modifications, or tailored corporate bundles?..."
                  className="text-xs min-h-20 bg-background resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="size-3.5 text-primary" />
                    Public Contact Email
                  </Label>
                  <Input
                    type="email"
                    value={storeContactEmail}
                    onChange={(e) => setStoreContactEmail(e.target.value)}
                    placeholder="hello@yourstore.com"
                    className="text-xs h-9 bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="size-3.5 text-primary" />
                    Contact Phone / WhatsApp
                  </Label>
                  <Input
                    value={storeContactPhone}
                    onChange={(e) => setStoreContactPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="text-xs h-9 bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" />
                    Physical Atelier / Address
                  </Label>
                  <Input
                    value={storeContactAddress}
                    onChange={(e) => setStoreContactAddress(e.target.value)}
                    placeholder="123 Artisan Way, Lagos"
                    className="text-xs h-9 bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-primary" />
                    Operating / Store Hours
                  </Label>
                  <Input
                    value={storeContactHours}
                    onChange={(e) => setStoreContactHours(e.target.value)}
                    placeholder="Mon – Sat: 9:00 AM – 7:00 PM"
                    className="text-xs h-9 bg-background"
                  />
                </div>
              </div>

              {/* Contact Background Image */}
              <div className="pt-2 border-t border-border space-y-2">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-primary" />
                  Contact Section Background Image (Optional)
                </Label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-28 h-16 rounded-lg border border-border bg-muted/30 overflow-hidden relative shrink-0">
                    {contactBackgroundUrl ? (
                      <Image
                        src={contactBackgroundUrl}
                        alt="Contact Background"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="size-full flex flex-col items-center justify-center text-muted-foreground/50 text-[10px]">
                        <ImageIcon className="size-4 mb-0.5" />
                        <span>No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 w-full">
                    <input
                      type="file"
                      ref={contactBgInputRef}
                      onChange={(e) =>
                        handleGenericImageUpload(
                          e,
                          "Contact Background",
                          setContactBackgroundUrl,
                        )
                      }
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => contactBgInputRef.current?.click()}
                        disabled={uploadingField === "Contact Background"}
                        variant="outline"
                        size="md"
                        className="h-8 text-xs gap-1 cursor-pointer"
                      >
                        {uploadingField === "Contact Background" ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="size-3" />
                            <span>Upload Background</span>
                          </>
                        )}
                      </Button>
                      {contactBackgroundUrl && (
                        <Button
                          type="button"
                          onClick={() => setContactBackgroundUrl(null)}
                          variant="outline"
                          size="md"
                          className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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

            {/* Preview Section Switcher */}
            <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg border border-border text-xs">
              <button
                type="button"
                onClick={() => setPreviewTab("hero")}
                className={`flex-1 py-1.5 px-2 rounded-md font-semibold transition-all cursor-pointer text-center text-xs ${
                  previewTab === "hero"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Hero
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("about")}
                className={`flex-1 py-1.5 px-2 rounded-md font-semibold transition-all cursor-pointer text-center text-xs ${
                  previewTab === "about"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                About
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("contact")}
                className={`flex-1 py-1.5 px-2 rounded-md font-semibold transition-all cursor-pointer text-center text-xs ${
                  previewTab === "contact"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Contact
              </button>
            </div>

            {/* Simulated Storefront Card */}
            <div className="rounded-xl border border-border bg-background overflow-hidden shadow-md transition-all">
              {/* Simulated Announcement Banner */}
              {announcementText && (
                <div
                  className="p-2 text-center text-sm font-semibold text-white transition-colors tracking-wide"
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
                  <span className="text-sm text-muted-foreground truncate max-w-28 capitalize">
                    {previewTab} Mode
                  </span>
                </div>
              </div>

              {/* Simulated Tab Content */}
              {previewTab === "hero" && (
                <div className="p-6 text-center space-y-3 bg-stone-950 text-white relative overflow-hidden min-h-64 flex flex-col justify-center">
                  {heroBackgroundUrl && (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-all"
                      style={{ backgroundImage: `url(${heroBackgroundUrl})` }}
                    />
                  )}
                  <div
                    className={`absolute inset-0 ${heroBackgroundUrl ? "bg-stone-950/80 backdrop-blur-xs" : "bg-stone-950"}`}
                  />
                  <div
                    className="absolute inset-0 opacity-20 blur-2xl pointer-events-none transition-colors"
                    style={{ backgroundColor: brandColor }}
                  />
                  <div className="flex items-center justify-center gap-2 relative z-10">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-xs"
                      style={{ backgroundColor: brandColor }}
                    >
                      Primary Accent
                    </span>
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-xs"
                      style={{ backgroundColor: accentColor }}
                    >
                      Secondary Accent
                    </span>
                  </div>

                  <h5 className="font-bold text-sm text-white relative z-10 leading-snug">
                    {storeHeadline}
                  </h5>
                  <p className="text-[11px] text-stone-300 relative z-10 max-w-xs mx-auto font-light line-clamp-2">
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
                      Custom Orders
                    </button>
                  </div>
                </div>
              )}

              {previewTab === "about" && (
                <div className="p-5 bg-stone-50 text-stone-900 space-y-3 relative overflow-hidden min-h-64">
                  {aboutBackgroundUrl && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-15"
                      style={{ backgroundImage: `url(${aboutBackgroundUrl})` }}
                    />
                  )}
                  <div className="relative z-10 space-y-2">
                    <div
                      style={{ color: accentColor }}
                      className="text-[10px] font-bold tracking-widest uppercase"
                    >
                      {aboutBadge}
                    </div>
                    <h5 className="font-bold text-xs text-stone-950 font-secondary line-clamp-2">
                      {aboutTitle}
                    </h5>
                    <p className="text-[11px] text-stone-600 line-clamp-2 font-light leading-relaxed">
                      {aboutDescription}
                    </p>

                    {/* Mini Showcase Card */}
                    <div className="p-3 rounded-xl bg-stone-900 text-white relative overflow-hidden border border-stone-800 space-y-1">
                      {aboutImageUrl && (
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-30"
                          style={{ backgroundImage: `url(${aboutImageUrl})` }}
                        />
                      )}
                      <div className="relative z-10">
                        <span
                          style={{
                            backgroundColor: `${brandColor}40`,
                            color: "#ffffff",
                          }}
                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase"
                        >
                          {aboutCardBadge}
                        </span>
                        <div className="text-[11px] font-bold mt-1 text-white">
                          {aboutCardTitle}
                        </div>
                        <p className="text-[10px] text-stone-300 line-clamp-1">
                          {aboutCardDescription}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-stone-700 font-semibold border-t border-stone-200">
                      <div className="truncate">✓ {aboutFeature1Title}</div>
                      <div className="truncate">✓ {aboutFeature2Title}</div>
                      <div className="truncate">✓ {aboutFeature3Title}</div>
                    </div>
                  </div>
                </div>
              )}

              {previewTab === "contact" && (
                <div className="p-5 bg-stone-950 text-white space-y-3 relative overflow-hidden min-h-64 flex flex-col justify-center">
                  {contactBackgroundUrl && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-25"
                      style={{
                        backgroundImage: `url(${contactBackgroundUrl})`,
                      }}
                    />
                  )}
                  <div className="relative z-10 space-y-2 text-center">
                    <div
                      style={{ color: accentColor }}
                      className="text-[10px] font-bold tracking-widest uppercase"
                    >
                      {contactBadge}
                    </div>
                    <h5 className="font-bold text-xs text-white font-secondary">
                      {contactHeading}
                    </h5>
                    <p className="text-[11px] text-stone-300 max-w-xs mx-auto line-clamp-2 font-light">
                      {contactSubheading}
                    </p>

                    <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-left space-y-1.5 text-[11px] text-stone-300 mt-2">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="size-3 text-primary shrink-0" />
                        <span className="truncate">{storeContactEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="size-3 text-primary shrink-0" />
                        <span className="truncate">{storeContactPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="size-3 text-primary shrink-0" />
                        <span className="truncate">{storeContactAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Color & Mode Summary Pill */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Primary Color:</span>
                <span className=" font-bold flex items-center gap-1.5 text-foreground">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: brandColor }}
                  />
                  {brandColor}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Secondary Accent:</span>
                <span className=" font-bold flex items-center gap-1.5 text-foreground">
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
                      ? "bg-pink-500/10 text-pink-600 border-pink-200 text-sm"
                      : "bg-primary/10 text-primary border-primary/20 text-sm"
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
