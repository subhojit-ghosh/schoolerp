const LOCALHOST_NAMES = new Set(["localhost", "127.0.0.1"]);
const LOCALHOST_SUFFIX = ".localhost";

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase();
}

export function getTenantSlugFromHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname);

  if (LOCALHOST_NAMES.has(normalizedHostname)) {
    return null;
  }

  if (normalizedHostname.endsWith(LOCALHOST_SUFFIX)) {
    const tenantSlug = normalizedHostname.slice(0, -LOCALHOST_SUFFIX.length);

    return tenantSlug || null;
  }

  const hostnameParts = normalizedHostname.split(".");

  if (hostnameParts.length <= 2) {
    return null;
  }

  return hostnameParts[0] || null;
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

  const { protocol, hostname, port } = window.location;
  const normalizedHostname = normalizeHostname(hostname);
  const portSuffix = port ? `:${port}` : "";

  if (
    LOCALHOST_NAMES.has(normalizedHostname) ||
    normalizedHostname.endsWith(LOCALHOST_SUFFIX)
  ) {
    return `${protocol}//${tenantSlug}${LOCALHOST_SUFFIX}${portSuffix}${path}`;
  }

  const hostnameParts = normalizedHostname.split(".");
  const baseHostname =
    hostnameParts.length > 2
      ? hostnameParts.slice(1).join(".")
      : normalizedHostname;

  return `${protocol}//${tenantSlug}.${baseHostname}${portSuffix}${path}`;
}
