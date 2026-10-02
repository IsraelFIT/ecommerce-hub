"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your registered email address");
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordReset(email);
      setSubmittedEmail(email);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      toast.success("Verification code sent! Please check your email.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to request password reset code.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 shadow-xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <KeyRound className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold tracking-tight font-secondary text-foreground">
              Reset Your Password
            </h3>
            <p className="text-muted-foreground max-w-xs">
              Enter your merchant account email and we&apos;ll send you a
              6-digit verification OTP.
            </p>
          </div>
        </div>

        {submittedEmail ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-primary/20 bg-primary-light p-4 text-center space-y-3">
              <div className="flex justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Verification Code Sent
                </p>
                <p className="text-xs text-muted-foreground">
                  We sent a 6-digit one-time passcode to{" "}
                  <strong className="text-foreground">{submittedEmail}</strong>.
                </p>
              </div>

              {devOtp && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                    <span>Dev OTP Code:</span>
                  </div>
                  <strong className="font-mono text-sm tracking-wider px-2 py-0.5 bg-amber-500/20 rounded">
                    {devOtp}
                  </strong>
                </div>
              )}
            </div>

            <Button
              onClick={() =>
                router.push(
                  `/reset-password?email=${encodeURIComponent(submittedEmail)}`,
                )
              }
              className="w-full gap-2 h-11 text-sm font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <span>Enter Verification Code</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Registered Email Address
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Send Verification OTP</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}
        <Link href="/login">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
