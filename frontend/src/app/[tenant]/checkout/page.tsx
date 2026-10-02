"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Calendar,
  Clock,
  MapPin,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCartStore();

  // Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [fulfillmentType, setFulfillmentType] = useState<"pickup" | "delivery">(
    "pickup",
  );
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [giftMessage, setGiftMessage] = useState("");

  // Checkout Success Modal State
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const subtotal = getCartTotal();
  const deliveryFee = fulfillmentType === "delivery" ? 45 : 0;
  const estTax = subtotal * 0.0825;
  const total = subtotal + deliveryFee + estTax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    if (!firstName || !lastName || !email || !phone || !date || !timeSlot) {
      toast.error("Please fill in all contact and timing information.");
      return;
    }

    if (fulfillmentType === "delivery" && (!address || !city || !zip)) {
      toast.error("Please fill in your delivery address.");
      return;
    }

    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
      toast.error("Please complete the payment details.");
      return;
    }

    // Success simulation
    const generatedOrderNum = `CB-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderNumber(generatedOrderNum);
    setIsSuccess(true);
    toast.success("Order placed successfully!");
  };

  const handleCloseSuccess = () => {
    clearCart();
    setIsSuccess(false);
    router.push("/");
  };

  // If cart is empty and not checked out, show redirect button
  if (items.length === 0 && !isSuccess) {
    return (
      <div className="py-32 bg-stone-50 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <h2 className="font-serif text-3xl font-bold text-stone-950 mb-3">
          No Items to Checkout
        </h2>
        <p className="text-stone-500 text-sm max-w-sm leading-relaxed mb-8 font-light">
          Your cart is empty. Please add confections from our menu before
          checking out.
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
    <div className="py-24 bg-stone-50 text-stone-900 min-h-screen relative">
      <div className="container flex-col">
        {/* Header navigation */}
        <div className="mb-12">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-wider text-xs font-bold mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
          <h1 className="font-serif font-medium text-stone-950 text-4xl md:text-5xl">
            Secure Checkout
          </h1>
          <p className="text-stone-500 text-sm mt-2 font-light">
            Enter your fulfillment timeline, billing coordinates, and gift
            options below.
          </p>
        </div>

        {/* Success Modal Overlay */}
        {isSuccess && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full p-8 md:p-12 text-center rounded-none shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle className="h-16 w-16 text-emerald-600 mb-6" />

              <h2 className="font-serif text-3xl font-bold text-stone-950 mb-2">
                Order Confirmed!
              </h2>
              <p className="text-xs text-primary font-bold tracking-wider uppercase mb-6">
                Order Number: {orderNumber}
              </p>

              <div className="w-full bg-stone-100 p-6 mb-8 text-left text-xs font-light text-stone-600 flex flex-col gap-2">
                <p>
                  <span className="font-semibold text-stone-900">Client:</span>{" "}
                  {firstName} {lastName}
                </p>
                <p>
                  <span className="font-semibold text-stone-900">Email:</span>{" "}
                  {email}
                </p>
                <p>
                  <span className="font-semibold text-stone-900">Method:</span>{" "}
                  {fulfillmentType === "pickup"
                    ? "Studio Pickup"
                    : "White-Glove Delivery"}
                </p>
                <p>
                  <span className="font-semibold text-stone-900">
                    Schedule:
                  </span>{" "}
                  {date} at {timeSlot}
                </p>
                {fulfillmentType === "delivery" && (
                  <p>
                    <span className="font-semibold text-stone-900">
                      Address:
                    </span>{" "}
                    {address}, {city}, {zip}
                  </p>
                )}
                <div className="border-t border-stone-200 mt-3 pt-3 flex justify-between font-serif text-sm font-bold text-stone-950">
                  <span>Amount Charged</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-xs text-stone-500 mb-8 leading-relaxed">
                Thank you for choosing Cakes by Bode. We have sent a receipt
                with design details and schedule slots to your email address.
              </p>

              <Button
                onClick={handleCloseSuccess}
                className="w-full bg-stone-950 text-white font-bold tracking-wider hover:bg-stone-800 transition-colors uppercase h-12 rounded-none cursor-pointer"
              >
                Return to Studio Home
              </Button>
            </div>
          </div>
        )}

        {/* Main Columns Grid */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start w-full"
        >
          {/* Left Columns: Checkout Fields */}
          <div className="lg:col-span-2 flex flex-col gap-8 w-full">
            {/* 1. Client details */}
            <div className="bg-white border border-stone-200 p-8 shadow-xs">
              <h3 className="font-serif text-xl font-bold text-stone-950 mb-6 pb-2 border-b border-stone-100 flex items-center gap-2">
                <span className="inline-flex w-6 h-6 rounded-full bg-stone-100 text-stone-700 items-center justify-center text-xs font-bold">
                  1
                </span>
                Contact Coordinates
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="firstName"
                    className="text-xs font-bold uppercase tracking-wider text-stone-500"
                  >
                    First Name
                  </Label>
                  <Input
                    type="text"
                    id="firstName"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-10 px-4 border border-stone-200 focus:border-stone-950 rounded-none bg-stone-50/50 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="lastName"
                    className="text-xs font-bold uppercase tracking-wider text-stone-500"
                  >
                    Last Name
                  </Label>
                  <Input
                    type="text"
                    id="lastName"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-10 px-4 border border-stone-200 focus:border-stone-950 rounded-none bg-stone-50/50 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-bold uppercase tracking-wider text-stone-500"
                  >
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 px-4 border border-stone-200 focus:border-stone-950 rounded-none bg-stone-50/50 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="phone"
                    className="text-xs font-bold uppercase tracking-wider text-stone-500"
                  >
                    Phone Number
                  </Label>
                  <Input
                    type="tel"
                    id="phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10 px-4 border border-stone-200 focus:border-stone-950 rounded-none bg-stone-50/50 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 2. Fulfillment selection */}
            <div className="bg-white border border-stone-200 p-8 shadow-xs">
              <h3 className="font-serif text-xl font-bold text-stone-950 mb-6 pb-2 border-b border-stone-100 flex items-center gap-2">
                <span className="inline-flex w-6 h-6 rounded-full bg-stone-100 text-stone-700 items-center justify-center text-xs font-bold">
                  2
                </span>
                Fulfillment Logistics
              </h3>

              {/* Selector */}
              <div className="flex gap-4 p-2 bg-stone-100 mb-6">
                <button
                  type="button"
                  onClick={() => setFulfillmentType("pickup")}
                  className={`flex-1 py-3 text-center text-xs font-bold tracking-wide uppercase cursor-pointer flex items-center justify-center gap-2 ${
                    fulfillmentType === "pickup"
                      ? "bg-white text-stone-950 shadow-xs"
                      : "text-stone-500 hover:text-stone-950"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  Studio Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentType("delivery")}
                  className={`flex-1 py-3 text-center text-xs font-bold tracking-wide uppercase cursor-pointer flex items-center justify-center gap-2 ${
                    fulfillmentType === "delivery"
                      ? "bg-white text-stone-950 shadow-xs"
                      : "text-stone-500 hover:text-stone-950"
                  }`}
                >
                  <Truck className="h-4 w-4" />
                  White-Glove Delivery
                </button>
              </div>

              {/* Delivery Address fields */}
              {fulfillmentType === "delivery" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="flex flex-col gap-2 md:col-span-3">
                    <Label
                      htmlFor="address"
                      className="text-xs font-bold uppercase tracking-wider text-stone-500"
                    >
                      Street Address
                    </Label>
                    <Input
                      type="text"
                      id="address"
                      required={fulfillmentType === "delivery"}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-10 px-4 border border-stone-200 focus:border-stone-950 rounded-none bg-stone-50/50 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label
                      htmlFor="city"
                      className="text-xs font-bold uppercase tracking-wider text-stone-500"
                    >
                      City
                    </Label>
                    <Input
                      type="text"
                      id="city"
                      required={fulfillmentType === "delivery"}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-10 px-4 border border-stone-200 focus:border-stone-950 rounded-none bg-stone-50/50 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="zip"
                      className="text-xs font-bold uppercase tracking-wider text-stone-500"
                    >
                      Zip Code
                    </Label>
                    <Input
                      type="text"
                      id="zip"
                      required={fulfillmentType === "delivery"}
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="h-10 px-4 border border-stone-200 focus:border-stone-950 rounded-none bg-stone-50/50 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 p-4 border border-stone-200 mb-6 text-stone-600 text-xs leading-relaxed font-light">
                  <p className="font-semibold text-stone-950 mb-1">
                    Pickup Location:
                  </p>
                  <p>Cakes by Bode Studio</p>
                  <p>742 Designer Row, New York, NY 10011</p>
                  <p className="mt-2 text-[10px] text-stone-400">
                    Available: Tuesday–Saturday, 10:00 – 18:00
                  </p>
                </div>
              )}

              {/* Date & Time slots (Very crucial for cakes!) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="date"
                    className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Date Needed
                  </Label>
                  <Input
                    type="date"
                    id="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-10 px-4 border border-stone-200 focus:border-stone-950 rounded-none bg-stone-50/50 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="timeSlot"
                    className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1"
                  >
                    <Clock className="h-3.5 w-3.5" /> Delivery / Collection Time
                  </Label>
                  <Select value={timeSlot} onValueChange={setTimeSlot}>
                    <SelectTrigger className="w-full h-10 px-4 border border-stone-200 rounded-none text-sm bg-white">
                      <SelectValue placeholder="Select a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10:00 AM - 12:00 PM">
                        Morning (10:00 AM - 12:00 PM)
                      </SelectItem>
                      <SelectItem value="12:00 PM - 02:00 PM">
                        Midday (12:00 PM - 02:00 PM)
                      </SelectItem>
                      <SelectItem value="02:00 PM - 04:00 PM">
                        Afternoon (02:00 PM - 04:00 PM)
                      </SelectItem>
                      <SelectItem value="04:00 PM - 06:00 PM">
                        Late Afternoon (04:00 PM - 06:00 PM)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 3. Payment Details */}
            <div className="bg-white border border-stone-200 p-8 shadow-xs">
              <h3 className="font-serif text-xl font-bold text-stone-950 mb-6 pb-2 border-b border-stone-100 flex items-center gap-2">
                <span className="inline-flex w-6 h-6 rounded-full bg-stone-100 text-stone-700 items-center justify-center text-xs font-bold">
                  3
                </span>
                Secure Payment Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex flex-col gap-2 md:col-span-4">
                  <Label
                    htmlFor="cardName"
                    className="text-xs font-bold uppercase tracking-wider text-stone-500"
                  >
                    Name on Card
                  </Label>
                  <Input
                    type="text"
                    id="cardName"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe"
                    className="h-10 px-4 border border-stone-200 focus:border-stone-950 rounded-none bg-stone-50/50 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label
                    htmlFor="cardNumber"
                    className="text-xs font-bold uppercase tracking-wider text-stone-500"
                  >
                    Card Number
                  </Label>
                  <Input
                    type="text"
                    id="cardNumber"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="•••• •••• •••• ••••"
                    maxLength={16}
                    className="h-10 px-4 border border-stone-200 focus:border-stone-950 rounded-none bg-stone-50/50 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="cardExpiry"
                    className="text-xs font-bold uppercase tracking-wider text-stone-500"
                  >
                    Expiration
                  </Label>
                  <Input
                    type="text"
                    id="cardExpiry"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="h-10 px-4 border border-stone-200 focus:border-stone-950 rounded-none bg-stone-50/50 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="cardCvv"
                    className="text-xs font-bold uppercase tracking-wider text-stone-500"
                  >
                    CVV
                  </Label>
                  <Input
                    type="text"
                    id="cardCvv"
                    required
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="•••"
                    maxLength={3}
                    className="h-10 px-4 border border-stone-200 focus:border-stone-950 rounded-none bg-stone-50/50 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Gift Options */}
            <div className="bg-white border border-stone-200 p-8 shadow-xs">
              <h3 className="font-serif text-xl font-bold text-stone-950 mb-4 pb-2 border-b border-stone-100">
                Gift Message & Custom Requests (Optional)
              </h3>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="giftMessage"
                  className="text-xs font-bold uppercase tracking-wider text-stone-500"
                >
                  Message for Complimentary Card
                </Label>
                <Textarea
                  id="giftMessage"
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="E.g., 'Happy Anniversary Sarah! With love, Mark.' or write any special instructions for cake presentation..."
                  rows={4}
                  className="p-4 border border-stone-200 focus:border-stone-950 rounded-none bg-stone-50/50 text-sm resize-y"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Summary Box */}
          <div className="bg-white border border-stone-200 p-8 flex flex-col w-full shadow-xs sticky top-24">
            <h3 className="font-serif text-xl font-bold text-stone-950 mb-6 border-b border-stone-200 pb-4">
              Consultation Cart
            </h3>

            {/* Items Summary list */}
            <div className="flex flex-col gap-4 mb-6 max-h-60 overflow-y-auto no-scrollbar">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="relative aspect-square w-12 h-12 bg-stone-100 shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0 grow text-xs">
                    <h4 className="font-bold text-stone-950 truncate">
                      {item.name}
                    </h4>
                    <p className="text-stone-400 font-medium">
                      Qty: {item.quantity} • {item.size}
                    </p>
                  </div>
                  <span className="font-serif font-bold text-xs text-stone-950 shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="w-full h-px bg-stone-200 mb-6" />

            {/* Summary figures */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex justify-between text-sm text-stone-500 font-light">
                <span>Subtotal</span>
                <span className="font-medium text-stone-950">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm text-stone-500 font-light">
                <span>Fulfillment Fee</span>
                {fulfillmentType === "pickup" ? (
                  <span className="text-emerald-600 font-semibold uppercase text-xs tracking-wider">
                    Free Pickup
                  </span>
                ) : (
                  <span className="font-medium text-stone-950">$45.00</span>
                )}
              </div>

              <div className="flex justify-between text-sm text-stone-500 font-light">
                <span>Sales Tax (8.25%)</span>
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

            {/* Place Order CTA button */}
            <Button
              type="submit"
              className="w-full bg-stone-950 text-white font-bold tracking-wider hover:bg-stone-800 transition-colors uppercase h-12 rounded-none gap-2 flex items-center justify-center cursor-pointer"
            >
              <CreditCard className="h-5 w-5" />
              Place Order & Book Date
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
