# Magic Strings Elimination Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all magic strings in the codebase with typed constants in `src/constants/`, and enable Next.js `typedRoutes` for compile-time route validation.

**Architecture:** Two layers: (1) `typedRoutes: true` in `next.config.ts` gives free compile-time validation for route strings used in `<Link>`, `router.push()`, and `redirect()`; (2) `src/constants/` holds typed `as const` objects for routes, permissions, roles, headers, status values, cookies, and shared zod validators. All consumer files are updated to import from constants.

**Tech Stack:** TypeScript (`as const`, `typeof`), Zod (shared validators), Next.js `typedRoutes`

---

### Task 1: Enable typedRoutes

**Files:**
- Modify: `next.config.ts`

**Step 1: Enable typedRoutes**

Replace the contents of `next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
};

export default nextConfig;
```

**Step 2: Run typecheck**

```bash
bun run typecheck
```

Expected: passes (no existing route references are broken yet — they're all plain strings that Next.js will validate once the `.d.ts` is generated at dev/build time).

**Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: enable typedRoutes for compile-time route validation"
```

---

### Task 2: Create `src/constants/` files

**Files:**
- Create: `src/constants/routes.ts`
- Create: `src/constants/permissions.ts`
- Create: `src/constants/roles.ts`
- Create: `src/constants/headers.ts`
- Create: `src/constants/status.ts`
- Create: `src/constants/cookies.ts`
- Create: `src/constants/validation.ts`
- Create: `src/constants/index.ts`

**Step 1: Create `src/constants/routes.ts`**

```ts
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
    AUTH_PREFIX: "/api/auth",
    SETUP_PREFIX: "/api/setup/",
  },
} as const;
```

**Step 2: Create `src/constants/permissions.ts`**

```ts
export const PERMISSIONS = {
  FEES: {
    READ: "fees:read",
    WRITE: "fees:write",
    DELETE: "fees:delete",
  },
  ATTENDANCE: {
    READ: "attendance:read",
    WRITE: "attendance:write",
  },
  STUDENTS: {
    READ: "students:read",
    WRITE: "students:write",
    DELETE: "students:delete",
  },
  GRADES: {
    READ: "grades:read",
    WRITE: "grades:write",
  },
  ROLES: {
    MANAGE: "roles:manage",
  },
  MEMBERS: {
    INVITE: "members:invite",
  },
  REPORTS: {
    EXPORT: "reports:export",
  },
  LIBRARY: {
    READ: "library:read",
    WRITE: "library:write",
  },
  ADMISSIONS: {
    READ: "admissions:read",
    WRITE: "admissions:write",
  },
} as const;
```

**Step 3: Create `src/constants/roles.ts`**

```ts
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

export const ROLE_TYPES = {
  PLATFORM: "platform",
  SYSTEM: "system",
  STAFF: "staff",
} as const;
```

**Step 4: Create `src/constants/headers.ts`**

```ts
export const HEADERS = {
  INSTITUTION_ID: "x-institution-id",
  INSTITUTION_SLUG: "x-institution-slug",
  USER_ID: "x-user-id",
} as const;
```

**Step 5: Create `src/constants/status.ts`**

```ts
export const STATUS = {
  ORG: {
    ACTIVE: "active",
    SUSPENDED: "suspended",
  },
  MEMBER: {
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended",
  },
  INVITATION: {
    PENDING: "pending",
  },
  ACADEMIC_YEAR: {
    ACTIVE: "active",
    ARCHIVED: "archived",
  },
} as const;
```

**Step 6: Create `src/constants/cookies.ts`**

```ts
export const COOKIES = {
  TWO_FACTOR: "two_factor",
} as const;
```

**Step 7: Create `src/constants/validation.ts`**

This exports shared zod field schemas so the same error messages are never duplicated across forms.

```ts
import { z } from "zod";

