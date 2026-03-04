const IGNORED_SUBDOMAINS = new Set(["www", "api", "app"]);

export function resolveInstitutionFromRequest(
  url: URL,
  institutionIdHeader: string | null,
): string | null {
  const host = url.hostname;
  const parts = host.split(".");

  // Handle *.localhost (2 parts: ["school-a", "localhost"])
  // Handle *.erp.com (3+ parts: ["school-a", "erp", "com"])
  const hasSubdomain =
    (parts.length === 2 && parts[1] === "localhost") ||
    parts.length >= 3;

  if (hasSubdomain) {
    const subdomain = parts[0];
    if (!IGNORED_SUBDOMAINS.has(subdomain)) {
      return subdomain;
    }
  }

  return institutionIdHeader ?? null;
}
