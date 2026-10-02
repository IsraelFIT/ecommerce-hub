"use client";

import { useState, use } from "react";
import { Package, Plus, Search, Percent, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUserStore } from "@/store/user";
import { Badge } from "@/components/ui/badge";

interface ProductsPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "low_stock";
  sales: number;
}

export default function TenantProductsPage({ params }: ProductsPageProps) {
  const unwrappedParams = use(params);
  const tenantSlug = unwrappedParams.tenant || "store";
  const { user } = useUserStore();

  const formattedStoreName =
    user?.tenant_name ||
    tenantSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Products State
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: "prod-1",
      name: "Minimalist Leather Travel Backpack",
      sku: "SKU-BP-001",
      category: "Fashion & Apparel",
      price: 149.0,
      stock: 34,
      status: "active",
      sales: 128,
    },
    {
      id: "prod-2",
      name: "Studio Wireless Noise-Cancelling Headphones",
      sku: "SKU-HP-002",
      category: "Tech & Electronics",
      price: 299.0,
      stock: 12,
      status: "active",
      sales: 64,
    },
    {
      id: "prod-3",
      name: "Ceramic Matte Artisan Coffee Mug",
      sku: "SKU-MUG-003",
      category: "Home & Living",
      price: 28.0,
      stock: 4,
      status: "low_stock",
      sales: 312,
    },
    {
      id: "prod-4",
      name: "Tactile Mechanical Desk Keyboard (RGB)",
      sku: "SKU-KB-004",
      category: "Tech & Electronics",
      price: 185.0,
      stock: 22,
      status: "active",
      sales: 95,
    },
    {
      id: "prod-5",
      name: "Organic Botanical Face Serum 50ml",
      sku: "SKU-SRM-005",
      category: "Health & Beauty",
      price: 45.0,
      stock: 0,
      status: "draft",
      sales: 42,
    },
  ]);

  // Filters
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;

  const handleSearchChange = (val: string) => {
    setProductSearch(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val);
    setCurrentPage(1);
  };

  // New Product Form
  const [newProdName, setNewProdName] = useState("");
  const [newProdSku, setNewProdSku] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("General Retail");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdStock, setNewProdStock] = useState("");

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice || !newProdStock) {
      toast.error("Please fill in required product details");
      return;
    }

    const priceNum = parseFloat(newProdPrice);
    const stockNum = parseInt(newProdStock, 10);

    const newProduct: ProductItem = {
      id: `prod-${Date.now()}`,
      name: newProdName.trim(),
      sku: newProdSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      category: newProdCategory,
      price: priceNum,
      stock: stockNum,
      status: stockNum > 0 ? "active" : "draft",
      sales: 0,
    };

    setProducts([newProduct, ...products]);
    toast.success(
      `Product "${newProdName}" published to ${formattedStoreName}!`,
    );
    setIsAddProductOpen(false);
    setNewProdName("");
    setNewProdSku("");
    setNewProdPrice("");
    setNewProdStock("");
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    toast.success("Product removed from catalog");
  };

  const handleToggleProductStatus = (id: string) => {
    setProducts(
      products.map((p) => {
        if (p.id === id) {
          const nextStatus = p.status === "active" ? "draft" : "active";
          return { ...p, status: nextStatus };
        }
        return p;
      }),
    );
    toast.success("Product visibility updated");
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 w-full">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-stone-400 z-10 pointer-events-none" />
            <Input
              placeholder="Search product title or SKU..."
              value={productSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <Select
            value={categoryFilter}
            onValueChange={(val) => handleCategoryChange(val)}
          >
            <SelectTrigger className="h-9 w-40 text-xs bg-white border-stone-200 text-stone-700">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Fashion & Apparel">
                Fashion & Apparel
              </SelectItem>
              <SelectItem value="Tech & Electronics">
                Tech & Electronics
              </SelectItem>
              <SelectItem value="Home & Living">Home & Living</SelectItem>
              <SelectItem value="Health & Beauty">Health & Beauty</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
          <DialogTrigger asChild>
            <Button
              size="md"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Product</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-white p-6 rounded-2xl border border-stone-200">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-stone-900">
                Add New Product
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Publish a new item directly to your{" "}
                <span className="font-semibold text-emerald-600">
                  {tenantSlug}
                </span>{" "}
                storefront catalog.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateProduct} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Product Title *
                </Label>
                <Input
                  placeholder="e.g. Signature Blend Roasted Beans 500g"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">
                    SKU Code
                  </Label>
                  <Input
                    placeholder="e.g. SKU-CF-009"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">
                    Category
                  </Label>
                  <Select
                    value={newProdCategory}
                    onValueChange={setNewProdCategory}
                  >
                    <SelectTrigger className="w-full h-9 rounded-lg border border-stone-200 bg-white px-3 text-xs text-stone-800">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General Retail">
                        General Retail
                      </SelectItem>
                      <SelectItem value="Fashion & Apparel">
                        Fashion & Apparel
                      </SelectItem>
                      <SelectItem value="Tech & Electronics">
                        Tech & Electronics
                      </SelectItem>
                      <SelectItem value="Home & Living">
                        Home & Living
                      </SelectItem>
                      <SelectItem value="Health & Beauty">
                        Health & Beauty
                      </SelectItem>
                      <SelectItem value="Artisanal Foods">
                        Artisanal Foods
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">
                    Price ($ USD) *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="49.99"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">
                    Initial Stock Quantity *
                  </Label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-stone-50 border border-stone-200/80 p-3 text-[11px] text-stone-600 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                  <Percent className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Automatic Split Settlement</span>
                </div>
                <p>
                  On sale, 97.5% is instantly deposited to your merchant bank
                  account; 2.5% platform fee is settled automatically.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsAddProductOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="md"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  Publish Product
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-stone-200/90 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-stone-50 border-b border-stone-200/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="p-4 text-xs font-medium text-stone-500">
                Product Details
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-stone-500">
                SKU
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-stone-500">
                Category
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-stone-500">
                Price
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-stone-500">
                Inventory
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-stone-500">
                Sales
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-stone-500">
                Status
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-stone-500 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-stone-100">
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="p-8 text-center text-stone-400"
                >
                  No products found matching your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((p) => (
                  <TableRow
                    key={p.id}
                    className="hover:bg-stone-50/60 transition-colors"
                  >
                    <TableCell className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">
                            {p.name}
                          </div>
                          <div className="text-xs text-stone-400">
                            ID: {p.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 text-stone-600">
                      {p.sku}
                    </TableCell>
                    <TableCell className="p-4 text-stone-600">
                      {p.category}
                    </TableCell>
                    <TableCell className="p-4 font-bold text-stone-900">
                      ${p.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-4">
                      <Badge
                        className={`font-semibold text-xs bg-transparent border border-input ${
                          p.stock === 0
                            ? "text-red-600"
                            : p.stock < 10
                              ? "text-amber-600"
                              : "text-stone-700"
                        }`}
                      >
                        {p.stock} in stock
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4 text-stone-600 text-xs">
                      {p.sales} units
                    </TableCell>
                    <TableCell className="p-4">
                      <Badge
                        onClick={() => handleToggleProductStatus(p.id)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-transform cursor-pointer capitalize ${
                          p.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : p.status === "low_stock"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-stone-100 text-stone-600 border border-stone-200"
                        }`}
                      >
                        <span
                          className={`text-xs ${p.status === "active" ? "text-emerald-600" : p.status === "low_stock" ? "text-amber-600" : "text-stone-600"}`}
                        >
                          {p.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleProductStatus(p.id)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Toggle Visibility"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {filteredProducts.length > 0 && (
          <div className="p-4 border-t border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-stone-500">
            <span className="">
              Showing{" "}
              {Math.min(
                (currentPage - 1) * pageSize + 1,
                filteredProducts.length,
              )}{" "}
              to {Math.min(currentPage * pageSize, filteredProducts.length)} of{" "}
              {filteredProducts.length} items
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
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from(
                  {
                    length: Math.ceil(filteredProducts.length / pageSize) || 1,
                  },
                  (_, idx) => (
                    <PaginationItem key={idx + 1}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === idx + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(idx + 1);
                        }}
                        className="cursor-pointer text-xs"
                      >
                        {idx + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (
                        currentPage <
                        Math.ceil(filteredProducts.length / pageSize)
                      )
                        setCurrentPage(currentPage + 1);
                    }}
                    className={
                      currentPage >=
                      Math.ceil(filteredProducts.length / pageSize)
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
    </div>
  );
}
