"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Save,
  Trash2,
  Globe,
  UploadCloud,
  Sparkles,
  Layers,
  Boxes,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getProductById,
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
  UpdateProductInput,
  ProductCategory,
  ProductFilter,
} from "@/types/products";
import { getTenantRoute } from "@/utils/helper";
import { useUserStore } from "@/store/user";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";

interface ProductDetailPageProps {
  params: Promise<{
    tenant: string;
    id: string;
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
  id?: string;
  sku: string;
  price: string;
  compare_at_price: string;
  track_inventory: boolean;
  stock_quantity: string;
  options: OptionEntry[];
}

export default function TenantProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const unwrappedParams = use(params);
  const { tenant: rawTenant, id: productId } = unwrappedParams;
  const router = useRouter();
  const { user } = useUserStore();
  const { tenant } = useTenantTheme();

  const activeTenantSlug =
    user?.tenant_slug || (rawTenant !== "store" ? rawTenant : "jazz-cakes-ltd");

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, setIsUploading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Core Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [productClass, setProductClass] = useState<ProductClass>("physical");
  const [currency, setCurrency] = useState(
    tenant?.currency || user?.tenant_currency || "NGN",
  );

  useEffect(() => {
    if (tenant?.currency) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrency((prev) =>
        prev === "USD" || !prev ? tenant.currency! : prev,
      );
    }
  }, [tenant?.currency]);
  const [isPublished, setIsPublished] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [customImageUrl, setCustomImageUrl] = useState("");

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

  // Dynamic Specifications (JSONB)
  const [specifications, setSpecifications] = useState<SpecEntry[]>([
    { key: "", value: "" },
  ]);

  // Dynamic Variants
  const [variants, setVariants] = useState<FormVariant[]>([
    {
      sku: "SKU-001",
      price: "100",
      compare_at_price: "",
      track_inventory: true,
      stock_quantity: "10",
      options: [],
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch product data
  const loadProduct = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getProductById(productId, activeTenantSlug);
      if (res.status === "success" && res.data) {
        const p = res.data;
        setProduct(p);
        setName(p.name || p.title || "");
        setSlug(p.slug || "");
        setDescription(p.description || "");
        setCategory(p.category || "General");
        setSelectedCategoryId(p.category_id || "");

        // Comprehensive normalization for filters & tags
        const loadedFilters: Record<string, string[]> = {};
        if (p.filters && typeof p.filters === "object") {
          Object.entries(p.filters).forEach(([k, v]) => {
            if (Array.isArray(v)) {
              loadedFilters[k] = (v as unknown[]).map(String);
            } else if (typeof v === "string") {
              loadedFilters[k] = (v as unknown as string)
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean);
            }
          });
        }
        if (
          p.specifications?.filters &&
          typeof p.specifications.filters === "object"
        ) {
          Object.entries(
            p.specifications.filters as Record<string, unknown>,
          ).forEach(([k, v]) => {
            if (!loadedFilters[k]) {
              if (Array.isArray(v)) {
                loadedFilters[k] = (v as unknown[]).map(String);
              } else if (typeof v === "string") {
                loadedFilters[k] = (v as unknown as string)
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean);
              }
            }
          });
        }
        const rawP = p as unknown as Record<string, unknown>;
        if (rawP.tags) {
          const tagsVal = rawP.tags;
          if (Array.isArray(tagsVal) && tagsVal.length > 0) {
            loadedFilters["tags"] = tagsVal.map(String);
          } else if (typeof tagsVal === "string" && tagsVal.trim()) {
            loadedFilters["tags"] = tagsVal
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
        }
        setSelectedFilters(loadedFilters);

        setProductClass(p.product_class || "physical");
        setCurrency(
          p.currency || tenant?.currency || user?.tenant_currency || "NGN",
        );
        setIsPublished(p.is_published ?? true);
        setImages(p.images && p.images.length > 0 ? p.images.slice(0, 5) : []);

        // Load specifications
        if (p.specifications && Object.keys(p.specifications).length > 0) {
          const loadedSpecs: SpecEntry[] = [];
          Object.entries(p.specifications).forEach(([k, v]) => {
            if (k.toLowerCase() === "filters") return;
            if (Array.isArray(v)) {
              v.forEach((val) => {
                if (val !== undefined && val !== null && String(val).trim()) {
                  loadedSpecs.push({ key: k, value: String(val).trim() });
                }
              });
            } else if (v !== undefined && v !== null && typeof v === "object") {
              loadedSpecs.push({ key: k, value: JSON.stringify(v) });
            } else if (v !== undefined && v !== null && String(v).trim()) {
              loadedSpecs.push({ key: k, value: String(v).trim() });
            }
          });
          setSpecifications(
            loadedSpecs.length > 0 ? loadedSpecs : [{ key: "", value: "" }],
          );
        } else {
          setSpecifications([{ key: "", value: "" }]);
        }

        // Load variants
        if (p.variants && p.variants.length > 0) {
          const loadedVariants = p.variants.map((v) => {
            const rawOptions = v.options || {};
            const flatOptions: { key: string; value: string }[] = [];
            Object.entries(rawOptions).forEach(([ok, ov]) => {
              if (Array.isArray(ov)) {
                ov.forEach((val) => {
                  if (val !== undefined && val !== null && String(val).trim()) {
                    flatOptions.push({ key: ok, value: String(val).trim() });
                  }
                });
              } else if (typeof ov === "string" && ov.includes(",")) {
                ov.split(",").forEach((val) => {
                  if (val.trim()) {
                    flatOptions.push({ key: ok, value: val.trim() });
                  }
                });
              } else if (ov !== undefined && ov !== null && String(ov).trim()) {
                flatOptions.push({ key: ok, value: String(ov).trim() });
              }
            });

            return {
              id: v.id,
              sku: v.sku,
              price: v.price ? v.price.toString() : "0",
              compare_at_price: v.compare_at_price
                ? v.compare_at_price.toString()
                : "",
              track_inventory: v.track_inventory ?? true,
              stock_quantity:
                v.stock_quantity !== undefined
                  ? v.stock_quantity.toString()
                  : "0",
              options: flatOptions,
            };
          });
          setVariants(loadedVariants);
        } else {
          setVariants([
            {
              sku: p.sku || `SKU-${Date.now().toString().slice(-4)}`,
              price: p.price ? p.price.toString() : "0",
              compare_at_price: "",
              track_inventory: p.product_class === "physical",
              stock_quantity:
                p.inventory_count !== undefined
                  ? p.inventory_count.toString()
                  : "0",
              options: [],
            },
          ]);
        }
      } else {
        toast.error(res.message || "Failed to find product");
      }
    } catch (err: unknown) {
      console.error("Error loading product details:", err);
      toast.error("Could not load product details from backend");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, activeTenantSlug]);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProduct();
    loadCategoriesAndFilters();
  }, [loadProduct, loadCategoriesAndFilters]);

  // Auto-sync category ID if category name matches an existing tenant category
  useEffect(() => {
    if (!category || selectedCategoryId) return;
    const found = tenantCategories.find(
      (c) => c.name.toLowerCase() === category.toLowerCase(),
    );
    if (found) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCategoryId(found.id);
    }
  }, [category, tenantCategories, selectedCategoryId]);

  // Helper to check if an option is selected across slug and name variants
  const isFilterOptionActive = useCallback(
    (filter: ProductFilter, option: string): boolean => {
      const normOpt = option.trim().toLowerCase();
      for (const [key, val] of Object.entries(selectedFilters)) {
        const normKey = key.trim().toLowerCase();
        const matchesFilter =
          normKey === filter.slug.toLowerCase() ||
          normKey === filter.name.toLowerCase() ||
          normKey === filter.slug.replace(/-/g, "").toLowerCase() ||
          normKey === filter.name.replace(/\s+/g, "").toLowerCase();

        if (matchesFilter) {
          if (Array.isArray(val)) {
            if (val.some((v) => String(v).trim().toLowerCase() === normOpt)) {
              return true;
            }
          } else if (typeof (val as unknown) === "string") {
            const parts = (val as unknown as string)
              .split(",")
              .map((s: string) => s.trim().toLowerCase());
            if (parts.includes(normOpt)) {
              return true;
            }
          }
        }
      }
      return false;
    },
    [selectedFilters],
  );

  // Toggle filter option
  const toggleFilterOption = (filter: ProductFilter, option: string) => {
    setSelectedFilters((prev) => {
      const next = { ...prev };
      const currentOpts = new Set<string>();

      // Collect all current options for this filter across keys
      Object.entries(prev).forEach(([k, v]) => {
        const normK = k.trim().toLowerCase();
        if (
          normK === filter.slug.toLowerCase() ||
          normK === filter.name.toLowerCase()
        ) {
          if (Array.isArray(v)) {
            v.forEach((item) => currentOpts.add(String(item)));
          } else if (typeof (v as unknown) === "string") {
            (v as unknown as string)
              .split(",")
              .forEach((item: string) => currentOpts.add(item.trim()));
          }
        }
      });

      const normOpt = option.trim().toLowerCase();
      let matchedItem: string | null = null;
      for (const item of currentOpts) {
        if (item.trim().toLowerCase() === normOpt) {
          matchedItem = item;
          break;
        }
      }

      if (matchedItem) {
        currentOpts.delete(matchedItem);
      } else {
        currentOpts.add(option);
      }

      const updatedList = Array.from(currentOpts).filter(Boolean);
      next[filter.slug] = updatedList;

      // Clean up duplicate non-canonical key if present
      if (filter.name !== filter.slug && next[filter.name]) {
        delete next[filter.name];
      }

      return next;
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
        setCategory(res.data.name);
        setIsAddCategoryOpen(false);
        setNewCategoryName("");
        setNewCategoryDescription("");
        toast.success(`Category "${res.data.name}" created!`);
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
      toast.error("Please provide at least one option");
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
        track_inventory: productClass === "physical",
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

  // Handle Save
  const handleSaveProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      toast.error("Product name cannot be empty");
      return;
    }

    // Build specifications dict
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

      return {
        id: v.id,
        sku: v.sku.trim(),
        price: parseFloat(v.price) || 0,
        compare_at_price: v.compare_at_price
          ? parseFloat(v.compare_at_price)
          : undefined,
        track_inventory: v.track_inventory,
        stock_quantity: v.track_inventory
          ? parseInt(v.stock_quantity, 10) || 0
          : 0,
        options: optionsDict,
      };
    });

    const primaryVariant = variantsPayload[0];
    if (!primaryVariant || primaryVariant.price <= 0) {
      toast.error("Please provide a valid price for the primary variant");
      return;
    }

    try {
      setIsSaving(true);

      const cleanedFilters: Record<string, string[]> = {};
      Object.entries(selectedFilters).forEach(([k, v]) => {
        if (Array.isArray(v) && v.length > 0) {
          cleanedFilters[k] = v.filter(
            (item) => typeof item === "string" && item.trim().length > 0,
          );
        }
      });

      const payload: UpdateProductInput = {
        name: name.trim(),
        title: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        category_id: selectedCategoryId || undefined,
        category: category.trim(),
        product_class: productClass,
        specifications: specsDict,
        filters: cleanedFilters,
        variants: variantsPayload,
        images: images.slice(0, 5),
        is_published: isPublished,
        // Legacy fallbacks
        sku: primaryVariant.sku,
        price: primaryVariant.price,
        currency,
        inventory_count: primaryVariant.stock_quantity,
      };

      const res = await updateProduct(productId, payload, activeTenantSlug);
      if (res.status === "success" && res.data) {
        setProduct(res.data);
        if (res.data.filters) {
          const loadedFilters: Record<string, string[]> = {};
          Object.entries(res.data.filters).forEach(([k, v]) => {
            if (Array.isArray(v)) {
              loadedFilters[k] = (v as unknown[]).map(String);
            }
          });
          setSelectedFilters(loadedFilters);
        }
        toast.success("Product updated successfully");
      } else {
        toast.error(res.message || "Failed to update product");
      }
    } catch (err: unknown) {
      console.error("Error updating product:", err);
      toast.error("An error occurred while updating product");
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async () => {
    const nextState = !isPublished;
    setIsPublished(nextState);
    try {
      const res = await updateProduct(
        productId,
        { is_published: nextState },
        activeTenantSlug,
      );
      if (res.status === "success") {
        toast.success(
          nextState
            ? "Product is now live on storefront"
            : "Product unlisted to drafts",
        );
      }
    } catch {
      setIsPublished(!nextState);
      toast.error("Failed to update status");
    }
  };

  // Delete product
  const handleDeleteProduct = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteProduct(productId, activeTenantSlug);
      if (res.status === "success") {
        toast.success("Product deleted successfully");
        router.push(getTenantRoute(activeTenantSlug, "/products"));
      } else {
        toast.error(res.message || "Could not delete product");
      }
    } catch (err: unknown) {
      console.error("Error deleting product:", err);
      toast.error("Failed to delete product");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // File Upload (Enforcing max 5 images)
  const handleFileUpload = async (file: File) => {
    if (images.length >= 5) {
      toast.error("Maximum 5 images allowed per product");
      return;
    }
    try {
      setIsUploading(true);
      const res = await uploadProductImage(file, activeTenantSlug);
      if (res.status === "success" && res.data?.url) {
        const uploadedUrl = res.data.url;
        setImages((prev) => [...prev, uploadedUrl].slice(0, 5));
        setSelectedImageIndex(Math.min(images.length, 4));
        toast.success("Image uploaded successfully");
      } else {
        toast.error(res.message || "Image upload failed");
      }
    } catch (err: unknown) {
      console.error("Image upload error:", err);
      toast.error("Failed to upload image to CDN");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddCustomUrl = () => {
    if (!customImageUrl.trim()) return;
    if (images.length >= 5) {
      toast.error("Maximum 5 images allowed per product");
      return;
    }
    setImages((prev) => [...prev, customImageUrl.trim()].slice(0, 5));
    setSelectedImageIndex(Math.min(images.length, 4));
    setCustomImageUrl("");
    toast.success("Image added to gallery");
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
    if (selectedImageIndex >= indexToRemove && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-card rounded-2xl border border-border text-center space-y-4 shadow-xs text-foreground">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <Package className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            Product Not Found
          </h3>
          <p className="text-xs text-muted-foreground">
            The product you are trying to edit does not exist or has been
            removed from this storefront.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-2">
          <Link href={getTenantRoute(activeTenantSlug, "/products")}>
            <Button
              variant="outline"
              size="default"
              className="text-xs h-8 border-border bg-card hover:bg-muted text-foreground"
            >
              Back to Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-5 pb-16 text-foreground">
      {/* Top Navigation & Actions */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href={getTenantRoute(activeTenantSlug, "/products")}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-muted hover:bg-muted/80 text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h4 className="font-bold font-secondary text-foreground">
                {name || "Edit Product"}
              </h4>
              <Badge
                variant="outline"
                className={`text-[10px] capitalize ${
                  productClass === "service"
                    ? "bg-purple-50 text-purple-700"
                    : productClass === "digital"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {productClass}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            className="text-xs h-8 gap-1.5"
          >
            <Globe className="h-3.5 w-3.5 text-stone-500" />
            <span>{isPublished ? "Set to Draft" : "Publish Live"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            onClick={() => handleSaveProduct()}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-4 gap-1.5 font-semibold shadow-xs"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Core + Specs + Variants) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Core Attributes */}
          <div className="p-5 bg-card rounded-xl border border-border space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 border-b border-border pb-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              1. Core Attributes
            </h3>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Product Name / Title *
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs bg-background border-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Product Class *
                </Label>
                <Select
                  value={productClass}
                  onValueChange={(val: ProductClass) => setProductClass(val)}
                >
                  <SelectTrigger className="w-full h-9 bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="physical">
                      Physical (Requires inventory & shipping)
                    </SelectItem>
                    <SelectItem value="digital">
                      Digital (Requires download access)
                    </SelectItem>
                    <SelectItem value="service">
                      Service (Requires booking & scheduling)
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
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> New Category
                  </button>
                </div>

                {(() => {
                  const matchingCat = tenantCategories.find(
                    (c) =>
                      (selectedCategoryId && c.id === selectedCategoryId) ||
                      (category &&
                        c.name.trim().toLowerCase() ===
                          category.trim().toLowerCase()),
                  );
                  const selectVal = matchingCat
                    ? matchingCat.id
                    : selectedCategoryId
                      ? selectedCategoryId
                      : category
                        ? `name:${category}`
                        : "";

                  return (
                    <Select
                      value={selectVal}
                      onValueChange={(val) => {
                        if (val === "__new__") {
                          setIsAddCategoryOpen(true);
                        } else if (val.startsWith("name:")) {
                          const catName = val.replace("name:", "");
                          setCategory(catName);
                          setSelectedCategoryId("");
                        } else {
                          const found = tenantCategories.find(
                            (c) => c.id === val,
                          );
                          if (found) {
                            setSelectedCategoryId(found.id);
                            setCategory(found.name);
                          } else {
                            setSelectedCategoryId(val);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-full h-9 bg-background border-border text-foreground">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        {tenantCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                        {/* Always ensure previously selected category is present as an option */}
                        {category && !matchingCat && (
                          <SelectItem
                            value={selectedCategoryId || `name:${category}`}
                          >
                            {category}
                          </SelectItem>
                        )}
                        {tenantCategories.length === 0 && !category && (
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
                          className="text-primary font-semibold"
                        >
                          + Create New Category...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                URL Slug
              </Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="h-9 text-xs font-mono bg-muted border-border text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Description
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="text-xs resize-none bg-background border-border text-foreground"
              />
            </div>
          </div>

          {/* 2. Product Custom Filters & Tags */}
          <div className="p-5 bg-card rounded-xl border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  2. Product Custom Filters & Tags
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Assign filter attributes for storefront filtering (e.g.
                  Dietary, Occasion, Meal Time).
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

            {tenantFilters.length === 0 &&
            Object.keys(selectedFilters).length === 0 ? (
              <div className="text-center py-4 px-4 bg-muted/30 rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                <span>No custom filters configured for this store yet. </span>
                <button
                  type="button"
                  onClick={() => setIsAddFilterOpen(true)}
                  className="text-primary font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  Create filter group
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tenantFilters.map((filter) => (
                  <div key={filter.id} className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">
                      {filter.name}
                    </Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {filter.options.map((opt) => {
                        const isSelected = isFilterOptionActive(filter, opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleFilterOption(filter, opt)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-background text-foreground border-border hover:border-foreground/40"
                            }`}
                          >
                            {isSelected && "✓ "}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Previously selected custom tags or extra filter groups not defined in tenantFilters */}
                {Object.entries(selectedFilters)
                  .filter(([k, v]) => {
                    const normK = k.trim().toLowerCase();
                    const isKnownTenantFilter = tenantFilters.some(
                      (tf) =>
                        tf.slug.toLowerCase() === normK ||
                        tf.name.toLowerCase() === normK,
                    );
                    return (
                      !isKnownTenantFilter && Array.isArray(v) && v.length > 0
                    );
                  })
                  .map(([filterKey, opts]) => (
                    <div
                      key={filterKey}
                      className="space-y-2 pt-2 border-t border-border/50"
                    >
                      <Label className="text-xs font-semibold text-foreground capitalize">
                        {filterKey.replace(/-/g, " ")} (Selected Tags)
                      </Label>
                      <div className="flex flex-wrap items-center gap-2">
                        {opts.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setSelectedFilters((prev) => {
                                const current = prev[filterKey] || [];
                                const updated = current.filter(
                                  (o) => o !== opt,
                                );
                                if (updated.length === 0) {
                                  const rest = { ...prev };
                                  delete rest[filterKey];
                                  return rest;
                                }
                                return { ...prev, [filterKey]: updated };
                              });
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium border transition-all cursor-pointer bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          >
                            ✓ {opt} <span className="opacity-70 ml-1">×</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 3. Dynamic Specifications (JSONB) */}
          <div className="p-5 bg-card rounded-xl border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Boxes className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  3. Dynamic Specifications (JSONB)
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Metadata stored in flexible PostgreSQL JSONB column without
                  schema migrations.
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
                    placeholder="Key (e.g. Brand, Material, Duration)"
                    value={spec.key}
                    onChange={(e) =>
                      handleSpecChange(idx, "key", e.target.value)
                    }
                    className="h-8 text-xs bg-background border-border text-foreground flex-1"
                  />
                  <Input
                    placeholder="Value (e.g. Sony, 100% Organic Silk, 45 mins)"
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

          {/* 4. Product Variants & Pricing */}
          <div className="p-5 bg-card rounded-xl border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  4. Product Variants & Inventory
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Price, SKU, and stock are strictly tracked per variant.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddVariant}
                className="h-7 text-xs gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Add Variant
              </Button>
            </div>

            <div className="space-y-4">
              {variants.map((v, vIdx) => (
                <div
                  key={vIdx}
                  className="p-4 rounded-xl border border-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">
                        SKU Code
                      </Label>
                      <Input
                        value={v.sku}
                        onChange={(e) =>
                          handleVariantChange(vIdx, "sku", e.target.value)
                        }
                        className="h-8 text-xs bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] text-muted-foreground">
                        Price ({currency}) *
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={v.price}
                        onChange={(e) =>
                          handleVariantChange(vIdx, "price", e.target.value)
                        }
                        className="h-8 text-xs bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] text-muted-foreground">
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
                        className="h-8 text-xs bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] text-muted-foreground">
                        {v.track_inventory
                          ? "Stock Quantity"
                          : "Stock (Unlimited)"}
                      </Label>
                      <Input
                        type="number"
                        disabled={!v.track_inventory}
                        value={
                          v.track_inventory ? v.stock_quantity : "Unlimited"
                        }
                        onChange={(e) =>
                          handleVariantChange(
                            vIdx,
                            "stock_quantity",
                            e.target.value,
                          )
                        }
                        className="h-8 text-xs bg-background border-border text-foreground"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={v.track_inventory}
                        onChange={(e) =>
                          handleVariantChange(
                            vIdx,
                            "track_inventory",
                            e.target.checked,
                          )
                        }
                        className="rounded border-border text-emerald-600 focus:ring-primary"
                      />
                      Track inventory quantity for this variant
                    </label>
                  </div>

                  {/* Variant Options Key-Values */}
                  <div className="pt-2 border-t border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Variant Options (e.g. Size, Color, Edition)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddVariantOption(vIdx)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add Option
                      </button>
                    </div>

                    {v.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <Input
                          placeholder="Option Name (e.g. Size)"
                          value={opt.key}
                          onChange={(e) =>
                            handleVariantOptionChange(
                              vIdx,
                              optIdx,
                              "key",
                              e.target.value,
                            )
                          }
                          className="h-7 text-xs bg-background border-border text-foreground flex-1"
                        />
                        <Input
                          placeholder="Option Value (e.g. XL)"
                          value={opt.value}
                          onChange={(e) =>
                            handleVariantOptionChange(
                              vIdx,
                              optIdx,
                              "value",
                              e.target.value,
                            )
                          }
                          className="h-7 text-xs bg-background border-border text-foreground flex-1"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveVariantOption(vIdx, optIdx)
                          }
                          className="text-muted-foreground hover:text-rose-500"
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
        </div>

        {/* Right Column (Images Gallery & Publish Status) */}
        <div className="space-y-6">
          <div className="p-5 bg-card rounded-xl border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Media & Product Images
              </h3>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {images.length}/5 images
              </span>
            </div>

            {/* Main Preview */}
            <div className="relative aspect-square w-full rounded-xl bg-muted border border-border overflow-hidden">
              {images.length > 0 ? (
                <Image
                  src={images[selectedImageIndex] || images[0]}
                  alt="Product Image"
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-2">
                  <Package className="h-8 w-8" />
                  <span className="text-xs">No images uploaded</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer shrink-0 ${
                      selectedImageIndex === i
                        ? "border-emerald-600"
                        : "border-border"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumb ${i}`}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(i);
                      }}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-rose-600"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Box */}
            <div
              onClick={() => {
                if (images.length >= 5) {
                  toast.error(
                    "Maximum of 5 images reached. Remove an image to upload a new one.",
                  );
                  return;
                }
                fileInputRef.current?.click();
              }}
              className={`border-2 border-dashed rounded-xl p-3 text-center transition-colors flex flex-col items-center justify-center gap-1 ${
                images.length >= 5
                  ? "border-border/50 bg-muted/10 opacity-60 cursor-not-allowed"
                  : "border-border hover:border-emerald-500 bg-muted/20 cursor-pointer"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                disabled={images.length >= 5}
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && handleFileUpload(e.target.files[0])
                }
              />
              <UploadCloud className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">
                {images.length >= 5
                  ? "Maximum 5 Images Reached"
                  : "Upload Image File"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {images.length >= 5
                  ? "Delete an image to add another"
                  : `${5 - images.length} of 5 remaining`}
              </span>
            </div>

            {/* Custom URL */}
            <div className="flex items-center gap-1.5 pt-2">
              <Input
                placeholder={
                  images.length >= 5
                    ? "Maximum 5 images reached"
                    : "Paste Image URL"
                }
                disabled={images.length >= 5}
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                className="h-8 text-xs bg-background border-border text-foreground"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={images.length >= 5 || !customImageUrl.trim()}
                onClick={handleAddCustomUrl}
                className="h-8 text-xs border-border bg-card hover:bg-muted text-foreground"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-card p-6 rounded-2xl border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Delete Product
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete &quot;{name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="text-xs h-8 border-border bg-card hover:bg-muted text-foreground"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteProduct}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 px-4"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Create Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-foreground">
              Create Product Category
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
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
          <form onSubmit={handleCreateFilterSubmit} className="space-y-4 pt-2">
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
              <Select value={newFilterType} onValueChange={setNewFilterType}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkbox">
                    Checkbox / Multi-Select
                  </SelectItem>
                  <SelectItem value="pills">Pill Badges</SelectItem>
                  <SelectItem value="radio">Radio / Single-Select</SelectItem>
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
  );
}
