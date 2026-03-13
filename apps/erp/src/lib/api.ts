import {
  healthResponseSchema,
  tenantBrandingSchema,
} from "@repo/contracts";
import { apiFetchClient } from "@/lib/api/client";

export async function fetchHealth() {
  const response = await apiFetchClient.GET("/health");

  if (response.error) {
    throw new Error("Failed to fetch API health.");
  }

  return healthResponseSchema.parse(response.data);
}

export async function fetchTenantBranding() {
  const response = await apiFetchClient.GET("/public/tenant-branding");

  if (response.error) {
    throw new Error("Failed to fetch tenant branding.");
  }

  return tenantBrandingSchema.parse(response.data);
}
