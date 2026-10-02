export enum Roles {
  SUPER_ADMIN = "admin",
  TENANT_ADMIN = "tenant_admin",
  CUSTOMER = "customer",
  USER = "user",
}

export enum TenantBackendType {
  POSTGRES = "postgres",
  SANITY = "sanity",
}

export enum PaymentGateway {
  PAYSTACK = "paystack",
  STRIPE = "stripe",
}
