export * from "./users";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface TenantBranding {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  customDomain?: string;
}
