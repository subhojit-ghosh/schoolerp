import { APP_FALLBACKS } from "@/constants/api";

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase();
}

export function isRootHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname);
  const normalizedRootHost = normalizeHostname(APP_FALLBACKS.ROOT_HOST);

  return normalizedHostname === normalizedRootHost;
}

export function getTenantSlugFromHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname);
  const normalizedRootHost = normalizeHostname(APP_FALLBACKS.ROOT_HOST);
  const normalizedRootDomain = normalizeHostname(APP_FALLBACKS.ROOT_DOMAIN);

  if (
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname === normalizedRootHost
  ) {
    return null;
  }

  const tenantSuffix = `.${normalizedRootDomain}`;
  if (!normalizedHostname.endsWith(tenantSuffix)) {
    return null;
  }

  const tenantSlug = normalizedHostname.slice(0, -tenantSuffix.length);

  return tenantSlug || null;
}

export function getCurrentTenantSlug() {
  if (typeof window === "undefined") {
    return null;
  }

  return getTenantSlugFromHostname(window.location.hostname);
}

export function buildTenantAppUrl(tenantSlug: string, path = "/") {
  if (typeof window === "undefined") {
    return path;
  }

  const { protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : "";
  const normalizedRootDomain = normalizeHostname(APP_FALLBACKS.ROOT_DOMAIN);

  return `${protocol}//${tenantSlug}.${normalizedRootDomain}${portSuffix}${path}`;
}

export function buildRootAppUrl(path = "/") {
  if (typeof window === "undefined") {
    return path;
  }

  const { protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : "";
  const normalizedRootHost = normalizeHostname(APP_FALLBACKS.ROOT_HOST);

  return `${protocol}//${normalizedRootHost}${portSuffix}${path}`;
}
