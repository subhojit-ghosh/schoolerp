import {
  healthResponseSchema,
  tenantBrandingSchema,
} from "@repo/contracts";
import { apiFetchClient, getTenantSlug } from "@/lib/api/client";

export async function fetchHealth() {
  const response = await apiFetchClient.GET("/health");

  if (response.error) {
    throw new Error("Failed to fetch API health.");
  }

  return healthResponseSchema.parse(response.data);
}

export async function fetchTenantBranding() {
  const tenantSlug = getTenantSlug();
  const response = await apiFetchClient.GET("/public/tenant-branding", {
    params: tenantSlug
      ? {
          query: {
            tenant: tenantSlug,
          },
        }
      : undefined,
  });

  if (response.error) {
    throw new Error("Failed to fetch tenant branding.");
  }

  return tenantBrandingSchema.parse(response.data);
}
