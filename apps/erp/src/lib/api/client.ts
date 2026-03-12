import createFetchClient from "openapi-fetch";
import createQueryClient from "openapi-react-query";
import type { paths } from "@/lib/api/generated/schema";
import { APP_FALLBACKS } from "@/constants/api";

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? APP_FALLBACKS.API_URL;
}

export function getTenantSlug() {
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

const fetchWithCredentials: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    credentials: "include",
  });

export const apiFetchClient = createFetchClient<paths>({
  baseUrl: getApiBaseUrl(),
  fetch: fetchWithCredentials,
});

export const apiQueryClient = createQueryClient(apiFetchClient);
