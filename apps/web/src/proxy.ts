import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { resolveInstitutionFromRequest } from "@/lib/tenant";
import { ROUTES, HEADERS, COOKIES } from "@/constants";

const isExactOrChildRoute = (path: string, baseRoute: string) =>
  path === baseRoute || path.startsWith(`${baseRoute}/`);

// Completely bypass — Better Auth handles these internally
const isApiAuthRoute = (path: string) =>
  isExactOrChildRoute(path, ROUTES.API.AUTH_PREFIX);
const isSetupRoute = (path: string) =>
  isExactOrChildRoute(path, ROUTES.ADMIN.SETUP);
const isSetupApiRoute = (path: string) => path.startsWith(ROUTES.API.SETUP_PREFIX);
const isPlatformAuthPage = (path: string) =>
  path === ROUTES.ADMIN.SIGN_IN || path === ROUTES.ADMIN.TWO_FA;
const isPublicRoute = (path: string) =>
  isSetupRoute(path) || isSetupApiRoute(path);
const ORG_CLEAN_PATHS: ReadonlySet<string> = new Set(Object.values(ROUTES.ORG));

// Public-facing auth pages — institution context needed for branding, but no session
const isAuthPage = (path: string) =>
  isExactOrChildRoute(path, ROUTES.AUTH.PREFIX);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API auth routes: completely bypass
  if (isApiAuthRoute(pathname)) {
    return NextResponse.next();
  }

  // Resolve institution slug from subdomain (always)
  // Use the raw `host` header — request.nextUrl.hostname is normalized by Next.js in middleware
  const institutionSlug = resolveInstitutionFromRequest(
    request.headers.get("host"),
    request.headers.get(HEADERS.INSTITUTION_SLUG),
  );
  const hasTwoFactorCookie = request.cookies.has(COOKIES.TWO_FACTOR);
  const isOrgCleanPath = institutionSlug ? ORG_CLEAN_PATHS.has(pathname) : false;

  // Admin routes are root-domain only — never accessible from a subdomain
  if (institutionSlug && isExactOrChildRoute(pathname, ROUTES.ADMIN.PREFIX)) {
    return NextResponse.redirect(new URL(ROUTES.ROOT, request.url));
  }

  if (!institutionSlug && pathname === ROUTES.ROOT) {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    const requestHeaders = new Headers(request.headers);
    if (institutionSlug) {
      requestHeaders.set(HEADERS.INSTITUTION_SLUG, institutionSlug);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (isPlatformAuthPage(pathname)) {
    return NextResponse.next();
  }

  // Auth pages: set institution header for branding, no session required
  if (isAuthPage(pathname)) {
    if (!institutionSlug) {
      return NextResponse.json(
        { error: "Institution context required" },
        { status: 400 },
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(HEADERS.INSTITUTION_SLUG, institutionSlug);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Platform routes: root-domain control plane, no institution context required
  // Cookie-only check (no DB hit) — full session validation happens in layouts
  if (!institutionSlug) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      if (hasTwoFactorCookie) {
        return NextResponse.redirect(new URL(ROUTES.ADMIN.TWO_FA, request.url));
      }
      return NextResponse.redirect(new URL(ROUTES.ADMIN.SIGN_IN, request.url));
    }

    return NextResponse.next();
  }

  // Org-scoped routes: institution slug required
  const isOrgScopedRoute =
    pathname.startsWith(ROUTES.DASHBOARD) ||
    pathname.startsWith(ROUTES.APP_PREFIX) ||
    isOrgCleanPath;
  if (isOrgScopedRoute && !institutionSlug) {
    return NextResponse.json(
      { error: "Institution context required" },
      { status: 400 },
    );
  }

  // All other routes: cookie-only session check (no DB hit)
  // Full session validation happens in layouts via requireOrgAccess / getPlatformSessionUser
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    if (isOrgScopedRoute && hasTwoFactorCookie) {
      return NextResponse.redirect(new URL(ROUTES.AUTH.TWO_FA, request.url));
    }
    return NextResponse.redirect(new URL(ROUTES.AUTH.SIGN_IN, request.url));
  }

  // Pass institution context downstream via request headers
  const requestHeaders = new Headers(request.headers);
  if (institutionSlug) {
    requestHeaders.set(HEADERS.INSTITUTION_SLUG, institutionSlug);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
