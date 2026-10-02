import type { Metadata } from "next";
import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "@/styles/main.scss";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage-grotesque",
});

export const metadata: Metadata = {
  title: {
    default: "EcommerceHub — Multi-Tenant E-Commerce Platform",
    template: "%s | EcommerceHub",
  },
  description:
    "Next-generation multi-tenant platform, bespoke custom storefronts, and artisanal commerce.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${bricolageGrotesque.variable}`}
      suppressHydrationWarning
    >
      <body className={`${dmSans.className} ${bricolageGrotesque.className}`}>
        <Header />
        <main>{children}</main>
        <Toaster position="top-right" theme="light" closeButton richColors />
        <Footer />
      </body>
    </html>
  );
}