export const V = {
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
};
```

**Step 8: Create `src/constants/index.ts`**

```ts
export * from "./routes";
export * from "./permissions";
export * from "./roles";
export * from "./headers";
export * from "./status";
export * from "./cookies";
export * from "./validation";
```

**Step 9: Run typecheck**

```bash
bun run typecheck
```

Expected: passes (constants files are self-contained, no consumers changed yet).

**Step 10: Commit**

```bash
git add src/constants/
git commit -m "feat: add src/constants/ with routes, permissions, roles, headers, status, cookies, validation"
```

---

### Task 3: Update `src/proxy.ts`

**Files:**
- Modify: `src/proxy.ts`

Current magic strings: route path strings, `"x-institution-id"`, `"x-institution-slug"`, `"x-user-id"`, `"two_factor"`.

**Step 1: Update the file**

Replace the top of `src/proxy.ts` — add imports and replace all magic strings:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveInstitutionFromRequest } from "@/lib/tenant";
import { ROUTES, HEADERS, COOKIES } from "@/constants";

// Completely bypass — Better Auth handles these internally
const isApiAuthRoute = (path: string) => path.startsWith(ROUTES.API.AUTH_PREFIX);
const isSetupRoute = (path: string) =>
  path === ROUTES.ADMIN.SETUP || path.startsWith(ROUTES.ADMIN.SETUP + "/");
const isSetupApiRoute = (path: string) => path.startsWith(ROUTES.API.SETUP_PREFIX);
const isPlatformAuthPage = (path: string) =>
  path === ROUTES.ADMIN.SIGN_IN || path === ROUTES.ADMIN.TWO_FA;
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
    request.headers.get("host"),
    request.headers.get(HEADERS.INSTITUTION_ID),
  );
  const hasTwoFactorCookie = request.cookies.has(COOKIES.TWO_FACTOR);
  const isOrgCleanPath = institutionSlug ? ORG_CLEAN_PATHS.has(pathname) : false;

  // Admin routes are root-domain only — never accessible from a subdomain
  if (institutionSlug && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!institutionSlug && pathname === "/") {
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
  if (!institutionSlug) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      if (hasTwoFactorCookie) {
        return NextResponse.redirect(new URL(ROUTES.ADMIN.TWO_FA, request.url));
      }
      return NextResponse.redirect(new URL(ROUTES.ADMIN.SIGN_IN, request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(HEADERS.USER_ID, session.user.id);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Org-scoped routes: institution slug required
  const isOrgScopedRoute =
    pathname.startsWith(ROUTES.DASHBOARD) ||
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
      return NextResponse.redirect(new URL(ROUTES.AUTH.TWO_FA, request.url));
    }
    return NextResponse.redirect(new URL(ROUTES.AUTH.SIGN_IN, request.url));
  }

  // Pass resolved context downstream via request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(HEADERS.USER_ID, session.user.id);
  if (institutionSlug) {
    requestHeaders.set(HEADERS.INSTITUTION_SLUG, institutionSlug);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 2: Run typecheck**

```bash
bun run typecheck
```

Expected: passes.

**Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "refactor: replace magic strings in proxy.ts with constants"
```

---

### Task 4: Update `src/lib/` files

**Files:**
- Modify: `src/lib/auth-client.ts`
- Modify: `src/lib/auth/permissions.ts`
- Modify: `src/lib/nav.ts`

**Step 1: Update `src/lib/auth-client.ts`**

Add import and replace route strings on lines 15 and 27:

```ts
"use client";

import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";
import { ROUTES } from "@/constants";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",

  plugins: [
    organizationClient(),

    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = ROUTES.AUTH.TWO_FA;
      },
    }),
  ],
});

export const platformAuthClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",

  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/2fa";
      },
    }),
  ],
});

// Named exports for convenience
export const { signIn, signOut, signUp, useSession } = authClient;
```

Note: `/2fa` on line 27 is the platform 2FA route — it's not currently in `ROUTES` because the platform 2FA page appears to be at `/admin/auth/2fa`. Leave this as-is until the platform routing is clarified, or add `ROUTES.ADMIN.TWO_FA` if that's the intended redirect.

**Step 2: Update `src/lib/auth/permissions.ts`**

Add imports and replace role type and slug strings on lines 33-34:

