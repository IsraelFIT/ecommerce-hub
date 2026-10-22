"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStore } from "@/store/user";
import { updateUserProfile } from "@/lib/api/auth";
import { uploadImage } from "@/lib/api/products";
import { getTenantRoute } from "@/utils/helper";
import type { User } from "@/types/users";

function ProfileFormComponent({
  user,
  tenant,
}: {
  user: User | null;
  tenant: string;
}) {
  const { setUser } = useUserStore();

  const [profileForm, setProfileForm] = useState({
    firstName: user?.first_name || user?.name?.split(" ")[0] || "",
    lastName:
      user?.last_name || user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone: user?.phone_number || "",
  });

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error("Please provide both first and last names");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updatedUser = await updateUserProfile({
        first_name: profileForm.firstName,
        last_name: profileForm.lastName,
        phone_number: profileForm.phone,
      });

      if (updatedUser) {
        setUser(updatedUser);
        toast.success("Profile updated successfully!");
      }
    } catch {
      toast.error("Failed to update profile information");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploadRes = await uploadImage(file, tenant);
      const newAvatarUrl = uploadRes.data?.url;

      if (!newAvatarUrl) {
        throw new Error("No URL returned from upload");
      }

      const updatedUser = await updateUserProfile({
        avatar_url: newAvatarUrl,
      });

      if (updatedUser) {
        setUser(updatedUser);
        toast.success("Profile picture updated!");
      }
    } catch {
      toast.error("Failed to update profile image");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const avatarUrl = user?.avatar_url || user?.avatarUrl;
  const userInitials =
    (profileForm.firstName?.charAt(0) || "") +
      (profileForm.lastName?.charAt(0) || "") || "U";

  return (
    <div>
      <h4 className="font-bold text-foreground mb-6">Personal Information</h4>

      {/* Avatar with edit badge */}
      <div className="flex justify-center md:justify-start mb-8">
        <div className="relative inline-block">
          <div className="h-28 w-28 rounded-full overflow-hidden border border-border shadow-sm bg-muted flex items-center justify-center">
            {isUploadingAvatar ? (
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            ) : avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Profile Avatar"
                width={112}
                height={112}
                priority
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl font-secondary">
                {userInitials.toUpperCase()}
              </div>
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
            className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              First Name *
            </Label>
            <Input
              value={profileForm.firstName}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  firstName: e.target.value,
                })
              }
              placeholder="First Name"
              className="h-10"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              Last Name *
            </Label>
            <Input
              value={profileForm.lastName}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  lastName: e.target.value,
                })
              }
              placeholder="Last Name"
              className="h-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">
            Email Address
          </Label>
          <Input
            type="email"
            value={profileForm.email}
            disabled
            className="h-10 bg-muted/50 cursor-not-allowed opacity-80"
          />
          <span className="text-[11px] text-muted-foreground block">
            Email address is permanently linked to your account credentials.
          </span>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">
            Phone Number
          </Label>
          <Input
            value={profileForm.phone}
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                phone: e.target.value,
              })
            }
            placeholder="e.g. +234 801 234 5678"
            className="h-10"
          />
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isUpdatingProfile}>
            {isUpdatingProfile ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ProfileContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tenant = (params?.tenant as string) || "store";
  const { user } = useUserStore();

  // Backward compatibility: redirect ?tab=... to its dedicated subpage
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["orders", "address", "password", "wishlist"].includes(tabParam)
    ) {
      router.replace(getTenantRoute(tenant, `/profile/${tabParam}`));
    }
  }, [searchParams, tenant, router]);

  return (
    <ProfileFormComponent
      key={user?.id || "guest"}
      user={user}
      tenant={tenant}
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-12 container mx-auto px-4 max-w-6xl">
          <Skeleton className="w-full h-80 rounded-2xl" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
