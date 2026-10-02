"use client";

import { useState } from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import { FaXTwitter, FaGithub } from "react-icons/fa6";
import { FaLinkedinIn } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import useInvalidPaths from "@/hooks/invalid-paths";

export function Footer() {
  const [email, setEmail] = useState("");
  const invalidPath = useInvalidPaths();

  if (invalidPath) return null;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    toast.success("Subscribed to EcommerceHub product dispatches!");
    setEmail("");
  };

  return (
    <footer className="bg-[#0D0D11] text-stone-300 pt-16 pb-12 border-t border-stone-800 font-sans">
      <div className="container flex-col gap-16">
        {/* Top Newsletter Card inside Footer */}
        <div className="w-full rounded-3xl bg-[#14141B] border border-stone-800 p-8 md:p-12 text-center flex flex-col items-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-800/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
            <span>Stay Updated</span>
          </div>

          <h2 className="font-secondary font-bold tracking-tight text-white max-w-3xl">
            Get Platform Updates & Commerce Growth Insights Delivered To{" "}
            <span className="font-secondary italic text-primary font-normal">
              Your Inbox
            </span>
          </h2>

          <form
            onSubmit={handleSubscribe}
            className="flex flex-col md:flex-row gap-2.5 w-full max-w-md pt-2"
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-11 px-4 text-xs bg-[#1C1C24] border-stone-700 text-white"
            />
            <Button type="submit" className="h-11 rounded-xl">
              Subscribe
            </Button>
          </form>

          <p className="text-stone-500 font-light">
            By subscribing, you agree to our Privacy Policy and Terms of
            Service.
          </p>
        </div>

        {/* 5 Columns Links Row */}
        <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-8 text-left text-xs">
          {/* Column 1: Brand & Bio */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                <Store className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <span className="block font-secondary font-bold text-base text-white">
                  Ecommerce<span className="text-primary">Hub</span>
                </span>
                <span className="block text-[9px] uppercase tracking-widest text-stone-500 font-bold">
                  Commerce Cloud
                </span>
              </div>
            </div>

            <p className="text-stone-400 text-xs font-light leading-relaxed">
              EcommerceHub empowers merchants and retail brands to deploy
              isolated subdomain storefronts, automate order operations, and
              scale multi-channel commerce.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 pt-2">
              <Link
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-lg bg-[#1C1C24] border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
                aria-label="X (Twitter)"
              >
                <FaXTwitter className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-lg bg-[#1C1C24] border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-lg bg-[#1C1C24] border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <FaGithub className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Column 2: PLATFORM */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">
              PLATFORM
            </h4>
            <ul className="space-y-2 font-light">
              <li>
                <Link
                  href="#features"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Subdomain Routing
                </Link>
              </li>
              <li>
                <Link
                  href="#features"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Store Analytics
                </Link>
              </li>
              <li>
                <Link
                  href="#features"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Order Management
                </Link>
              </li>
              <li>
                <Link
                  href="#features"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Catalog & Inventory
                </Link>
              </li>
              <li>
                <Link
                  href="#features"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Security & Isolation
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: SOLUTIONS */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">
              SOLUTIONS
            </h4>
            <ul className="space-y-2 font-light">
              <li>
                <Link
                  href="#how-it-works"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Bakeries & Food
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Artisans & Studios
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Fashion & Boutiques
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Direct-to-Consumer
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Multi-Store Franchises
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: RESOURCES */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">
              RESOURCES
            </h4>
            <ul className="space-y-2 text-stone-400 font-light">
              <li>
                <Link
                  href="#faq"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  API & Webhooks
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Platform Status
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link
                  href="#contact"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Technical Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: COMPANY */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">
              COMPANY
            </h4>
            <ul className="space-y-2 text-stone-400 font-light">
              <li>
                <Link
                  href="/"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="#testimonials"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Merchant Stories
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Enterprise
                </Link>
              </li>
              <li>
                <Link
                  href="#contact"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Contact Sales
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Merchant Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="w-full pt-8 border-t border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-light">
          <Link
            href="/privacy"
            className="text-stone-400 hover:text-stone-300 transition-colors"
          >
            Privacy Policy
          </Link>
          <p>© {new Date().getFullYear()} EcommerceHub. All rights reserved.</p>
          <Link
            href="/terms"
            className="text-stone-400 hover:text-stone-300 transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}

// Keep LandingFooter alias for backwards compatibility
export const LandingFooter = Footer;
