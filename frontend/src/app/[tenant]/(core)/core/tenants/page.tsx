"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  domain: string;
  category: string;
  backend: "postgres" | "sanity";
  gateway: "paystack" | "stripe";
  subaccount: string;
  status: "Active" | "Pending" | "Suspended";
  productCount: number;
  ordersCount: number;
  totalVolume: string;
  createdAt: string;
}

export default function CoreTenantsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreSlug, setNewStoreSlug] = useState("");
  const [newCategory, setNewCategory] = useState("Boutique & Retail");
  const [newBackend, setNewBackend] = useState<"postgres" | "sanity">(
    "postgres",
  );

  const [tenants, setTenants] = useState<TenantRecord[]>([
    {
      id: "t-1",
      name: "Jazz Cakes LTD",
      slug: "jazz-cakes",
      domain: "cakes.jazz-luxury.com",
      category: "Bakery & Confectionery",
      backend: "postgres",
      gateway: "paystack",
      subaccount: "ACCT_7493021948",
      status: "Active",
      productCount: 42,
      ordersCount: 318,
      totalVolume: "$48,920.00",
      createdAt: "2026-09-15",
    },
    {
      id: "t-2",
      name: "Velvet Couture Atelier",
      slug: "velvet-couture",
      domain: "velvetcouture.io",
      category: "Luxury Fashion",
      backend: "sanity",
      gateway: "stripe",
      subaccount: "acct_1NZX8302183",
      status: "Active",
      productCount: 128,
      ordersCount: 540,
      totalVolume: "$92,400.00",
      createdAt: "2026-08-20",
    },
    {
      id: "t-3",
      name: "Nordic Minimalist Home",
      slug: "nordic-home",
      domain: "nordichome.store",
      category: "Interior Design",
      backend: "postgres",
      gateway: "paystack",
      subaccount: "ACCT_8839201940",
      status: "Active",
      productCount: 64,
      ordersCount: 210,
      totalVolume: "$34,150.00",
      createdAt: "2026-09-02",
    },
    {
      id: "t-4",
      name: "Aura Artisan Coffee",
      slug: "aura-coffee",
      domain: "aura.coffee",
      category: "Specialty Cafe",
      backend: "postgres",
      gateway: "stripe",
      subaccount: "acct_1MKL8392011",
      status: "Active",
      productCount: 18,
      ordersCount: 412,
      totalVolume: "$21,800.00",
      createdAt: "2026-09-18",
    },
    {
      id: "t-5",
      name: "Solstice Organic Skincare",
      slug: "solstice-skin",
      domain: "solsticeskin.co",
      category: "Beauty & Wellness",
      backend: "postgres",
      gateway: "paystack",
      subaccount: "ACCT_3392019481",
      status: "Active",
      productCount: 35,
      ordersCount: 189,
      totalVolume: "$18,450.00",
      createdAt: "2026-09-24",
    },
  ]);

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newStoreSlug) {
      toast.error("Please provide both store name and URL slug.");
      return;
    }

    const created: TenantRecord = {
      id: `t-${tenants.length + 1}`,
      name: newStoreName,
      slug: newStoreSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      domain: `${newStoreSlug}.ecommerce-hub.com`,
      category: newCategory,
      backend: newBackend,
      gateway: "paystack",
      subaccount: `ACCT_${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      status: "Active",
      productCount: 0,
      ordersCount: 0,
      totalVolume: "$0.00",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setTenants([created, ...tenants]);
    setIsCreateOpen(false);
    setNewStoreName("");
    setNewStoreSlug("");
    toast.success(
      `Store "${created.name}" provisioned successfully on Neon Postgres!`,
    );
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
            Manage store boundaries, custom domains, payment subaccounts, and
            data layer adapters
          </p>
        </div>

        <Button
          size="md"
          onClick={() => setIsCreateOpen(true)}
          className="gap-1.5 h-8 text-xs cursor-pointer self-start md:self-auto"
        >
          <Plus className="size-3.5" />
          <span>Provision New Store</span>
        </Button>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter stores by name, slug, domain..."
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-card-gray/30 dark:bg-white/5 text-[11px] text-muted-foreground">
                <th className="p-3.5 font-medium">Store & Subdomain</th>
                <th className="p-3.5 font-medium">Category</th>
                <th className="p-3.5 font-medium">Data Adapter</th>
                <th className="p-3.5 font-medium">Payment Subaccount</th>
                <th className="p-3.5 font-medium">Products / Orders</th>
                <th className="p-3.5 font-medium">Total Volume (GMV)</th>
                <th className="p-3.5 font-medium">Status</th>
                <th className="p-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTenants.map((t) => (
                <tr key={t.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-foreground text-[13px] flex items-center gap-1.5">
                      <span>{t.name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5 flex items-center gap-1">
                      <span>{t.slug}.ecommerce-hub.com</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-card-gray border border-border text-[11px] text-foreground font-medium">
                      {t.category}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {t.backend === "postgres" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-semibold">
                        <Database className="size-2.5" />
                        Neon Postgres
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                        <Layers className="size-2.5" />
                        Sanity CMS
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-[11px]">
                    <div className="font-semibold text-foreground">
                      {t.gateway.toUpperCase()}
                    </div>
                    <div className="text-muted-foreground text-[10px]">
                      {t.subaccount}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="text-foreground font-medium">
                      {t.productCount} items
                    </div>
                    <div className="text-muted-foreground text-[10px]">
                      {t.ordersCount} orders
                    </div>
                  </td>
                  <td className="p-3.5 font-bold font-mono text-foreground text-[13px]">
                    {t.totalVolume}
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="size-2.5" />
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/${t.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
                        title="View Storefront"
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                      <Link
                        href={`/${t.slug}/admin`}
                        target="_blank"
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
                        title="Tenant Admin Portal"
                      >
                        <Settings className="size-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                  <span className="px-2.5 py-2 bg-muted/50 text-muted-foreground font-mono text-[11px] border-l border-border">
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
                  className="h-8 text-xs cursor-pointer"
                >
                  Provision Storefront
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