```ts
import { ROLE_TYPES, ROLES } from "@/constants";

export type RoleForPermissions = {
  permissions: string[];
};

export type RoleFor2FA = {
  role_type: string;
  slug: string;
};

/** Union all permissions across all active roles. Default deny — empty set = no access. */
export function resolvePermissions(roles: RoleForPermissions[]): Set<string> {
  const set = new Set<string>();
  for (const role of roles) {
    for (const perm of role.permissions) {
      set.add(perm);
    }
  }
  return set;
}

/** Default deny: returns false if permission not in set. */
export function checkPermission(permissionSet: Set<string>, slug: string): boolean {
  return permissionSet.has(slug);
}

/**
 * Returns true if ANY resolved role requires 2FA enforcement.
 * Rule: role_type='platform' OR (role_type='system' AND slug='institution_admin')
 */
export function requires2FA(roles: RoleFor2FA[]): boolean {
  return roles.some(
    (r) =>
      r.role_type === ROLE_TYPES.PLATFORM ||
      (r.role_type === ROLE_TYPES.SYSTEM && r.slug === ROLES.INSTITUTION_ADMIN),
  );
}

/** Permission slugs must be 'resource:action' with exactly one colon. */
export function isValidPermissionSlug(slug: string): boolean {
  if (!slug) return false;
  const parts = slug.split(":");
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}
```

**Step 3: Update `src/lib/nav.ts`**

Replace permission and route strings with constants:

```ts
import { PERMISSIONS, ROUTES } from "@/constants";

export type NavItem = {
  label: string;
  href: string;
  permission: string;
  icon: string; // lucide icon name
  group: "academics" | "finance" | "admin";
};

export const NAV_ITEMS: NavItem[] = [
  // Academics
  { label: "Attendance",  href: "/attendance", permission: PERMISSIONS.ATTENDANCE.READ, icon: "CalendarCheck",  group: "academics" },
  { label: "Grades",      href: "/grades",     permission: PERMISSIONS.GRADES.READ,     icon: "GraduationCap",  group: "academics" },
  { label: "Students",    href: "/students",   permission: PERMISSIONS.STUDENTS.READ,   icon: "Users",          group: "academics" },
  // Finance
  { label: "Fees",        href: "/fees",       permission: PERMISSIONS.FEES.READ,       icon: "CreditCard",     group: "finance" },
  { label: "Reports",     href: "/reports",    permission: PERMISSIONS.REPORTS.EXPORT,  icon: "BarChart2",      group: "finance" },
  // Admin
  { label: "Members",     href: "/members",    permission: PERMISSIONS.MEMBERS.INVITE,  icon: "UserPlus",       group: "admin" },
  { label: "Roles",       href: "/roles",      permission: PERMISSIONS.ROLES.MANAGE,    icon: "Shield",         group: "admin" },
  { label: "Admissions",  href: "/admissions", permission: PERMISSIONS.ADMISSIONS.READ, icon: "ClipboardList",  group: "admin" },
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

**Step 4: Run typecheck**

```bash
bun run typecheck
```

Expected: passes.

**Step 5: Commit**

```bash
git add src/lib/auth-client.ts src/lib/auth/permissions.ts src/lib/nav.ts
git commit -m "refactor: replace magic strings in lib/ with constants"
```

---

### Task 5: Update auth form pages

**Files:**
- Modify: `src/app/(org)/auth/sign-in/page.tsx`
- Modify: `src/app/(org)/auth/sign-up/page.tsx`
- Modify: `src/app/(org)/auth/2fa/page.tsx`

**Step 1: Update `src/app/(org)/auth/sign-in/page.tsx`**

Replace the `schema` definition (lines 12-15) and `router.push` (line 42) and the sign-up `<a href>` (line 90):

```ts
import { V, ROUTES } from "@/constants";

const schema = z.object({
  email: V.email,
  password: V.password,
});
```

In `onSubmit`:
```ts
router.push(ROUTES.DASHBOARD);
```

In JSX:
```tsx
<a href={ROUTES.AUTH.SIGN_UP} className="text-foreground underline underline-offset-4">
  Sign up
</a>
```

**Step 2: Update `src/app/(org)/auth/sign-up/page.tsx`**

Replace the `schema` definition (lines 12-16) and `router.push` (line 44) and the sign-in `<a href>` (line 104):

```ts
import { V, ROUTES } from "@/constants";

