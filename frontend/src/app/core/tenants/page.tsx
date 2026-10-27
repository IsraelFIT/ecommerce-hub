"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Store,
  Plus,
  Search,
  ExternalLink,
  Database,
  Layers,
  CheckCircle2,
  Settings,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PaymentGatewayLogo } from "@/components/shared/payment-gateway-logo";
import { getTenants, createTenant } from "@/lib/api/tenants";
import { TenantRecord } from "@/types";
import {
  formatCurrency,
  getTenantSubdomainUrl,
  getTenantRoute,
} from "@/utils/helper";
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

export default function CoreTenantsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreSlug, setNewStoreSlug] = useState("");
  const [newCategory, setNewCategory] = useState("Boutique & Retail");
  const [newBackend, setNewBackend] = useState<"postgres" | "sanity">(
    "postgres",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTenants = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getTenants({ search: searchTerm.trim() || undefined });
      if (res.data?.items) {
        setTenants(res.data.items);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load tenants list";
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
      loadTenants();
    }, 300);
    return () => clearTimeout(handler);
  }, [loadTenants]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTenants();
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesCategory =
      categoryFilter === "all" || t.category === categoryFilter;
    return matchesCategory;
  });

  const totalPages = Math.ceil(filteredTenants.length / pageSize) || 1;
  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newStoreSlug) {
      toast.error("Please provide both store name and URL slug.");
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanedSlug = newStoreSlug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-");

      const res = await createTenant({
        name: newStoreName.trim(),
        slug: cleanedSlug,
        category: newCategory,
        backend_type: newBackend,
        default_gateway: "paystack",
      });

      if (res.data) {
        toast.success(
          `Store "${res.data.name}" provisioned successfully on Neon Postgres!`,
        );
        setIsCreateOpen(false);
        setNewStoreName("");
        setNewStoreSlug("");
        loadTenants();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to provision store";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full pb-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-secondary text-foreground">
            Multi-Tenant Storefront Directory
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage live store boundaries, custom domains, payment subaccounts,
            and data layer adapters
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="md"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="gap-1.5 h-8 text-xs cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>

          <Button
            size="md"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 h-8 text-xs cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Provision New Store</span>
          </Button>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter stores by name, slug, category..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Showing{" "}
            <strong className="text-foreground">
              {filteredTenants.length}
            </strong>{" "}
            of {tenants.length} stores
          </span>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50 border-b border-border">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Store & Subdomain
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Category
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Data Adapter
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Payment Subaccount
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Products / Orders
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Total Volume (GMV)
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell className="p-3.5">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </TableCell>
                  <TableCell className="p-3.5">
                    <Skeleton className="h-5 w-24 rounded-md" />
                  </TableCell>
                  <TableCell className="p-3.5">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="p-3.5">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="p-3.5">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="p-3.5">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="p-3.5">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="p-3.5 text-right">
                    <Skeleton className="h-7 w-16 ml-auto rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredTenants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-muted-foreground text-xs"
                >
                  <Store className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                  No stores found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTenants.map((t) => {
                const subaccount =
                  t.paystack_subaccount_code ||
                  t.stripe_account_id ||
                  "Subaccount Direct";
                const gateway = (t.default_gateway || "paystack") as
                  | "paystack"
                  | "stripe";
                const storeDomain = t.custom_domain
                  ? t.custom_domain
                  : `${t.slug}.localhost:3000`;

                return (
                  <TableRow
                    key={t.id}
                    className="hover:bg-muted/40 transition-colors border-border"
                  >
                    <TableCell className="p-3.5">
                      <div className="font-bold text-foreground text-[13px] flex items-center gap-1.5">
                        <span>{t.name}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 font-mono">
                        <span>{storeDomain}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-card-gray border border-border text-[11px] text-foreground font-medium">
                        {t.category || "General Retail"}
                      </span>
                    </TableCell>
                    <TableCell className="p-3.5">
                      {t.backend_type === "sanity" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                          <Layers className="size-2.5" />
                          Sanity CMS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-semibold">
                          <Database className="size-2.5" />
                          Neon Postgres
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="p-3.5 text-[11px]">
                      <div className="font-semibold text-foreground mb-1">
                        <PaymentGatewayLogo gateway={gateway} />
                      </div>
                      <div className="text-muted-foreground text-[10px] font-mono">
                        {subaccount}
                      </div>
                    </TableCell>
                    <TableCell className="p-3.5">
                      <div className="text-foreground font-medium">
                        {t.product_count ?? 0} items
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {t.orders_count ?? 0} orders
                      </div>
                    </TableCell>
                    <TableCell className="p-3.5 font-bold text-foreground text-[13px]">
                      {formatCurrency(t.total_volume ?? 0, t.currency || "NGN")}
                    </TableCell>
                    <TableCell className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          t.is_active !== false
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                            : "text-rose-600 dark:text-rose-400 bg-rose-500/10"
                        }`}
                      >
                        <CheckCircle2 className="size-2.5" />
                        {t.is_active !== false ? "Active" : "Suspended"}
                      </span>
                    </TableCell>
                    <TableCell className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={getTenantSubdomainUrl(t.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
                          title="Visit Live Storefront"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                        <Link
                          href={getTenantRoute(t.slug, "/dashboard")}
                          target="_blank"
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
                          title="Tenant Admin Dashboard"
                        >
                          <Settings className="size-3.5" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            Showing{" "}
            <strong className="text-foreground">
              {(currentPage - 1) * pageSize + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-foreground">
              {Math.min(currentPage * pageSize, filteredTenants.length)}
            </strong>{" "}
            of{" "}
            <strong className="text-foreground">
              {filteredTenants.length}
            </strong>{" "}
            stores
          </span>

          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === pageNum}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(pageNum);
                      }}
                      className="cursor-pointer text-xs"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      setCurrentPage(currentPage + 1);
                  }}
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Provision Store Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Store className="size-4" />
                </div>
                <h3 className="text-sm font-bold font-secondary text-foreground">
                  Provision Multi-Tenant Storefront
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateTenant}
              className="flex flex-col gap-3.5 mt-4 text-xs"
            >
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Store Business Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lumina Artisan Bakery"
                  value={newStoreName}
                  onChange={(e) => {
                    setNewStoreName(e.target.value);
                    if (!newStoreSlug) {
                      setNewStoreSlug(
                        e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                      );
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Subdomain Slug
                </label>
                <div className="flex items-center rounded-lg border border-border bg-background overflow-hidden">
                  <input
                    type="text"
                    required
                    placeholder="lumina-bakery"
                    value={newStoreSlug}
                    onChange={(e) => setNewStoreSlug(e.target.value)}
                    className="flex-1 px-3 py-2 bg-transparent text-foreground focus:outline-none"
                  />
                  <span className="px-2.5 py-2 bg-muted/50 text-muted-foreground text-[11px] border-l border-border">
                    .ecommerce-hub.com
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Industry / Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="Bakery & Confectionery">
                    Bakery & Confectionery
                  </option>
                  <option value="Luxury Fashion">Luxury Fashion</option>
                  <option value="Specialty Cafe">Specialty Cafe</option>
                  <option value="Interior Design">Interior Design</option>
                  <option value="Beauty & Wellness">Beauty & Wellness</option>
                  <option value="Boutique & Retail">Boutique & Retail</option>
                  <option value="Artisanal Goods">Artisanal Goods</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Data Layer Adapter
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewBackend("postgres")}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      newBackend === "postgres"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <div className="font-bold">Neon Postgres</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      Lakebase Serverless
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewBackend("sanity")}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      newBackend === "sanity"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <div className="font-bold">Sanity CMS</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      Headless Content
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="md"
                  disabled={isSubmitting}
                  className="h-8 text-xs cursor-pointer"
                >
                  {isSubmitting ? "Provisioning..." : "Provision Storefront"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
