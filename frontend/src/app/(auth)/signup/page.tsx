"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Store,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CreditCard,
  Info,
  Server,
  Globe,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserStore } from "@/store/user";
import { setAuthSession, getRefreshToken } from "@/lib/auth";
import { getSessionTokenClient } from "@/lib/session";
import { registerTenantUser } from "@/lib/api/auth";
import { getTenantSubdomainUrl } from "@/utils/helper";

const COUNTRIES = [
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    dial: "+1",
    currency: "USD",
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    dial: "+44",
    currency: "GBP",
  },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dial: "+234", currency: "NGN" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dial: "+1", currency: "CAD" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dial: "+49", currency: "EUR" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dial: "+61", currency: "AUD" },
  { code: "EE", name: "Estonia", flag: "🇪🇪", dial: "+372", currency: "EUR" },
];

const CATEGORIES = [
  "General Retail",
  "Fashion & Apparel",
  "Bakery & Confectionery",
  "Artisanal Foods & Beverages",
  "Handcrafted Goods & Crafts",
  "Tech, Electronics & Gadgets",
  "Health & Beauty Care",
  "Home, Living & Decor",
];

export default function SignupPage() {
  const { setUser } = useUserStore();

  // Current step: 1 = Who are you?, 2 = What is your store?, 3 = What is your phone number?
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Who are you?
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: What is your store?
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paymentGateway, setPaymentGateway] = useState<"stripe" | "paystack">(
    "stripe",
  );

  // Step 3: What is your phone number?
  const [phoneNational, setPhoneNational] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [provisionedTenant, setProvisionedTenant] = useState<{
    slug: string;
    name: string;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Auto-generate slug from store name
  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setStoreSlug(generated);
  };

  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      toast.error("Please fill in all personal details");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setCurrentStep(2);
  };

  const handleNextFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !storeSlug.trim()) {
      toast.error("Please provide your store name and subdomain slug");
      return;
    }
    setCurrentStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.error(
        "Please accept the terms and conditions to launch your store",
      );
      return;
    }

    const fullPhoneNumber = phoneNational.trim()
      ? `${selectedCountry.dial}${phoneNational.trim().replace(/^0+/, "")}`
      : undefined;

    setIsLoading(true);
    try {
      const authData = await registerTenantUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone_number: fullPhoneNumber,
        store_name: storeName.trim(),
        store_slug: storeSlug.trim(),
        store_category: category,
        password,
        confirm_password: confirmPassword,
        consent_to_terms: agreeTerms,
      });

      const user = {
        id: authData.id,
        email: authData.email,
        name:
          authData.full_name || `${authData.first_name} ${authData.last_name}`,
        first_name: authData.first_name,
        last_name: authData.last_name,
        full_name: authData.full_name,
        role: authData.role,
        tenant_slug: authData.tenant_slug || storeSlug.trim(),
        tenant_name: authData.tenant_name || storeName.trim(),
        auth: authData.auth,
      };

      setAuthSession(
        authData.auth.access_token,
        user,
        authData.auth.refresh_token,
      );
      setUser(user);

      const finalSlug = authData.tenant_slug || storeSlug.trim();
      const finalName = authData.tenant_name || storeName.trim();

      setProvisionedTenant({
        slug: finalSlug,
        name: finalName,
      });

      toast.success(
        `Store "${finalName}" provisioned successfully! Click below to enter your dashboard.`,
      );
      setIsLoading(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to provision tenant store. Please check your details.";
      toast.error(msg);
      setIsLoading(false);
    }
  };

  const handleCopySubdomain = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success("Subdomain URL copied to clipboard!");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col justify-between overflow-hidden">
      {/* Decorative Brand Ambient Glow */}
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-137.5 w-137.5 rounded-full bg-radial from-primary/15 to-transparent blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -top-40 -left-40 h-112.5 w-112.5 rounded-full bg-radial from-primary-light/40 to-transparent blur-2xl opacity-50" />

      {/* Top Header Bar */}
      <header className="relative z-10 container h-16 items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <span className="font-secondary text-xl font-bold tracking-tight text-foreground">
            Ecommerce<span className="text-primary">Hub</span>
          </span>
        </Link>

        {/* Right side helper */}
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            Have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline ml-1"
            >
              Log in
            </Link>
          </p>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative z-10 container flex-1 items-center justify-center">
        {provisionedTenant ? (
          /* Storefront Provisioned Success & Subdomain Showcase Card */
          <div className="w-full bg-card border border-border rounded-3xl p-6 md:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Header Badge */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Store className="h-8 w-8" />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 font-semibold text-primary border border-primary/20">
                  <Check className="h-3.5 w-3.5" />
                  <span>Storefront Successfully Created</span>
                </div>
                <h3 className="font-secondary font-bold text-foreground tracking-tight">
                  Welcome to {provisionedTenant.name}!
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your multi-tenant store is provisioned with isolated database
                  RLS and automated subaccount split payments.
                </p>
              </div>
            </div>

            {/* Subdomain Display Box */}
            <div className="rounded-2xl border border-border bg-card-gray p-5 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  Your Official Store Subdomain URL
                </span>
                <span className="flex items-center gap-1 text-[11px] text-primary font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Live Subdomain
                </span>
              </div>

              {(() => {
                const liveUrl = getTenantSubdomainUrl(provisionedTenant.slug);
                return (
                  <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-2 shadow-2xs">
                    <Globe className="h-4 w-4 text-primary ml-1.5 shrink-0" />
                    <span className="font-mono font-semibold text-foreground flex-1 truncate">
                      {liveUrl}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => handleCopySubdomain(liveUrl)}
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-primary" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-primary" />
                  <span>PostgreSQL Tenant RLS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                  <span>97.5% Instant Split Payout</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3 pt-2">
              <Button
                type="button"
                onClick={() => {
                  const adminUrl = getTenantSubdomainUrl(
                    provisionedTenant.slug,
                    "/admin",
                  );
                  const sessionToken = getSessionTokenClient();
                  const refreshToken = getRefreshToken();
                  const urlObj = new URL(adminUrl);
                  if (sessionToken)
                    urlObj.searchParams.set("auth_token", sessionToken);
                  if (refreshToken)
                    urlObj.searchParams.set("refresh_token", refreshToken);
                  urlObj.searchParams.set("role", "tenant_admin");
                  window.location.assign(urlObj.toString());
                }}
                className="w-full"
              >
                <span>
                  Enter Admin Dashboard (
                  {getTenantSubdomainUrl(provisionedTenant.slug, "/admin")})
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="flex items-center justify-center gap-4 ">
                <Link
                  href={getTenantSubdomainUrl(provisionedTenant.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary font-medium inline-flex items-center gap-1 hover:underline"
                >
                  <span>View Public Storefront</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full bg-card border border-border rounded-2xl grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-130">
            {/* Left Column: Progress Steps & Context */}
            <div className="md:col-span-5 bg-card-gray border-b md:border-b-0 md:border-r border-border p-6 md:p-8 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Header */}
                <div className="space-y-1.5">
                  <h3 className="font-secondary font-bold text-foreground tracking-tight">
                    Welcome to Ecommerce Hub
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Provision your multi-tenant digital storefront in 3 simple
                    steps.
                  </p>
                </div>

                {/* Steps Progress List */}
                <nav aria-label="Signup Steps" className="space-y-4 pt-2">
                  {/* Step 1 */}
                  <div
                    className={`flex items-center gap-3 transition-colors ${
                      currentStep === 1
                        ? "text-primary font-semibold"
                        : currentStep > 1
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold transition-all ${
                        currentStep > 1
                          ? "bg-primary text-primary-foreground"
                          : currentStep === 1
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > 1 ? (
                        <Check className="h-3.5 w-3.5 stroke-3" />
                      ) : (
                        "1"
                      )}
                    </div>
                    <span>Who are you?</span>
                  </div>

                  {/* Step 2 */}
                  <div
                    className={`flex items-center gap-3 transition-colors ${
                      currentStep === 2
                        ? "text-primary font-semibold"
                        : currentStep > 2
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold transition-all ${
                        currentStep > 2
                          ? "bg-primary text-primary-foreground"
                          : currentStep === 2
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > 2 ? (
                        <Check className="h-3.5 w-3.5 stroke-3" />
                      ) : (
                        "2"
                      )}
                    </div>
                    <span>What is your store?</span>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`flex items-center gap-3 transition-colors ${
                      currentStep === 3
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold transition-all ${
                        currentStep === 3
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      3
                    </div>
                    <span>What is your phone number?</span>
                  </div>
                </nav>
              </div>

              {/* Bottom Graphic & Why Section */}
              <div className="pt-8 space-y-4">
                <div className="rounded-xl bg-card border border-border p-3.5 text-muted-foreground space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Why?</span>
                  </div>
                  <p className="leading-normal">
                    We need this information to configure your isolated tenant
                    database, subdomain routing, and automated split payments.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Step Form Content */}
            <div className="md:col-span-7 p-6 md:p-8 lg:p-10 flex flex-col justify-between">
              {/* STEP 1: Who are you? */}
              {currentStep === 1 && (
                <form
                  onSubmit={handleNextFromStep1}
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <h4 className="font-secondary font-bold text-foreground">
                      Who are you?
                    </h4>

                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="font-semibold text-foreground">
                          First Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g. Alex"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="h-10 bg-background border-input focus-visible:ring-primary"
                          required
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="font-semibold text-foreground">
                          Last Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g. Mercer"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="h-10 bg-background border-input focus-visible:ring-primary"
                          required
                        />
                      </div>
                    </div>

                    {/* Work Email */}
                    <div className="space-y-1">
                      <Label className="font-semibold text-foreground">
                        Work Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="alex@yourbrand.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10 bg-background border-input focus-visible:ring-primary"
                        required
                      />
                    </div>

                    {/* Passwords */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="font-semibold text-foreground">
                          Password <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="password"
                          placeholder="Min 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-10 bg-background border-input focus-visible:ring-primary"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="font-semibold text-foreground">
                          Confirm Password{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="password"
                          placeholder="Repeat password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-10 bg-background border-input focus-visible:ring-primary"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-6 flex justify-end">
                    <Button type="submit">
                      <span>Next</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </form>
              )}

              {/* STEP 2: What is your store? */}
              {currentStep === 2 && (
                <form
                  onSubmit={handleNextFromStep2}
                  className="space-y-5 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <h4 className="font-secondary font-bold text-foreground">
                      What is your store?
                    </h4>

                    {/* Country Selector */}
                    <div className="space-y-1">
                      <Label className="font-semibold text-foreground">
                        Country / Primary Market
                      </Label>
                      <Select
                        value={selectedCountry.code}
                        onValueChange={(val) => {
                          const match = COUNTRIES.find((c) => c.code === val);
                          if (match) setSelectedCountry(match);
                        }}
                      >
                        <SelectTrigger className="w-full h-10  bg-background border-input text-foreground">
                          <SelectValue placeholder="Select country">
                            {selectedCountry.flag} {selectedCountry.name} (
                            {selectedCountry.currency})
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.flag} {country.name} ({country.currency})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Store Name & Slug */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="font-semibold text-foreground">
                          Store / Brand Name{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g. Nova Studios"
                          value={storeName}
                          onChange={(e) =>
                            handleStoreNameChange(e.target.value)
                          }
                          className="h-10 bg-background border-input focus-visible:ring-primary"
                          required
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className=" font-semibold text-foreground">
                          Store Subdomain Slug{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="nova-studios"
                          value={storeSlug}
                          onChange={(e) =>
                            setStoreSlug(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9-]/g, ""),
                            )
                          }
                          className="h-10 font-mono bg-background border-input focus-visible:ring-primary"
                          required
                        />
                      </div>
                    </div>

                    {/* Subdomain Live Preview Badge */}
                    <div className="flex items-center gap-2 rounded-lg bg-primary-light border border-primary/20 px-3 py-2 text-primary">
                      <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">
                        Store URL:{" "}
                        <strong className="underline">
                          {storeSlug || "your-store"}.ecommerce-hub.com
                        </strong>
                      </span>
                    </div>

                    {/* Category & Payment Split Gateway */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className=" font-semibold text-foreground">
                          Store Category
                        </Label>
                        <Select
                          value={category}
                          onValueChange={(val) => setCategory(val)}
                        >
                          <SelectTrigger className="w-full h-10 bg-background border-input text-foreground">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className=" font-semibold text-foreground">
                          Split Payout Provider
                        </Label>
                        <div className="grid grid-cols-2 gap-2 h-10">
                          <button
                            type="button"
                            onClick={() => setPaymentGateway("stripe")}
                            className={`flex items-center justify-center gap-1 rounded-md border  font-medium transition-all ${
                              paymentGateway === "stripe"
                                ? "border-primary bg-primary-light text-primary font-semibold"
                                : "border-border bg-card text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <CreditCard className="h-3 w-3" />
                            <span>Stripe</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentGateway("paystack")}
                            className={`flex items-center justify-center gap-1 rounded-md border  font-medium transition-all ${
                              paymentGateway === "paystack"
                                ? "border-primary bg-primary-light text-primary font-semibold"
                                : "border-border bg-card text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <CreditCard className="h-3 w-3" />
                            <span>Paystack</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Navigation */}
                  <div className="pt-6 flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back</span>
                    </Button>

                    <Button type="submit">
                      <span>Next</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </form>
              )}

              {/* STEP 3: What is your phone number? */}
              {currentStep === 3 && (
                <form
                  onSubmit={handleFinalSubmit}
                  className="space-y-5 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <h4 className="font-secondary font-bold text-foreground">
                      What is your phone number?
                    </h4>

                    {/* Phone Input with Country Code */}
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">
                        Mobile Number
                      </Label>
                      <div className="flex rounded-md shadow-2xs border border-input overflow-hidden focus-within:ring focus-within:ring-primary focus-within:border-primary bg-background">
                        <div className="flex items-center gap-1.5 bg-card-gray px-3 border-r border-border font-medium text-foreground">
                          <span>{selectedCountry.flag}</span>
                          <span className="font-mono">
                            {selectedCountry.dial}
                          </span>
                        </div>
                        <Input
                          type="tel"
                          placeholder="801 234 5678"
                          value={phoneNational}
                          onChange={(e) => setPhoneNational(e.target.value)}
                          className="border-0 rounded-none h-10  focus-visible:ring-0 shadow-none bg-background"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Consents & Terms */}
                    <div className="space-y-3 pt-2">
                      <Label className="flex items-start gap-2.5 cursor-pointer">
                        <Input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
                        />
                        <span className=" text-muted-foreground leading-normal">
                          I agree to the{" "}
                          <Link
                            href="/terms"
                            className="text-primary underline hover:opacity-85 font-medium"
                          >
                            Terms & Conditions
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="/privacy"
                            className="text-primary underline hover:opacity-85 font-medium"
                          >
                            Privacy Policy
                          </Link>
                          .
                        </span>
                      </Label>

                      <Label className="flex items-start gap-2.5 cursor-pointer">
                        <Input
                          type="checkbox"
                          checked={subscribeNewsletter}
                          onChange={(e) =>
                            setSubscribeNewsletter(e.target.checked)
                          }
                          className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
                        />
                        <span className=" text-muted-foreground leading-normal">
                          Send me feature updates, product analytics tips, and
                          merchant guides.
                        </span>
                      </Label>
                    </div>
                  </div>

                  {/* Footer Navigation */}
                  <div className="pt-6 flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back</span>
                    </Button>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <span>Launch Storefront</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer copyright */}
      <footer className="relative z-10 container h-16 items-center justify-between text-muted-foreground">
        <span>© {new Date().getFullYear()} EcommerceHub Platform.</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
