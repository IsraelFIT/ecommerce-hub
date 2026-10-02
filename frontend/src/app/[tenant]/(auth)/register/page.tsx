"use client";

import { useState, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Store, Lock, Mail, ArrowRight, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/store/user";
import { setAuthSession } from "@/lib/auth";
import { registerTenantCustomer } from "@/lib/api/auth";
import { getTenantSubdomainUrl } from "@/utils/helper";

interface TenantRegisterPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

function TenantRegisterForm({ tenantSlug }: { tenantSlug: string }) {
  //   const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const { setUser } = useUserStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const formattedStoreName = tenantSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      toast.error("Please fill in all required fields");
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

    if (!agreeTerms) {
      toast.error("Please accept the terms of service");
      return;
    }

    setIsLoading(true);
    try {
      const authData = await registerTenantCustomer({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone_number: phone.trim() || undefined,
        tenant_slug: tenantSlug,
        password,
        confirm_password: confirmPassword,
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
        tenant_slug: authData.tenant_slug || tenantSlug,
        tenant_name: authData.tenant_name || formattedStoreName,
        auth: authData.auth,
      };

      setAuthSession(
        authData.auth.access_token,
        user,
        authData.auth.refresh_token,
      );
      setUser(user);

      toast.success(
        `Welcome to ${formattedStoreName}, ${authData.first_name}! Your account is active.`,
      );

      const targetPath = redirectPath || "/";
      window.location.assign(getTenantSubdomainUrl(tenantSlug, targetPath));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again.";
      toast.error(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-8 shadow-xl">
      {/* Store Branding Header */}
      <div className="flex flex-col items-center text-center space-y-2.5">
        <Link
          href={`/${tenantSlug}`}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105"
        >
          <Store className="h-6 w-6" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight font-secondary text-foreground">
            Create Account at {formattedStoreName}
          </h1>
          <p className="text-xs text-muted-foreground">
            Join to save favorite items, track orders, and speed up checkout
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">
              First Name *
            </Label>
            <Input
              placeholder="e.g. Maya"
              className="h-10 text-xs bg-background border-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">
              Last Name *
            </Label>
            <Input
              placeholder="e.g. Lin"
              className="h-10 text-xs bg-background border-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground">
            Email Address *
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
              type="email"
              placeholder="maya@example.com"
              className="pl-9 h-10 text-xs bg-background border-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Phone Number (Optional) */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground">
            Phone Number (Optional)
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
              type="tel"
              placeholder="+1 555 123 4567"
              className="pl-9 h-10 text-xs bg-background border-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground">
            Password *
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
              type="password"
              placeholder="••••••••"
              className="pl-9 h-10 text-xs bg-background border-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground">
            Confirm Password *
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
              type="password"
              placeholder="••••••••"
              className="pl-9 h-10 text-xs bg-background border-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Terms Checkbox */}
        <Label className="flex items-start gap-2 cursor-pointer pt-1">
          <Input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
          />
          <span className="text-[11px] text-muted-foreground leading-normal">
            I agree to the store terms & conditions and secure checkout
            policies.
          </span>
        </Label>

        <Button
          type="submit"
          className="w-full gap-2 h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Footer Sign In Link */}
      <div className="rounded-2xl bg-card-gray p-3.5 text-center text-xs text-muted-foreground border border-border space-y-1">
        <div>
          <span>Already have an account? </span>
          <Link
            href={`/${tenantSlug}/login`}
            className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
          >
            Sign in
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TenantRegisterPage({
  params,
}: TenantRegisterPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading registration form...
          </div>
        }
      >
        <TenantRegisterForm tenantSlug={tenantSlug} />
      </Suspense>
    </div>
  );
}
