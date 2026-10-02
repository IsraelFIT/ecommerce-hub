"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuItem } from "@/constants/menu";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";

interface ItemDetailsClientProps {
  item: MenuItem;
}

export function ItemDetailsClient({ item }: ItemDetailsClientProps) {
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [selectedFlavor, setSelectedFlavor] = useState(item.flavors[0]);
  const [quantity, setQuantity] = useState(1);
  const addToCart = useCartStore((state) => state.addToCart);
  const router = useRouter();

  // Parse size name and price from size string
  // Format is: "6-inch (12 Servings) - $85"
  const parseSizeDetails = (sizeStr: string) => {
    const parts = sizeStr.split(" - $");
    const name = parts[0];
    const price = parts[1] ? parseFloat(parts[1]) : item.price;
    return { name, price };
  };

  const currentSizeDetails = parseSizeDetails(item.sizes[selectedSizeIdx]);

  const handleAdd = () => {
    const cartItem = {
      id: item.id,
      name: item.name,
      price: currentSizeDetails.price,
      image: item.image,
      description: item.description,
      size: currentSizeDetails.name,
      flavor: selectedFlavor,
    };

    addToCart(cartItem, quantity);

    toast.success(`Added ${quantity}x ${item.name} to cart!`, {
      description: `${currentSizeDetails.name} • ${selectedFlavor}`,
      action: {
        label: "View Cart",
        onClick: () => router.push("/cart"),
      },
    });
  };

  return (
    <div className="py-24 bg-stone-50">
      <div className="container flex-col">
        {/* Back Link */}
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-wider text-xs font-bold mb-12"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu
        </Link>

        {/* Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left Column: Image & Info */}
          <div className="flex flex-col gap-8 w-full">
            <div className="relative aspect-square w-full bg-stone-100 overflow-hidden shadow-sm">
              <Image
                src={item.image}
                alt={item.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Allergen Card */}
            <div className="bg-stone-100/60 border border-stone-200/50 p-6 rounded-lg">
              <h4 className="font-serif font-bold text-stone-900 mb-2">
                Dietary & Allergen Information
              </h4>
              <p className="text-stone-500 text-sm font-light leading-relaxed">
                {item.allergenInfo}
              </p>
            </div>
          </div>

          {/* Right Column: Customization & Cart Action */}
          <div className="flex flex-col items-start w-full">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3">
              {item.category}
            </span>

            <h1 className="font-serif font-medium text-stone-950 text-4xl md:text-5xl lg:text-6xl mb-4 leading-tight">
              {item.name}
            </h1>

            {/* Price tag */}
            <div className="text-3xl font-serif font-bold text-stone-950 mb-6">
              ${(currentSizeDetails.price * quantity).toFixed(2)}
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-stone-200 mb-6" />

            <p className="text-stone-600 text-base leading-relaxed font-light mb-8">
              {item.longDescription}
            </p>

            {/* SIZE SELECTION */}
            <div className="w-full mb-6">
              <h4 className="text-xs font-bold tracking-wider uppercase text-stone-500 mb-3">
                Select Size & Serving
              </h4>
              <div className="flex flex-col gap-2">
                {item.sizes.map((sizeStr, idx) => {
                  const details = parseSizeDetails(sizeStr);
                  const isSelected = selectedSizeIdx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedSizeIdx(idx)}
                      className={`w-full text-left px-5 py-4 border rounded-none flex justify-between items-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-stone-950 bg-stone-950 text-white"
                          : "border-stone-200 hover:border-stone-400 bg-white text-stone-800"
                      }`}
                    >
                      <span className="text-sm font-semibold">
                        {details.name}
                      </span>
                      <span className="text-sm font-bold">
                        ${details.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FLAVOR SELECTION */}
            <div className="w-full mb-8">
              <h4 className="text-xs font-bold tracking-wider uppercase text-stone-500 mb-3">
                Select Sponge & Buttercream Flavor
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {item.flavors.map((flavor, idx) => {
                  const isSelected = selectedFlavor === flavor;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedFlavor(flavor)}
                      className={`text-left px-5 py-3 border text-sm transition-all cursor-pointer ${
                        isSelected
                          ? "border-stone-950 bg-stone-950 text-white"
                          : "border-stone-200 hover:border-stone-400 bg-white text-stone-800"
                      }`}
                    >
                      {flavor}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QUANTITY AND ADD BUTTON */}
            <div className="w-full flex flex-col md:flex-row gap-4 items-stretch mb-8">
              {/* Quantity Counter */}
              <div className="flex items-center justify-between border border-stone-200 bg-white w-full md:w-36 h-12 px-4 select-none">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-stone-500 hover:text-stone-950 transition-colors p-1"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-stone-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-stone-500 hover:text-stone-950 transition-colors p-1"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Add To Cart Button */}
              <Button
                onClick={handleAdd}
                className="grow bg-stone-950 text-white font-bold tracking-wider hover:bg-stone-800 transition-colors uppercase h-12 rounded-none gap-2 flex items-center justify-center cursor-pointer"
              >
                <ShoppingBag className="h-5 w-5" />
                Add to Cart Studio
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
