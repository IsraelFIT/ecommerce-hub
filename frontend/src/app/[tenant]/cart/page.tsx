import type { Metadata } from "next";
import { CartView } from "@/components/pages/cart/cart-view";
import { getTenantMeta } from "@/lib/api/server-tenant";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const { storeName, storeDescription } = await getTenantMeta(tenant);

  return {
    title: `Cart | ${storeName}`,
    description: storeDescription,
  };
}

export default function CartPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <CartView />
    </div>
  );
}
