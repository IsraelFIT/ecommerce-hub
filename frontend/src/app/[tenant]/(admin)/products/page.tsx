"use client";

import { useState, use, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  UploadCloud,
  X,
  Sparkles,
  Boxes,
  Star,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserStore } from "@/store/user";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from "@/lib/api/products";
import { getCategories, createCategory } from "@/lib/api/categories";
import { getFilters, createFilter } from "@/lib/api/filters";
import {
  Product,
  ProductClass,
  ProductVariantInput,
  CreateProductInput,
  ProductCategory,
  ProductFilter,
} from "@/types/products";
import { formatCurrency, getTenantRoute } from "@/utils/helper";

interface ProductsPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

interface SpecEntry {
  key: string;
  value: string;
}

interface OptionEntry {
  key: string;
  value: string;
}

interface FormVariant {
  sku: string;
  price: string;
  compare_at_price: string;
  track_inventory: boolean;
  stock_quantity: string;
  options: OptionEntry[];
}

const PRESET_SAMPLE_IMAGES = [
  {
    label: "Valrhona Cake",
    url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80",
  },
  {
    label: "Artisan Mug",
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
  },
  {
    label: "Leather Bag",
    url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80",
  },
  {
    label: "Headphones",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
  },
  {
    label: "Botanical Serum",
    url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
  },
];

