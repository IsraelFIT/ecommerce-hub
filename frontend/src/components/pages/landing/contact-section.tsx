"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, ChevronRight, User } from "lucide-react";
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
import { toast } from "sonner";

export function ContactSection() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Multi-Tenant Storefront Setup");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !message) {
      toast.error("Please fill in all contact fields");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success(
        "Thank you! Our eCommerce platform specialists will be in touch shortly.",
      );
      setFullName("");
      setEmail("");
      setMessage("");
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <section
      id="contact"
      className="py-16 bg-background border-t border-border"
    >
      <div className="container text-center flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground shadow-2xs mb-5">
          <span>Contact Us</span>
        </div>

        {/* Section Heading */}
        <h2 className="font-secondary font-bold tracking-tight text-foreground max-w-3xl leading-[1.15] mb-2">
          Contact Our{" "}
          <span className="font-secondary italic text-primary font-normal">
            Platform Solutions
          </span>{" "}
          Team
        </h2>

        {/* Subtitle */}
        <p className="text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed mb-16">
          Get expert onboarding assistance, multi-tenant setup guidance, custom
          API integrations, and 24/7 technical support.
        </p>

        {/* 2 Column Form Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left w-full bg-card rounded-3xl border border-border p-6 md:p-10">
          {/* Left Column: Contact Details (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:pr-6 lg:border-r border-border flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="font-bold text-foreground font-secondary">
                Get in Touch
              </h4>
              <p className="text-muted-foreground font-normal leading-relaxed">
                Whether you&apos;re launching a standalone store or managing
                thousands of merchant subdomains, our technical team is here to
                help.
              </p>
            </div>

            {/* Information Cards List */}
            <div className="space-y-3">
              {/* Item 1: Email */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card-gray hover:bg-card-gray/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Email address
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      israelfolaranmi01@gmail.com
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Item 2: Phone */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card-gray hover:bg-card-gray/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Phone Number
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      +234 902 994 9407
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Item 3: Address */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card-gray hover:bg-card-gray/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Headquarters
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Maitama, Abuja, Nigeria
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Item 4: Hours */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card-gray hover:bg-card-gray/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Support Hours
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      24/7 Global Availability
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form (7 cols) */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Alex Morgan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 pl-10 pr-4 bg-card-gray border-border text-foreground"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="alex@yourstore.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 pl-10 pr-4 bg-card-gray border-border text-foreground"
                    required
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-foreground">
                  Subject
                </Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="w-full h-10 px-4 bg-card-gray border-border text-foreground">
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Multi-Tenant Storefront Setup">
                      Multi-Tenant Storefront Setup
                    </SelectItem>
                    <SelectItem value="Custom Subdomain & DNS Configuration">
                      Custom Subdomain & DNS Configuration
                    </SelectItem>
                    <SelectItem value="Payment Gateway & Payout Support">
                      Payment Gateway & Payout Support
                    </SelectItem>
                    <SelectItem value="API & Webhook Integrations">
                      API & Webhook Integrations
                    </SelectItem>
                    <SelectItem value="Enterprise Architecture & SLAs">
                      Enterprise Architecture & SLAs
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-foreground">
                  Message
                </Label>
                <Textarea
                  rows={4}
                  placeholder="Tell us about your multi-store architecture or requirements..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3.5 bg-card-gray border-border text-foreground resize-none"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
