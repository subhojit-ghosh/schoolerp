const IGNORED_SUBDOMAINS = new Set(["www", "api", "app"]);

/**
 * Resolves institution slug from subdomain or X-Institution-Id header.
 * Subdomain takes precedence (subdomain-first strategy for white-label).
 */
export function resolveInstitutionFromRequest(
  url: URL,
  institutionIdHeader: string | null,
): string | null {
  const host = url.hostname;
  const parts = host.split(".");

  // Subdomain detection: hostname has 3+ parts and first part isn't a reserved subdomain
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (!IGNORED_SUBDOMAINS.has(subdomain)) {
      return subdomain;
    }
  }

  // Fallback to header (for API clients / single-domain mode)
  return institutionIdHeader ?? null;
}