export default function TenantProductsPage({ params }: ProductsPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";
  const { user } = useUserStore();
  const { tenant } = useTenantTheme();

  const activeTenantSlug =
    user?.tenant_slug ||
    (tenantSlug !== "store" ? tenantSlug : "jazz-cakes-ltd");

  const formattedStoreName =
    user?.tenant_name ||
    activeTenantSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Filters & Pagination State
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

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

  // Product Form State (Core + JSONB + Variant Architecture)
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("Artisanal Goods");
  const [newProductClass, setNewProductClass] =
    useState<ProductClass>("physical");
  const [newIsPublished, setNewIsPublished] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImages, setNewImages] = useState<string[]>([]);
  const [imageMode, setImageMode] = useState<"upload" | "url" | "presets">(
    "upload",
  );

  // Dynamic Categories and Custom Filters State
  const [tenantCategories, setTenantCategories] = useState<ProductCategory[]>(
    [],
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [tenantFilters, setTenantFilters] = useState<ProductFilter[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});
  const [isAddFilterOpen, setIsAddFilterOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");
  const [newFilterType, setNewFilterType] = useState<string>("checkbox");
  const [newFilterOptionsInput, setNewFilterOptionsInput] = useState("");
  const [isCreatingFilter, setIsCreatingFilter] = useState(false);

  // Dynamic Specifications (JSONB key-values)
  const [specifications, setSpecifications] = useState<SpecEntry[]>([
    { key: "", value: "" },
  ]);

  // Product Variants
  const [variants, setVariants] = useState<FormVariant[]>([
    {
      sku: "SKU-001",
      price: "120",
      compare_at_price: "",
      track_inventory: true,
      stock_quantity: "25",
      options: [],
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate slug when title changes
  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setNewSlug(generated);
  };

  // Adjust default variant inventory tracking when ProductClass changes
  const handleClassChange = (val: ProductClass) => {
    setNewProductClass(val);
    if (val === "digital" || val === "service") {
      setVariants((prev) =>
        prev.map((v) => ({ ...v, track_inventory: false })),
      );
    } else {
      setVariants((prev) => prev.map((v) => ({ ...v, track_inventory: true })));
    }
  };

  // Dynamic Specification handlers
  const handleAddSpec = () => {
    setSpecifications((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpecChange = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    setSpecifications((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  // Dynamic Variant handlers
  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        sku: `SKU-${Date.now().toString().slice(-4)}`,
        price: prev[0]?.price || "100",
        compare_at_price: "",
        track_inventory: newProductClass === "physical",
        stock_quantity: "10",
        options: [{ key: "Option", value: "Default" }],
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      toast.error("Every product must have at least one variant");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: keyof Omit<FormVariant, "options">,
    value: string | boolean,
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  };

  const handleAddVariantOption = (variantIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? { ...v, options: [...v.options, { key: "", value: "" }] }
          : v,
      ),
    );
  };

  const handleRemoveVariantOption = (
    variantIndex: number,
    optionIndex: number,
  ) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? {
              ...v,
              options: v.options.filter((_, oi) => oi !== optionIndex),
            }
          : v,
      ),
    );
  };

  const handleVariantOptionChange = (
    variantIndex: number,
    optionIndex: number,
    field: "key" | "value",
    val: string,
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== variantIndex) return v;
        const nextOptions = v.options.map((opt, oi) =>
          oi === optionIndex ? { ...opt, [field]: val } : opt,
        );
        return { ...v, options: nextOptions };
      }),
    );
  };

  // Load Tenant Categories & Filters
  const loadCategoriesAndFilters = useCallback(async () => {
    try {
      const [catRes, filterRes] = await Promise.all([
        getCategories({ tenantSlug: activeTenantSlug }),
        getFilters({ tenantSlug: activeTenantSlug }),
      ]);
      if (catRes.status === "success" && catRes.data) {
        setTenantCategories(catRes.data);
      }
      if (filterRes.status === "success" && filterRes.data) {
        setTenantFilters(filterRes.data);
      }
    } catch (err: unknown) {
      console.warn("Could not load categories or filters:", err);
    }
  }, [activeTenantSlug]);

  // Fetch Products from API
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getProducts({ tenantSlug: activeTenantSlug });
      if (res.status === "success" && res.data) {
        const items = res.data.items || [];
        setProducts(items);
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
  }, [activeTenantSlug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
    loadCategoriesAndFilters();
  }, [loadProducts, loadCategoriesAndFilters]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProducts();
    loadCategoriesAndFilters();
  };

  // Toggle dynamic filter option for the product being created
  const toggleFilterOption = (filterSlug: string, option: string) => {
    setSelectedFilters((prev) => {
      const current = prev[filterSlug] || [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [filterSlug]: updated };
    });
  };

  // Create Category Handler
  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error("Please provide a category name");
      return;
    }
    setIsCreatingCategory(true);
    try {
      const res = await createCategory(
        {
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || undefined,
        },
        activeTenantSlug,
      );
      if (res.status === "success" && res.data) {
        setTenantCategories((prev) => [...prev, res.data as ProductCategory]);
        setSelectedCategoryId(res.data.id);
        setNewCategory(res.data.name);
        setIsAddCategoryOpen(false);
        setNewCategoryName("");
        setNewCategoryDescription("");
        toast.success(`Category "${res.data.name}" created successfully!`);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create category";
      toast.error(msg);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Create Filter Group Handler
  const handleCreateFilterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilterName.trim()) {
      toast.error("Please provide a filter group name");
      return;
    }
    const options = newFilterOptionsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (options.length === 0) {
      toast.error("Please provide at least one option (comma separated)");
      return;
    }

    setIsCreatingFilter(true);
    try {
      const res = await createFilter(
        {
          name: newFilterName.trim(),
          filter_type: newFilterType,
          options,
        },
        activeTenantSlug,
      );
      if (res.status === "success" && res.data) {
        const createdFilter = res.data as ProductFilter;
        setTenantFilters((prev) => [...prev, createdFilter]);
        setIsAddFilterOpen(false);
        setNewFilterName("");
        setNewFilterOptionsInput("");
        toast.success(`Filter group "${createdFilter.name}" created!`);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create filter";
      toast.error(msg);
    } finally {
      setIsCreatingFilter(false);
    }
  };

  // Image Upload Handler
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WEBP)");
      return;
    }

    if (newImages.length >= 5) {
      toast.error("Maximum 5 images allowed per product");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size cannot exceed 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadProductImage(file, activeTenantSlug);
      if (res.status === "success" && res.data?.url) {
        setNewImages((prev) => [...prev, res.data.url].slice(0, 5));
        setNewImageUrl(res.data.url);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error(res.message || "Failed to upload image");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image upload failed";
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Create Product Handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please provide a product title/name");
      return;
    }

    // Build specifications dictionary from dynamic array
    const specsDict: Record<string, string | string[]> = {};
    specifications.forEach((s) => {
      const k = s.key.trim();
      const val = s.value.trim();
      if (k && val) {
        if (specsDict[k] !== undefined) {
          const existing = specsDict[k];
          if (Array.isArray(existing)) {
            existing.push(val);
          } else {
            specsDict[k] = [existing, val];
          }
        } else {
          specsDict[k] = val;
        }
      }
    });

    // Build variants payload
    const variantsPayload: ProductVariantInput[] = variants.map((v) => {
      const optionsDict: Record<string, string | string[]> = {};
      v.options.forEach((opt) => {
        const k = opt.key.trim();
        const val = opt.value.trim();
        if (k && val) {
          if (optionsDict[k]) {
            const existing = optionsDict[k];
            if (Array.isArray(existing)) {
              existing.push(val);
            } else {
              optionsDict[k] = [existing, val];
            }
          } else {
            optionsDict[k] = val;
          }
        }
      });

      const parsedPrice = parseFloat(v.price) || 0;
      const parsedCompare = v.compare_at_price
        ? parseFloat(v.compare_at_price)
        : undefined;
      const parsedStock = parseInt(v.stock_quantity, 10) || 0;

      return {
        sku: v.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        price: parsedPrice,
        compare_at_price: parsedCompare,
        track_inventory: v.track_inventory,
        stock_quantity: v.track_inventory ? parsedStock : 0,
        options: optionsDict,
      };
    });

    const primaryVariant = variantsPayload[0];
    if (!primaryVariant || primaryVariant.price <= 0) {
      toast.error("Please provide a valid price for the primary variant");
      return;
    }

    // Build cleaned filters dictionary
    const cleanedFilters: Record<string, string[]> = {};
    Object.entries(selectedFilters).forEach(([k, v]) => {
      if (Array.isArray(v) && v.length > 0) {
        cleanedFilters[k] = v;
      }
    });

    setIsSubmitting(true);
    try {
      const payload: CreateProductInput = {
        name: newTitle.trim(),
        title: newTitle.trim(),
        slug: newSlug.trim() || undefined,
        description: newDescription.trim() || undefined,
        product_class: newProductClass,
        category_id: selectedCategoryId || undefined,
        category: newCategory,
        specifications: specsDict,
        filters: cleanedFilters,
        variants: variantsPayload,
        images: (newImages.length > 0
          ? newImages
          : newImageUrl.trim()
            ? [newImageUrl.trim()]
            : []
        ).slice(0, 5),
        is_published: newIsPublished,
        // Legacy fallback fields
        sku: primaryVariant.sku,
        price: primaryVariant.price,
        currency: tenantCurrency,
        inventory_count: primaryVariant.stock_quantity,
      };

      const res = await createProduct(payload, activeTenantSlug);

      if (res.status === "success" && res.data) {
        setProducts((prev) => [res.data as Product, ...prev]);
        toast.success(
          `Product "${newTitle}" published under ${newProductClass.toUpperCase()} class!`,
        );
        setIsAddProductOpen(false);

        // Reset Form
        setNewTitle("");
        setNewSlug("");
        setNewDescription("");
        setNewCategory(tenantCategories[0]?.name || "General");
        setSelectedCategoryId(tenantCategories[0]?.id || "");
        setSelectedFilters({});
        setNewProductClass("physical");
        setNewImageUrl("");
        setNewImages([]);
        setNewIsPublished(true);
        setSpecifications([{ key: "", value: "" }]);
        setVariants([
          {
            sku: "SKU-001",
            price: "120",
            compare_at_price: "",
            track_inventory: true,
            stock_quantity: "25",
            options: [],
          },
        ]);
      } else {
        toast.error(res.message || "Failed to create product");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create product";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
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
  const handleDeleteProduct = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await deleteProduct(id, activeTenantSlug);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success(`Product "${title}" deleted from catalog`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete product";
      toast.error(msg);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const name = p.name || p.title || "";
    const matchesSearch =
      name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase())) ||
      (p.description &&
        p.description.toLowerCase().includes(productSearch.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" ||
      (p.category && p.category.toLowerCase() === categoryFilter.toLowerCase());

    const matchesClass =
      classFilter === "all" || (p.product_class || "physical") === classFilter;

    return matchesSearch && matchesCategory && matchesClass;
  });

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedItems = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

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

          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogContent className="max-w-2xl bg-card p-6 rounded-2xl border border-border max-h-[90vh] overflow-y-auto text-foreground">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Create Catalog Product</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Add a new item to{" "}
                  <span className="font-semibold text-foreground">
                    {formattedStoreName}
                  </span>{" "}
                  with flexible JSONB specifications and variants.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateProduct} className="space-y-6 mt-3">
                {/* 1. Product Core Information */}
                <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    1. Core Attributes
                  </h4>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Product Name / Title *
                    </Label>
                    <Input
                      placeholder="e.g. Master Artisan Espresso Roast"
                      value={newTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      required
                      className="h-9 text-xs bg-background border-border text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Product Class *
                      </Label>
                      <Select
                        value={newProductClass}
                        onValueChange={(val: ProductClass) =>
                          handleClassChange(val)
                        }
                      >
                        <SelectTrigger className="h-9 text-xs bg-background border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="physical">
                            Physical (Requires inventory/shipping)
                          </SelectItem>
                          <SelectItem value="digital">
                            Digital (Requires download access)
                          </SelectItem>
                          <SelectItem value="service">
                            Service (Requires scheduling/booking)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-foreground">
                          Product Category *
                        </Label>
                        <button
                          type="button"
                          onClick={() => setIsAddCategoryOpen(true)}
                          className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> New Category
                        </button>
                      </div>

                      <Select
                        value={
                          selectedCategoryId ||
                          (newCategory ? `name:${newCategory}` : "")
                        }
                        onValueChange={(val) => {
                          if (val === "__new__") {
                            setIsAddCategoryOpen(true);
                          } else if (val.startsWith("name:")) {
                            const name = val.replace("name:", "");
                            setNewCategory(name);
                            setSelectedCategoryId("");
                          } else {
                            const found = tenantCategories.find(
                              (c) => c.id === val,
                            );
                            if (found) {
                              setSelectedCategoryId(found.id);
                              setNewCategory(found.name);
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs bg-background border-border text-foreground">
                          <SelectValue placeholder="Select or create a category" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                          {tenantCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                          {tenantCategories.length === 0 && (
                            <>
                              <SelectItem value="name:Celebration Cakes">
                                Celebration Cakes
                              </SelectItem>
                              <SelectItem value="name:Pastries">
                                Pastries
                              </SelectItem>
                              <SelectItem value="name:Dessert Cups">
                                Dessert Cups
                              </SelectItem>
                              <SelectItem value="name:General">
                                General
                              </SelectItem>
                            </>
                          )}
                          <SelectItem
                            value="__new__"
                            className="text-emerald-600 dark:text-emerald-400 font-semibold"
                          >
                            + Create New Category...
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Description
                    </Label>
                    <Textarea
                      placeholder="Detailed product overview, craftsmanship, and notes..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={2}
                      className="text-xs bg-background border-border text-foreground resize-none"
                    />
                  </div>
                </div>

                {/* 2. Dynamic Specifications (JSONB Metadata) */}
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <Boxes className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        2. Dynamic Specifications (JSONB)
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Flexible key-value pairs (e.g. Brand, Author, Material,
                        Dietary tags)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddSpec}
                      className="h-7 text-xs gap-1 cursor-pointer bg-card hover:bg-muted border-border text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                      Add Field
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {specifications.map((spec, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder="Key (e.g. Brand, Origin, Duration)"
                          value={spec.key}
                          onChange={(e) =>
                            handleSpecChange(idx, "key", e.target.value)
                          }
                          className="h-8 text-xs bg-background border-border text-foreground flex-1"
                        />
                        <Input
                          placeholder="Value (e.g. Sony, Tokyo, 60 mins)"
                          value={spec.value}
                          onChange={(e) =>
                            handleSpecChange(idx, "value", e.target.value)
                          }
                          className="h-8 text-xs bg-background border-border text-foreground flex-1"
                        />
                        {specifications.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSpec(idx)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Product Custom Filters & Tags */}
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        3. Product Custom Filters & Tags
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Select applicable filter values for storefront
                        filtering.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddFilterOpen(true)}
                      className="h-7 text-xs gap-1 cursor-pointer bg-card hover:bg-muted border-border text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                      Add Filter Group
                    </Button>
                  </div>

                  {tenantFilters.length === 0 ? (
                    <div className="text-center py-3 px-4 bg-card rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                      <span>No custom filters defined yet. </span>
                      <button
                        type="button"
                        onClick={() => setIsAddFilterOpen(true)}
                        className="text-primary font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        Create your first filter (e.g. Dietary, Occasion)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tenantFilters.map((filter) => {
                        const activeOpts = selectedFilters[filter.slug] || [];
                        return (
                          <div key={filter.id} className="space-y-1.5">
                            <Label className="text-xs font-semibold text-foreground">
                              {filter.name}
                            </Label>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {filter.options.map((opt) => {
                                const isSelected = activeOpts.includes(opt);
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() =>
                                      toggleFilterOption(filter.slug, opt)
                                    }
                                    className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors cursor-pointer ${
                                      isSelected
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                        : "bg-card text-foreground border-border hover:border-foreground/40"
                                    }`}
                                  >
                                    {isSelected && "✓ "}
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Product Variants & Pricing */}
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        4. Product Variants & Pricing
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Define pricing, SKU, and stock for each variant.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddVariant}
                      className="h-7 text-xs gap-1 cursor-pointer bg-card hover:bg-muted border-border text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                      Add Variant
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {variants.map((v, vIdx) => (
                      <div
                        key={vIdx}
                        className="p-3 bg-white rounded-lg border border-stone-200 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-800">
                            Variant #{vIdx + 1}
                          </span>
                          {variants.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveVariant(vIdx)}
                              className="h-6 text-[11px] text-rose-600 hover:bg-rose-50 p-1"
                            >
                              Remove Variant
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <Label className="text-[11px] text-stone-600">
                              SKU Code
                            </Label>
                            <Input
                              value={v.sku}
                              onChange={(e) =>
                                handleVariantChange(vIdx, "sku", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </div>

                          <div>
                            <Label className="text-[11px] text-stone-600">
                              Price ({tenantCurrency}) *
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={v.price}
                              onChange={(e) =>
                                handleVariantChange(
                                  vIdx,
                                  "price",
                                  e.target.value,
                                )
                              }
                              className="h-8 text-xs"
                            />
                          </div>

                          <div>
                            <Label className="text-[11px] text-stone-600">
                              Compare Price
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Optional"
                              value={v.compare_at_price}
                              onChange={(e) =>
                                handleVariantChange(
                                  vIdx,
                                  "compare_at_price",
                                  e.target.value,
                                )
                              }
                              className="h-8 text-xs"
                            />
                          </div>

                          <div>
                            <Label className="text-[11px] text-stone-600">
                              {v.track_inventory
                                ? "Stock Qty"
                                : "Stock (Unlimited)"}
                            </Label>
                            <Input
                              type="number"
                              disabled={!v.track_inventory}
                              value={
                                v.track_inventory
                                  ? v.stock_quantity
                                  : "Unlimited"
                              }
                              onChange={(e) =>
                                handleVariantChange(
                                  vIdx,
                                  "stock_quantity",
                                  e.target.value,
                                )
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>

                        {/* Variant Options (Key-Values) */}
                        <div className="pt-2 border-t border-stone-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-stone-500">
                              Variant Options (e.g. Size, Color, Tier)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddVariantOption(vIdx)}
                              className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" /> Add Option
                            </button>
                          </div>

                          {v.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className="flex items-center gap-2"
                            >
                              <Input
                                placeholder="Option (e.g. Size)"
                                value={opt.key}
                                onChange={(e) =>
                                  handleVariantOptionChange(
                                    vIdx,
                                    optIdx,
                                    "key",
                                    e.target.value,
                                  )
                                }
                                className="h-7 text-xs flex-1"
                              />
                              <Input
                                placeholder="Value (e.g. Large)"
                                value={opt.value}
                                onChange={(e) =>
                                  handleVariantOptionChange(
                                    vIdx,
                                    optIdx,
                                    "value",
                                    e.target.value,
                                  )
                                }
                                className="h-7 text-xs flex-1"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveVariantOption(vIdx, optIdx)
                                }
                                className="text-stone-400 hover:text-rose-600"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Product Image */}
                <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      4. Product Images & Media
                    </h4>
                    <span className="text-[11px] font-semibold text-stone-500">
                      {newImages.length}/5 images
                    </span>
                  </div>

                  {/* Gallery Thumbnails */}
                  {newImages.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {newImages.map((img, i) => (
                        <div
                          key={i}
                          className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-stone-200 shrink-0"
                        >
                          <Image
                            src={img}
                            alt={`Preview ${i}`}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setNewImages((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-rose-600 cursor-pointer"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setImageMode("upload")}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        imageMode === "upload"
                          ? "bg-stone-900 text-white"
                          : "text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode("url")}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        imageMode === "url"
                          ? "bg-stone-900 text-white"
                          : "text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      Custom Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode("presets")}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        imageMode === "presets"
                          ? "bg-stone-900 text-white"
                          : "text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      Sample Presets
                    </button>
                  </div>

                  {imageMode === "upload" && (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => {
                        if (newImages.length >= 5) {
                          toast.error(
                            "Maximum of 5 images reached. Remove an image to upload a new one.",
                          );
                          return;
                        }
                        fileInputRef.current?.click();
                      }}
                      className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors flex flex-col items-center justify-center gap-1.5 ${
                        newImages.length >= 5
                          ? "border-stone-200 bg-stone-100/50 opacity-60 cursor-not-allowed"
                          : "border-stone-300 hover:border-emerald-500 bg-white cursor-pointer"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        disabled={newImages.length >= 5}
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleFileUpload(e.target.files[0])
                        }
                      />
                      <UploadCloud className="h-6 w-6 text-stone-400" />
                      <p className="text-xs text-foreground font-semibold">
                        {newImages.length >= 5
                          ? "Maximum 5 Images Reached"
                          : "Click to upload or drag image here"}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {newImages.length >= 5
                          ? "Delete an image to add more"
                          : `${5 - newImages.length} of 5 remaining (PNG, JPG, WEBP)`}
                      </p>
                    </div>
                  )}

                  {imageMode === "url" && (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={
                          newImages.length >= 5
                            ? "Limit of 5 images reached"
                            : "https://images.unsplash.com/..."
                        }
                        disabled={newImages.length >= 5}
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="h-8 text-xs bg-white flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={newImages.length >= 5 || !newImageUrl.trim()}
                        onClick={() => {
                          if (!newImageUrl.trim()) return;
                          if (newImages.length >= 5) {
                            toast.error("Maximum 5 images allowed per product");
                            return;
                          }
                          setNewImages((prev) =>
                            [...prev, newImageUrl.trim()].slice(0, 5),
                          );
                          setNewImageUrl("");
                          toast.success("Image added to gallery");
                        }}
                        className="h-8 text-xs bg-stone-900 text-white hover:bg-stone-800"
                      >
                        Add
                      </Button>
                    </div>
                  )}

                  {imageMode === "presets" && (
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_SAMPLE_IMAGES.map((preset, i) => {
                        const isAdded = newImages.includes(preset.url);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (isAdded) {
                                setNewImages((prev) =>
                                  prev.filter((u) => u !== preset.url),
                                );
                              } else {
                                if (newImages.length >= 5) {
                                  toast.error(
                                    "Maximum 5 images allowed per product",
                                  );
                                  return;
                                }
                                setNewImages((prev) =>
                                  [...prev, preset.url].slice(0, 5),
                                );
                              }
                            }}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                              isAdded
                                ? "border-emerald-600 ring-2 ring-emerald-500/20"
                                : "border-stone-200 hover:border-stone-400"
                            }`}
                          >
                            <Image
                              src={preset.url}
                              alt={preset.label}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                            {isAdded && (
                              <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center text-white font-bold text-xs">
                                ✓
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newIsPublished}
                      onChange={(e) => setNewIsPublished(e.target.checked)}
                      className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-foreground">
                      Publish immediately to live storefront
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddProductOpen(false)}
                      className="text-xs h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-4 font-semibold"
                    >
                      {isSubmitting ? "Creating..." : "Save Product"}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Quick Create Category Dialog */}
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-bold text-stone-900">
                  Create Product Category
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500">
                  Add a new category that will be available across your product
                  catalog and storefront.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleCreateCategorySubmit}
                className="space-y-4 pt-2"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Category Name *
                  </Label>
                  <Input
                    placeholder="e.g. Celebration Cakes, Signature Pastries"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Subtitle / Description (Optional)
                  </Label>
                  <Input
                    placeholder="e.g. Sculptural tiered centerpieces"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddCategoryOpen(false)}
                    className="text-xs h-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreatingCategory}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-4 font-semibold"
                  >
                    {isCreatingCategory ? "Creating..." : "Create Category"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Quick Create Filter Group Dialog */}
          <Dialog open={isAddFilterOpen} onOpenChange={setIsAddFilterOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-bold text-stone-900">
                  Create Product Filter Group
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500">
                  Create a custom filter dimension (e.g. Dietary, Occasion, Meal
                  Time) for catalog products.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleCreateFilterSubmit}
                className="space-y-4 pt-2"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Filter Name *
                  </Label>
                  <Input
                    placeholder="e.g. Dietary, Occasion, Meal Time, Roast Level"
                    value={newFilterName}
                    onChange={(e) => setNewFilterName(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Filter Display Style
                  </Label>
                  <Select
                    value={newFilterType}
                    onValueChange={setNewFilterType}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checkbox">
                        Checkbox / Multi-Select
                      </SelectItem>
                      <SelectItem value="pills">Pill Badges</SelectItem>
                      <SelectItem value="radio">
                        Radio / Single-Select
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Options (Comma separated) *
                  </Label>
                  <Textarea
                    placeholder="e.g. Vegan, Gluten-Free, Nut-Free, Dairy-Free"
                    value={newFilterOptionsInput}
                    onChange={(e) => setNewFilterOptionsInput(e.target.value)}
                    rows={2}
                    required
                    className="text-xs resize-none"
                  />
                  <p className="text-[10px] text-stone-400">
                    Separate multiple tags with commas. You can add more later.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddFilterOpen(false)}
                    className="text-xs h-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreatingFilter}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-4 font-semibold"
                  >
                    {isCreatingFilter ? "Creating..." : "Create Filter Group"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                      {p.filters && Object.keys(p.filters).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(p.filters).flatMap(([k, v]) =>
                            (Array.isArray(v) ? v : [String(v)]).map((opt) => (
                              <span
                                key={`${k}-${opt}`}
                                className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium border border-emerald-200 dark:border-emerald-800"
                              >
                                {opt}
                              </span>
                            )),
                          )}
                        </div>
                      )}
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
                            Edit
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
        {totalPages > 1 && (
          <div className="p-3 border-t border-stone-200 flex items-center justify-between">
            <span className="text-xs text-stone-500">
              Page {currentPage} of {totalPages}
            </span>
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="cursor-pointer text-xs"
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
                    className="cursor-pointer text-xs"
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
