"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  Tag,
  Search,
  SlidersHorizontal,
  FolderTree,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api/categories";
import {
  getFilters,
  createFilter,
  updateFilter,
  deleteFilter,
} from "@/lib/api/filters";
import { ProductCategory, ProductFilter } from "@/types/products";

export default function CategoryFiltersAdminPage() {
  const [activeTab, setActiveTab] = useState<string>("categories");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [filters, setFilters] = useState<ProductFilter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search queries
  const [categorySearch, setCategorySearch] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  // Category Dialog State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Filter Dialog State
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<ProductFilter | null>(
    null,
  );
  const [filterName, setFilterName] = useState("");
  const [filterOptionsStr, setFilterOptionsStr] = useState("");
  const [isSubmittingFilter, setIsSubmittingFilter] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, filts] = await Promise.all([getCategories(), getFilters()]);
      setCategories(cats.data || []);
      setFilters(filts.data || []);
    } catch (err: unknown) {
      const e = err as Error;
      toast.error("Failed to load categories & filters: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Handle Category CRUD
  const handleOpenCategoryDialog = (cat?: ProductCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryName(cat.name);
      setCategoryDesc(cat.description || "");
    } else {
      setEditingCategory(null);
      setCategoryName("");
      setCategoryDesc("");
    }
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setIsSubmittingCat(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: categoryName.trim(),
          description: categoryDesc.trim() || undefined,
        });
        toast.success(`Category "${categoryName}" updated`);
      } else {
        await createCategory({
          name: categoryName.trim(),
          description: categoryDesc.trim() || undefined,
        });
        toast.success(`Category "${categoryName}" created`);
      }
      setIsCategoryDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to save category");
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async (cat: ProductCategory) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`))
      return;
    try {
      await deleteCategory(cat.id);
      toast.success(`Category "${cat.name}" deleted`);
      loadData();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to delete category");
    }
  };

  // Handle Filter CRUD
  const handleOpenFilterDialog = (filt?: ProductFilter) => {
    if (filt) {
      setEditingFilter(filt);
      setFilterName(filt.name);
      setFilterOptionsStr(filt.options.join(", "));
    } else {
      setEditingFilter(null);
      setFilterName("");
      setFilterOptionsStr("");
    }
    setIsFilterDialogOpen(true);
  };

  const handleSaveFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterName.trim()) {
      toast.error("Filter group name is required");
      return;
    }
    const options = filterOptionsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (options.length === 0) {
      toast.error("Provide at least one filter option (comma-separated)");
      return;
    }

    setIsSubmittingFilter(true);
    try {
      if (editingFilter) {
        await updateFilter(editingFilter.id, {
          name: filterName.trim(),
          options,
        });
        toast.success(`Filter "${filterName}" updated`);
      } else {
        await createFilter({
          name: filterName.trim(),
          options,
        });
        toast.success(`Filter "${filterName}" created`);
      }
      setIsFilterDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to save filter group");
    } finally {
      setIsSubmittingFilter(false);
    }
  };

  const handleDeleteFilter = async (filt: ProductFilter) => {
    if (
      !confirm(`Are you sure you want to delete filter group "${filt.name}"?`)
    )
      return;
    try {
      await deleteFilter(filt.id);
      toast.success(`Filter group "${filt.name}" deleted`);
      loadData();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to delete filter group");
    }
  };

  // Filtered lists based on search
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)),
    );
  }, [categories, categorySearch]);

  const filteredFilters = useMemo(() => {
    if (!filterSearch.trim()) return filters;
    const q = filterSearch.toLowerCase();
    return filters.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q) ||
        f.options.some((opt) => opt.toLowerCase().includes(q)),
    );
  }, [filters, filterSearch]);

  const totalFilterOptionsCount = useMemo(() => {
    return filters.reduce((acc, f) => acc + f.options.length, 0);
  }, [filters]);

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-col">
          <h4 className="font-bold font-secondary text-foreground">
            Categories & Product Filters
          </h4>
          <p className="text-muted-foreground mt-1">
            Manage your store&apos;s product catalog taxonomy and dynamic
            storefront filter facets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="cursor-pointer gap-1.5 border-border bg-card hover:bg-muted text-foreground"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Total Categories
            </p>
            <h3 className="text-2xl font-bold font-secondary text-foreground mt-1">
              {categories.length}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Active store departments
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Filter Facet Groups
            </p>
            <h3 className="text-2xl font-bold font-secondary text-foreground mt-1">
              {filters.length}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Configured storefront groups
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Total Selectable Options
            </p>
            <h3 className="text-2xl font-bold font-secondary text-foreground mt-1">
              {totalFilterOptionsCount}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Pills & checkbox tags
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Tag className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Single-Table Tabs Section */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full flex flex-col gap-2"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="bg-muted/60 p-1 border border-border h-10">
            <TabsTrigger
              value="categories"
              className="gap-2 text-xs font-semibold px-4 cursor-pointer data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Categories</span>
              <Badge
                variant="secondary"
                className="ml-1 text-[10px] px-1.5 py-0 bg-muted-foreground/15 border-0"
              >
                {categories.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="filters"
              className="gap-2 text-xs font-semibold px-4 cursor-pointer data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Product Filters</span>
              <Badge
                variant="secondary"
                className="ml-1 text-[10px] px-1.5 py-0 bg-muted-foreground/15 border-0"
              >
                {filters.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {activeTab === "categories" ? (
            <Button
              size="sm"
              onClick={() => handleOpenCategoryDialog()}
              className="cursor-pointer gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs h-9"
            >
              <Plus className="h-3.5 w-3.5" />
              New Category
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => handleOpenFilterDialog()}
              className="cursor-pointer gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs h-9"
            >
              <Plus className="h-3.5 w-3.5" />
              New Filter Group
            </Button>
          )}
        </div>

        {/* Categories Tab Content */}
        <TabsContent value="categories" className="space-y-4 outline-none">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories by name, slug, or description..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-card border-border text-foreground w-full"
            />
          </div>

          {/* Categories Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow className="border-border">
                  <TableHead className="text-xs font-bold text-foreground">
                    Category Name
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground">
                    Slug Identifier
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground">
                    Description
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="border-border">
                    <TableCell
                      colSpan={4}
                      className="h-36 text-center text-xs text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span>Loading product categories...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell
                      colSpan={4}
                      className="h-36 text-center text-xs text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <FolderTree className="h-12 w-12 text-muted-foreground/50" />
                        <h5 className="font-semibold text-foreground">
                          No categories found
                        </h5>
                        <p className="text-muted-foreground max-w-sm">
                          {categorySearch
                            ? `No categories match "${categorySearch}". Try a different search term.`
                            : "Organize your store by creating product categories."}
                        </p>
                        {!categorySearch && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenCategoryDialog()}
                            className="mt-2 text-xs gap-1 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" /> Create Category
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((cat) => (
                    <TableRow
                      key={cat.id}
                      className="border-border hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Layers className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <p className="font-bold text-foreground block">
                              {cat.name}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              ID: {cat.id}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded border border-border text-foreground">
                          {cat.slug}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 text-xs text-muted-foreground max-w-xs truncate">
                        {cat.description || (
                          <span className="text-muted-foreground/60 italic">
                            No description provided
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenCategoryDialog(cat)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(cat)}
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Filters Tab Content */}
        <TabsContent value="filters" className="space-y-4 outline-none">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search filter groups by name, slug, or option tag..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-card border-border text-foreground w-full"
            />
          </div>

          {/* Filters Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow className="border-border">
                  <TableHead className="text-xs font-bold text-foreground">
                    Filter Group
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground">
                    Slug Identifier
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground">
                    Configured Option Badges
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-center">
                    Total Options
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="border-border">
                    <TableCell
                      colSpan={5}
                      className="h-36 text-center text-xs text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span>Loading product filters...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredFilters.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell
                      colSpan={5}
                      className="h-36 text-center text-xs text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <SlidersHorizontal className="h-12 w-12 text-muted-foreground/50" />
                        <h5 className="font-semibold text-foreground">
                          No filter groups found
                        </h5>
                        <p className="text-muted-foreground max-w-sm">
                          {filterSearch
                            ? `No filters match "${filterSearch}". Try a different search term.`
                            : "Create custom filter facets like Dietary, Occasion, or Size to help customers discover products."}
                        </p>
                        {!filterSearch && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenFilterDialog()}
                            className="mt-2 text-xs gap-1 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" /> Create Filter Group
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFilters.map((filt) => (
                    <TableRow
                      key={filt.id}
                      className="border-border hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <p className="font-bold text-foreground block">
                              {filt.name}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              ID: {filt.id}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded border border-border text-foreground">
                          {filt.slug}
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex flex-wrap items-center gap-1 max-w-md">
                          {filt.options.slice(0, 5).map((opt) => (
                            <Badge
                              key={opt}
                              variant="secondary"
                              className="text-[11px] font-medium bg-background border border-border text-foreground shadow-2xs"
                            >
                              {opt}
                            </Badge>
                          ))}
                          {filt.options.length > 5 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-muted-foreground border-border bg-muted/30"
                            >
                              +{filt.options.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
                          {filt.options.length}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenFilterDialog(filt)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                            title="Edit Filter Group"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFilter(filt)}
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            title="Delete Filter Group"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Category Modal */}
      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
      >
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="font-bold text-foreground">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Categories help organize your storefront products into sections.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Category Name *
              </Label>
              <Input
                placeholder="e.g. Pastries, Beverages, Electronics"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="h-9 text-xs bg-background border-border text-foreground"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Description (Optional)
              </Label>
              <Textarea
                placeholder="Brief summary or description for storefront customers..."
                value={categoryDesc}
                onChange={(e) => setCategoryDesc(e.target.value)}
                className="text-xs h-20 bg-background border-border text-foreground resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCategoryDialogOpen(false)}
                className="text-xs border-border bg-card hover:bg-muted text-foreground cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingCat}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1.5 shadow-xs cursor-pointer font-semibold"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isSubmittingCat
                  ? "Saving..."
                  : editingCategory
                    ? "Update Category"
                    : "Create Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filter Modal */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="font-bold text-foreground">
              {editingFilter ? "Edit Filter Group" : "Create New Filter Group"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define reusable product filters that appear in your store&apos;s
              navigation and catalog sidebar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveFilter} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Filter Group Name *
              </Label>
              <Input
                placeholder="e.g. Dietary, Occasion, Meal Time, Material"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="h-9 text-xs bg-background border-border text-foreground"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Filter Options (comma-separated) *
              </Label>
              <Input
                placeholder="e.g. Vegan, Gluten-Free, Halal, Nut-Free"
                value={filterOptionsStr}
                onChange={(e) => setFilterOptionsStr(e.target.value)}
                className="h-9 text-xs bg-background border-border text-foreground"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Separate each selectable tag with a comma.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFilterDialogOpen(false)}
                className="text-xs border-border bg-card hover:bg-muted text-foreground cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingFilter}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1.5 shadow-xs cursor-pointer font-semibold"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isSubmittingFilter
                  ? "Saving..."
                  : editingFilter
                    ? "Update Filter"
                    : "Create Filter Group"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
