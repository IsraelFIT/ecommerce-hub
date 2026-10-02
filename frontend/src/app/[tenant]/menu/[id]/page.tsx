import { notFound } from "next/navigation";
import { MENU_ITEMS } from "@/constants/menu";
import { ItemDetailsClient } from "@/components/pages/menu/item-details-client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const item = MENU_ITEMS.find((m) => m.id === id);

  if (!item) return { title: "Item Not Found | Cakes by Bode" };

  return {
    title: `${item.name} | Cakes by Bode`,
    description: item.description,
  };
}

export default async function MenuItemPage({ params }: PageProps) {
  const { id } = await params;
  const item = MENU_ITEMS.find((m) => m.id === id);

  if (!item) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <ItemDetailsClient item={item} />
    </div>
  );
}

// Generate static params for all known items for optimization
export async function generateStaticParams() {
  return MENU_ITEMS.map((item) => ({
    id: item.id,
  }));
}
