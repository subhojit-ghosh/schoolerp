const APP_HOST_DEFAULTS = {
  ROOT_HOST: "erp.test",
} as const;

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase();
}

function getRootHost() {
  return normalizeHostname(
    process.env.NEXT_PUBLIC_ROOT_HOST ?? APP_HOST_DEFAULTS.ROOT_HOST,
  );
}

function getRootDomain() {
  return normalizeHostname(
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? getRootHost(),
  );
}

export function buildTenantAppUrl(tenantSlug: string, path = "/") {
  if (typeof window === "undefined") {
    return path;
  }

  const { protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : "";

  return `${protocol}//${tenantSlug}.${getRootDomain()}${portSuffix}${path}`;
}
