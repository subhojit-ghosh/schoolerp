# Magic Strings Elimination Design

**Date:** 2026-03-05
**Status:** Approved

## Problem

Magic strings are scattered across the codebase with no central source of truth. Key categories affected:

- Route paths (25+ occurrences across `proxy.ts`, page files, components, auth-client)
- Permission slugs (`attendance:read`, `roles:manage`, etc.) used in nav, seeds, auth
- Role slugs (`institution_admin`, `teacher`, etc.) used in seeds, permissions logic
- Custom request headers (`x-institution-slug`, `x-user-id`) used in proxy and server code
- Status/enum values (`active`, `suspended`, `pending`) used in schema and server logic
- Cookie names (`two_factor`)
- Validation error messages duplicated across sign-in, sign-up, and setup forms

## Solution

Two-layer approach:

### Layer 1 — `typedRoutes: true` (Next.js compile-time route validation)

Enable in `next.config.ts`. Next.js generates a `.d.ts` from the actual `app/` directory. TypeScript validates all `<Link href>`, `router.push()`, `router.replace()`, and `redirect()` calls against real routes at compile time. Typos become build errors for free.

Requires `.next/types/**/*.ts` in `tsconfig.json` `include` array.

### Layer 2 — `src/constants/` (centralized constant files)

For non-typed usages (proxy path comparisons, `NextResponse.redirect`, server logic) and all non-route strings.

```
src/constants/
  routes.ts       # ROUTES.* — proxy path matching + non-typed redirect contexts
  permissions.ts  # PERMISSIONS.FEES.READ, PERMISSIONS.ROLES.MANAGE, etc.
  roles.ts        # ROLES.INSTITUTION_ADMIN, ROLES.TEACHER, etc.
  headers.ts      # HEADERS.INSTITUTION_SLUG, HEADERS.USER_ID, HEADERS.INSTITUTION_ID
  status.ts       # STATUS.ORG.ACTIVE, STATUS.MEMBER.SUSPENDED, etc.
  cookies.ts      # COOKIES.TWO_FACTOR
  validation.ts   # Shared zod field validators / error messages
  index.ts        # Re-exports all
```

## Constant Shapes (representative examples)

```ts
// routes.ts
export const ROUTES = {
  DASHBOARD: "/dashboard",
  AUTH: {
    SIGN_IN: "/auth/sign-in",
    SIGN_UP: "/auth/sign-up",
    TWO_FA: "/auth/2fa",
  },
  ADMIN: {
    SIGN_IN: "/admin/auth/sign-in",
    TWO_FA: "/admin/auth/2fa",
    SETUP: "/admin/setup",
  },
  API: {
    AUTH: "/api/auth",
    SETUP: "/api/setup/",
  },
} as const;

// permissions.ts
export const PERMISSIONS = {
  FEES: { READ: "fees:read", WRITE: "fees:write", DELETE: "fees:delete" },
  ATTENDANCE: { READ: "attendance:read", WRITE: "attendance:write" },
  STUDENTS: { READ: "students:read", WRITE: "students:write", DELETE: "students:delete" },
  GRADES: { READ: "grades:read", WRITE: "grades:write" },
  ROLES: { MANAGE: "roles:manage" },
  MEMBERS: { INVITE: "members:invite" },
  REPORTS: { EXPORT: "reports:export" },
  LIBRARY: { READ: "library:read", WRITE: "library:write" },
  ADMISSIONS: { READ: "admissions:read", WRITE: "admissions:write" },
} as const;

// roles.ts
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  INSTITUTION_ADMIN: "institution_admin",
  PRINCIPAL: "principal",
  TEACHER: "teacher",
  ACCOUNTANT: "accountant",
  LIBRARIAN: "librarian",
  RECEPTIONIST: "receptionist",
  STUDENT: "student",
  PARENT: "parent",
} as const;

// headers.ts
export const HEADERS = {
  INSTITUTION_ID: "x-institution-id",
  INSTITUTION_SLUG: "x-institution-slug",
  USER_ID: "x-user-id",
} as const;

// status.ts
export const STATUS = {
  ORG: { ACTIVE: "active", SUSPENDED: "suspended" },
  MEMBER: { ACTIVE: "active", INACTIVE: "inactive", SUSPENDED: "suspended" },
  INVITATION: { PENDING: "pending" },
  ACADEMIC_YEAR: { ACTIVE: "active", ARCHIVED: "archived" },
} as const;

// cookies.ts
export const COOKIES = {
  TWO_FACTOR: "two_factor",
} as const;

// validation.ts — shared zod field validators (not raw strings)
import { z } from "zod";
export const V = {
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
};
```

## What is NOT changed

- DB table/column name strings inside Drizzle `pgTable()` schema definitions — Drizzle schema is the source of truth
- Internal Better Auth configuration strings

## Files to Update After Constants Are Created

- `src/proxy.ts` — routes, headers, cookies
- `src/app/page.tsx` — headers, routes
- `src/lib/auth-client.ts` — routes
- `src/lib/auth/permissions.ts` — role type strings, role slugs
- `src/lib/nav.ts` — permissions, routes
- `src/app/(org)/auth/sign-in/page.tsx` — routes, validation
- `src/app/(org)/auth/sign-up/page.tsx` — routes, validation
- `src/app/(org)/auth/2fa/page.tsx` — routes
- `src/components/org/app-sidebar.tsx` — routes
- `src/components/platform/platform-sign-out-button.tsx` — routes
- `src/components/platform/platform-sign-in-form.tsx` — routes
- `src/server/auth/require-org-access.ts` — status
- `src/server/institutions/get-current.ts` — headers
- `src/db/seeds/index.ts` — roles, permissions
- `src/lib/auth.ts` — status
- `src/lib/tenant.ts` — subdomain ignore list (minor)
