"use client";

import { useState, use, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  Star,
  Heart,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserStore } from "@/store/user";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts, updateProduct, deleteProduct } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import { confirmToast } from "@/components/ui/confirm-toast";
import { Product, ProductCategory, PaginationMeta } from "@/types";
import { formatCurrency, getTenantRoute } from "@/utils/helper";

interface ProductsPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function TenantProductsPage({ params }: ProductsPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";
  const { user } = useUserStore();
  const { tenant } = useTenantTheme();

  const activeTenantSlug =
    user?.tenant_slug ||
    (tenantSlug !== "store" ? tenantSlug : "jazz-cakes-ltd");

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Pagination State
  const [productSearch, setProductSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const pageSize = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(productSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [productSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [debouncedSearch, categoryFilter, classFilter]);

  // Currency State
  const [tenantCurrency, setTenantCurrency] = useState<string>(
    tenant?.currency || user?.tenant_currency || "NGN",
  );

  useEffect(() => {
    if (tenant?.currency) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTenantCurrency(tenant.currency);
    } else if (user?.tenant_currency) {
      setTenantCurrency(user.tenant_currency);
    }
  }, [tenant?.currency, user?.tenant_currency]);

  // Dynamic Categories State for Filters
  const [tenantCategories, setTenantCategories] = useState<ProductCategory[]>(
    [],
  );

  // Load Tenant Categories
  const loadCategories = useCallback(async () => {
    try {
      const catRes = await getCategories({ tenantSlug: activeTenantSlug });
      if (catRes.status === "success" && catRes.data) {
        setTenantCategories(catRes.data);
      }
    } catch (err: unknown) {
      console.warn("Could not load categories:", err);
    }
  }, [activeTenantSlug]);

  // Fetch Products from API
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getProducts({
        tenantSlug: activeTenantSlug,
        page: currentPage,
        per_page: pageSize,
        published_only: false,
        search: debouncedSearch.trim() || undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        product_class: classFilter !== "all" ? classFilter : undefined,
      });
      if (res.status === "success" && res.data) {
        const items = res.data.items || [];
        setProducts(items);
        if (res.pagination) {
          setPagination(res.pagination as PaginationMeta);
        }
        if (items.length > 0 && items[0].currency) {
          setTenantCurrency(items[0].currency);
        }
      }
    } catch (err: unknown) {
      console.warn("Could not fetch products from backend:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [
    activeTenantSlug,
    currentPage,
    pageSize,
    debouncedSearch,
    categoryFilter,
    classFilter,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProducts();
    loadCategories();
  };

  // Toggle Visibility Handler
  const handleToggleProductStatus = async (product: Product) => {
    const nextStatus = !product.is_published;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_published: nextStatus } : p,
      ),
    );

    try {
      await updateProduct(
        product.id,
        { is_published: nextStatus },
        activeTenantSlug,
      );
      toast.success(
        `Product visibility set to ${nextStatus ? "Published" : "Draft"}`,
      );
    } catch {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, is_published: product.is_published }
            : p,
        ),
      );
      toast.error("Failed to update product visibility");
    }
  };

  // Delete Product Handler
  const handleDeleteProduct = (id: string, title: string) => {
    confirmToast({
      title: "Delete Product?",
      subtitle: title,
      description: `Are you sure you want to delete "${title}"? This product will be removed from your store catalog.`,
      confirmText: "Yes, Delete",
      cancelText: "Keep Product",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteProduct(id, activeTenantSlug);
          setProducts((prev) => prev.filter((p) => p.id !== id));
          toast.success(`Product "${title}" deleted from catalog`);
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : "Failed to delete product";
          toast.error(msg);
        }
      },
    });
  };

  // Filtered Products
  const totalProducts = pagination?.total ?? products.length;
  const totalPages =
    pagination?.last_page ?? Math.max(1, Math.ceil(totalProducts / pageSize));
  const paginatedItems = products;

  return (
    <div className="space-y-5 w-full">
      {/* Top Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold font-secondary text-foreground">
              Product Catalog & Inventory
            </h4>
            <Badge variant="outline" className="text-xs">
              {activeTenantSlug}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="md"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="gap-1.5 h-9 text-xs cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
          <Button
            asChild
            size="md"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 cursor-pointer shadow-xs"
          >
            <Link href={getTenantRoute(activeTenantSlug, "/products/new")}>
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-card p-3 rounded-xl border border-border text-foreground">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product name, SKU, or specs..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-background border-border text-foreground"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-9 text-xs w-35 bg-background border-border text-foreground">
              <SelectValue placeholder="Product Class" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 text-xs w-38 bg-background border-border text-foreground">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Categories</SelectItem>
              {tenantCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
              {tenantCategories.length === 0 && (
                <>
                  <SelectItem value="Artisanal Foods">
                    Artisanal Foods
                  </SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="border-border">
              <TableHead className="text-xs font-bold text-foreground">
                Product
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Class
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Category
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Pricing & Variants
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Inventory
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                      <div className="space-y-1.5 min-w-0">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Skeleton className="h-7 w-12 rounded-md" />
                      <Skeleton className="h-7 w-7 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedItems.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-xs text-muted-foreground"
                >
                  No products found matching the criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((p) => {
                const name = p.name || p.title || "Untitled Product";
                const pClass = p.product_class || "physical";
                const variantsList = p.variants || [];
                const primaryVariant = variantsList[0];
                const displayPrice = primaryVariant?.price ?? p.price ?? 0;
                const totalStock =
                  variantsList.length > 0
                    ? variantsList.reduce(
                        (acc, v) =>
                          acc + (v.track_inventory ? v.stock_quantity : 0),
                        0,
                      )
                    : (p.inventory_count ?? 0);
                const hasInfiniteStock =
                  pClass === "digital" ||
                  pClass === "service" ||
                  variantsList.some((v) => !v.track_inventory);

                const imageUrl = (p.images && p.images[0]) || null;

                return (
                  <TableRow
                    key={p.id}
                    className="border-border hover:bg-muted/40"
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 border border-border flex items-center justify-center">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-muted-foreground/60" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={getTenantRoute(
                              activeTenantSlug,
                              `/products/${p.id}`,
                            )}
                            className="font-bold text-xs text-foreground hover:text-primary transition-colors block truncate"
                          >
                            {name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-muted-foreground">
                              {p.slug}
                            </span>
                            {(p.reviews_count || 0) > 0 && (
                              <div className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                                <span className="text-foreground">
                                  {(p.average_rating ?? 0.0).toFixed(1)}
                                </span>
                                <span className="text-muted-foreground text-[10px]">
                                  ({p.reviews_count || 0})
                                </span>
                              </div>
                            )}
                            {(p.likes_count ?? 0) > 0 && (
                              <div className="flex items-center gap-0.5 text-[11px] text-rose-500 font-medium">
                                <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500 shrink-0" />
                                <span>{p.likes_count}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize px-2 py-0.5 ${
                          pClass === "service"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : pClass === "digital"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {pClass}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-foreground">
                      <div className="font-medium">
                        {p.category || "General"}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs font-semibold text-foreground">
                      <div>
                        {formatCurrency(
                          displayPrice,
                          p.currency || tenantCurrency,
                        )}
                        {variantsList.length > 1 && (
                          <span className="text-[10px] text-stone-400 block font-normal">
                            {variantsList.length} variants
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      {hasInfiniteStock ? (
                        <span className="text-blue-500 font-medium text-[11px]">
                          Digital / Unlimited
                        </span>
                      ) : (
                        <span
                          className={`font-semibold ${
                            totalStock > 0 ? "text-foreground" : "text-rose-500"
                          }`}
                        >
                          {totalStock > 0
                            ? `${totalStock} in stock`
                            : "Out of stock"}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <button
                        onClick={() => handleToggleProductStatus(p)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                          p.is_published
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                        }`}
                      >
                        {p.is_published ? "Published" : "Draft"}
                      </button>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={getTenantRoute(
                            activeTenantSlug,
                            `/products/${p.id}`,
                          )}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-stone-600 hover:text-stone-900 bg-gray-200 hover:bg-gray-300"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(p.id, name)}
                          className="h-7 w-7 p-0 text-red-400 hover:text-rose-600 bg-red-100 hover:bg-red-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalProducts > pageSize && (
          <div className="p-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, totalProducts)} of{" "}
              {totalProducts} products
            </span>
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={
                      currentPage <= 1
                        ? "pointer-events-none opacity-50 text-xs"
                        : "cursor-pointer text-xs"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <PaginationItem key={idx}>
                    <PaginationLink
                      isActive={currentPage === idx + 1}
                      onClick={() => setCurrentPage(idx + 1)}
                      className="cursor-pointer text-xs"
                    >
                      {idx + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className={
                      currentPage >= totalPages
                        ? "pointer-events-none opacity-50 text-xs"
                        : "cursor-pointer text-xs"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
