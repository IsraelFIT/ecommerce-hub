"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Camera,
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserStore } from "@/store/user";
import { updateUserProfile } from "@/lib/api/auth";
import { uploadImage } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UserProfileSettingsCardProps {
  tenantSlug?: string;
  title?: string;
  description?: string;
  roleBadgeText?: string;
  className?: string;
}

export function UserProfileSettingsCard({
  tenantSlug,
  title = "Administrator Profile & Information",
  description = "View and manage your personal account details, contact phone, and avatar.",
  roleBadgeText,
  className,
}: UserProfileSettingsCardProps) {
  const { user, updateUser, syncSession } = useUserStore();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [gender, setGender] = useState(user?.gender || "Female");
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatar_url || user?.avatarUrl || "",
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever user in store updates or hydrates
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setPhone(user.phone_number || "");
      setGender(user.gender || "Female");
      setAvatarUrl(user.avatar_url || user.avatarUrl || "");
    }
  }, [user]);

  // Initial session sync on mount
  useEffect(() => {
    syncSession().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP)");
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const res = await uploadImage(file, tenantSlug);
      if (res.data?.url) {
        const uploadedUrl = res.data.url;
        setAvatarUrl(uploadedUrl);
        const updated = await updateUserProfile({
          avatar_url: uploadedUrl,
        });
        updateUser(updated);
        toast.success("Profile avatar updated successfully!");
      } else {
        throw new Error("No image URL returned");
      }
    } catch {
      toast.error("Failed to upload avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First Name and Last Name are required");
      return;
    }

    try {
      setIsSaving(true);
      const updated = await updateUserProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phone.trim() || undefined,
        gender: gender || undefined,
        avatar_url: avatarUrl || undefined,
      });

      updateUser(updated);
      toast.success("Profile updated successfully!");
    } catch {
      // Optimistic local update fallback
      updateUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        phone_number: phone.trim(),
        gender: gender,
        avatar_url: avatarUrl,
      });
      toast.success("Profile updated locally");
    } finally {
      setIsSaving(false);
    }
  };

  const currentRole =
    roleBadgeText ||
    (user?.role === "super_admin"
      ? "Super Administrator"
      : user?.role === "tenant_admin"
        ? "Tenant Administrator"
        : user?.role?.replace("_", " ") || "Administrator");

  const effectiveAvatar =
    avatarUrl ||
    user?.avatar_url ||
    user?.avatarUrl ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6",
        className,
      )}
    >
      {/* Header section with User summary badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-4">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <UserIcon className="size-4.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>{title}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/20 text-[11px] font-semibold py-2 px-2.5 flex items-center gap-1.5"
          >
            <span className="capitalize">{currentRole}</span>
          </Badge>
        </div>
      </div>

      {/* Avatar Section & Preview */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-4 rounded-xl bg-muted/30 border border-border/50">
        <div className="relative inline-block shrink-0">
          <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border shadow-sm bg-muted flex items-center justify-center relative">
            {isUploadingAvatar ? (
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            ) : (
              <Image
                src={effectiveAvatar}
                alt="Profile Avatar"
                width={96}
                height={96}
                priority
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarChange}
            className="hidden"
            accept="image/*"
          />

          <button
            type="button"
            aria-label="Upload photo"
            disabled={isUploadingAvatar}
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
            title="Upload new avatar"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col justify-center text-center sm:text-left gap-1 flex-1 min-w-0">
          <h5 className="font-bold text-foreground truncate">
            {firstName || lastName
              ? `${firstName} ${lastName}`.trim()
              : user?.name || "Administrator"}
          </h5>
          <p className="text-muted-foreground truncate flex items-center justify-center sm:justify-start gap-1">
            <Mail className="h-3 w-3 shrink-0" />
            <span>{email || "user@ecommerce-hub.com"}</span>
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-xs text-muted-foreground">
              PNG, JPG, or WebP (max 5MB)
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="profileFirstName"
              className="text-xs font-semibold text-foreground"
            >
              First Name *
            </Label>
            <Input
              id="profileFirstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. John"
              required
              className="h-10 text-xs bg-background"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="profileLastName"
              className="text-xs font-semibold text-foreground"
            >
              Last Name *
            </Label>
            <Input
              id="profileLastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Doe"
              required
              className="h-10 text-xs bg-background"
            />
          </div>

          {/* Email (Read Only) */}
          <div className="space-y-1.5">
            <Label
              htmlFor="profileEmail"
              className="text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
              Address (Read-Only)
            </Label>
            <div className="relative">
              <Input
                id="profileEmail"
                type="email"
                value={email}
                readOnly
                className="h-10 text-xs bg-muted text-muted-foreground cursor-not-allowed pr-8"
              />
              <Lock className="h-3.5 w-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Primary login email associated with your authentication session.
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <Label
              htmlFor="profilePhone"
              className="text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone
              Number
            </Label>
            <Input
              id="profilePhone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="h-10 text-xs bg-background"
            />
          </div>

          {/* Gender */}
          <div className="space-y-1.5 md:col-span-2">
            <Label
              htmlFor="profileGender"
              className="text-xs font-semibold text-foreground"
            >
              Gender
            </Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger
                id="profileGender"
                className="h-10 w-full bg-background"
              >
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="Prefer not to say">
                  Prefer not to say
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/60">
          <Button type="submit" disabled={isSaving || isUploadingAvatar}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving Profile...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Profile Information
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
