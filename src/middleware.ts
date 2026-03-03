import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveInstitutionFromRequest } from "@/lib/auth/tenant";

// Routes that bypass authentication entirely
const PUBLIC_ROUTES = ["/auth", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for public routes
  if (PUBLIC_ROUTES.some((p) => pathname.startsWith(p))) {
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

  // 4. Pass resolved context downstream via response headers
  const response = NextResponse.next();
  if (institutionSlug) {
    response.headers.set("x-institution-slug", institutionSlug);
  }
  response.headers.set("x-user-id", session.user.id);

  return response;
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
