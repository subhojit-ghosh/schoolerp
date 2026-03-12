import { APP_FALLBACKS } from "@repo/contracts";

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase();
}

export function buildTenantAppUrl(tenantSlug: string, path: string) {
  if (typeof window === "undefined") {
    return path;
  }

  const normalizedRootDomain = normalizeHostname(APP_FALLBACKS.ROOT_DOMAIN);
  const { protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : "";

  return `${protocol}//${tenantSlug}.${normalizedRootDomain}${portSuffix}${path}`;
}
