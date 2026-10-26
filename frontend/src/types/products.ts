export type ProductClass = "physical" | "digital" | "service";

export interface ProductCategory {
  id: string;
  tenant_id?: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  display_order?: number;
  parent_id?: string | null;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  display_order?: number;
  parent_id?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  display_order?: number;
  parent_id?: string;
}

export interface ProductFilter {
  id: string;
  tenant_id?: string;
  name: string;
  slug: string;
  filter_type: "checkbox" | "pills" | "radio" | string;
  options: string[];
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFilterInput {
  name: string;
  slug?: string;
  filter_type?: "checkbox" | "pills" | "radio" | string;
  options: string[];
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateFilterInput {
  name?: string;
  slug?: string;
  filter_type?: string;
  options?: string[];
  is_active?: boolean;
  display_order?: number;
}

export interface ProductVariant {
  id: string;
  product_id?: string;
  tenant_id?: string;
  sku: string;
  price: number;
  compare_at_price?: number | null;
  track_inventory: boolean;
  stock_quantity: number;
  options?: Record<string, string | string[]>;
}

export interface ProductVariantInput {
  id?: string;
  sku: string;
  price: number;
  compare_at_price?: number | null;
  track_inventory: boolean;
  stock_quantity: number;
  options: Record<string, string | string[]>;
}

export interface Product {
  id: string;
  tenant_id?: string;
  name?: string;
  title?: string; // Backwards-compatible alias for name
  slug?: string;
  description?: string | null;
  product_class?: ProductClass;
  is_published?: boolean;
  specifications?: Record<string, unknown>; // Flexible JSONB metadata: { "author": "Tolkien", "brand": "Sony" }
  filters?: Record<string, string[]>; // Dynamic assigned filter values: { "dietary": ["Vegan", "Gluten-Free"], "occasion": ["Birthday"] }
  category_id?: string | null;
  category?: string | null;
  images: string[];
  availability?: "available" | "preorder" | string;
  variants?: ProductVariant[];

  // Backwards-compatible fields for components expecting flat attributes
  sku?: string | null;
  price?: number;
  currency?: string;
  inventory_count?: number;
  track_inventory?: boolean;
  sales?: number;
  created_at?: string;
  updated_at?: string;

  // Ratings and Likes
  average_rating?: number;
  reviews_count?: number;
  is_liked?: boolean;
  likes_count?: number;
}

export interface CreateProductInput {
  name?: string;
  title?: string;
  slug?: string;
  description?: string;
  product_class?: ProductClass;
  specifications?: Record<string, unknown>;
  filters?: Record<string, string[]>;
  category_id?: string;
  category?: string;
  images?: string[];
  availability?: "available" | "preorder" | string;
  is_published?: boolean;
  variants?: ProductVariantInput[];

  // Fallbacks
  sku?: string;
  price?: number;
  currency?: string;
  inventory_count?: number;
}

export interface UpdateProductInput {
  name?: string;
  title?: string;
  slug?: string;
  description?: string;
  product_class?: ProductClass;
  specifications?: Record<string, unknown>;
  filters?: Record<string, string[]>;
  category_id?: string;
  category?: string;
  images?: string[];
  availability?: "available" | "preorder" | string;
  is_published?: boolean;
  variants?: ProductVariantInput[];

  // Fallbacks
  sku?: string;
  price?: number;
  currency?: string;
  inventory_count?: number;
}

export interface ResolveImageUrlResponse {
  resolved_url: string;
  original_url: string;
  is_converted: boolean;
}
