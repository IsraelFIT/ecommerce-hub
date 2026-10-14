"use client";

import { useState } from "react";
import {
  Sparkles,
  Cake,
  ChevronRight,
  Plus,
  Minus,
  Check,
  Send,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart";
import type { BespokeStorefrontProps } from "../index";
import Image from "next/image";

interface CakeTierOption {
  id: string;
  name: string;
  servings: string;
  basePrice: number;
  description: string;
}

interface FlavorOption {
  id: string;
  name: string;
  notes: string;
  tag: string;
  extraPrice: number;
}

const TIERS: CakeTierOption[] = [
  {
    id: "single",
    name: "Petite Luxe (1 Tier)",
    servings: "10-14 Guests",
    basePrice: 85,
    description:
      "Ideal for intimate birthdays, dinner parties & anniversaries.",
  },
  {
    id: "double",
    name: "Grand Gala (2 Tiers)",
    servings: "28-36 Guests",
    basePrice: 175,
    description:
      "Our signature silhouette for micro-weddings and celebrations.",
  },
  {
    id: "triple",
    name: "Royale Masterpiece (3 Tiers)",
    servings: "65-80 Guests",
    basePrice: 340,
    description: "Towering statement centerpiece with botanical sugar work.",
  },
];

const FLAVORS: FlavorOption[] = [
  {
    id: "pistachio-rose",
    name: "Sicilian Pistachio & Wild Rose",
    notes:
      "Roasted Bronte pistachios, organic Persian rosewater cream, raspberry reduction",
    tag: "Chef's Signature",
    extraPrice: 15,
  },
  {
    id: "madagascar-vanilla",
    name: "Madagascar Bourbon Bean & Salted Caramel",
    notes:
      "Slow-infused vanilla bean chiffon, Brittany sea salt caramel, Swiss meringue buttercream",
    tag: "Timeless Classic",
    extraPrice: 0,
  },
  {
    id: "valrhona-dark",
    name: "Valrhona 70% Guanaja & Espresso Ganache",
    notes:
      "Dark chocolate sponge soaked in cold-brew espresso with silken whipped ganache",
    tag: "Decadent",
    extraPrice: 10,
  },
  {
    id: "yuzu-earl-grey",
    name: "Kyoto Yuzu & Bergamot Earl Grey",
    notes:
      "Earl Grey infused genoise sponge, tangy Japanese yuzu curd, blossom honey glaze",
    tag: "Award Winning",
    extraPrice: 20,
  },
];

const ARTISANAL_SIGNATURES = [
  {
    id: "jazz-cake-1",
    name: "The Gilded Velvet Blossom",
    price: 195,
    category: "Wedding & Romance",
    servings: "30 Servings",
    image:
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80",
    description:
      "24k edible gold leaf leafing over ivory white chocolate ganache with cascading handcrafted sugar orchids.",
  },
  {
    id: "jazz-cake-2",
    name: "Opera Noir Nocturne",
    price: 145,
    category: "Gourmet Patisserie",
    servings: "16 Servings",
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80",
    description:
      "Layers of almond sponge cake soaked in coffee syrup, layered with ganache and coffee French buttercream.",
  },
  {
    id: "jazz-cake-3",
    name: "Botanical Meadow Symphony",
    price: 220,
    category: "Bespoke Art",
    servings: "40 Servings",
    image:
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80",
    description:
      "Pressed edible organic pansies and lavender sprigs set in crystal buttercream with lemon-verbena curd.",
  },
];

export function JazzCakesBespokeStorefront({
  storeName,
}: BespokeStorefrontProps) {
  const { addToCart } = useCartStore();

  // Interactive Builder State
  const [selectedTier, setSelectedTier] = useState<CakeTierOption>(TIERS[1]);
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorOption>(
    FLAVORS[0],
  );
  const [addGoldLeaf, setAddGoldLeaf] = useState(true);
  const [addFlowers, setAddFlowers] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);

  // Consultation form state
  const [consultName, setConsultName] = useState("");
  const [consultEmail, setConsultEmail] = useState("");
  const [consultDate, setConsultDate] = useState("");
  const [consultNotes, setConsultNotes] = useState("");
  const [isSubmittingConsult, setIsSubmittingConsult] = useState(false);

  const calculatedUnitPrice =
    selectedTier.basePrice +
    selectedFlavor.extraPrice +
    (addGoldLeaf ? 35 : 0) +
    (addFlowers ? 45 : 0);

  const totalPrice = calculatedUnitPrice * quantity;

  const handleAddCustomCakeToCart = () => {
    setIsOrdering(true);
    setTimeout(() => {
      addToCart(
        {
          id: `custom-cake-${Date.now()}`,
          name: `Bespoke ${selectedTier.name} — ${selectedFlavor.name}`,
          price: calculatedUnitPrice,
          image:
            "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80",
          description: `${selectedTier.name}, ${selectedFlavor.name} with bespoke finishes`,
          size: selectedTier.name,
          flavor: selectedFlavor.name,
        },
        quantity,
      );
      setIsOrdering(false);
      toast.success("Bespoke Creation Added to Bag!", {
        description: `${quantity}x ${selectedTier.name} (${selectedFlavor.name}) added to your celebration order.`,
      });
    }, 400);
  };

  const handleConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultName || !consultEmail) {
      toast.error("Please enter your name and email.");
      return;
    }
    setIsSubmittingConsult(true);
    setTimeout(() => {
      setIsSubmittingConsult(false);
      toast.success("VIP Tasting Request Received!", {
        description: `Thank you ${consultName}. Chef Jazz will contact you within 24 hours.`,
      });
      setConsultName("");
      setConsultEmail("");
      setConsultDate("");
      setConsultNotes("");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0d0907] text-[#fbf6f0] selection:bg-amber-600 selection:text-white font-sans antialiased">
      {/* 1. Bespoke Editorial Hero */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        {/* Ambient Warm Golden Glows */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-175 h-175 rounded-full bg-amber-600/15 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-orange-700/10 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />

        <div className="container relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Atelier Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-md mb-8 animate-fade-in">
            <Sparkles className="size-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-300">
              Haute Pâtisserie & Bespoke Cake Atelier
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl  font-extrabold tracking-tight text-balance leading-[1.08] text-white">
            Where Haute Pastry <br className="hidden sm:inline" />
            <span className="italic font-normal text-transparent bg-clip-text bg-linear-to-r from-amber-200 via-amber-400 to-yellow-600">
              Meets Modern Artistry
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-stone-300 font-light leading-relaxed text-balance">
            Every layer sculpted by hand. Sustainable organic ingredients,
            French techniques, and avant-garde designs tailored for life’s
            grandest milestones.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href="#customizer">
              <Button
                size="lg"
                className="h-14 px-8 rounded-full bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold uppercase tracking-wider text-xs shadow-xl shadow-amber-950/40 hover:scale-105 transition-all cursor-pointer"
              >
                Design Your Cake <ChevronRight className="ml-1 size-4" />
              </Button>
            </a>
            <a href="#tastings">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 rounded-full border-stone-700 bg-stone-900/60 hover:bg-stone-800 text-stone-200 hover:text-white font-semibold uppercase tracking-wider text-xs backdrop-blur-sm transition-all cursor-pointer"
              >
                Book Private Tasting
              </Button>
            </a>
          </div>

          {/* Stat Pillars */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-stone-800/80 w-full max-w-4xl text-left">
            <div>
              <p className="text-2xl sm:text-3xl  font-bold text-amber-300">
                100%
              </p>
              <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider">
                Organic Dairy & Botanicals
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl  font-bold text-amber-300">
                36 hrs
              </p>
              <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider">
                Slow Infusion & Sculpting
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl  font-bold text-amber-300">
                4.98 ★
              </p>
              <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider">
                Over 1,400 Reviews
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl  font-bold text-amber-300">
                White Glove
              </p>
              <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider">
                Refrigerated Venue Delivery
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Bespoke Cake Customizer */}
      <section
        id="customizer"
        className="py-24 px-4 sm:px-6 lg:px-8 bg-[#120d0a] border-y border-stone-800/80 relative"
      >
        <div className="container max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold font-mono">
              Live Atelier Studio
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl  font-bold text-white mt-2">
              Custom Cake Configurator
            </h2>
            <p className="text-stone-400 text-sm sm:text-base mt-3">
              Configure your bespoke centerpiece in real-time with instant
              pricing, tier options, and gourmet flavour pairings.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Step 1 & 2: Options Selection */}
            <div className="lg:col-span-7 space-y-8">
              {/* Tier Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold uppercase tracking-wider text-amber-200">
                    1. Select Structure & Scale
                  </Label>
                  <span className="text-xs text-stone-400">
                    Serving capacity
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TIERS.map((tier) => {
                    const isSelected = selectedTier.id === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTier(tier)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50"
                            : "border-stone-800 bg-stone-900/50 hover:border-stone-700 text-stone-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Cake
                            className={`size-4 ${isSelected ? "text-amber-400" : "text-stone-500"}`}
                          />
                          <span className="text-xs font-bold text-amber-300 font-mono">
                            ${tier.basePrice}
                          </span>
                        </div>
                        <p className="font-semibold text-sm text-white mt-2">
                          {tier.name}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                          {tier.servings}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flavor Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold uppercase tracking-wider text-amber-200">
                    2. Choose Signature Flavour Profile
                  </Label>
                  <span className="text-xs text-stone-400">
                    Crafted by master chocolatiers
                  </span>
                </div>
                <div className="space-y-2.5">
                  {FLAVORS.map((flavor) => {
                    const isSelected = selectedFlavor.id === flavor.id;
                    return (
                      <button
                        key={flavor.id}
                        type="button"
                        onClick={() => setSelectedFlavor(flavor)}
                        className={`w-full p-4 rounded-xl border text-left transition-all flex items-start justify-between gap-4 cursor-pointer ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50"
                            : "border-stone-800 bg-stone-900/50 hover:border-stone-700"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">
                              {flavor.name}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 border border-stone-700">
                              {flavor.tag}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 leading-relaxed">
                            {flavor.notes}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {flavor.extraPrice > 0 ? (
                            <span className="text-xs font-mono text-amber-400">
                              +${flavor.extraPrice}
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-stone-500">
                              Included
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Finishing Flourishes */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold uppercase tracking-wider text-amber-200">
                  3. Atelier Finishes & Botanical Accents
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setAddGoldLeaf(!addGoldLeaf)}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      addGoldLeaf
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-stone-800 bg-stone-900/50 hover:border-stone-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-5 rounded flex items-center justify-center border ${addGoldLeaf ? "bg-amber-500 border-amber-500 text-stone-950" : "border-stone-700"}`}
                      >
                        {addGoldLeaf && <Check className="size-3.5 stroke-3" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          24k Edible Gold Flakes
                        </p>
                        <p className="text-[11px] text-stone-400">
                          Hand-applied gilded accents
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-amber-400 font-semibold">
                      +$35
                    </span>
                  </label>

                  <label
                    onClick={() => setAddFlowers(!addFlowers)}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      addFlowers
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-stone-800 bg-stone-900/50 hover:border-stone-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-5 rounded flex items-center justify-center border ${addFlowers ? "bg-amber-500 border-amber-500 text-stone-950" : "border-stone-700"}`}
                      >
                        {addFlowers && <Check className="size-3.5 stroke-3" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          Organic Sugar Orchids
                        </p>
                        <p className="text-[11px] text-stone-400">
                          Handcrafted botanical blooms
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-amber-400 font-semibold">
                      +$45
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Live Order Summary Card */}
            <div className="lg:col-span-5 sticky top-24">
              <div className="rounded-2xl border border-stone-800 bg-linear-to-b from-stone-900 to-stone-950 p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                  <div>
                    <h3 className=" font-bold text-lg text-white">
                      Your Bespoke Creation
                    </h3>
                    <p className="text-xs text-stone-400">
                      Order Summary & Quotation
                    </p>
                  </div>
                  <span className="size-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sparkles className="size-4" />
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-stone-300">
                    <span>Base Tier ({selectedTier.name}):</span>
                    <span className="font-mono text-white font-medium">
                      ${selectedTier.basePrice}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-300">
                    <span>Flavour Pairing ({selectedFlavor.name}):</span>
                    <span className="font-mono text-white font-medium">
                      {selectedFlavor.extraPrice > 0
                        ? `+$${selectedFlavor.extraPrice}`
                        : "$0"}
                    </span>
                  </div>
                  {addGoldLeaf && (
                    <div className="flex justify-between text-stone-300">
                      <span>24k Edible Gold Leaf:</span>
                      <span className="font-mono text-white font-medium">
                        +$35
                      </span>
                    </div>
                  )}
                  {addFlowers && (
                    <div className="flex justify-between text-stone-300">
                      <span>Organic Sugar Orchids:</span>
                      <span className="font-mono text-white font-medium">
                        +$45
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                    <span className="text-stone-400 font-medium">Quantity</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="size-7 border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700 cursor-pointer"
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-8 text-center font-mono font-bold text-white text-sm">
                        {quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setQuantity(quantity + 1)}
                        className="size-7 border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700 cursor-pointer"
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-800 flex items-baseline justify-between">
                  <span className="text-sm font-semibold uppercase tracking-wider text-stone-300">
                    Total Price
                  </span>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-amber-400 font-mono">
                      ${totalPrice}
                    </span>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Includes atelier presentation box
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleAddCustomCakeToCart}
                  disabled={isOrdering}
                  className="w-full h-13 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-950/50 transition-all cursor-pointer"
                >
                  {isOrdering ? (
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="size-4 animate-spin" /> Adding to
                      Order...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Add Bespoke Cake to Bag • ${totalPrice}{" "}
                      <ArrowRight className="size-4" />
                    </span>
                  )}
                </Button>

                <p className="text-[11px] text-center text-stone-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-amber-500" />
                  White glove temperature-controlled delivery guaranteed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Signature Gallery Collection */}
      <section id="collection" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold font-mono">
                The Heritage Vault
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl  font-bold text-white mt-2">
                Celebrated Showpieces
              </h2>
            </div>
            <p className="text-stone-400 text-sm max-w-md">
              A curated selection of our most requested ceremonial cakes and
              fine patisserie creations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ARTISANAL_SIGNATURES.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-stone-800/80 bg-stone-900/40 overflow-hidden hover:border-amber-500/50 transition-all flex flex-col"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-stone-950">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-transparent to-transparent opacity-80" />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-stone-950/80 text-amber-300 border border-stone-800 backdrop-blur-md">
                    {item.category}
                  </span>
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-stone-950">
                    ${item.price}
                  </span>
                </div>

                <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                  <div>
                    <h3 className=" font-bold text-xl text-white group-hover:text-amber-300 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-800/60 flex items-center justify-between">
                    <span className="text-xs text-stone-400">
                      {item.servings}
                    </span>
                    <Button
                      onClick={() => {
                        addToCart({
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          image: item.image,
                          description: item.description,
                        });
                        toast.success(`${item.name} added to cart!`);
                      }}
                      className="rounded-full bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 text-xs font-semibold px-4 h-8 cursor-pointer transition-all"
                    >
                      Order Showpiece
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. VIP Tasting & Consultation Booking Form */}
      <section
        id="tastings"
        className="py-24 px-4 sm:px-6 lg:px-8 bg-[#140e0b] border-t border-stone-800 relative"
      >
        <div className="container max-w-4xl mx-auto">
          <div className="rounded-3xl border border-amber-500/20 bg-linear-to-b from-stone-900 to-stone-950 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] pointer-events-none" />

            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold font-mono">
                Private Appointment
              </span>
              <h2 className="text-3xl sm:text-4xl  font-bold text-white mt-2">
                Book a VIP Cake Tasting
              </h2>
              <p className="text-stone-400 text-xs sm:text-sm mt-2">
                Sample our seasonal flavor library with Chef Jazz. Complimentary
                for wedding couples and gala hosts.
              </p>
            </div>

            <form onSubmit={handleConsultSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-stone-300">
                    Your Full Name
                  </Label>
                  <Input
                    required
                    value={consultName}
                    onChange={(e) => setConsultName(e.target.value)}
                    placeholder="Lady Jacqueline Vance"
                    className="h-11 bg-stone-950 border-stone-800 text-stone-100 placeholder:text-stone-600 focus:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-stone-300">
                    Email Address
                  </Label>
                  <Input
                    required
                    type="email"
                    value={consultEmail}
                    onChange={(e) => setConsultEmail(e.target.value)}
                    placeholder="jacqueline@domain.com"
                    className="h-11 bg-stone-950 border-stone-800 text-stone-100 placeholder:text-stone-600 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-stone-300">
                    Event Date
                  </Label>
                  <Input
                    type="date"
                    value={consultDate}
                    onChange={(e) => setConsultDate(e.target.value)}
                    className="h-11 bg-stone-950 border-stone-800 text-stone-100 focus:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-stone-300">
                    Estimated Guest Count
                  </Label>
                  <Input
                    placeholder="e.g. 120 Guests"
                    className="h-11 bg-stone-950 border-stone-800 text-stone-100 placeholder:text-stone-600 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-stone-300">
                  Design Vision & Allergies
                </Label>
                <Textarea
                  rows={3}
                  value={consultNotes}
                  onChange={(e) => setConsultNotes(e.target.value)}
                  placeholder="Share details about your wedding palette, theme, or dietary preferences..."
                  className="bg-stone-950 border-stone-800 text-stone-100 placeholder:text-stone-600 focus:border-amber-500 text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmittingConsult}
                className="w-full h-13 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-950/50 transition-all cursor-pointer"
              >
                {isSubmittingConsult ? (
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="size-4 animate-spin" /> Scheduling
                    Tasting...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    Request Tasting Appointment <Send className="size-4" />
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* 5. Minimalist Footer */}
      <footer className="py-12 border-t border-stone-900 bg-stone-950 text-center text-xs text-stone-500">
        <p>
          © {new Date().getFullYear()} {storeName}. All rights reserved.
          Handcrafted with passion.
        </p>
        <p className="mt-1 text-[11px] text-stone-600">
          Powered by E-Commerce Multi-Tenant Hub
        </p>
      </footer>
    </div>
  );
}

export default JazzCakesBespokeStorefront;
