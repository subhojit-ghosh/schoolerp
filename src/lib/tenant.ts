const IGNORED_SUBDOMAINS = new Set(["www", "api", "app"]);

/**
 * Resolves institution slug from subdomain or X-Institution-Slug header.
 * Subdomain takes precedence (subdomain-first strategy for white-label).
 * Header fallback supports API clients and single-domain mode.
 *
 * Accepts the raw `host` header (e.g. "school-a.localhost:3000") rather than
 * request.nextUrl.hostname, which Next.js may normalize away in middleware.
 */
export function resolveInstitutionFromRequest(
  hostHeader: string | null,
  institutionSlugHeader: string | null,
): string | null {
  // Strip port if present (e.g. "school-a.localhost:3000" → "school-a.localhost")
  const host = (hostHeader ?? "").split(":")[0];
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

  return institutionSlugHeader ?? null;
}