const schema = z.object({
  name: V.name,
  email: V.email,
  password: V.password,
});
```

In `onSubmit`:
```ts
router.push(ROUTES.DASHBOARD);
```

In JSX:
```tsx
<a href={ROUTES.AUTH.SIGN_IN} className="text-foreground underline underline-offset-4">
  Sign in
</a>
```

**Step 3: Update `src/app/(org)/auth/2fa/page.tsx`**

Replace `router.push` on line 43:

```ts
import { ROUTES } from "@/constants";
// ...
router.push(ROUTES.DASHBOARD);
```

**Step 4: Run typecheck**

```bash
bun run typecheck
```

Expected: passes.

**Step 5: Commit**

```bash
git add src/app/\(org\)/auth/
git commit -m "refactor: replace magic strings in org auth pages with constants"
```

---

### Task 6: Update platform components

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/org/app-sidebar.tsx`
- Modify: `src/components/platform/platform-sign-out-button.tsx`
- Modify: `src/components/platform/platform-sign-in-form.tsx`

**Step 1: Update `src/app/page.tsx`**

Replace header reads and redirect strings (lines 17, 57, 63):

```ts
import { HEADERS, ROUTES } from "@/constants";
// ...
const institutionSlug = (await headers()).get(HEADERS.INSTITUTION_SLUG);
// ...
redirect(ROUTES.ADMIN.SETUP);
// ...
redirect(ROUTES.ADMIN.SIGN_IN);
```

**Step 2: Update `src/components/org/app-sidebar.tsx`**

Replace `router.push` on line 56:

```ts
import { ROUTES } from "@/constants";
// ...
router.push(ROUTES.AUTH.SIGN_IN);
```

**Step 3: Update `src/components/platform/platform-sign-out-button.tsx`**

Replace `router.push("/sign-in")` on line 12. Note: current value is `/sign-in` which looks like it may be a bug (should probably be `/admin/auth/sign-in`). Verify the intended route — if it's the platform sign-in, use `ROUTES.ADMIN.SIGN_IN`:

```ts
import { ROUTES } from "@/constants";
// ...
router.push(ROUTES.ADMIN.SIGN_IN);
```

**Step 4: Update `src/components/platform/platform-sign-in-form.tsx`**

Replace the `schema` definition (lines 12-15) and `router.push("/")` (line 42):

```ts
import { V, ROUTES } from "@/constants";

const schema = z.object({
  email: V.email,
  password: V.password,
});
```

In `onSubmit`:
```ts
router.push("/");
```

