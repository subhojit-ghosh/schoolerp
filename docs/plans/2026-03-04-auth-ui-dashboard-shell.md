# Auth UI + Dashboard Shell Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build institution-aware auth pages (sign-in, sign-up, 2FA with login-02) and a role-filtered dashboard shell (sidebar-08) on top of the existing Better Auth + RBAC foundation.

**Architecture:** Route groups `(public)/auth` and `(org)/dashboard`. Proxy sets `x-institution-slug` for all routes. Server-only helpers in `src/server/auth/` resolve institution + org context once in layout. Nav items declare required permissions; sidebar filters at render time (UX only — route handlers still call `assertPermission()`).

**Tech Stack:** Next.js 16 App Router, Better Auth, Drizzle ORM, shadcn/ui (login-02 layout, sidebar-08), react-hook-form, zod, server-only

**Design doc:** `docs/plans/2026-03-04-auth-ui-dashboard-shell-design.md`

---

## Task 1: Install dependencies and shadcn components

**Files:**
- Modify: `package.json`
- Modify: `src/components/ui/` (shadcn adds files here)

**Step 1: Install server-only**

```bash
bun add server-only
```

**Step 2: Add shadcn components needed across the feature**

```bash
bunx shadcn add form
bunx shadcn add avatar
bunx shadcn add breadcrumb
bunx shadcn add collapsible
bunx shadcn add sheet
bunx shadcn add tooltip
bunx shadcn add skeleton
bunx shadcn add sidebar
```

Each command creates the relevant file in `src/components/ui/`. Accept any prompts.

**Step 3: Typecheck**

```bash
bun run typecheck
```

Expected: passes (or only pre-existing errors — shadcn components may have minor type issues, ignore for now).

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: install server-only and shadcn ui components (form, sidebar, avatar, etc.)"
```

---

## Task 2: Fix tenant resolution for *.localhost + update proxy

Two fixes:

1. `tenant.ts`: `school-a.localhost` has only 2 parts — current code requires 3+, so it silently returns null. Fix to also detect `*.localhost` subdomains.
2. `proxy.ts`: Auth routes currently skip institution resolution entirely. Fix so `x-institution-slug` is set for auth routes too (needed for branding). Only `/api/auth/*` truly bypasses everything.

**Files:**
- Modify: `src/lib/auth/tenant.ts`
- Modify: `src/lib/auth/tenant.test.ts`
- Modify: `src/proxy.ts`

**Step 1: Write failing test for school-a.localhost**

Add to `src/lib/auth/tenant.test.ts`:

```typescript
test("extracts slug from *.localhost subdomain (2-part host)", () => {
  const url = new URL("http://school-a.localhost:3000/auth/sign-in");
  const slug = resolveInstitutionFromRequest(url, null);
  expect(slug).toBe("school-a");
});
```

**Step 2: Run test to verify it fails**

```bash
bun test src/lib/auth/tenant.test.ts
```

Expected: FAIL — returns null for `school-a.localhost`.

**Step 3: Fix tenant.ts**

```typescript
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
```

**Step 4: Run tests**

```bash
bun test src/lib/auth/tenant.test.ts
```

Expected: all PASS (7 tests now).

**Step 5: Update proxy.ts**

New logic:
- `/api/auth/*` → bypass completely (no headers set)
- `/auth/*` → resolve institution slug, set header, skip session check
- everything else → resolve institution slug, validate session, require slug for org routes

```typescript
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
```

**Step 6: Typecheck**

```bash
bun run typecheck
```

**Step 7: Commit**

```bash
git add src/lib/auth/tenant.ts src/lib/auth/tenant.test.ts src/proxy.ts
git commit -m "fix: detect *.localhost subdomains and set institution header for auth routes"
```

---

## Task 3: Create server-only institution helpers

**Files:**
- Create: `src/server/auth/get-current-institution.ts`

```typescript
import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organization } from "@/lib/auth-schema";
import { eq } from "drizzle-orm";

export type InstitutionContext = {
  id: string;
  slug: string;
  name: string;
  status: string;
  branding: {
    logoUrl: string | null;
    primaryColor: string | null;
  };
};

/**
 * Reads x-institution-slug from request headers (set by proxy) and resolves
 * the full institution context from DB. Throws an invariant error if missing —
 * this is a system bug, not a user error (proxy guarantees the header exists).
 */
