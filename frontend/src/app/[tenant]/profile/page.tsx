"use client";

import { useState, useEffect, useRef, useTransition, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Heart,
  Camera,
  ShoppingBag,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { getTenantRoute, formatCurrency } from "@/utils/helper";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStore } from "@/store/user";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { MenuCard } from "@/components/pages/menu/menu-card";
import type { Product } from "@/types/products";
import { UserAddress } from "@/types/users";
import { deleteAuthCookies } from "@/lib/session";
import { clearAuthSession } from "@/lib/auth";
import {
  updateUserProfile,
  changeUserPassword,
  getUserAddresses,
  addUserAddress,
  deleteUserAddress,
} from "@/lib/api/auth";
import { uploadImage } from "@/lib/api/products";
import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TabType = "profile" | "orders" | "address" | "password" | "wishlist";

interface OrderItemDisplay {
  id: string;
  title: string;
  specs: string;
  image: string;
  price: number;
}

interface OrderDisplay {
  id: string;
  gatewayReference: string;
  orderNumber: string;
  totalPayment: number;
  currency: string;
  paymentMethod: string;
  dateLabel: string;
  dateValue: string;
  status: "Accepted" | "Delivered" | "Processing" | "On the Way" | "Cancelled";
  statusDescription: string;
  items: OrderItemDisplay[];
}

interface ApiOrderItem {
  product_id?: string;
  product_title?: string;
  title?: string;
  quantity?: number;
  image?: string;
  image_url?: string;
  images?: string[];
  unit_price?: number | string;
  options?: Record<string, unknown>;
}

interface ApiOrder {
  id: string;
  gateway_reference?: string;
  total_amount?: number | string;
  currency?: string;
  payment_gateway?: string;
  created_at?: string;
  status?: string;
  items?: ApiOrderItem[];
  metadata_json?: Record<string, unknown>;
}

function ProfileContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const tenant = (params?.tenant as string) || "store";
  const { branding } = useTenantTheme();
  const { user, updateUser, clearUser } = useUserStore();

  const primaryColor = branding.primaryColor || "var(--primary)";

  // Tab state syncing
  const initialTabParam = searchParams.get("tab");
  const resolveTab = (param: string | null): TabType => {
    switch (param) {
      case "orders":
      case "my-orders":
        return "orders";
      case "address":
      case "manage-address":
        return "address";
      case "password":
      case "change-password":
        return "password";
      case "wishlist":
        return "wishlist";
      case "profile":
      case "personal-information":
      default:
        return "profile";
    }
  };

  const [activeTab, setActiveTab] = useState<TabType>(() =>
    resolveTab(initialTabParam),
  );

  useEffect(() => {
    const nextTab = resolveTab(searchParams.get("tab"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab(nextTab);
  }, [searchParams]);

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    startTransition(() => {
      router.replace(`/${tenant}/profile?tab=${tab}`, { scroll: false });
    });
  };

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const res = await uploadImage(file, tenant);
      if (res.data?.url) {
        const updated = await updateUserProfile({
          avatar_url: res.data.url,
        });
        updateUser(updated);
        toast.success("Avatar image updated!");
      }
    } catch {
      toast.error("Failed to upload avatar image");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Personal Information State
  const [profileForm, setProfileForm] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone_number || "",
    gender: user?.gender || "Female",
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfileForm((prev) => ({
        ...prev,
        firstName: user.first_name || prev.firstName,
        lastName: user.last_name || prev.lastName,
        email: user.email || prev.email,
        phone: user.phone_number ?? prev.phone,
        gender: user.gender ?? prev.gender,
      }));
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const updated = await updateUserProfile({
        first_name: profileForm.firstName,
        last_name: profileForm.lastName,
        phone_number: profileForm.phone,
        gender: profileForm.gender,
      });
      updateUser(updated);
      toast.success("Profile updated successfully!");
    } catch {
      // Local optimistic fallback
      updateUser({
        first_name: profileForm.firstName,
        last_name: profileForm.lastName,
        name: `${profileForm.firstName} ${profileForm.lastName}`,
        phone_number: profileForm.phone,
        gender: profileForm.gender,
      });
      toast.success("Profile changes saved locally");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Orders State
  const [orderFilter, setOrderFilter] = useState<string>("All");
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    async function fetchUserOrders() {
      if (!user) return;
      setIsLoadingOrders(true);
      try {
        const res = await apiRequest<{ items: ApiOrder[] }>(`/orders`, {
          headers: {
            "X-Tenant-Slug": tenant,
          },
        });
        if (res.data?.items) {
          const mapped: OrderDisplay[] = res.data.items.map((o: ApiOrder) => {
            const rawStatus = (o.status || "pending").toLowerCase();
            let displayStatus: OrderDisplay["status"] = "Processing";
            let statusDesc = "Your order is being prepared";
            if (rawStatus === "delivered" || rawStatus === "fulfilled") {
              displayStatus = "Delivered";
              statusDesc = "Your order has been delivered";
            } else if (rawStatus === "shipped") {
              displayStatus = "On the Way";
              statusDesc = "Your order is on the way";
            } else if (rawStatus === "accepted" || rawStatus === "paid") {
              displayStatus = "Accepted";
              statusDesc = "Your order has been accepted";
            } else if (rawStatus === "cancelled" || rawStatus === "failed") {
              displayStatus = "Cancelled";
              statusDesc = "Your order has been cancelled";
            }

            const items: OrderItemDisplay[] = (o.items || []).map(
              (it: ApiOrderItem, idx: number) => {
                const itemImg =
                  it.image ||
                  it.image_url ||
                  (Array.isArray(it.images) && it.images[0]) ||
                  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80";

                const optionsStr = it.options
                  ? Object.entries(it.options)
                      .map(
                        ([k, v]) =>
                          `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`,
                      )
                      .join(" | ")
                  : "";
                const specs = optionsStr
                  ? `${optionsStr} | ${it.quantity || 1} Qty.`
                  : `${it.quantity || 1} Qty.`;

                return {
                  id: `${o.id}-${idx}`,
                  title: it.product_title || it.title || "Product Item",
                  specs,
                  image: itemImg,
                  price: Number(it.unit_price) || 0,
                };
              },
            );

            return {
              id: o.id,
              gatewayReference: o.gateway_reference || o.id,
              orderNumber:
                o.gateway_reference || o.id.slice(0, 8).toUpperCase(),
              totalPayment: Number(o.total_amount) || 0,
              currency: o.currency || "NGN",
              paymentMethod: (o.payment_gateway || "Online").toUpperCase(),
              dateLabel:
                displayStatus === "Delivered"
                  ? "Delivered Date"
                  : "Estimated Delivery Date",
              dateValue: o.created_at
                ? new Date(o.created_at).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Pending",
              status: displayStatus,
              statusDescription: statusDesc,
              items,
            };
          });
          setOrders(mapped);
        }
      } catch (err) {
        console.error("Failed to load user orders:", err);
      } finally {
        setIsLoadingOrders(false);
      }
    }
    fetchUserOrders();
  }, [user, tenant]);

  const filteredOrders = orders.filter((ord) => {
    if (orderFilter === "All") return true;
    return ord.status.toLowerCase() === orderFilter.toLowerCase();
  });

  // Manage Address State
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  useEffect(() => {
    async function loadAddresses() {
      if (!user?.id) return;
      setIsLoadingAddresses(true);
      try {
        const res = await getUserAddresses();
        if (res && Array.isArray(res)) {
          setAddresses(res);
        }
      } catch (err) {
        console.error("Failed to load addresses:", err);
      } finally {
        setIsLoadingAddresses(false);
      }
    }
    loadAddresses();
  }, [user?.id]);

  const [addressForm, setAddressForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    country: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
  });

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.firstName || !addressForm.street) {
      toast.error("Please fill in the required address fields");
      return;
    }
    try {
      const added = await addUserAddress({
        first_name: addressForm.firstName,
        last_name: addressForm.lastName,
        company: addressForm.company || undefined,
        street: addressForm.street,
        city: addressForm.city,
        state: addressForm.state,
        zip_code: addressForm.zipCode,
        country: addressForm.country,
        phone: addressForm.phone,
        email: addressForm.email || undefined,
      });
      setAddresses((prev) => [added, ...prev]);
      toast.success("Address added successfully!");
      setAddressForm({
        firstName: "",
        lastName: "",
        company: "",
        country: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        phone: "",
        email: "",
      });
    } catch {
      toast.error("Failed to add address");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteUserAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address deleted");
    } catch {
      toast.error("Failed to delete address");
    }
  };

  // Password Manager State
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

  // Wishlist State
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);

  useEffect(() => {
    async function fetchWishlistProducts() {
      setIsLoadingWishlist(true);
      try {
        const res = await apiRequest<{ items: Product[] }>(
          `/products?page=1&per_page=50&published_only=true`,
        );
        if (res.data?.items) {
          const likedItems = res.data.items.filter(
            (p: Product) => p.is_liked === true,
          );
          setWishlistItems(likedItems);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoadingWishlist(false);
      }
    }
    if (activeTab === "wishlist") {
      fetchWishlistProducts();
    }
  }, [activeTab]);

  // Logout Handler
  const handleLogout = () => {
    try {
      deleteAuthCookies();
      clearAuthSession();
      clearUser();
      toast.success("Logged out successfully");
      router.push(`/${tenant}`);
      router.refresh();
    } catch {
      clearUser();
      router.push(`/${tenant}`);
    }
  };

  // Sidebar Tabs Config (Payment Method removed per user request)
  const tabsList = [
    { id: "profile" as TabType, label: "Personal Information" },
    { id: "orders" as TabType, label: "My Orders" },
    { id: "address" as TabType, label: "Manage Address" },
    { id: "password" as TabType, label: "Password Manager" },
    { id: "wishlist" as TabType, label: "Wishlist" },
  ];

  return (
    <div className="w-full bg-background py-8">
      <div className="container flex-col">
        {/* Breadcrumb Navigation */}
        <nav className="w-full flex items-center gap-2 text-sm text-foreground font-medium mb-8">
          <Link
            href={getTenantRoute(tenant, "/")}
            className="hover:text-stone-900 transition-colors text-stone-500"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          <Link
            href={getTenantRoute(tenant, "/profile")}
            className="hover:text-stone-900 transition-colors text-stone-500"
          >
            My Account
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          <span className="text-stone-900 font-semibold truncate max-w-xs">
            {tabsList.find((t) => t.id === activeTab)?.label ||
              "Personal Information"}
          </span>
        </nav>

        <div className="w-full flex flex-col md:flex-row items-start gap-8 lg:gap-12">
          {/* LEFT SIDEBAR TABS */}
          <div className="w-full md:w-64 lg:w-72 shrink-0">
            <div className="flex flex-col gap-2.5">
              {tabsList.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectTab(tab.id)}
                    style={
                      isActive
                        ? {
                            backgroundColor: primaryColor,
                            color: "#ffffff",
                          }
                        : undefined
                    }
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-sm text-sm font-semibold transition-all cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm font-bold scale-[1.01]"
                        : "bg-card border border-border/70 text-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 rounded-sm text-sm font-semibold transition-all cursor-pointer border border-border/70 bg-card text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 mt-1 shadow-2xs"
              >
                Logout
              </button>
            </div>
          </div>

          {/* RIGHT CONTENT PANEL */}
          <div className="flex-1 w-full min-w-0 bg-card border border-border/60 rounded-xl p-6">
            {/* 1. PERSONAL INFORMATION TAB */}
            {activeTab === "profile" && (
              <div>
                {/* Avatar with edit badge */}
                <div className="flex justify-center md:justify-start mb-8">
                  <div className="relative inline-block">
                    <div className="h-28 w-28 rounded-full overflow-hidden border border-border shadow-sm bg-muted flex items-center justify-center">
                      {isUploadingAvatar ? (
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      ) : (
                        <Image
                          src={
                            user?.avatar_url ||
                            user?.avatarUrl ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"
                          }
                          alt="Profile Avatar"
                          width={112}
                          height={112}
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
                      className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Profile Form */}
                <form
                  onSubmit={handleUpdateProfile}
                  className="space-y-6 max-w-xl"
                >
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
                      Email *
                    </Label>
                    <Input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="example@gmail.com"
                      className="h-10"
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">
                      Phone *
                    </Label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+0123-456-789"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">
                      Gender *
                    </Label>
                    <Select
                      value={profileForm.gender}
                      onValueChange={(val) =>
                        setProfileForm({ ...profileForm, gender: val })
                      }
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select Gender" />
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

                  <div className="pt-2">
                    <Button type="submit" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? "Updating..." : "Update Changes"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. MY ORDERS TAB */}
            {activeTab === "orders" && (
              <div>
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-border gap-4">
                  <h4 className="font-bold text-foreground">
                    Orders ({filteredOrders.length})
                  </h4>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-muted-foreground whitespace-nowrap">
                      Sort by :
                    </span>
                    <Select
                      value={orderFilter}
                      onValueChange={(val) => setOrderFilter(val)}
                    >
                      <SelectTrigger className="h-11 w-32 border-border bg-background">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Orders List */}
                {isLoadingOrders ? (
                  <div className="space-y-4">
                    <Skeleton className="h-44 w-full rounded-2xl" />
                    <Skeleton className="h-44 w-full rounded-2xl" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-semibold text-foreground">
                      No orders found
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                      Browse our store to place your first order.
                    </p>
                    <Link href={`/${tenant}/menu`}>
                      <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-6">
                        Explore Menu
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-border overflow-hidden bg-card shadow-2xs transition-shadow hover:shadow-xs"
                      >
                        {/* Header Strip */}
                        <div
                          style={{ backgroundColor: primaryColor }}
                          className="px-5 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-white font-semibold text-xs"
                        >
                          <div className="flex flex-col">
                            <p className="text-[11px] opacity-80 uppercase tracking-wider font-medium">
                              Order ID
                            </p>
                            <p className="font-bold">#{order.orderNumber}</p>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[11px] opacity-80 uppercase tracking-wider font-medium">
                              Total Payment
                            </p>
                            <p className="font-bold">
                              {formatCurrency(
                                order.totalPayment,
                                order.currency,
                              )}
                            </p>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[11px] opacity-80 uppercase tracking-wider font-medium">
                              Payment Method
                            </p>
                            <p className="font-bold">{order.paymentMethod}</p>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[11px] opacity-80 uppercase tracking-wider font-medium">
                              {order.dateLabel}
                            </p>
                            <p className="font-bold">{order.dateValue}</p>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="p-5 divide-y divide-border/60">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-4"
                            >
                              <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-border bg-muted/40 relative">
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-foreground truncate">
                                  {item.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.specs}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-foreground">
                                  {formatCurrency(item.price, order.currency)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Status & Actions Footer */}
                        <div className="px-5 py-4 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                                order.status === "Delivered"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : order.status === "On the Way"
                                    ? "bg-blue-100 text-blue-800 border-blue-300"
                                    : order.status === "Accepted"
                                      ? "bg-amber-100 text-amber-800 border-amber-300"
                                      : order.status === "Cancelled"
                                        ? "bg-rose-100 text-rose-800 border-rose-300"
                                        : "bg-muted text-muted-foreground border-border",
                              )}
                            >
                              {order.status}
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {order.statusDescription}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <Button
                              size="sm"
                              onClick={() =>
                                router.push(
                                  getTenantRoute(tenant, `/track/${order.id}`),
                                )
                              }
                              className="h-9 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold cursor-pointer"
                            >
                              Track Order
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const invoiceRef =
                                  order.gatewayReference || order.orderNumber;
                                const invoiceUrl = getTenantRoute(
                                  tenant,
                                  `/orders/confirmation?reference=${encodeURIComponent(invoiceRef)}&print=true`,
                                );
                                window.open(invoiceUrl, "_blank");
                              }}
                              className="h-9 px-4 rounded-full border-border text-foreground hover:bg-muted text-xs font-semibold cursor-pointer"
                            >
                              Invoice
                            </Button>

                            {order.status !== "Delivered" &&
                              order.status !== "Cancelled" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toast.info("Order cancellation requested")
                                  }
                                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors ml-2 cursor-pointer"
                                >
                                  Cancel Order
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. MANAGE ADDRESS TAB */}
            {activeTab === "address" && (
              <div className="space-y-8">
                {/* Saved Addresses Cards */}
                {isLoadingAddresses ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-4 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Loading saved addresses...</span>
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="rounded-xl border border-border/80 p-4 bg-background flex items-start justify-between gap-4"
                      >
                        <div>
                          <p className="text-sm font-bold text-foreground flex items-center gap-2">
                            <span>
                              {addr.first_name || addr.firstName}{" "}
                              {addr.last_name || addr.lastName}
                            </span>
                            {addr.is_default && (
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {addr.street}, {addr.city}, {addr.state}{" "}
                            {addr.zip_code || addr.zipCode}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {addr.country}
                            {addr.phone ? ` • ${addr.phone}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-rose-500 hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">
                    No addresses saved yet. Add your address below.
                  </p>
                )}

                {/* Add New Address Form */}
                <div className="pt-2">
                  <h3 className="text-base font-bold text-foreground mb-4">
                    Add New Address
                  </h3>

                  <form
                    onSubmit={handleAddAddress}
                    className="space-y-4 max-w-2xl"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          First Name *
                        </Label>
                        <Input
                          value={addressForm.firstName}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              firstName: e.target.value,
                            })
                          }
                          placeholder="Ex. John"
                          className="h-10"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Last Name *
                        </Label>
                        <Input
                          value={addressForm.lastName}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              lastName: e.target.value,
                            })
                          }
                          placeholder="Ex. Doe"
                          className="h-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Company Name (Optional)
                      </Label>
                      <Input
                        value={addressForm.company}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            company: e.target.value,
                          })
                        }
                        placeholder="Enter Company Name"
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Country *
                      </Label>
                      <Select
                        value={addressForm.country}
                        onValueChange={(val) =>
                          setAddressForm({ ...addressForm, country: val })
                        }
                      >
                        <SelectTrigger className="h-11 w-full">
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="United States">
                            United States
                          </SelectItem>
                          <SelectItem value="Nigeria">Nigeria</SelectItem>
                          <SelectItem value="United Kingdom">
                            United Kingdom
                          </SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="Germany">Germany</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Street Address *
                      </Label>
                      <Input
                        value={addressForm.street}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            street: e.target.value,
                          })
                        }
                        placeholder="Enter Street Address"
                        className="h-10"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          City *
                        </Label>
                        <Input
                          value={addressForm.city}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              city: e.target.value,
                            })
                          }
                          placeholder="Select City"
                          className="h-10"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          State *
                        </Label>
                        <Input
                          value={addressForm.state}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              state: e.target.value,
                            })
                          }
                          placeholder="Select State"
                          className="h-10"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Zip Code *
                        </Label>
                        <Input
                          value={addressForm.zipCode}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              zipCode: e.target.value,
                            })
                          }
                          placeholder="Enter Zip Code"
                          className="h-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Phone *
                        </Label>
                        <Input
                          value={addressForm.phone}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Enter Phone Number"
                          className="h-10"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Email *
                        </Label>
                        <Input
                          type="email"
                          value={addressForm.email}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              email: e.target.value,
                            })
                          }
                          placeholder="Enter Email Address"
                          className="h-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button type="submit">Add Address</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 4. PASSWORD MANAGER TAB */}
            {activeTab === "password" && (
              <div>
                <form
                  onSubmit={handleUpdatePassword}
                  className="space-y-5 max-w-xl"
                >
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Password *
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
                        placeholder="Enter Password"
                        className="h-10"
                        required
                      />
                    </div>

                    <div className="text-right pt-0.5">
                      <Link
                        href={`/${tenant}/forgot-password`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      New Password
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
                        placeholder="Enter Password"
                        className="h-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Confirm New Password
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
                        placeholder="Enter Password"
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
            )}

            {/* 5. WISHLIST TAB */}
            {activeTab === "wishlist" && (
              <div>
                <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
                  <h4 className="font-bold text-foreground">
                    Wishlist ({wishlistItems.length})
                  </h4>
                  <Link href={`/${tenant}/menu`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-semibold"
                    >
                      Discover Products
                    </Button>
                  </Link>
                </div>

                {isLoadingWishlist ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="py-12 text-center">
                    <Heart className="h-12 w-12 text-rose-400 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-semibold text-foreground">
                      Your wishlist is empty
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                      Explore our products and tap the heart icon to save your
                      favorites here.
                    </p>
                    <Link href={`/${tenant}/menu`}>
                      <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-6">
                        Browse Menu
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistItems.map((prod) => (
                      <MenuCard
                        key={prod.id}
                        product={prod}
                        tenantSlug={tenant}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-12 container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="w-full md:w-64 h-80 rounded-2xl" />
            <Skeleton className="flex-1 h-96 rounded-2xl" />
          </div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
