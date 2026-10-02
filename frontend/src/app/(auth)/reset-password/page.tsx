"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  Hash,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordWithOtp } from "@/lib/api/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !otp || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordWithOtp({
        email,
        otp: otp.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setIsSuccess(true);
      toast.success("Password reset successfully! You can now sign in.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to reset password. Please verify the OTP code.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-xl text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary shadow-sm">
            <CheckCircle2 className="h-8 w-8" />
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight font-secondary text-foreground">
            Password Changed!
          </h1>
          <p className="text-xs text-muted-foreground">
            Your credentials have been securely updated. You can now log into
            your console.
          </p>
        </div>
        <Button
          onClick={() => {
            router.push("/login");
            router.refresh();
          }}
          className="w-full gap-2 h-11 text-sm font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <span>Go to Sign In</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-xl">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight font-secondary text-foreground">
          Set New Password
        </h1>
        <p className="text-xs text-muted-foreground max-w-xs">
          Enter the 6-digit verification code and your new account password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">
            Account Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
              type="email"
              placeholder="alex@yourbrand.com"
              className="pl-9 h-10 text-xs bg-background border-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">
            6-Digit Verification Code (OTP)
          </Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
              type="text"
              placeholder="e.g. 492817"
              maxLength={10}
              className="pl-9 h-10 font-mono tracking-widest text-sm bg-background border-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">
            New Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
              type="password"
              placeholder="At least 6 characters"
              className="pl-9 h-10 text-xs bg-background border-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">
            Confirm New Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
              type="password"
              placeholder="Repeat new password"
              className="pl-9 h-10 text-xs bg-background border-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full gap-2 h-11 text-sm font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Update Password</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="rounded-xl bg-card-gray p-3 text-center text-xs text-muted-foreground border border-border">
        <Link
          href="/login"
          className="text-primary font-semibold hover:underline inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading reset form...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