export async function getCurrentInstitution(): Promise<InstitutionContext> {
  const slug = (await headers()).get("x-institution-slug");
  if (!slug) {
    throw new Error("Invariant: x-institution-slug header missing — check proxy configuration");
  }

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1);

  if (!org) {
    throw new Error(`Invariant: institution not found for slug "${slug}"`);
  }

  return {
    id: org.id,
    slug: org.slug,
    name: org.name,
    status: org.status ?? "active",
    branding: {
      logoUrl: null,       // TODO: add logoUrl column to organization table
      primaryColor: null,  // TODO: add primaryColor column to organization table
    },
  };
}

/**
 * Lightweight version for auth pages — returns only branding fields.
 * Does NOT validate session or membership.
 */
export async function getCurrentInstitutionBranding() {
  const ctx = await getCurrentInstitution();
  return {
    slug: ctx.slug,
    name: ctx.name,
    logoUrl: ctx.branding.logoUrl,
    primaryColor: ctx.branding.primaryColor,
  };
}
```

**Step 1: Write the file** (above)

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/server/auth/get-current-institution.ts
git commit -m "feat: add server-only getCurrentInstitution and getCurrentInstitutionBranding helpers"
```

---

## Task 4: Refactor requireOrgAccess — move to src/server/auth/, update OrgContext

Changes from existing `src/lib/auth/require-org-access.ts`:
- Add `import "server-only"`
- Accepts `institution: InstitutionContext` (not a slug string) — avoids redundant DB lookup
- `OrgContext` now embeds `institution: InstitutionContext` and `academicYear: { id: string; name: string }`
- Remove `institutionId` and `currentAcademicYearId` top-level fields (now inside `institution` and `academicYear`)
- Remove `permissionSet: new Set(["*"])` for super admin — use `isSuperAdmin: true` flag only
- `assertPermission`: super admin short-circuit at top (already correct, keep it)

**Files:**
- Create: `src/server/auth/require-org-access.ts`
- Delete: `src/lib/auth/require-org-access.ts`

**Step 1: Create `src/server/auth/require-org-access.ts`**

