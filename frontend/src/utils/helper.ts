// Sanitize Inputs
export function sanitizeInput(value: string, type: string): string {
  let sanitized = value || "";

  switch (type) {
    case "text":
    case "textarea":
      // More aggressive tag removal: strips anything between < and >
      sanitized = sanitized.replace(/<[^>]*>?/gm, "");
      break;

    case "email":
      sanitized = sanitized.toLowerCase();
      // Allow spaces before validation (they'll be trimmed later)
      // To do - remove the + later
      sanitized = sanitized.replace(/[^a-zA-Z0-9@+._ -]/g, ""); // Added space to allowed chars
      break;

    case "tel":
    case "phone":
      // Allow spaces in phone numbers (users might format with spaces)
      sanitized = sanitized.replace(/[^\d\s+-]/g, ""); // Changed to allow spaces and +/-
      break;

    case "password":
      // Allow spaces in passwords but remove dangerous strings
      sanitized = sanitized.replace(/(script|onerror|onload|javascript)/gi, "");
      break;

    default:
      // Allow spaces in all other cases
      sanitized = sanitized.replace(/[<>"']/g, "");
  }

  // Final sanitization that preserves spaces
  sanitized = sanitized.replace(/(script|onerror|onload|javascript)/gi, "");

  return sanitized;
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Returns the proper subdomain URL for a tenant depending on the environment.
 * In development: http://{tenantSlug}.localhost:3000{path}
 * In production: https://{tenantSlug}.ecommerce-hub.com{path}
 */
export function getTenantSubdomainUrl(
  tenantSlug: string,
  path: string = "",
): string {
  let cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  if (cleanPath.startsWith(`/${tenantSlug}/`)) {
    cleanPath = cleanPath.slice(tenantSlug.length + 1);
  } else if (cleanPath === `/${tenantSlug}`) {
    cleanPath = "/";
  }
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ecommerce-hub.com";

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    const protocol = window.location.protocol;

    if (host.endsWith("localhost") || host === "127.0.0.1") {
      return `http://${tenantSlug}.localhost${port}${cleanPath}`;
    }
    return `${protocol}//${tenantSlug}.${rootDomain}${cleanPath}`;
  }

  if (process.env.NODE_ENV === "development") {
    return `http://${tenantSlug}.localhost:3000${cleanPath}`;
  }
  return `https://${tenantSlug}.${rootDomain}${cleanPath}`;
}
