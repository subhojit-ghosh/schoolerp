import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveInstitutionFromRequest } from "@/lib/auth/tenant";

// Completely bypass — Better Auth handles these internally
const isApiAuthRoute = (path: string) => path.startsWith("/api/auth");
const isSetupRoute = (path: string) => path === "/setup" || path.startsWith("/setup/");
const isSetupApiRoute = (path: string) => path.startsWith("/api/setup/");
const isPlatformAuthPage = (path: string) =>
  path === "/sign-in" || path === "/2fa";
const isPublicRoute = (path: string) =>
  isSetupRoute(path) || isSetupApiRoute(path);
const ORG_CLEAN_PATHS = new Set([
  "/",
  "/attendance",
  "/grades",
  "/students",
  "/fees",
  "/reports",
  "/members",
  "/roles",
  "/admissions",
]);

// Public-facing auth pages — institution context needed for branding, but no session
const isAuthPage = (path: string) =>
  path.startsWith("/auth/") || path === "/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API auth routes: completely bypass
  if (isApiAuthRoute(pathname)) {
    return NextResponse.next();
  }

  // Resolve institution slug from subdomain (always)
  const institutionSlug = resolveInstitutionFromRequest(
    request.nextUrl,
    request.headers.get("x-institution-id"),
  );
  const hasTwoFactorCookie = request.cookies.has("two_factor");
  const isOrgCleanPath = institutionSlug ? ORG_CLEAN_PATHS.has(pathname) : false;

  if (institutionSlug && pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  if (institutionSlug && pathname === "/2fa") {
    return NextResponse.redirect(new URL("/auth/2fa", request.url));
  }

  if (!institutionSlug && pathname === "/") {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    const requestHeaders = new Headers(request.headers);
    if (institutionSlug) {
      requestHeaders.set("x-institution-slug", institutionSlug);
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
    requestHeaders.set("x-institution-slug", institutionSlug);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Platform routes: root-domain control plane, no institution context required
  if (!institutionSlug) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      if (hasTwoFactorCookie) {
        return NextResponse.redirect(new URL("/2fa", request.url));
      }
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", session.user.id);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Org-scoped routes: institution slug required
  const isOrgScopedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/app") ||
    isOrgCleanPath;
  if (isOrgScopedRoute && !institutionSlug) {
    return NextResponse.json(
      { error: "Institution context required" },
      { status: 400 },
    );
  }

  // All other routes: validate session
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    if (isOrgScopedRoute && hasTwoFactorCookie) {
      return NextResponse.redirect(new URL("/auth/2fa", request.url));
    }
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // Pass resolved context downstream via request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.user.id);
  if (institutionSlug) {
    requestHeaders.set("x-institution-slug", institutionSlug);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
