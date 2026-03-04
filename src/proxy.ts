import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveInstitutionFromRequest } from "@/lib/auth/tenant";

// Completely bypass — Better Auth handles these internally
const isApiAuthRoute = (path: string) => path.startsWith("/api/auth");

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

  // Auth pages: set institution header for branding, no session required
  if (isAuthPage(pathname)) {
    const requestHeaders = new Headers(request.headers);
    if (institutionSlug) {
      requestHeaders.set("x-institution-slug", institutionSlug);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // All other routes: validate session
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // Org-scoped routes: institution slug required
  const isOrgScopedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/app");
  if (isOrgScopedRoute && !institutionSlug) {
    return NextResponse.json(
      { error: "Institution context required" },
      { status: 400 },
    );
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
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
