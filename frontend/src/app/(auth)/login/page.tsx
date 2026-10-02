"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Store,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  Globe,
  Check,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/store/user";
import { setAuthSession } from "@/lib/auth";
import { loginUser } from "@/lib/api/auth";
import { getTenantSubdomainUrl } from "@/utils/helper";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const { setUser } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const [loggedInTenant] = useState<{
    slug: string;
    name: string;
    role: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
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
        tenant_slug: authData.tenant_slug,
        tenant_name: authData.tenant_name,
        auth: authData.auth,
      };

      setAuthSession(
        authData.auth.access_token,
        user,
        authData.auth.refresh_token,
      );
      setUser(user);

      toast.success(
        `Welcome back, ${authData.first_name || authData.full_name || "Merchant"}!`,
      );

      // 1. Super Administrator redirect to core console
      if (authData.role === "super_admin") {
        const targetPath = redirectPath || "/";
        const coreUrl = getTenantSubdomainUrl("core", targetPath);
        const urlObj = new URL(coreUrl);
        urlObj.searchParams.set("auth_token", authData.auth.access_token);
        urlObj.searchParams.set("refresh_token", authData.auth.refresh_token);
        urlObj.searchParams.set("role", authData.role);
        window.location.assign(urlObj.toString());
        return;
      }

      // 2. Tenant admin direct to their admin dashboard
      if (
        (authData.role === "tenant_admin" || authData.role === "admin") &&
        authData.tenant_slug
      ) {
        const targetPath = redirectPath || "/admin";
        const adminUrl = getTenantSubdomainUrl(
          authData.tenant_slug,
          targetPath,
        );
        const urlObj = new URL(adminUrl);
        urlObj.searchParams.set("auth_token", authData.auth.access_token);
        urlObj.searchParams.set("refresh_token", authData.auth.refresh_token);
        urlObj.searchParams.set("role", authData.role);
        window.location.assign(urlObj.toString());
      } else if (authData.tenant_slug) {
        // Customer with tenant_slug
        const targetPath = redirectPath || "/";
        const storeUrl = getTenantSubdomainUrl(
          authData.tenant_slug,
          targetPath,
        );
        const urlObj = new URL(storeUrl);
        urlObj.searchParams.set("auth_token", authData.auth.access_token);
        urlObj.searchParams.set("refresh_token", authData.auth.refresh_token);
        urlObj.searchParams.set("role", authData.role);
        window.location.assign(urlObj.toString());
      } else {
        router.push(redirectPath || "/dashboard");
        router.refresh();
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

  const handleCopySubdomain = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success("Subdomain URL copied to clipboard!");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (loggedInTenant) {
    const targetPath = redirectPath || "/admin";
    const liveSubdomainUrl = getTenantSubdomainUrl(loggedInTenant.slug);
    const liveAdminUrl = getTenantSubdomainUrl(loggedInTenant.slug, targetPath);

    return (
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-8 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Store className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-secondary text-foreground">
              {loggedInTenant.name} Storefront
            </h2>
            <p className="text-xs text-muted-foreground">
              Authenticated successfully as Tenant Administrator
            </p>
          </div>
        </div>

        {/* Subdomain Display Box */}
        <div className="rounded-2xl border border-border bg-card-gray p-4 text-left space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Your Subdomain URL
            </span>
            <span className="flex items-center gap-1 text-[11px] text-primary font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Live Subdomain
            </span>
          </div>

          <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-2 shadow-2xs">
            <Globe className="h-4 w-4 text-primary ml-1 shrink-0" />
            <span className="font-mono text-xs font-semibold text-foreground flex-1 truncate">
              {liveSubdomainUrl}
            </span>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => handleCopySubdomain(liveSubdomainUrl)}
              className="h-7 px-2 text-[11px] gap-1 shrink-0"
            >
              {copiedUrl ? (
                <>
                  <Check className="h-3 w-3 text-primary" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 text-muted-foreground" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* CTA to enter dashboard */}
        <div className="space-y-3 pt-1">
          <Button
            type="button"
            onClick={() => {
              window.location.assign(liveAdminUrl);
            }}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs md:text-sm rounded-xl shadow-md gap-2"
          >
            <span>Enter Admin Dashboard ({liveAdminUrl})</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="flex items-center justify-center gap-4 text-xs">
            <a
              href={liveSubdomainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary font-medium inline-flex items-center gap-1 hover:underline"
            >
              <span>View Public Storefront</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-xl">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="flex items-center justify-center">
          <Store className="h-8 w-8 text-primary" />
        </div>
        <div className="flex flex-col">
          <h3 className="font-bold tracking-tight font-secondary text-foreground">
            Sign In to Your Storefront
          </h3>
          <p className="text-muted-foreground">
            Access your multi-tenant admin console, orders, and products
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
              placeholder="owner@yourstore.com"
              className="pl-9 h-10 text-xs bg-background border-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Sign In to Console</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="rounded-xl bg-card-gray p-3 text-center text-muted-foreground border border-border">
        <span>Ready to launch your own brand? </span>
        <Link
          href="/signup"
          className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
        >
          Create Store
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading form...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
