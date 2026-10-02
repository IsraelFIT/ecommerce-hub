import { CartView } from "@/components/pages/cart/cart-view";

export const metadata = {
  title: "Your Cart Studio | Cakes by Bode",
  description: "Review your custom custom cake orders.",
};

export default function CartPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <CartView />
    </div>
  );
}
