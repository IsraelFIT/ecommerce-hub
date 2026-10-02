import { MenuHero } from "@/components/pages/menu/menu-hero";
import { MenuList } from "@/components/pages/menu/menu-list";

export const metadata = {
  title: "Menu | Cakes by Bode",
  description:
    "Explore our collection of custom celebration cakes and pastries.",
};

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
