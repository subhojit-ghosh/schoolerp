const APP_HOST_DEFAULTS = {
  ROOT_HOST: "erp.test",
} as const;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase();
}

function getRootHost() {
  return normalizeHostname(
    import.meta.env.VITE_ROOT_HOST ?? APP_HOST_DEFAULTS.ROOT_HOST,
  );
}

function getRootDomain() {
  return normalizeHostname(import.meta.env.VITE_ROOT_DOMAIN ?? getRootHost());
}

export function isRootHostname(hostname: string) {
  return normalizeHostname(hostname) === getRootHost();
}

export function getTenantSlugFromHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname);

  if (
    LOCAL_HOSTS.has(normalizedHostname) ||
    normalizedHostname === getRootHost()
  ) {
    return null;
  }

  const tenantSuffix = `.${getRootDomain()}`;
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

  return `${protocol}//${tenantSlug}.${getRootDomain()}${portSuffix}${path}`;
}

export function buildRootAppUrl(path = "/") {
  if (typeof window === "undefined") {
    return path;
  }

  const { protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : "";

  return `${protocol}//${getRootHost()}${portSuffix}${path}`;
}
