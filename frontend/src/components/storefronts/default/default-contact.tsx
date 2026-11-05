"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import type { BrandingConfig } from "@/types/users";

export interface DefaultContactProps {
  tenantSlug: string;
  storeName: string;
  branding?: BrandingConfig;
}

export function DefaultContact({
  tenantSlug,
  storeName,
  branding: initialBranding,
}: DefaultContactProps) {
  const { branding: themeBranding } = useTenantTheme();
  const branding = initialBranding || themeBranding;

  const primaryColor = branding?.primaryColor || "#059669";
  const secondaryColor =
    branding?.secondaryColor || branding?.accentColor || "#ec4899";

  const contactBadge = branding?.contactBadge || "Custom Orders & Inquiries";
  const contactHeading =
    branding?.contactHeading || `Connect With ${storeName}`;
  const contactSubheading =
    branding?.contactSubheading ||
    `Have questions about our collections, need custom volume orders, or require personalized assistance? Reach out to our dedicated client team.`;

  const contactEmail = branding?.contactEmail || `hello@${tenantSlug}.com`;
  const contactPhone = branding?.contactPhone || "+234 (0) 800 000 0000";
  const contactAddress =
    branding?.contactAddress ||
    branding?.pickupAddress ||
    "Flagship Atelier & Storefront • Central Business District";
  const contactHours =
    branding?.contactHours ||
    branding?.pickupHours ||
    "Monday – Saturday: 9:00 AM – 7:00 PM";

  const heroBg = branding?.contactBackgroundUrl || branding?.heroBackgroundUrl;

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formMessage.trim()) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }

    try {
      setIsSubmitting(true);
      // Simulated inquiry dispatch / message submission
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
      toast.success(
        `Thank you ${formName}! Your inquiry has been dispatched to ${storeName}. Our team will contact you shortly.`,
      );
    } catch {
      toast.error(
        "Failed to send your inquiry. Please try again or reach out directly.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900 selection:bg-stone-950 selection:text-white">
      {/* Hero Header */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-stone-950 text-white">
        {heroBg && (
          <div
            className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
        )}
        <div
          className={`absolute inset-0 z-0 ${heroBg ? "bg-stone-950/85 backdrop-blur-xs" : "bg-radial-[at_top_right] from-stone-800 via-stone-900 to-stone-950"}`}
        />
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-120 h-120 rounded-full blur-3xl pointer-events-none opacity-20 transition-colors duration-500"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="container relative z-10 flex-col gap-0 items-center">
          {/* Breadcrumb */}
          <nav className="inline-flex items-center gap-2 mb-2">
            <Link
              href={`/${tenantSlug}`}
              className="text-stone-200 hover:text-white transition-colors"
            >
              <p>Home</p>
            </Link>
            <span>/</span>
            <p className="text-stone-200 font-medium">Contact</p>
          </nav>

          <div
            style={{ color: secondaryColor }}
            className="inline-flex items-center gap-2 font-bold tracking-[0.25em] uppercase mb-2"
          >
            <span>{contactBadge}</span>
          </div>

          <h2 className="font-bold font-secondary uppercase tracking-wide text-stone-100 text-center max-w-4xl">
            {contactHeading}
          </h2>

          <p className="text-stone-300 text-center max-w-2xl">
            {contactSubheading}
          </p>
        </div>
      </section>

      {/* Main Content: Form & Contact Info */}
      <section className="py-10 container flex-col">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-white p-8 rounded-2xl border border-stone-200/80">
            {submitted ? (
              <div className="py-12 flex flex-col items-center text-center space-y-4">
                <div
                  className="size-16 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-stone-900 font-secondary">
                  Message Dispatched!
                </h3>
                <p className="text-stone-600 max-w-md">
                  Thank you for reaching out to {storeName}. One of our client
                  specialists will review your message and reply via email at{" "}
                  <strong className="text-stone-900">{formEmail}</strong> within
                  24 hours.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setFormSubject("");
                    setFormMessage("");
                  }}
                  className="mt-4 uppercase tracking-wider text-xs font-bold cursor-pointer"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h4 className="font-bold font-secondary text-stone-950 uppercase tracking-wide">
                    Send Direct Message
                  </h4>
                  <p className="text-stone-500">
                    Fill out the form below and we will get back to you
                    promptly.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-xs font-semibold uppercase tracking-wider text-stone-700"
                    >
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Jane Doe"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-xs font-semibold uppercase tracking-wider text-stone-700"
                    >
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jane@example.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="subject"
                    className="text-xs font-semibold uppercase tracking-wider text-stone-700"
                  >
                    Subject / Inquiry Type
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Custom Order / Bulk Booking / Product Question"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="message"
                    className="text-xs font-semibold uppercase tracking-wider text-stone-700"
                  >
                    Your Message *
                  </Label>
                  <Textarea
                    id="message"
                    rows={5}
                    placeholder="Tell us what you are looking for, order requirements, delivery timeline, or any specific details..."
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    required
                    className="resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSubmitting ? (
                    <span>Sending Inquiry...</span>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Dispatch Message</span>
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Right Column: Contact Details Card */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-stone-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden border border-stone-800">
              <div
                style={{
                  background: `radial-gradient(at top right, ${secondaryColor + "25"} 0%, ${primaryColor + "20"} 60%, transparent 100%)`,
                }}
                className="absolute inset-0 pointer-events-none"
              />

              <div className="relative z-10 space-y-6">
                <div>
                  <span
                    style={{ color: secondaryColor }}
                    className="text-xs font-bold uppercase tracking-widest"
                  >
                    Direct Contact
                  </span>
                  <h4 className="font-bold font-secondary uppercase tracking-wide mt-1">
                    Store Information
                  </h4>
                </div>

                <div className="space-y-5 pt-2">
                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div
                      className="p-2.5 rounded-xl text-white shrink-0"
                      style={{ backgroundColor: `${primaryColor}40` }}
                    >
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                        Client Inquiries
                      </div>
                      <Link
                        href={`mailto:${contactEmail}`}
                        className="text-stone-200 font-medium hover:text-white transition-colors break-all"
                      >
                        {contactEmail}
                      </Link>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div
                      className="p-2.5 rounded-xl text-white shrink-0"
                      style={{ backgroundColor: `${primaryColor}40` }}
                    >
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                        Phone & WhatsApp
                      </div>
                      <Link
                        href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                        className="text-stone-200 font-medium hover:text-white transition-colors"
                      >
                        {contactPhone}
                      </Link>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div
                      className="p-2.5 rounded-xl text-white shrink-0"
                      style={{ backgroundColor: `${primaryColor}40` }}
                    >
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                        Physical Location / Atelier
                      </div>
                      <p className="text-stone-300 font-light">
                        {contactAddress}
                      </p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-4">
                    <div
                      className="p-2.5 rounded-xl text-white shrink-0"
                      style={{ backgroundColor: `${primaryColor}40` }}
                    >
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                        Store & Collection Hours
                      </div>
                      <p className="text-stone-300 font-light">
                        {contactHours}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-500">
                  <Link href={`/${tenantSlug}#collection`}>
                    <Button variant="outline" className="w-full">
                      Explore Full Storefront
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DefaultContact;