```typescript
import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  roles,
  membershipRoles,
  academicYears,
  permissions,
  rolePermissions,
} from "@/lib/schema";
import { member as memberTable } from "@/lib/auth-schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { requires2FA, resolvePermissions } from "@/lib/auth/permissions";
import type { InstitutionContext } from "./get-current-institution";

export class AuthError extends Error {
  constructor(
    message: string,
    public status: 400 | 401 | 403 | 500,
  ) {
    super(message);
  }
}

export type OrgContext = {
  institution: InstitutionContext;
  userId: string;
  membershipId: string;
  roles: Array<{ id: string; slug: string; roleType: string }>;
  permissionSet: Set<string>;
  academicYear: { id: string; name: string };
  isSuperAdmin: boolean;
};

/**
 * Resolves full org-scoped access context for the current request.
 * Call once in dashboard layout — pass context down, never re-fetch.
 * Takes InstitutionContext from getCurrentInstitution() to avoid a second DB lookup.
 */
export async function requireOrgAccess(
  institution: InstitutionContext,
): Promise<OrgContext> {
  const h = await headers();

  // 1. Check institution is not suspended
  if (institution.status === "suspended") {
    throw new AuthError("Forbidden", 403);
  }

  // 2. Validate session
  const session = await auth.api.getSession({ headers: h });
  if (!session) throw new AuthError("Unauthorized", 401);

  const userId = session.user.id;
  const isSuperAdmin =
    (session.user as { isSuperAdmin?: boolean }).isSuperAdmin === true;

  // 3. super_admin shortcut — bypasses membership/role/permission resolution
  if (isSuperAdmin) {
    return {
      institution,
      userId,
      membershipId: "",
      roles: [],
      permissionSet: new Set(), // empty — assertPermission short-circuits via isSuperAdmin
      academicYear: { id: "", name: "" },
      isSuperAdmin: true,
    };
  }

  // 4. Validate membership (query member table directly — Better Auth API limitation)
  const [member] = await db
    .select()
    .from(memberTable)
    .where(
      and(
        eq(memberTable.organizationId, institution.id),
        eq(memberTable.userId, userId),
      ),
    )
    .limit(1);

  if (!member) throw new AuthError("Forbidden", 403);

  const membershipId = member.id;

  // 5. Resolve active membership roles
  const activeRoleRows = await db
    .select({ roleId: membershipRoles.roleId })
    .from(membershipRoles)
    .where(
      and(
        eq(membershipRoles.membershipId, membershipId),
        isNull(membershipRoles.validTo),
        isNull(membershipRoles.deletedAt),
      ),
    );

  if (activeRoleRows.length === 0) throw new AuthError("Forbidden", 403);

  const roleIds = activeRoleRows.map((r) => r.roleId);
  const resolvedRoles = await db
    .select({ id: roles.id, slug: roles.slug, roleType: roles.roleType })
    .from(roles)
    .where(and(inArray(roles.id, roleIds), isNull(roles.deletedAt)));

  // 6. Enforce 2FA before resolving permissions
  if (
    requires2FA(resolvedRoles.map((r) => ({ role_type: r.roleType, slug: r.slug })))
  ) {
    if (!(session as { twoFactorVerified?: boolean }).twoFactorVerified) {
      throw new AuthError("2FA required", 401);
    }
  }

  // 7. Resolve current academic year
  const [currentYear] = await db
    .select({ id: academicYears.id, name: academicYears.name })
    .from(academicYears)
    .where(
      and(
        eq(academicYears.institutionId, institution.id),
        eq(academicYears.isCurrent, true),
        isNull(academicYears.deletedAt),
      ),
    )
    .limit(1);

  if (!currentYear) {
    throw new AuthError(
      "Institution has no current academic year configured",
      500,
    );
  }

  // 8. Resolve permissions (default deny — empty set = no access)
  const permRows = await db
    .select({ slug: permissions.slug })
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(inArray(rolePermissions.roleId, roleIds));

  const permissionSet = resolvePermissions([
    { permissions: permRows.map((p) => p.slug) },
  ]);

  return {
    institution,
    userId,
    membershipId,
    roles: resolvedRoles,
    permissionSet,
    academicYear: { id: currentYear.id, name: currentYear.name },
    isSuperAdmin: false,
  };
}

/**
 * Asserts a permission is present in the context. Throws 403 if not.
 * MUST be called before constructing any data query.
 * Super admin short-circuits at top — never reaches permission check.
 */
export function assertPermission(ctx: OrgContext, permissionSlug: string): void {
  if (ctx.isSuperAdmin) return;
  if (!ctx.permissionSet.has(permissionSlug)) {
    throw new AuthError(`Missing permission: ${permissionSlug}`, 403);
  }
}
```

**Step 2: Delete old file**

```bash
rm src/lib/auth/require-org-access.ts
```

**Step 3: Typecheck**

```bash
bun run typecheck
```

**Step 4: Commit**

```bash
git add src/server/auth/require-org-access.ts src/lib/auth/require-org-access.ts
git commit -m "refactor: move requireOrgAccess to src/server/auth/, embed InstitutionContext in OrgContext"
```

---

## Task 5: Nav items config with permission filtering (TDD)

A pure function that filters nav items by the user's permission set. Testable without DB or Next.js.

**Files:**
- Create: `src/lib/nav.ts`
- Create: `src/lib/nav.test.ts`

**Step 1: Write failing tests**

```typescript
// src/lib/nav.test.ts
import { describe, expect, test } from "bun:test";
import { filterNavItems, NAV_ITEMS } from "./nav";

describe("filterNavItems", () => {
  test("returns all items for super admin", () => {
    const result = filterNavItems(NAV_ITEMS, new Set(), true);
    expect(result).toHaveLength(NAV_ITEMS.length);
  });

  test("returns only items matching permission set", () => {
    const perms = new Set(["attendance:read", "grades:read"]);
    const result = filterNavItems(NAV_ITEMS, perms, false);
    expect(result.every((item) => perms.has(item.permission))).toBe(true);
    expect(result).toHaveLength(2);
  });

  test("returns empty array when no permissions match", () => {
    const result = filterNavItems(NAV_ITEMS, new Set(), false);
    expect(result).toHaveLength(0);
  });

  test("NAV_ITEMS has no duplicate hrefs", () => {
    const hrefs = NAV_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
```

