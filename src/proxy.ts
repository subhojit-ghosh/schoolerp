import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveInstitutionFromRequest } from "@/lib/auth/tenant";

// Routes that bypass authentication
const isPublicRoute = (path: string) =>
  path.startsWith("/auth/") || path === "/auth" || path.startsWith("/api/auth");

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 1. Validate session
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // 2. Resolve institution context (subdomain-first, header fallback)
  const institutionSlug = resolveInstitutionFromRequest(
    request.nextUrl,
    request.headers.get("x-institution-id"),
  );

  // 3. For org-scoped routes: institution context is required
  const isOrgScopedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/app");
  if (isOrgScopedRoute && !institutionSlug) {
    return NextResponse.json(
      { error: "Institution context required" },
      { status: 400 },
    );
  }

  // 4. Pass resolved context to downstream route handlers via request headers
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
