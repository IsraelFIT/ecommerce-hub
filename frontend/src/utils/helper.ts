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

export function getCurrencySymbol(currency: string = "NGN"): string {
  const code = (currency || "NGN").toUpperCase();
  const map: Record<string, string> = {
    NGN: "₦",
    USD: "$",
    GBP: "£",
    EUR: "€",
    GHS: "GH₵",
    KES: "KSh",
    ZAR: "R",
    CAD: "CA$",
    AUD: "A$",
  };
  return map[code] || code;
}

export function formatCurrency(
  amount: number | string,
  currency: string = "NGN",
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0.00";
  const symbol = getCurrencySymbol(currency);
  const formattedNum = num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formattedNum}`;
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
  const rootDomain = (
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ecommerce-hub.com"
  ).toLowerCase();

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    const port = window.location.port ? `:${window.location.port}` : "";
    const protocol = window.location.protocol;

    if (host.endsWith("localhost") || host === "127.0.0.1") {
      return `http://${tenantSlug}.localhost${port}${cleanPath}`;
    }

    // On *.vercel.app or domains that don't support wildcard subdomains, use path-based URLs
    if (host.endsWith(".vercel.app") || rootDomain.endsWith(".vercel.app")) {
      const tenantBase = tenantSlug === "core" ? "/core" : `/${tenantSlug}`;
      const suffix = cleanPath === "/" ? "" : cleanPath;
      return `${protocol}//${host}${tenantBase}${suffix}`;
    }

    return `${protocol}//${tenantSlug}.${rootDomain}${cleanPath}`;
  }

  if (process.env.NODE_ENV === "development") {
    return `http://${tenantSlug}.localhost:3000${cleanPath}`;
  }

  if (rootDomain.endsWith(".vercel.app")) {
    const tenantBase = tenantSlug === "core" ? "/core" : `/${tenantSlug}`;
    const suffix = cleanPath === "/" ? "" : cleanPath;
    return `https://${rootDomain}${tenantBase}${suffix}`;
  }

  return `https://${tenantSlug}.${rootDomain}${cleanPath}`;
}

/**
 * Checks if the current browser window is running on a tenant subdomain.
 */
export function isSubdomainEnv(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  const rootDomain = (
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ecommerce-hub.com"
  ).toLowerCase();

  // *.vercel.app never supports wildcard tenant subdomains
  if (host.endsWith(".vercel.app")) {
    return false;
  }

  const isDevSub = host.endsWith(".localhost") && host !== "localhost";
  const isProdSub =
    host.endsWith(`.${rootDomain}`) &&
    host !== rootDomain &&
    !host.startsWith("www.") &&
    !host.startsWith("app.") &&
    !host.startsWith("core.");

  return isDevSub || isProdSub;
}

/**
 * Returns the appropriate local route path for navigation within a tenant space.
 * On tenant subdomains: clean path like "/admin", "/menu", "/cart"
 * On path-based domains (e.g. *.vercel.app): prefixed path like "/[tenant]/admin", "/[tenant]/cart"
 */
export function getTenantRoute(
  tenantSlug: string,
  subPath: string = "",
): string {
  let cleanSubPath = subPath
    ? subPath.startsWith("/")
      ? subPath
      : `/${subPath}`
    : "/";

  // Strip leading tenant slug if already present in subPath (e.g. /pressctrl/admin -> /admin)
  if (
    tenantSlug &&
    (cleanSubPath === `/${tenantSlug}` ||
      cleanSubPath.startsWith(`/${tenantSlug}/`))
  ) {
    cleanSubPath = cleanSubPath.slice(`/${tenantSlug}`.length) || "/";
  }

  // If running on a true subdomain (e.g. jazz-cakes-ltd.localhost or jazz-cakes-ltd.mycustomdomain.com)
  if (isSubdomainEnv()) {
    return cleanSubPath;
  }

  // In path-based routing (e.g. *.vercel.app or localhost:3000/pressctrl/...)
  if (tenantSlug && tenantSlug !== "general" && tenantSlug !== "core") {
    return `/${tenantSlug}${cleanSubPath === "/" ? "" : cleanSubPath}`;
  }

  return cleanSubPath;
}

/**
 * Returns the root application URL (outside of any tenant subdomains).
 * In development: http://localhost:3000{path}
 * In production: https://ecommerce-hub.com{path}
 */
export function getRootAppUrl(path: string = "/"): string {
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "/";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ecommerce-hub.com";

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    const protocol = window.location.protocol;

    if (host.endsWith("localhost") || host === "127.0.0.1") {
      return `http://localhost${port}${cleanPath}`;
    }
    return `${protocol}//${rootDomain}${cleanPath}`;
  }

  if (process.env.NODE_ENV === "development") {
    return `http://localhost:3000${cleanPath}`;
  }
  return `https://${rootDomain}${cleanPath}`;
}