**Step 2: Run to verify failure**

```bash
bun test src/lib/nav.test.ts
```

Expected: FAIL — "Cannot find module './nav'"

**Step 3: Create `src/lib/nav.ts`**

```typescript
export type NavItem = {
  label: string;
  href: string;
  permission: string;
  icon: string; // lucide icon name
  group: "academics" | "finance" | "admin";
};

export const NAV_ITEMS: NavItem[] = [
  // Academics
  { label: "Attendance",  href: "/dashboard/attendance", permission: "attendance:read",  icon: "CalendarCheck",  group: "academics" },
  { label: "Grades",      href: "/dashboard/grades",     permission: "grades:read",      icon: "GraduationCap",  group: "academics" },
  { label: "Students",    href: "/dashboard/students",   permission: "students:read",    icon: "Users",          group: "academics" },
  // Finance
  { label: "Fees",        href: "/dashboard/fees",       permission: "fees:read",        icon: "CreditCard",     group: "finance" },
  { label: "Reports",     href: "/dashboard/reports",    permission: "reports:export",   icon: "BarChart2",      group: "finance" },
  // Admin
  { label: "Members",     href: "/dashboard/members",    permission: "members:invite",   icon: "UserPlus",       group: "admin" },
  { label: "Roles",       href: "/dashboard/roles",      permission: "roles:manage",     icon: "Shield",         group: "admin" },
  { label: "Admissions",  href: "/dashboard/admissions", permission: "admissions:read",  icon: "ClipboardList",  group: "admin" },
];

/**
 * Filters nav items by the user's permission set.
 * Super admin sees everything. This is UX filtering only —
 * route handlers must still call assertPermission() independently.
 */
export function filterNavItems(
  items: NavItem[],
  permissionSet: Set<string>,
  isSuperAdmin: boolean,
): NavItem[] {
  if (isSuperAdmin) return items;
  return items.filter((item) => permissionSet.has(item.permission));
}
```

**Step 4: Run tests**

```bash
bun test src/lib/nav.test.ts
```

Expected: all PASS.

**Step 5: Typecheck**

```bash
bun run typecheck
```

**Step 6: Commit**

```bash
git add src/lib/nav.ts src/lib/nav.test.ts
git commit -m "feat: add nav items config and permission-based filtering with tests"
```

---

## Task 6: OrgContextProvider (React context for dashboard)

Passes resolved `OrgContext` from server layout to client components that need role/permission info.

**Files:**
- Create: `src/components/providers/org-context.tsx`

```tsx
"use client";

import { createContext, useContext } from "react";
import type { OrgContext } from "@/server/auth/require-org-access";

const OrgCtx = createContext<OrgContext | null>(null);

export function OrgContextProvider({
  value,
  children,
}: {
  value: OrgContext;
  children: React.ReactNode;
}) {
  return <OrgCtx.Provider value={value}>{children}</OrgCtx.Provider>;
}

export function useOrgContext(): OrgContext {
  const ctx = useContext(OrgCtx);
  if (!ctx) throw new Error("useOrgContext must be used inside OrgContextProvider");
  return ctx;
}
```

Note: `OrgContext` contains `Set<string>` which is not JSON-serializable. This is fine — it's passed as a prop in memory, not through a serialization boundary. The provider is a client component that wraps server-rendered children.

**Step 1: Write the file** (above)

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/components/providers/org-context.tsx
git commit -m "feat: add OrgContextProvider for passing resolved org context to client components"
```

---

## Task 7: Auth layout — fetch institution branding

**Files:**
- Create: `src/app/(public)/auth/layout.tsx`

The auth layout wraps all auth pages. It fetches institution branding from the server (using `getCurrentInstitutionBranding()`) and passes it via props. If the institution is not found (invariant error), the error boundary handles it.

```tsx
import { getCurrentInstitutionBranding } from "@/server/auth/get-current-institution";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getCurrentInstitutionBranding();

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left panel — institution branding */}
      <div className="bg-primary text-primary-foreground flex flex-col gap-4 p-10">
        <div className="flex items-center gap-2 font-semibold text-lg">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} className="h-8 w-8 object-contain" />
          ) : (
            <div className="bg-primary-foreground/20 flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold">
              {branding.name.charAt(0)}
            </div>
          )}
          {branding.name}
        </div>
        <div className="flex-1" />
        <p className="text-primary-foreground/60 text-sm">
          &copy; {new Date().getFullYear()} {branding.name}. All rights reserved.
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
```

**Step 1: Write the file** (above)

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/app/(public)/auth/layout.tsx
git commit -m "feat: add auth layout with institution branding panel (login-02 structure)"
```

