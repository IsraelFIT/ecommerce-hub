import type { Metadata } from "next";
import { getTenantMeta } from "@/lib/api/server-tenant";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const { storeName, storeDescription } = await getTenantMeta(tenant);

  return {
    title: `My Profile | ${storeName}`,
    description: storeDescription,
  };
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
