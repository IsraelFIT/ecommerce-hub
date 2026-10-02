"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Trash2, Plus, Minus, CreditCard, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";

export function CartView() {
  const { items, updateQuantity, removeFromCart, getCartTotal } =
    useCartStore();
  const [shippingMethod, setShippingMethod] = useState<"pickup" | "delivery">(
    "pickup",
  );

  const subtotal = getCartTotal();
  const deliveryFee = shippingMethod === "delivery" ? 45 : 0; // White-Glove cake delivery is premium!
  const estTax = subtotal * 0.0825; // 8.25% NY tax
  const total = subtotal + deliveryFee + estTax;

  if (items.length === 0) {
    return (
      <div className="py-32 bg-stone-50 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-6">
          <ShoppingBagIcon />
        </div>
        <h2 className="font-serif text-3xl font-bold text-stone-950 mb-3">
          Your Cart Studio is Empty
        </h2>
        <p className="text-stone-500 text-sm max-w-sm leading-relaxed mb-8 font-light">
          You haven&apos;t added any celebration cakes or artisanal pastries
          yet. Let&apos;s design something sweet.
        </p>
        <Link href="/menu">
          <Button className="bg-stone-950 text-white font-bold tracking-wider hover:bg-stone-800 transition-colors uppercase h-12 px-8 rounded-none">
            Browse Menu
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-24 bg-stone-50 text-stone-900">
      <div className="container flex-col">
        {/* Title */}
        <div className="mb-12">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-wider text-xs font-bold mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Browsing
          </Link>
          <h1 className="font-serif font-medium text-stone-950 text-4xl md:text-5xl">
            Your Cart Studio
          </h1>
          <p className="text-stone-500 text-sm mt-2 font-light">
            Review your custom confections and choose delivery or studio pickup.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start w-full">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-2 flex flex-col gap-6 w-full">
            <div className="divide-y divide-stone-200 border-b border-stone-200">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="py-6 flex flex-col md:flex-row gap-6 items-start"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square w-24 h-24 bg-stone-100 shrink-0 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>

                  {/* Details */}
                  <div className="grow min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-serif text-lg font-bold text-stone-950">
                        {item.name}
                      </h3>
                      <span className="font-serif font-bold text-stone-950">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 mb-4 text-xs text-stone-500">
                      {item.size && (
                        <div>
                          <span className="font-semibold text-stone-700">
                            Size:
                          </span>{" "}
                          {item.size}
                        </div>
                      )}
                      {item.flavor && (
                        <div>
                          <span className="font-semibold text-stone-700">
                            Flavor:
                          </span>{" "}
                          {item.flavor}
                        </div>
                      )}
                      <div className="text-[10px] text-stone-400 font-bold mt-1">
                        UNIT PRICE: ${item.price.toFixed(2)}
                      </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between">
                      {/* Quantity selector */}
                      <div className="flex items-center justify-between border border-stone-200 bg-white w-28 h-8 px-2 select-none">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity - 1,
                              item.size,
                              item.flavor,
                            )
                          }
                          className="text-stone-500 hover:text-stone-900 transition-colors p-1"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1,
                              item.size,
                              item.flavor,
                            )
                          }
                          className="text-stone-500 hover:text-stone-900 transition-colors p-1"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() =>
                          removeFromCart(item.id, item.size, item.flavor)
                        }
                        className="text-stone-400 hover:text-rose-600 transition-colors flex items-center gap-1 text-xs"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Gift option helper banner */}
            <div className="flex items-start gap-4 p-5 bg-stone-100/50 border border-stone-200/50">
              <Gift className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold tracking-wider uppercase text-stone-900 mb-1">
                  Ordering as a Gift?
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed font-light">
                  Include a complimentary handwritten card. You will be prompted
                  to enter your message during the checkout process.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Summary Box */}
          <div className="bg-white border border-stone-200 p-8 flex flex-col w-full shadow-xs">
            <h3 className="font-serif text-xl font-bold text-stone-950 mb-6 border-b border-stone-200 pb-4">
              Studio Summary
            </h3>

            {/* Shipping selection tabs */}
            <div className="w-full mb-6">
              <h4 className="text-xs font-bold tracking-wider uppercase text-stone-500 mb-3">
                Fulfillment Mode
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShippingMethod("pickup")}
                  className={`py-3 text-center text-xs font-bold tracking-wide uppercase cursor-pointer border ${
                    shippingMethod === "pickup"
                      ? "border-stone-950 bg-stone-950 text-white"
                      : "border-stone-200 hover:border-stone-400 bg-white text-stone-700"
                  }`}
                >
                  Studio Pickup
                </button>
                <button
                  onClick={() => setShippingMethod("delivery")}
                  className={`py-3 text-center text-xs font-bold tracking-wide uppercase cursor-pointer border ${
                    shippingMethod === "delivery"
                      ? "border-stone-950 bg-stone-950 text-white"
                      : "border-stone-200 hover:border-stone-400 bg-white text-stone-700"
                  }`}
                >
                  White-Glove Delivery
                </button>
              </div>
            </div>

            {/* Summary figures */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex justify-between text-sm text-stone-500 font-light">
                <span>Items Subtotal</span>
                <span className="font-medium text-stone-950">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm text-stone-500 font-light">
                <span>Fulfillment Fee</span>
                {shippingMethod === "pickup" ? (
                  <span className="text-emerald-600 font-semibold uppercase text-xs tracking-wider">
                    Free Pickup
                  </span>
                ) : (
                  <span className="font-medium text-stone-950">$45.00</span>
                )}
              </div>

              <div className="flex justify-between text-sm text-stone-500 font-light">
                <span>Estimated Sales Tax</span>
                <span className="font-medium text-stone-950">
                  ${estTax.toFixed(2)}
                </span>
              </div>

              <div className="w-full h-px bg-stone-200 my-2" />

              <div className="flex justify-between items-baseline font-serif">
                <span className="text-base font-bold text-stone-950">
                  Grand Total
                </span>
                <span className="text-2xl font-bold text-stone-950">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout Link button */}
            <Link href="/checkout" className="w-full">
              <Button className="w-full bg-stone-950 text-white font-bold tracking-wider hover:bg-stone-800 transition-colors uppercase h-12 rounded-none gap-2 flex items-center justify-center cursor-pointer">
                <CreditCard className="h-5 w-5" />
                Proceed to Checkout
              </Button>
            </Link>

            {/* Pickup/delivery instructions */}
            <p className="text-[10px] text-stone-400 mt-4 leading-relaxed text-center">
              {shippingMethod === "pickup"
                ? "Pickup available Tuesday–Saturday at our studio. Select your time slot on the checkout page."
                : "White-Glove climate-controlled delivery is locked for the Tri-State area. Assembly included."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon helper
function ShoppingBagIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-shopping-bag"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
