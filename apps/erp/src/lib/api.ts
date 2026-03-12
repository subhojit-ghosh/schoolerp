import { healthResponseSchema, tenantBrandingSchema } from "@academic-platform/contracts";
import { API_ROUTES, APP_FALLBACKS } from "@/constants/api";

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? APP_FALLBACKS.API_URL;
}

function getTenantSlug() {
  if (typeof window === "undefined") {
    return APP_FALLBACKS.LOCALHOST_TENANT_SLUG;
  }

  const { hostname } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return import.meta.env.VITE_TENANT_SLUG ?? APP_FALLBACKS.LOCALHOST_TENANT_SLUG;
  }

  const [subdomain] = hostname.split(".");

  return subdomain || APP_FALLBACKS.LOCALHOST_TENANT_SLUG;
}

export async function fetchHealth() {
  const response = await fetch(`${getApiBaseUrl()}${API_ROUTES.HEALTH}`, {
    credentials: "include",
  });

  const payload = await response.json();

  return healthResponseSchema.parse(payload);
}

export async function fetchTenantBranding() {
  const tenantSlug = getTenantSlug();
  const url = new URL(`${getApiBaseUrl()}${API_ROUTES.TENANT_BRANDING}`);

  url.searchParams.set("tenant", tenantSlug);

  const response = await fetch(url, {
    credentials: "include",
  });

  const payload = await response.json();

  return tenantBrandingSchema.parse(payload);
}
