"use client";

import { useState } from "react";
import { Mail, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function PreFooterBanner() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    toast.success(
      "Welcome to EcommerceHub! Check your inbox for access instructions.",
    );
    setEmail("");
  };

  return (
    <section className="py-16 bg-background border-t border-border">
      <div className="container">
        <div className="w-full relative rounded-3xl bg-linear-to-r from-primary/10 via-primary/5 to-card-gray border border-border p-8 md:p-12 lg:p-16 overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left: Content & Form */}
          <div className="space-y-6 max-w-xl text-left">
            <h2 className="font-secondary font-bold tracking-tight text-foreground leading-[1.15]">
              Ready to Launch Your
              <br />
              <span className="font-secondary italic text-primary font-normal">
                eCommerce Storefront?
              </span>
            </h2>

            <p className="text-muted-foreground font-normal leading-relaxed">
              Join thousands of fast-growing merchants building isolated, custom
              subdomain storefronts and scaling multi-channel sales on
              EcommerceHub.
            </p>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col md:flex-row gap-2.5 pt-2"
            >
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-card border-border text-foreground"
                />
              </div>
              <Button type="submit" className="h-11 rounded-xl">
                Start Free Trial
              </Button>
            </form>
          </div>

          {/* Right: Mini Dashboard Snippet */}
          <div className="w-full max-w-md bg-card rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border text-xs font-bold text-foreground">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                  <Store className="h-3 w-3" />
                </div>
                <span className="font-secondary">EcommerceHub Network</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold">
                Live Data
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-card-gray p-2.5 rounded-xl border border-border/50">
                <span className="block text-[10px] text-muted-foreground">
                  Active Stores
                </span>
                <span className="font-bold text-foreground">1,420</span>
              </div>
              <div className="bg-card-gray p-2.5 rounded-xl border border-border/50">
                <span className="block text-[10px] text-muted-foreground">
                  Processed GMV
                </span>
                <span className="font-bold text-foreground">$1.48M</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Store Growth Rate</span>
                <span className="text-success font-bold">
                  +28.4% this quarter
                </span>
              </div>
              <div className="flex items-end gap-1 h-12 pt-1">
                <div className="flex-1 bg-primary/20 rounded-t h-[40%]" />
                <div className="flex-1 bg-primary/20 rounded-t h-[60%]" />
                <div className="flex-1 bg-primary rounded-t h-full" />
                <div className="flex-1 bg-primary/20 rounded-t h-[70%]" />
                <div className="flex-1 bg-primary/20 rounded-t h-[50%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
