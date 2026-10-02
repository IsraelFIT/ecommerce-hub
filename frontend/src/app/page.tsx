import { HeroSection } from "@/components/pages/landing/hero-section";
import { TrustedBrands } from "@/components/pages/landing/trusted-brands";
import { FeaturesSection } from "@/components/pages/landing/features-section";
import { HowItWorksSection } from "@/components/pages/landing/how-it-works-section";
import { PricingSection } from "@/components/pages/landing/pricing-section";
import { TestimonialsSection } from "@/components/pages/landing/testimonials-section";
import { FaqSection } from "@/components/pages/landing/faq-section";
import { ContactSection } from "@/components/pages/landing/contact-section";
import { PreFooterBanner } from "@/components/pages/landing/pre-footer-banner";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-primary">
      {/* Hero & Multi-Store Dashboard Preview */}
      <HeroSection />

      {/* Trusted Brands Social Proof */}
      <TrustedBrands />

      {/* Powerful Platform Features Grid */}
      <FeaturesSection />

      {/* Merchant Onboarding / How It Works */}
      <HowItWorksSection />

      {/* Transparent SaaS Pricing */}
      <PricingSection />

      {/* Store Owner Testimonials Masonry */}
      <TestimonialsSection />

      {/* FAQ & Live Revenue Analytics */}
      <FaqSection />

      {/* Contact Platform Solutions Team */}
      <ContactSection />

      {/* Pre-Footer Conversion Banner */}
      <PreFooterBanner />
    </div>
  );
}