---

## Task 8: Sign-in page

**Files:**
- Create: `src/app/(public)/auth/sign-in/page.tsx`

Uses react-hook-form + zod + shadcn Form components. Calls `authClient.signIn.email()`.

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function SignInPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });

    if (error) {
      form.setError("root", { message: error.message ?? "Sign in failed" });
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your email and password to continue
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@school.edu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <p className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="/auth/sign-up" className="text-foreground underline underline-offset-4">
          Sign up
        </a>
      </p>
    </div>
  );
}
```

**Step 1: Write the file** (above)

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/app/(public)/auth/sign-in/page.tsx
git commit -m "feat: add sign-in page with react-hook-form + zod"
```

---

## Task 9: Sign-up page

**Files:**
- Create: `src/app/(public)/auth/sign-up/page.tsx`

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function SignUpPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    if (error) {
      form.setError("root", { message: error.message ?? "Sign up failed" });
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your details to get started
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@school.edu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <p className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <a href="/auth/sign-in" className="text-foreground underline underline-offset-4">
          Sign in
        </a>
      </p>
    </div>
  );
}
```

**Step 1: Write the file** (above)

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/app/(public)/auth/sign-up/page.tsx
git commit -m "feat: add sign-up page with react-hook-form + zod"
```

---

## Task 10: 2FA page

Shown after sign-in when the user's role requires 2FA. Verifies a TOTP code.

**Files:**
- Create: `src/app/(public)/auth/2fa/page.tsx`

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const schema = z.object({
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d+$/, "Code must be digits only"),
});

type FormValues = z.infer<typeof schema>;

export default function TwoFactorPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });

  async function onSubmit(values: FormValues) {
    const { error } = await authClient.twoFactor.verifyTotp({
      code: values.code,
    });

    if (error) {
      form.setError("root", { message: "Invalid code. Try again." });
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Two-factor authentication</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Authentication code</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <p className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Verifying…" : "Verify"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
```

**Step 1: Write the file** (above)

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/app/(public)/auth/2fa/page.tsx
git commit -m "feat: add 2FA verification page"
```

---

## Task 11: AppSidebar component (sidebar-08 pattern)

The main sidebar for the dashboard. Receives filtered nav items and user info. Uses shadcn's Sidebar components.

**Files:**
- Create: `src/components/dashboard/app-sidebar.tsx`

```tsx
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronsUpDown, LogOut } from "lucide-react";
import * as Icons from "lucide-react";
import type { NavItem } from "@/lib/nav";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";

type Props = {
  institutionName: string;
  userName: string;
  userEmail: string;
  navItems: NavItem[];
};

const GROUP_LABELS: Record<string, string> = {
  academics: "Academics",
  finance: "Finance",
  admin: "Administration",
};

const GROUP_ORDER = ["academics", "finance", "admin"] as const;

export function AppSidebar({ institutionName, userName, userEmail, navItems }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const groupedItems = GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    items: navItems.filter((item) => item.group === group),
  })).filter((g) => g.items.length > 0);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/auth/sign-in");
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold">
            {institutionName.charAt(0)}
          </div>
          <span className="truncate font-semibold text-sm">{institutionName}</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groupedItems.map(({ group, label, items }) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  // Dynamically resolve lucide icon by name
                  const Icon = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[item.icon];
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <a href={item.href}>
                          {Icon && <Icon className="h-4 w-4" />}
                          <span>{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-12">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium leading-none">{userName}</span>
                    <span className="text-muted-foreground text-xs">{userEmail}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
```

**Step 1: Write the file** (above)

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/components/dashboard/app-sidebar.tsx
git commit -m "feat: add AppSidebar component with grouped, permission-filtered nav (sidebar-08)"
```

---

## Task 12: Dashboard layout

Resolves institution + org context once. Wraps children in `OrgContextProvider` and `SidebarProvider`.

**Files:**
- Create: `src/app/(org)/dashboard/layout.tsx`

```tsx
import { getCurrentInstitution } from "@/server/auth/get-current-institution";
import { requireOrgAccess } from "@/server/auth/require-org-access";
import { OrgContextProvider } from "@/components/providers/org-context";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NAV_ITEMS, filterNavItems } from "@/lib/nav";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);

  // Get user name/email for sidebar footer
  const session = await auth.api.getSession({ headers: await headers() });
  const userName = session?.user.name ?? "User";
  const userEmail = session?.user.email ?? "";

  const visibleNavItems = filterNavItems(
    NAV_ITEMS,
    org.permissionSet,
    org.isSuperAdmin,
  );

  return (
    <OrgContextProvider value={org}>
      <SidebarProvider>
        <AppSidebar
          institutionName={institution.name}
          userName={userName}
          userEmail={userEmail}
          navItems={visibleNavItems}
        />
        <SidebarInset>
          <header className="flex h-16 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {/* Breadcrumb goes here — populated per page */}
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </OrgContextProvider>
  );
}
```

**Step 1: Write the file** (above)

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/app/(org)/dashboard/layout.tsx
git commit -m "feat: add dashboard layout with sidebar-08 shell and org context resolution"
```

