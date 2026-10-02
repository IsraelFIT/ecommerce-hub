"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import useInvalidPaths from "@/hooks/invalid-paths";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const invalidPath = useInvalidPaths();

  if (invalidPath) return null;

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all font-primary">
      <div className="container h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <h4 className="font-secondary text-2xl font-bold tracking-tight text-foreground">
            Ecommerce<span className="text-primary">Hub</span>
          </h4>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-full border border-border bg-card-gray shadow-2xs">
          {navLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              className={`px-4 py-1.5 font-semibold rounded-full transition-all ${
                link.label === "Home"
                  ? "bg-primary-light text-primary font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Action Icons & CTA Button */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>

          <Link href="/signup">
            <Button>
              <span>Start Free Trial</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-foreground hover:text-primary"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card/95 px-6 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-foreground hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-primary flex items-center gap-1.5"
            >
              <span>Launch Storefront</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export const LandingNavbar = Header;
