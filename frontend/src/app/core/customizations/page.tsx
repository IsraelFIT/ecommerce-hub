"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Palette,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  Store,
  RefreshCw,
  Edit3,
  XCircle,
  FileCode2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  getTenantBrandings,
  getCustomizationRequests,
  updateCustomizationRequest,
} from "@/lib/api/customizations";
import { CustomizationRequest, TenantBrandingSummary } from "@/types/users";
import { getTenantSubdomainUrl } from "@/utils/helper";

export default function CoreCustomizationsPage() {
  const [activeTab, setActiveTab] = useState<"brandings" | "requests">(
    "brandings",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [landingTypeFilter, setLandingTypeFilter] = useState("all");
  const [brandingsPage, setBrandingsPage] = useState(1);
  const brandingsPageSize = 10;
  const [requestsPage, setRequestsPage] = useState(1);
  const requestsPageSize = 10;
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [brandings, setBrandings] = useState<TenantBrandingSummary[]>([]);
  const [requests, setRequests] = useState<CustomizationRequest[]>([]);

  // Modal / Review drawer state for requests
  const [selectedRequest, setSelectedRequest] =
    useState<CustomizationRequest | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [editAdminNotes, setEditAdminNotes] = useState("");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [brandingsRes, requestsRes] = await Promise.all([
        getTenantBrandings({ per_page: 100 }),
        getCustomizationRequests({ per_page: 100 }),
      ]);

      if (brandingsRes.data?.items) {
        setBrandings(brandingsRes.data.items);
      }
      if (requestsRes.data?.items) {
        setRequests(requestsRes.data.items);
      }
    } catch (err) {
      console.warn("Could not load customization data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Update status or notes for a custom landing page request
  const handleUpdateStatus = async (
    requestId: string,
    newStatus: string,
    notes?: string,
  ) => {
    try {
      setUpdatingStatusId(requestId);
      const res = await updateCustomizationRequest(requestId, {
        status: newStatus,
        admin_notes: notes !== undefined ? notes : undefined,
      });

      if (res.data) {
        toast.success(`Request status updated to "${newStatus}"`);
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, ...res.data } : r)),
        );
        if (selectedRequest?.id === requestId) {
          setSelectedRequest(res.data);
        }
        await loadData();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update request");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedRequest) return;
    await handleUpdateStatus(
      selectedRequest.id,
      selectedRequest.status,
      editAdminNotes,
    );
    toast.success("Admin notes saved successfully!");
  };

  // Filter Brandings
  const filteredBrandings = brandings.filter((b) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (b.name || "").toLowerCase().includes(term) ||
      (b.slug || "").toLowerCase().includes(term) ||
      (b.category || "").toLowerCase().includes(term) ||
      (b.store_headline && b.store_headline.toLowerCase().includes(term));

    const matchesType =
      landingTypeFilter === "all" || b.landing_page_type === landingTypeFilter;

    return matchesSearch && matchesType;
  });

  // Filter Requests
  const filteredRequests = requests.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (r.tenant_name || "").toLowerCase().includes(term) ||
      (r.tenant_slug || "").toLowerCase().includes(term) ||
      (r.requested_by_email &&
        r.requested_by_email.toLowerCase().includes(term)) ||
      (r.details && r.details.toLowerCase().includes(term));

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalBrandingsPages =
    Math.ceil(filteredBrandings.length / brandingsPageSize) || 1;
  const paginatedBrandings = filteredBrandings.slice(
    (brandingsPage - 1) * brandingsPageSize,
    brandingsPage * brandingsPageSize,
  );

  const totalRequestsPages =
    Math.ceil(filteredRequests.length / requestsPageSize) || 1;
  const paginatedRequests = filteredRequests.slice(
    (requestsPage - 1) * requestsPageSize,
    requestsPage * requestsPageSize,
  );

  // Metrics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const inProgressRequests = requests.filter(
    (r) => r.status === "in_progress" || r.status === "in_review",
  ).length;
  const customStorefrontCount = brandings.filter(
    (b) => b.landing_page_type === "custom",
  ).length;

  return (
    <div className="space-y-6 w-full pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold font-secondary text-foreground">
              Storefront Customizations & Branding
            </h2>
            <Badge
              variant="outline"
              className="text-xs bg-muted/60 text-muted-foreground"
            >
              Super Admin Console
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit live brand palettes, logos, and manage bespoke custom landing
            page design requests from tenants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            disabled={isLoading}
            variant="outline"
            size="md"
            className="text-xs h-9 cursor-pointer gap-2"
          >
            <RefreshCw
              className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Bespoke Design Requests</span>
            <Sparkles className="size-4 text-pink-500" />
          </div>
          <div className="text-2xl font-bold font-secondary text-foreground">
            {totalRequests}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Tenant landing page inquiries
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Pending Review</span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-secondary text-amber-600 dark:text-amber-400">
            {pendingRequests}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Awaiting engineering review
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">In Engineering</span>
            <Loader2 className="size-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-secondary text-blue-600 dark:text-blue-400">
            {inProgressRequests}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Active bespoke builds
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Custom Storefronts</span>
            <Palette className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-secondary text-foreground">
            {customStorefrontCount}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Active bespoke layouts
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("brandings")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "brandings"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Palette className="size-4" />
            <span>Tenant Brandings & Colors</span>
            <Badge
              variant="outline"
              className={`ml-1 text-[10px] ${
                activeTab === "brandings"
                  ? "bg-white/20 text-white border-transparent"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {brandings.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "requests"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Sparkles className="size-4" />
            <span>Custom Landing Page Requests</span>
            {pendingRequests > 0 && (
              <span className="flex size-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
            )}
            <Badge
              variant="outline"
              className={`ml-1 text-[10px] ${
                activeTab === "requests"
                  ? "bg-white/20 text-white border-transparent"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {requests.length}
            </Badge>
          </button>
        </div>

        {/* Filter / Search Controls */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search store, slug, domain..."
              className="text-xs pl-8 h-8.5 bg-card"
            />
          </div>

          {activeTab === "brandings" ? (
            <select
              value={landingTypeFilter}
              onChange={(e) => setLandingTypeFilter(e.target.value)}
              className="h-8.5 text-xs bg-card border border-border rounded-md px-2.5 text-foreground outline-none cursor-pointer"
            >
              <option value="all">All Storefront Modes</option>
              <option value="default">Standard Engine</option>
              <option value="custom">Bespoke Custom</option>
            </select>
          ) : (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8.5 text-xs bg-card border border-border rounded-md px-2.5 text-foreground outline-none cursor-pointer"
            >
              <option value="all">All Request Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="in_review">In Review</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          )}
        </div>
      </div>

      {/* TAB 1: Tenant Brandings Directory */}
      {activeTab === "brandings" && (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs">Store & Tenant</TableHead>
                <TableHead className="text-xs">
                  Brand Colors (Primary / Secondary)
                </TableHead>
                <TableHead className="text-xs">Storefront Mode</TableHead>
                <TableHead className="text-xs">Logo Asset</TableHead>
                <TableHead className="text-xs">
                  Headline & Announcement
                </TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow
                    key={`branding-skel-${i}`}
                    className="border-border"
                  >
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8.5 rounded-xl shrink-0" />
                        <div className="space-y-1.5 min-w-0">
                          <Skeleton className="h-3.5 w-28 rounded-md" />
                          <Skeleton className="h-3 w-36 rounded-md" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-4 rounded-full" />
                        <Skeleton className="h-3.5 w-14 rounded-md" />
                        <Skeleton className="size-4 rounded-full ml-2" />
                        <Skeleton className="h-3.5 w-14 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Skeleton className="h-5 w-16 rounded-md" />
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-32 rounded-md" />
                        <Skeleton className="h-3 w-24 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Skeleton className="h-7 w-20 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredBrandings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground text-xs"
                  >
                    No tenant brandings match your filter.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBrandings.map((tenant) => {
                  const subUrl = getTenantSubdomainUrl(tenant.slug);
                  return (
                    <TableRow
                      key={tenant.tenant_id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Store Details */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="size-8.5 rounded-xl text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                            style={{ backgroundColor: tenant.primary_color }}
                          >
                            {tenant.logo_url ? (
                              <Image
                                src={tenant.logo_url}
                                alt={tenant.name}
                                width={34}
                                height={34}
                                className="object-cover size-full rounded-xl"
                                unoptimized
                              />
                            ) : (
                              <Store className="size-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-foreground truncate">
                              {tenant.name}
                            </div>
                            <div className="text-[11px]  text-muted-foreground truncate">
                              {subUrl.replace(/^https?:\/\//, "")}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Brand Colors (Primary & Secondary) */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="size-4 rounded-full border border-card shadow-xs shrink-0"
                              style={{ backgroundColor: tenant.primary_color }}
                              title={`Primary: ${tenant.primary_color}`}
                            />
                            <span className=" text-xs font-semibold text-foreground">
                              {tenant.primary_color}
                            </span>
                          </div>
                          <span className="text-muted-foreground/50">/</span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="size-4 rounded-full border border-card shadow-xs shrink-0"
                              style={{
                                backgroundColor: tenant.secondary_color,
                              }}
                              title={`Secondary: ${tenant.secondary_color}`}
                            />
                            <span className=" text-xs font-semibold text-foreground">
                              {tenant.secondary_color}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Storefront Mode */}
                      <TableCell className="py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge
                            variant="outline"
                            className={
                              tenant.landing_page_type === "custom"
                                ? "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 text-[10px]"
                                : "bg-primary/10 text-primary border-primary/20 text-[10px]"
                            }
                          >
                            {tenant.landing_page_type === "custom"
                              ? "Bespoke Custom"
                              : "Standard Engine"}
                          </Badge>
                          {tenant.has_custom_request && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              Request: {tenant.custom_request_status}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Logo Asset */}
                      <TableCell className="py-3.5">
                        {tenant.logo_url ? (
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg border border-border overflow-hidden bg-muted/30">
                              <Image
                                src={tenant.logo_url}
                                alt="Logo"
                                width={28}
                                height={28}
                                className="object-cover size-full"
                                unoptimized
                              />
                            </div>
                            <span className="text-[11px] text-muted-foreground  truncate max-w-24">
                              Neon Storage
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Default Icon
                          </span>
                        )}
                      </TableCell>

                      {/* Headline & Announcement */}
                      <TableCell className="py-3.5 max-w-xs">
                        <div className="space-y-0.5">
                          <div className="text-xs font-medium text-foreground truncate">
                            {tenant.store_headline || "Default Headline"}
                          </div>
                          {tenant.announcement_text && (
                            <div className="text-[10px] text-muted-foreground truncate">
                              📢 {tenant.announcement_text}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Action Links */}
                      <TableCell className="py-3.5 text-right">
                        <a
                          href={subUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                        >
                          <span>View Live</span>
                          <ExternalLink className="size-3" />
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Brandings Pagination Footer */}
          {totalBrandingsPages > 1 && (
            <div className="p-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                Showing{" "}
                <strong className="text-foreground">
                  {(brandingsPage - 1) * brandingsPageSize + 1}
                </strong>{" "}
                to{" "}
                <strong className="text-foreground">
                  {Math.min(
                    brandingsPage * brandingsPageSize,
                    filteredBrandings.length,
                  )}
                </strong>{" "}
                of{" "}
                <strong className="text-foreground">
                  {filteredBrandings.length}
                </strong>{" "}
                store brandings
              </span>

              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (brandingsPage > 1)
                          setBrandingsPage(brandingsPage - 1);
                      }}
                      className={
                        brandingsPage <= 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {Array.from(
                    { length: totalBrandingsPages },
                    (_, i) => i + 1,
                  ).map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={brandingsPage === pageNum}
                        onClick={(e) => {
                          e.preventDefault();
                          setBrandingsPage(pageNum);
                        }}
                        className="cursor-pointer text-xs"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (brandingsPage < totalBrandingsPages)
                          setBrandingsPage(brandingsPage + 1);
                      }}
                      className={
                        brandingsPage >= totalBrandingsPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Custom Landing Page Requests Table */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Tenant / Store</TableHead>
                  <TableHead className="text-xs">Contact & Date</TableHead>
                  <TableHead className="text-xs">
                    Design Specifications & Notes
                  </TableHead>
                  <TableHead className="text-xs">Color Palette</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">
                    Engineering Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`req-skel-${i}`} className="border-border">
                      <TableCell className="py-3.5">
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-28 rounded-md" />
                          <Skeleton className="h-3 w-16 rounded-md" />
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-32 rounded-md" />
                          <Skeleton className="h-3 w-20 rounded-md" />
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 max-w-xs">
                        <Skeleton className="h-3.5 w-48 rounded-md" />
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Skeleton className="size-4 rounded-full" />
                          <Skeleton className="size-4 rounded-full" />
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Skeleton className="h-7 w-20 rounded-md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground text-xs"
                    >
                      No customization requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRequests.map((req) => {
                    const isUpdating = updatingStatusId === req.id;
                    return (
                      <TableRow
                        key={req.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Tenant Info */}
                        <TableCell className="py-3.5">
                          <div className="space-y-0.5">
                            <div className="font-bold text-xs text-foreground">
                              {req.tenant_name}
                            </div>
                            <div className="text-[11px]  text-muted-foreground">
                              /{req.tenant_slug}
                            </div>
                          </div>
                        </TableCell>

                        {/* Contact & Date */}
                        <TableCell className="py-3.5">
                          <div className="space-y-0.5">
                            <div className="text-xs text-foreground font-medium">
                              {req.requested_by_email || "Not specified"}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(req.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Specifications */}
                        <TableCell className="py-3.5 max-w-sm">
                          <div className="space-y-1">
                            <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                              {req.details || "No special instructions."}
                            </p>
                            {req.admin_notes && (
                              <div className="text-[10px] text-primary flex items-center gap-1 font-medium">
                                <FileCode2 className="size-3" />
                                <span className="truncate">
                                  Notes: {req.admin_notes}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Color Snapshots */}
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="size-4 rounded-full border border-card shadow-xs"
                              style={{
                                backgroundColor: req.primary_color || "#059669",
                              }}
                              title="Primary Color"
                            />
                            <span
                              className="size-4 rounded-full border border-card shadow-xs"
                              style={{
                                backgroundColor:
                                  req.secondary_color || "#ec4899",
                              }}
                              title="Secondary Color"
                            />
                            <span className=" text-[10px] text-muted-foreground">
                              {req.primary_color}
                            </span>
                          </div>
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="py-3.5">
                          {req.status === "pending" && (
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 text-[10px]">
                              <Clock className="size-3 mr-1" />
                              Pending Review
                            </Badge>
                          )}
                          {req.status === "in_review" && (
                            <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 text-[10px]">
                              <Clock className="size-3 mr-1" />
                              In Review
                            </Badge>
                          )}
                          {req.status === "in_progress" && (
                            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 text-[10px]">
                              <Loader2 className="size-3 animate-spin mr-1" />
                              In Engineering
                            </Badge>
                          )}
                          {req.status === "completed" && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 text-[10px]">
                              <CheckCircle2 className="size-3 mr-1" />
                              Completed & Live
                            </Badge>
                          )}
                          {req.status === "rejected" && (
                            <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 text-[10px]">
                              <XCircle className="size-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="md"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(req);
                                setEditAdminNotes(req.admin_notes || "");
                              }}
                              className="h-8 text-xs cursor-pointer gap-1"
                            >
                              <Edit3 className="size-3.5" />
                              <span>Manage</span>
                            </Button>

                            {req.status !== "completed" && (
                              <Button
                                size="md"
                                onClick={() =>
                                  handleUpdateStatus(req.id, "completed")
                                }
                                disabled={isUpdating}
                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              >
                                {isUpdating ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  "Deploy Live"
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Requests Pagination Footer */}
            {totalRequestsPages > 1 && (
              <div className="p-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  Showing{" "}
                  <strong className="text-foreground">
                    {(requestsPage - 1) * requestsPageSize + 1}
                  </strong>{" "}
                  to{" "}
                  <strong className="text-foreground">
                    {Math.min(
                      requestsPage * requestsPageSize,
                      filteredRequests.length,
                    )}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-foreground">
                    {filteredRequests.length}
                  </strong>{" "}
                  customization requests
                </span>

                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (requestsPage > 1)
                            setRequestsPage(requestsPage - 1);
                        }}
                        className={
                          requestsPage <= 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {Array.from(
                      { length: totalRequestsPages },
                      (_, i) => i + 1,
                    ).map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          isActive={requestsPage === pageNum}
                          onClick={(e) => {
                            e.preventDefault();
                            setRequestsPage(pageNum);
                          }}
                          className="cursor-pointer text-xs"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (requestsPage < totalRequestsPages)
                            setRequestsPage(requestsPage + 1);
                        }}
                        className={
                          requestsPage >= totalRequestsPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>

          {/* Detailed Request Drawer / Modal */}
          {selectedRequest && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 animate-scaleUp">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                      <Sparkles className="size-4 text-pink-500" />
                      Manage Custom Landing Page Request
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedRequest.tenant_name} (/
                      {selectedRequest.tenant_slug})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Status Selection */}
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-foreground">
                      Update Engineering Status
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { status: "pending", label: "Pending" },
                        { status: "in_progress", label: "In Engineering" },
                        { status: "completed", label: "Completed" },
                        { status: "rejected", label: "Reject" },
                      ].map((s) => (
                        <button
                          key={s.status}
                          type="button"
                          onClick={() =>
                            handleUpdateStatus(selectedRequest.id, s.status)
                          }
                          className={`p-2 rounded-lg border font-semibold text-center transition-all cursor-pointer ${
                            selectedRequest.status === s.status
                              ? "border-primary bg-primary/10 text-primary font-bold"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1.5">
                    <span className="font-bold text-foreground">
                      Client Design Specifications:
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedRequest.details ||
                        "No additional text provided."}
                    </p>
                  </div>

                  {/* Admin Notes for Tenant */}
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-foreground">
                      Engineering Feedback / Tenant Notification Notes
                    </Label>
                    <Textarea
                      value={editAdminNotes}
                      onChange={(e) => setEditAdminNotes(e.target.value)}
                      placeholder="e.g. Bespoke hero wireframes deployed to staging branch. Custom interactive lookbook added."
                      className="text-xs min-h-20 bg-background"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      These notes appear directly on the tenant admin&apos;s
                      branding screen.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setSelectedRequest(null)}
                    className="text-xs cursor-pointer"
                  >
                    Close
                  </Button>
                  <Button
                    size="md"
                    onClick={handleSaveNotes}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs cursor-pointer"
                  >
                    Save Notes & Update
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
