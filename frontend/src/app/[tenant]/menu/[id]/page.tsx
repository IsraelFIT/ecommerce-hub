import { notFound } from "next/navigation";
import { getProductById, getProductBySlug } from "@/lib/api/products";
import { ItemDetailsClient } from "@/components/pages/menu/item-details-client";
import { Product } from "@/types/products";

interface PageProps {
  params: Promise<{
    tenant: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { tenant, id } = await params;
  try {
    const res = await getProductById(id, tenant).catch(() => null);
    const product = res?.status === "success" ? res.data : null;

    if (!product) {
      const slugRes = await getProductBySlug(id, tenant).catch(() => null);
      const slugProduct = slugRes?.status === "success" ? slugRes.data : null;
      if (slugProduct) {
        return {
          title: `${slugProduct.name || slugProduct.title} | Menu`,
          description: slugProduct.description,
        };
      }
      return { title: "Item Not Found" };
    }

    return {
      title: `${product.name || product.title} | Menu`,
      description: product.description,
    };
  } catch {
    return { title: "Product | Menu" };
  }
}

export default async function MenuItemPage({ params }: PageProps) {
  const { tenant, id } = await params;

  let product: Product | null = null;

  try {
    const res = await getProductById(id, tenant);
    if (res.status === "success" && res.data) {
      product = res.data;
    }
  } catch {
    try {
      const slugRes = await getProductBySlug(id, tenant);
      if (slugRes.status === "success" && slugRes.data) {
        product = slugRes.data;
      }
    } catch {
      product = null;
    }
  }

  // Ensure full product data with all variants and options is fetched by product ID
  if (product?.id && product.id !== id) {
    try {
      const fullRes = await getProductById(product.id, tenant);
      if (fullRes.status === "success" && fullRes.data) {
        product = fullRes.data;
      }
    } catch (err) {
      console.warn("Could not refetch product by id:", err);
    }
  }

  if (!product) {
    notFound();
  }

  // Derive dynamic variants and pricing
  const variants =
    product.variants && product.variants.length > 0
      ? product.variants
      : [
          {
            id: `${product.id}-default`,
            sku: product.sku || "Standard",
            price: product.price ?? 0,
            compare_at_price: null,
            track_inventory: true,
            stock_quantity: product.inventory_count ?? 0,
            options: {},
          },
        ];

  const primaryVariant = variants[0];
  const primaryPrice = primaryVariant?.price ?? product.price ?? 0;

  const specs = product.specifications || {};

  const dietaryInfo =
    (typeof specs.dietary === "string" && specs.dietary) ||
    (typeof specs.allergens === "string" && specs.allergens) ||
    (typeof specs.material === "string" && specs.material) ||
    "";

  const allImages =
    product.images && product.images.length > 0
      ? product.images
      : ["/images/placeholder.jpg"];

  const adaptedItem = {
    id: product.id,
    name: product.name || product.title || "Product",
    category: (product.category || "General") as string,
    price: primaryPrice,
    compare_at_price: primaryVariant?.compare_at_price || null,
    currency: product.currency,
    image: allImages[0],
    images: allImages,
    description: product.description || "",
    longDescription: product.description || "",
    tags: Array.isArray(specs.tags) ? (specs.tags as string[]) : [],
    sizes: [],
    flavors: Array.isArray(specs.flavors) ? (specs.flavors as string[]) : [],
    allergenInfo: dietaryInfo,
    specifications: specs,
    variants: variants,
    product_class: product.product_class,
    sku: primaryVariant?.sku || product.sku || undefined,
    stock_quantity:
      primaryVariant?.stock_quantity ?? product.inventory_count ?? 0,
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <ItemDetailsClient item={adaptedItem} />
    </div>
  );
}
