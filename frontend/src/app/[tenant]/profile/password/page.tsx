"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeUserPassword } from "@/lib/api/auth";
import { getTenantRoute } from "@/utils/helper";

export default function ProfilePasswordPage() {
  const params = useParams();
  const tenant = (params?.tenant as string) || "store";

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await changeUserPassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      });
      toast.success("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to update password. Please check your credentials.";
      toast.error(errorMessage);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div>
      <h4 className="font-bold text-foreground mb-6">Password Manager</h4>
      <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-xl">
        {/* Current Password */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">
            Current Password *
          </Label>
          <div className="relative">
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
              placeholder="Enter Current Password"
              className="h-10"
              required
            />
          </div>

          <div className="text-right pt-0.5">
            <Link
              href={getTenantRoute(tenant, "/forgot-password")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">
            New Password *
          </Label>
          <div className="relative">
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
              placeholder="Enter New Password (min. 6 characters)"
              className="h-10"
              required
            />
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">
            Confirm New Password *
          </Label>
          <div className="relative">
            <Input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
              placeholder="Confirm New Password"
              className="h-10"
              required
            />
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isUpdatingPassword}>
            {isUpdatingPassword ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
