"use client";

import { useState, use } from "react";
import { Store, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/store/user";
import { getTenantSubdomainUrl } from "@/utils/helper";

interface BrandingPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function TenantBrandingPage({ params }: BrandingPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";
  const { user } = useUserStore();

  const formattedStoreName =
    user?.tenant_name ||
    tenantSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const subdomainUrl = getTenantSubdomainUrl(tenantSlug);

  // Customization state
  const [brandColor, setBrandColor] = useState("#059669");
  const [customDomain, setCustomDomain] = useState(`shop.${tenantSlug}.com`);
  const [storeHeadline, setStoreHeadline] = useState(
    `Official Online Store for ${formattedStoreName}`,
  );
  const [announcementText, setAnnouncementText] = useState(
    "Free standard shipping on all domestic orders over $75 ✨",
  );

  const handleCopySubdomain = () => {
    navigator.clipboard.writeText(subdomainUrl);
    toast.success("Subdomain URL copied to clipboard!");
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Customization Settings */}
        <div className="lg:col-span-7 space-y-5">
          {/* Subdomain & Custom Domain Card */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <h5 className="font-bold text-stone-900">
                Domains & URL Routing
              </h5>
              <p className="text-stone-500">
                Manage your primary multi-tenant subdomain and custom CNAME.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Primary Subdomain (Auto-Assigned)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={subdomainUrl}
                    readOnly
                    className="bg-stone-50"
                  />
                  <Button
                    onClick={handleCopySubdomain}
                    variant="outline"
                    size="md"
                    className="h-8 text-xs cursor-pointer"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Custom Domain (e.g. yourstore.com)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                  />
                  <Button
                    size="md"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    onClick={() =>
                      toast.success("Custom domain CNAME DNS verified!")
                    }
                  >
                    Verify DNS
                  </Button>
                </div>
                <p className="text-[11px] text-stone-400">
                  Point a CNAME record to{" "}
                  <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700 font-mono">
                    cname.ecommerce-hub.com
                  </code>
                </p>
              </div>
            </div>
          </div>

          {/* Theme Colors & Hero Text */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <h5 className="font-bold text-stone-900">
                Brand Palette & Storefront Hero
              </h5>
              <p className="text-stone-500">
                Personalize your customer storefront appearance.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-stone-700">
                  Primary Brand Accent Color
                </Label>
                <div className="flex items-center gap-3 flex-wrap">
                  {[
                    { color: "#059669", name: "Emerald" },
                    { color: "#2563eb", name: "Indigo" },
                    { color: "#d97706", name: "Amber" },
                    { color: "#e11d48", name: "Rose" },
                    { color: "#0f172a", name: "Slate" },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => {
                        setBrandColor(c.color);
                        toast.success(`Theme palette changed to ${c.name}`);
                      }}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer ${
                        brandColor === c.color
                          ? "border-stone-900 ring-2 ring-stone-700/10 font-bold"
                          : "border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Storefront Headline
                </Label>
                <Input
                  value={storeHeadline}
                  onChange={(e) => setStoreHeadline(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Top Announcement Banner Text
                </Label>
                <Input
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => toast.success("Brand customizations saved!")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
                >
                  Save Brand Settings
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 space-y-3 sticky">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-900">
                Live Storefront Preview
              </h4>
              <a
                href={subdomainUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                Open Full <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Simulated Storefront Card */}
            <div className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden shadow-2xs">
              {/* Banner */}
              <div
                className="p-2 text-center text-[10px] font-semibold text-white transition-colors"
                style={{ backgroundColor: brandColor }}
              >
                {announcementText}
              </div>

              {/* Header */}
              <div className="p-4 bg-white border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs"
                    style={{ backgroundColor: brandColor }}
                  >
                    <Store className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-xs text-stone-900">
                    {formattedStoreName}
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 font-mono">
                  {tenantSlug}.ecommerce-hub.com
                </span>
              </div>

              {/* Body Preview */}
              <div className="p-5 text-center space-y-2 bg-stone-50/50">
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  Featured
                </span>
                <h5 className="font-bold text-sm text-stone-900">
                  {storeHeadline}
                </h5>
                <p className="text-[11px] text-stone-500">
                  Browse top catalog items and checkout securely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
