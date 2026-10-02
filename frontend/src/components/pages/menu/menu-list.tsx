"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Grid, List } from "lucide-react";
import { MENU_ITEMS, MenuItem } from "@/constants/menu";

export function MenuList() {
  const [activeFilters, setActiveFilters] = useState<("V" | "VE" | "GF")[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Group menu items by category
  const categories: {
    name: MenuItem["category"];
    subtitle: string;
    code: string;
  }[] = [
    {
      name: "Celebration Cakes",
      subtitle: "Sculptural tiered centerpieces",
      code: "01",
    },
    {
      name: "Pastries",
      subtitle: "French classics with a modern touch",
      code: "02",
    },
    {
      name: "Dessert Cups & Small Bites",
      subtitle: "Delicate creations for dessert tables",
      code: "03",
    },
  ];

  const toggleFilter = (tag: "V" | "VE" | "GF") => {
    setActiveFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <section className="py-16 md:py-24 bg-stone-50">
      <div className="container flex-col">
        {/* Legends / Tag Filters display */}
        <div className="w-full flex flex-wrap items-center justify-between gap-6 px-6 py-5 rounded-lg bg-stone-200/50 border border-stone-200/50 mb-16">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => toggleFilter("V")}
              className={`flex items-center gap-2 text-xs md:text-sm font-semibold px-4 py-2 rounded-full border transition-all cursor-pointer select-none ${
                activeFilters.includes("V")
                  ? "bg-stone-950 text-white border-stone-950"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-sm font-bold text-[10px] ${
                  activeFilters.includes("V")
                    ? "bg-stone-800 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                V
              </span>
              Vegetarian
            </button>

            <button
              onClick={() => toggleFilter("VE")}
              className={`flex items-center gap-2 text-xs md:text-sm font-semibold px-4 py-2 rounded-full border transition-all cursor-pointer select-none ${
                activeFilters.includes("VE")
                  ? "bg-stone-950 text-white border-stone-950"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-sm font-bold text-[10px] ${
                  activeFilters.includes("VE")
                    ? "bg-stone-800 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                VE
              </span>
              Vegan
            </button>

            <button
              onClick={() => toggleFilter("GF")}
              className={`flex items-center gap-2 text-xs md:text-sm font-semibold px-4 py-2 rounded-full border transition-all cursor-pointer select-none ${
                activeFilters.includes("GF")
                  ? "bg-stone-950 text-white border-stone-950"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-sm font-bold text-[10px] ${
                  activeFilters.includes("GF")
                    ? "bg-stone-800 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                GF
              </span>
              Gluten Free
            </button>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-stone-500 hidden md:block text-xs">
              Custom allergen requests can be made during booking.
            </span>

            {/* View List/Grid toggle */}
            <div className="flex items-center border border-stone-300 bg-white p-1 rounded-sm select-none">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-xs transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-stone-950 text-white"
                    : "text-stone-400 hover:text-stone-950"
                }`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-xs transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-stone-950 text-white"
                    : "text-stone-400 hover:text-stone-950"
                }`}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Loop */}
        {categories.map((cat, idx) => {
          const items = MENU_ITEMS.filter((item) => item.category === cat.name);

          // Filter items based on active tags
          const filteredItems = items.filter((item) => {
            if (activeFilters.length === 0) return true;
            return activeFilters.every((filter) => item.tags.includes(filter));
          });

          return (
            <div
              key={idx}
              className="w-full mb-20 pb-16 border-b border-stone-200 last:border-0 last:pb-0 last:mb-0"
            >
              {/* Category Header */}
              <div className="flex items-start justify-between mb-12">
                <div className="flex flex-col">
                  <h2 className="font-medium tracking-tight text-stone-950 leading-tight">
                    {cat.name}
                  </h2>
                  <p className="tracking-[0.2em] uppercase font-bold text-primary text-xs mt-1">
                    {cat.subtitle}
                  </p>
                </div>
                <span className="text-stone-200 font-semibold text-5xl md:text-6xl leading-none hidden md:block select-none font-serif">
                  {cat.code}
                </span>
              </div>

              {/* Items Display Container */}
              {filteredItems.length === 0 ? (
                <p className="text-stone-400 text-sm italic font-light py-4">
                  No confections match the selected dietary filters.
                </p>
              ) : viewMode === "list" ? (
                /* LIST VIEW MODE */
                <div className="divide-y divide-stone-200/60 flex flex-col">
                  {filteredItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/menu/${item.id}`}
                      className="flex flex-col md:flex-row items-center gap-6 py-4 group hover:bg-white hover:-mx-4 hover:px-4 rounded-sm transition-all duration-200 border-transparent hover:shadow-sm"
                    >
                      <div className="grow w-full md:w-auto min-w-0">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Thumbnail Image */}
                          <div className="relative aspect-4/3 w-full md:w-36 md:h-40 rounded-sm shrink-0 bg-stone-100 overflow-hidden">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, 112px"
                            />
                          </div>

                          {/* Title & Description */}
                          <div className="flex flex-col justify-center min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h4 className="font-bold tracking-tight text-stone-950 group-hover:text-primary transition-colors text-lg">
                                {item.name}
                              </h4>

                              {/* Tags */}
                              {item.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="font-bold text-[9px] tracking-wider px-2 py-0.5 rounded-sm border border-stone-200 text-stone-500 bg-white"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <p className="text-stone-500 leading-relaxed font-light text-sm">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Dotted Divider line */}
                      <div
                        className="hidden md:block grow max-w-37.5 h-px opacity-60"
                        style={{
                          backgroundImage:
                            "repeating-linear-linear(to right, #78716c 0px, #78716c 2px, transparent 2px, transparent 6px)",
                        }}
                      />

                      {/* Price Tag */}
                      <span className="font-secondary text-xl font-bold text-stone-950 shrink-0 select-none">
                        ${item.price}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                /* GRID VIEW MODE */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-4">
                  {filteredItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/menu/${item.id}`}
                      className="flex flex-col bg-white border border-stone-200/60 hover:border-stone-400 p-5 rounded-lg group transition-all duration-300 hover:shadow-md cursor-pointer justify-between h-full"
                    >
                      <div>
                        {/* Card Image */}
                        <div className="relative aspect-16/10 w-full rounded-md bg-stone-100 overflow-hidden mb-4">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 300px"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-sm border border-stone-200 text-stone-500 bg-stone-50"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <h4 className="font-bold text-stone-950 group-hover:text-primary transition-colors text-lg leading-tight">
                            {item.name}
                          </h4>

                          <p className="text-stone-500 text-xs leading-relaxed font-light line-clamp-3">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Price tag at bottom */}
                      <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-stone-400 text-[10px] tracking-wider uppercase font-bold">
                          Price
                        </span>
                        <span className="font-secondary text-lg font-bold text-stone-950">
                          ${item.price}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
