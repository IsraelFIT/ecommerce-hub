"use client";

import { useState, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Store, Lock, Mail, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/store/user";
import { setAuthSession } from "@/lib/auth";
import { loginUser } from "@/lib/api/auth";
import { getTenantSubdomainUrl } from "@/utils/helper";

interface TenantLoginPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

function TenantLoginForm({ tenantSlug }: { tenantSlug: string }) {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const { setUser } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formattedStoreName = tenantSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const authData = await loginUser({ email, password });

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
        `Welcome back, ${authData.first_name || authData.full_name || "Shopper"}!`,
      );

      // Determine appropriate destination
      const isTenantAdmin =
        authData.role === "tenant_admin" || authData.role === "admin";
      const targetSlug = authData.tenant_slug || tenantSlug;

      if (redirectPath) {
        // If user came with explicit redirect param
        const targetUrl = getTenantSubdomainUrl(targetSlug, redirectPath);
        const urlObj = new URL(targetUrl);
        urlObj.searchParams.set("auth_token", authData.auth.access_token);
        urlObj.searchParams.set("refresh_token", authData.auth.refresh_token);
        urlObj.searchParams.set("role", authData.role);
        window.location.assign(urlObj.toString());
      } else if (isTenantAdmin) {
        // Tenant admins go straight to their admin dashboard
        const adminUrl = getTenantSubdomainUrl(targetSlug, "/admin");
        const urlObj = new URL(adminUrl);
        urlObj.searchParams.set("auth_token", authData.auth.access_token);
        urlObj.searchParams.set("refresh_token", authData.auth.refresh_token);
        urlObj.searchParams.set("role", authData.role);
        window.location.assign(urlObj.toString());
      } else {
        // Store customers go to the storefront
        const storeUrl = getTenantSubdomainUrl(targetSlug, "/");
        const urlObj = new URL(storeUrl);
        urlObj.searchParams.set("auth_token", authData.auth.access_token);
        urlObj.searchParams.set("refresh_token", authData.auth.refresh_token);
        urlObj.searchParams.set("role", authData.role);
        window.location.assign(urlObj.toString());
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to sign in. Please check your credentials.";
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
            Sign In to {formattedStoreName}
          </h1>
          <p className="text-xs text-muted-foreground">
            Access your orders, customer profile, or merchant console
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
              type="email"
              placeholder="you@example.com"
              className="pl-9 h-10 text-xs bg-background border-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <Label className="font-semibold text-foreground">Password</Label>
            <Link
              href="/forgot-password"
              className="text-primary hover:underline text-[11px] font-medium"
            >
              Forgot password?
            </Link>
          </div>
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

        <Button
          type="submit"
          className="w-full gap-2 h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Footer Register Link */}
      <div className="rounded-2xl bg-card-gray p-3.5 text-center text-xs text-muted-foreground border border-border space-y-1">
        <div>
          <span>New customer at {formattedStoreName}? </span>
          <Link
            href={`/${tenantSlug}/register`}
            className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
          >
            Create account
            <Sparkles className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TenantLoginPage({ params }: TenantLoginPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading login form...
          </div>
        }
      >
        <TenantLoginForm tenantSlug={tenantSlug} />
      </Suspense>
    </div>
  );
}