The `/` redirect is intentional (post-login goes to root), so no change needed there — but you can use `"/" as const` or leave it as a literal (it's already typed by `typedRoutes`).

**Step 5: Run typecheck**

```bash
bun run typecheck
```

Expected: passes.

**Step 6: Commit**

```bash
git add src/app/page.tsx src/components/
git commit -m "refactor: replace magic strings in page.tsx and components with constants"
```

---

### Task 7: Update server-side code

**Files:**
- Modify: `src/server/auth/require-org-access.ts`
- Modify: `src/server/institutions/get-current.ts`

**Step 1: Update `src/server/auth/require-org-access.ts`**

Replace `"suspended"` (line 82) and `"active"` (line 121):

```ts
import { STATUS } from "@/constants";
// ...
if (institution.status === STATUS.ORG.SUSPENDED) {
  throw new AuthError("Forbidden", 403);
}
// ...
eq(memberTable.status, STATUS.MEMBER.ACTIVE),
```

**Step 2: Update `src/server/institutions/get-current.ts`**

Replace `"x-institution-slug"` (line 25) and the `"active"` fallback (line 47):

```ts
import { HEADERS, STATUS } from "@/constants";
// ...
const slug = (await headers()).get(HEADERS.INSTITUTION_SLUG);
if (!slug) {
  throw new Error("Invariant: x-institution-slug header missing — check proxy configuration");
}
// ...
status: org.status ?? STATUS.ORG.ACTIVE,
```

**Step 3: Run typecheck**

```bash
bun run typecheck
```

Expected: passes.

**Step 4: Commit**

```bash
git add src/server/
git commit -m "refactor: replace magic strings in server code with constants"
```

---

### Task 8: Update seeds and `src/lib/auth.ts`

**Files:**
- Modify: `src/db/seeds/index.ts`
- Modify: `src/lib/auth.ts`

**Step 1: Update `src/db/seeds/index.ts`**

The seeds file is the *definition* of roles and permissions — the `ROLES` and `PERMISSIONS` constants are derived from the real domain values. So the seeds file itself can import from constants to eliminate duplicated slug strings in `ROLE_PERMISSIONS`:

```ts
import { ROLES, PERMISSIONS } from "@/constants";

// Replace ROLE_PERMISSIONS keys and values:
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.INSTITUTION_ADMIN]: ALL_PERMISSION_SLUGS,
  [ROLES.PRINCIPAL]: ALL_PERMISSION_SLUGS.filter(
    (s) => s !== PERMISSIONS.ROLES.MANAGE && s !== PERMISSIONS.MEMBERS.INVITE,
  ),
  [ROLES.TEACHER]: [
    PERMISSIONS.ATTENDANCE.WRITE,
    PERMISSIONS.STUDENTS.READ,
    PERMISSIONS.GRADES.READ,
    PERMISSIONS.GRADES.WRITE,
  ],
  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.FEES.READ,
    PERMISSIONS.FEES.WRITE,
    PERMISSIONS.REPORTS.EXPORT,
  ],
  [ROLES.LIBRARIAN]: [PERMISSIONS.LIBRARY.READ, PERMISSIONS.LIBRARY.WRITE],
  [ROLES.RECEPTIONIST]: [PERMISSIONS.STUDENTS.READ, PERMISSIONS.ADMISSIONS.READ],
  [ROLES.STUDENT]: [PERMISSIONS.STUDENTS.READ],
  [ROLES.PARENT]: [
    PERMISSIONS.STUDENTS.READ,
    PERMISSIONS.GRADES.READ,
    PERMISSIONS.ATTENDANCE.READ,
    PERMISSIONS.FEES.READ,
  ],
  [ROLES.SUPER_ADMIN]: [],
};
```

The `BUILT_IN_ROLES` array contains role IDs and slugs that are the canonical definitions — leave the string literals there since they ARE the source of truth (the constants are derived from them conceptually, not the other way around). The ROLE_PERMISSIONS mapping is the main win.

**Step 2: Update `src/lib/auth.ts`**

Replace the `"active"` defaultValues (lines 49, 58) with `STATUS` constants:

```ts
import { STATUS } from "@/constants";
// ...
status: {
  type: "string",
  required: false,
  defaultValue: STATUS.ORG.ACTIVE,
},
// ...
status: {
  type: "string",
  required: false,
  defaultValue: STATUS.MEMBER.ACTIVE,
},
```

**Step 3: Run typecheck**

```bash
bun run typecheck
```

Expected: passes.

**Step 4: Commit**

```bash
git add src/db/seeds/index.ts src/lib/auth.ts
git commit -m "refactor: replace magic strings in seeds and auth.ts with constants"
```

---

### Task 9: Final verification

**Step 1: Run full typecheck**

```bash
bun run typecheck
```

Expected: zero errors.

**Step 2: Verify no bare magic strings remain**

Search for common patterns to confirm nothing was missed:

```bash
# Should return no results outside constants/ and schema files
grep -rn '"x-institution-slug"\|"x-user-id"\|"x-institution-id"' src/ --include="*.ts" --include="*.tsx" | grep -v "src/constants/"

grep -rn '"fees:read"\|"roles:manage"\|"attendance:read"' src/ --include="*.ts" --include="*.tsx" | grep -v "src/constants/"

grep -rn '"/dashboard"\|"/auth/sign-in"\|"/admin/auth/sign-in"' src/ --include="*.ts" --include="*.tsx" | grep -v "src/constants/"
```

Expected: no output for each command.

**Step 3: Commit if any cleanup needed, then done**

```bash
git add -p  # stage any remaining cleanup
git commit -m "refactor: final magic string cleanup"
```