---

## Task 13: Dashboard placeholder pages

Minimal pages so routes resolve. Each calls `assertPermission()` before rendering.

**Files:**
- Create: `src/app/(org)/dashboard/page.tsx`
- Create: `src/app/(org)/dashboard/(academics)/attendance/page.tsx`
- Create: `src/app/(org)/dashboard/(academics)/grades/page.tsx`
- Create: `src/app/(org)/dashboard/(finance)/fees/page.tsx`
- Create: `src/app/(org)/dashboard/(admin)/members/page.tsx`
- Create: `src/app/(org)/dashboard/(admin)/roles/page.tsx`

**Dashboard overview** (`src/app/(org)/dashboard/page.tsx`):
```tsx
import { getCurrentInstitution } from "@/server/auth/get-current-institution";

export default async function DashboardPage() {
  const institution = await getCurrentInstitution();
  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome to {institution.name}</h1>
      <p className="text-muted-foreground mt-1">Select a module from the sidebar to get started.</p>
    </div>
  );
}
```

**Attendance page** (`src/app/(org)/dashboard/(academics)/attendance/page.tsx`):
```tsx
import { getCurrentInstitution } from "@/server/auth/get-current-institution";
import { requireOrgAccess, assertPermission } from "@/server/auth/require-org-access";

export default async function AttendancePage() {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);
  assertPermission(org, "attendance:read");

  return <h1 className="text-2xl font-bold">Attendance</h1>;
}
```

Create identical placeholder pages for `grades` (permission: `grades:read`), `fees` (permission: `fees:read`), `members` (permission: `members:invite`), `roles` (permission: `roles:manage`) — same pattern, different permission slug and heading.

**Step 1: Write all 6 files** (above patterns)

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/app/(org)/dashboard/
git commit -m "feat: add dashboard placeholder pages with permission enforcement"
```

---

## Task 14: Update root page and layout metadata

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

**Root page** — redirect to dashboard (proxy handles auth, so if not logged in it'll redirect to sign-in):

```tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
```

**layout.tsx** — update metadata title:

```tsx
export const metadata: Metadata = {
  title: "EduERP",
  description: "Education ERP Platform",
};
```

**Step 1: Update both files**

**Step 2: Run all tests**

```bash
bun test
```

Expected: all PASS (nav.test.ts + existing tests).

**Step 3: Typecheck**

```bash
bun run typecheck
```

**Step 4: Final commit**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat: redirect root to dashboard, update metadata"
```

---

## Done

The platform now has:

- `src/server/auth/` — server-only helpers: `getCurrentInstitution`, `getCurrentInstitutionBranding`, `requireOrgAccess`, `assertPermission`
- `src/app/(public)/auth/` — institution-branded sign-in, sign-up, 2FA pages
- `src/app/(org)/dashboard/` — sidebar-08 shell with role-filtered nav, org context resolution
- `src/lib/nav.ts` — nav items with permission declarations and pure filtering function
- `src/components/providers/org-context.tsx` — React context for client components
- `src/components/dashboard/app-sidebar.tsx` — sidebar-08 with grouped, filtered nav
