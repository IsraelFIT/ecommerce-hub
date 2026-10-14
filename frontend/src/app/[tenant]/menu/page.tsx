import type { Metadata } from "next";
import { MenuHero } from "@/components/pages/menu/menu-hero";
import { MenuList } from "@/components/pages/menu/menu-list";
import { getTenantMeta } from "@/lib/api/server-tenant";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const { storeName, storeDescription } = await getTenantMeta(tenant);

  return {
    title: `Menu | ${storeName}`,
    description: storeDescription,
  };
}

export default function MenuPage() {
  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      {/* Menu Header / Hero */}
      <MenuHero />

      {/* Menu Categories List */}
      <MenuList />
    </div>
  );
}
