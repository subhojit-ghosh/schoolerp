# Auth UI + Dashboard Shell Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build institution-aware auth pages (sign-in, sign-up, 2FA) and the dashboard shell (sidebar-08, role-filtered nav, server-only access resolution) on top of the existing Better Auth + RBAC foundation.

**Architecture:** Subdomain-first tenant resolution. Middleware guarantees `x-institution-slug` header on every non-public request. Server-only helpers resolve institution context and org access once in layout — children never re-fetch. Nav filtering is UX only; route handlers always enforce permissions independently.

**UI:** login-02 block for auth pages, sidebar-08 block for dashboard shell. Forms use react-hook-form + zod.

---

## Route Structure

```
src/app/
  (public)/
    auth/
      sign-in/page.tsx
      sign-up/page.tsx
      2fa/page.tsx

  (org)/
    dashboard/
      layout.tsx              ← single root resolution, passes context down
      page.tsx                ← overview placeholder
      (academics)/
        attendance/page.tsx
        grades/page.tsx
      (finance)/
        fees/page.tsx
      (admin)/
        members/page.tsx
        roles/page.tsx
```

Route groups `(public)` and `(org)` are Next.js App Router conventions — they do not appear in URLs.

---

## Tenant Resolution

`proxy.ts` (Next.js 16 middleware) resolves institution from subdomain and sets `x-institution-slug` on every request. If no subdomain is found, it returns 400 — no silent fallback to a default tenant.

Local dev: `school-a.localhost:3000` — modern browsers auto-resolve `*.localhost`, no `/etc/hosts` entry needed.

---

## Server-Only Auth Helpers

All access resolution logic lives in `src/server/auth/`. These files import `server-only` to prevent accidental bundling into client components.

### `getCurrentInstitutionBranding()`

Used by auth pages only (sign-in, sign-up, 2FA). Resolves institution branding without any membership or session check.

```ts
// src/server/auth/get-current-institution.ts
import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organization } from "@/lib/auth-schema";
import { eq } from "drizzle-orm";

export type InstitutionContext = {
  id: string;
  slug: string;
  name: string;
  branding: {
    logoUrl: string | null;
    primaryColor: string | null;
  };
};

export async function getCurrentInstitution(): Promise<InstitutionContext> {
  const slug = (await headers()).get("x-institution-slug");
  if (!slug) throw new Error("Invariant: institution context missing");
  // DB lookup — proxy guarantees slug is valid, but query handles unknown slugs
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1);
  if (!org) throw new Error("Invariant: institution not found for slug: " + slug);
  return {
    id: org.id,
    slug: org.slug,
    name: org.name,
    branding: {
      logoUrl: null,       // extend organization table with logoUrl later
      primaryColor: null,  // extend organization table with primaryColor later
    },
  };
}

export async function getCurrentInstitutionBranding() {
  const ctx = await getCurrentInstitution();
  return { slug: ctx.slug, name: ctx.name, ...ctx.branding };
}
```

### `requireOrgAccess(institutionId)`

Used by `(org)/dashboard/layout.tsx`. Takes `institution.id` (already resolved by `getCurrentInstitution()`) to avoid a redundant slug→id lookup. Returns a fully self-sufficient `OrgContext`.

```ts
export type OrgContext = {
  institution: InstitutionContext;
  userId: string;
  membershipId: string;
  roles: Array<{ id: string; slug: string; roleType: string }>;
  permissionSet: Set<string>;
  academicYear: { id: string; name: string };
  isSuperAdmin: boolean;
};
```

Super admin bypass: `isSuperAdmin: true` is the flag — no `"*"` wildcard in `permissionSet`. `assertPermission` short-circuits at the top:

```ts
export function assertPermission(ctx: OrgContext, slug: string): void {
  if (ctx.isSuperAdmin) return;
  if (!ctx.permissionSet.has(slug)) throw new AuthError("Forbidden", 403);
}
```

Move existing `src/lib/auth/require-org-access.ts` → `src/server/auth/require-org-access.ts` and add `import "server-only"`.

---

## Dashboard Layout

```tsx
// src/app/(org)/dashboard/layout.tsx
import { getCurrentInstitution } from "@/server/auth/get-current-institution";
import { requireOrgAccess } from "@/server/auth/require-org-access";
import { OrgContextProvider } from "@/components/providers/org-context";
import { AppSidebar } from "@/components/dashboard/app-sidebar";

export default async function DashboardLayout({ children }) {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution.id);

  return (
    <OrgContextProvider value={org}>
      <AppSidebar org={org} />
      <main>{children}</main>
    </OrgContextProvider>
  );
}
```

`OrgContextProvider` is a client component that exposes `useOrgContext()` for client children that need role/permission info (e.g. for conditional UI rendering). It does NOT expose raw headers or DB data — only the resolved `OrgContext`.

---

## Nav Filtering

Nav items are declared with a required permission:

```ts
const NAV_ITEMS = [
  { label: "Attendance", href: "/dashboard/attendance", permission: "attendance:read" },
  { label: "Grades",     href: "/dashboard/grades",     permission: "grades:read" },
  { label: "Fees",       href: "/dashboard/fees",       permission: "fees:read" },
  { label: "Members",    href: "/dashboard/members",    permission: "members:invite" },
  { label: "Roles",      href: "/dashboard/roles",      permission: "roles:manage" },
];
```

Sidebar filters at render time:

```ts
const visibleItems = org.isSuperAdmin
  ? NAV_ITEMS
  : NAV_ITEMS.filter((item) => org.permissionSet.has(item.permission));
```

**Nav filtering is UX only.** Every route handler still calls `assertPermission()` before any data query.

---

## Auth Pages

All auth pages call `getCurrentInstitutionBranding()` to render the institution name on the left panel of the login-02 block. They do NOT call `requireOrgAccess`.

- **sign-in**: email + password → `authClient.signIn.email()` — react-hook-form + zod schema
- **sign-up**: name + email + password → `authClient.signUp.email()` — react-hook-form + zod
- **2fa**: OTP input → `authClient.twoFactor.verifyTotp()` — shown after sign-in redirect when session requires 2FA

After successful sign-in, redirect to `/dashboard`. The proxy will verify the session on the next request.

---

## Key Constraints

- `src/server/auth/` files must import `"server-only"` — never importable in client components
- Missing `x-institution-slug` header → invariant error (system bug), not user-facing 400
- No wildcard `"*"` in permissionSet — use `isSuperAdmin` flag for bypass
- `requireOrgAccess` accepts `institutionId` (not slug) to avoid double lookup
- Nav filtering never substitutes for `assertPermission()` in route handlers
