# Dashboard Visual Refresh + Navigation Expansion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle the dashboard shell to match Linear/Stripe/GitHub aesthetics and expand the navigation from 3 to 6 groups with new placeholder pages.

**Architecture:** No structural changes. The existing shadcn Sidebar component, SidebarProvider/SidebarInset layout, role-based `filterNavItems()`, mobile sheet, DataTable with nuqs, and auth guards all remain untouched. We update constants, add nav items, refine CSS classes on existing components, and add placeholder pages.

**Tech Stack:** Next.js 16, shadcn (base-ui), Tailwind CSS 4, lucide-react, nuqs, @tanstack/react-table

---

## Task 1: Expand constants — routes, permissions, nav groups

**Files:**
- Modify: `src/constants/routes.ts`
- Modify: `src/constants/permissions.ts`
- Modify: `src/constants/nav.ts`

**Step 1: Add new routes**

Add to `ROUTES.ORG` in `src/constants/routes.ts`:

```ts
export const ROUTES = {
  // ... existing
  ORG: {
    ROOT: "/",
    ATTENDANCE: "/attendance",
    GRADES: "/grades",
    STUDENTS: "/students",
    FEES: "/fees",
    REPORTS: "/reports",
    MEMBERS: "/members",
    ROLES: "/roles",
    ADMISSIONS: "/admissions",
    // New routes
    DASHBOARD: "/dashboard",
    CLASSES: "/classes",
    TEACHERS: "/teachers",
    EXAMS: "/exams",
    INVOICES: "/invoices",
    MESSAGES: "/messages",
    ANNOUNCEMENTS: "/announcements",
    SETTINGS: "/settings",
  },
  // ... rest unchanged
} as const;
```

**Step 2: Add new permissions**

Add to `PERMISSIONS` in `src/constants/permissions.ts`:

```ts
export const PERMISSIONS = {
  // ... existing entries unchanged
  CLASSES: {
    READ: "classes:read",
    WRITE: "classes:write",
  },
  TEACHERS: {
    READ: "teachers:read",
    WRITE: "teachers:write",
  },
  EXAMS: {
    READ: "exams:read",
    WRITE: "exams:write",
  },
  INVOICES: {
    READ: "invoices:read",
    WRITE: "invoices:write",
  },
  COMMUNICATION: {
    READ: "communication:read",
    WRITE: "communication:write",
  },
  SETTINGS: {
    READ: "settings:read",
    WRITE: "settings:write",
  },
} as const;
```

**Step 3: Expand nav groups**

Replace `src/constants/nav.ts` with:

```ts
export const NAV_GROUPS = {
  CORE: "core",
  ACADEMICS: "academics",
  OPERATIONS: "operations",
  FINANCE: "finance",
  COMMUNICATION: "communication",
  ADMIN: "admin",
} as const;

export type NavGroup = (typeof NAV_GROUPS)[keyof typeof NAV_GROUPS];

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  [NAV_GROUPS.CORE]: "Core",
  [NAV_GROUPS.ACADEMICS]: "Academics",
  [NAV_GROUPS.OPERATIONS]: "Operations",
  [NAV_GROUPS.FINANCE]: "Finance",
  [NAV_GROUPS.COMMUNICATION]: "Communication",
  [NAV_GROUPS.ADMIN]: "Administration",
};

export const NAV_GROUP_ORDER: readonly NavGroup[] = [
  NAV_GROUPS.CORE,
  NAV_GROUPS.ACADEMICS,
  NAV_GROUPS.OPERATIONS,
  NAV_GROUPS.FINANCE,
  NAV_GROUPS.COMMUNICATION,
  NAV_GROUPS.ADMIN,
];
```

**Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: PASS (no type errors from removed/changed group keys)

**Step 5: Commit**

```
feat: expand constants with new routes, permissions, and nav groups
```

---

## Task 2: Expand nav items in `src/lib/nav.ts`

**Files:**
- Modify: `src/lib/nav.ts`
- Modify: `src/lib/nav.test.ts`

**Step 1: Update NAV_ITEMS**

Replace the `NAV_ITEMS` array in `src/lib/nav.ts`:

```ts
import { PERMISSIONS, NAV_GROUPS, ROUTES, type NavGroup } from "@/constants";

export type NavItem = {
  label: string;
  href: string;
  permission: string;
  icon: string; // lucide icon name
  group: NavGroup;
};

export const NAV_ITEMS: NavItem[] = [
  // Core
  { label: "Dashboard",     href: ROUTES.ORG.DASHBOARD,      permission: "",                          icon: "LayoutDashboard", group: NAV_GROUPS.CORE },
  // Academics
  { label: "Students",      href: ROUTES.ORG.STUDENTS,       permission: PERMISSIONS.STUDENTS.READ,   icon: "Users",           group: NAV_GROUPS.ACADEMICS },
  { label: "Classes",       href: ROUTES.ORG.CLASSES,        permission: PERMISSIONS.CLASSES.READ,    icon: "School",          group: NAV_GROUPS.ACADEMICS },
  { label: "Teachers",      href: ROUTES.ORG.TEACHERS,       permission: PERMISSIONS.TEACHERS.READ,   icon: "GraduationCap",   group: NAV_GROUPS.ACADEMICS },
  // Operations
  { label: "Attendance",    href: ROUTES.ORG.ATTENDANCE,     permission: PERMISSIONS.ATTENDANCE.READ,  icon: "CalendarCheck",   group: NAV_GROUPS.OPERATIONS },
  { label: "Exams",         href: ROUTES.ORG.EXAMS,          permission: PERMISSIONS.EXAMS.READ,       icon: "FileText",        group: NAV_GROUPS.OPERATIONS },
  { label: "Admissions",    href: ROUTES.ORG.ADMISSIONS,     permission: PERMISSIONS.ADMISSIONS.READ,  icon: "ClipboardList",   group: NAV_GROUPS.OPERATIONS },
  // Finance
  { label: "Fees",          href: ROUTES.ORG.FEES,           permission: PERMISSIONS.FEES.READ,        icon: "CreditCard",      group: NAV_GROUPS.FINANCE },
  { label: "Invoices",      href: ROUTES.ORG.INVOICES,       permission: PERMISSIONS.INVOICES.READ,    icon: "Receipt",         group: NAV_GROUPS.FINANCE },
  { label: "Reports",       href: ROUTES.ORG.REPORTS,        permission: PERMISSIONS.REPORTS.EXPORT,   icon: "BarChart2",       group: NAV_GROUPS.FINANCE },
  // Communication
  { label: "Messages",      href: ROUTES.ORG.MESSAGES,       permission: PERMISSIONS.COMMUNICATION.READ, icon: "MessageSquare", group: NAV_GROUPS.COMMUNICATION },
  { label: "Announcements", href: ROUTES.ORG.ANNOUNCEMENTS,  permission: PERMISSIONS.COMMUNICATION.READ, icon: "Megaphone",     group: NAV_GROUPS.COMMUNICATION },
  // Administration
  { label: "Members",       href: ROUTES.ORG.MEMBERS,        permission: PERMISSIONS.MEMBERS.INVITE,   icon: "UserPlus",        group: NAV_GROUPS.ADMIN },
  { label: "Roles",         href: ROUTES.ORG.ROLES,          permission: PERMISSIONS.ROLES.MANAGE,     icon: "Shield",          group: NAV_GROUPS.ADMIN },
  { label: "Settings",      href: ROUTES.ORG.SETTINGS,       permission: PERMISSIONS.SETTINGS.READ,    icon: "Settings",        group: NAV_GROUPS.ADMIN },
];
```

Note: Dashboard has `permission: ""` — it's always visible. Update `filterNavItems` to handle this:

```ts
export function filterNavItems(
  items: NavItem[],
  permissionSet: Set<string>,
  isSuperAdmin: boolean,
): NavItem[] {
  if (isSuperAdmin) return items;
  return items.filter((item) => !item.permission || permissionSet.has(item.permission));
}
```

**Step 2: Update the test**

Update `src/lib/nav.test.ts` to account for the Dashboard item (always visible, no permission):

```ts
import { describe, expect, test } from "bun:test";
import { filterNavItems, NAV_ITEMS } from "./nav";
import { PERMISSIONS } from "@/constants";

describe("filterNavItems", () => {
  test("returns all items for super admin", () => {
    const result = filterNavItems(NAV_ITEMS, new Set(), true);
    expect(result).toHaveLength(NAV_ITEMS.length);
  });

  test("returns only items matching permission set plus permissionless items", () => {
    const perms: Set<string> = new Set([PERMISSIONS.ATTENDANCE.READ, PERMISSIONS.GRADES.READ]);
    const result = filterNavItems(NAV_ITEMS, perms, false);
    const permissionlessCount = NAV_ITEMS.filter((i) => !i.permission).length;
    const matchedCount = NAV_ITEMS.filter((i) => i.permission && perms.has(i.permission)).length;
    expect(result).toHaveLength(permissionlessCount + matchedCount);
  });

  test("returns permissionless items when no permissions match", () => {
    const result = filterNavItems(NAV_ITEMS, new Set(), false);
    const permissionlessCount = NAV_ITEMS.filter((i) => !i.permission).length;
    expect(result).toHaveLength(permissionlessCount);
  });

  test("NAV_ITEMS has no duplicate hrefs", () => {
    const hrefs = NAV_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  test("dashboard is always visible regardless of permissions", () => {
    const result = filterNavItems(NAV_ITEMS, new Set(), false);
    expect(result.some((i) => i.label === "Dashboard")).toBe(true);
  });
});
```

**Step 3: Run tests**

Run: `bun test src/lib/nav.test.ts`
Expected: All 5 tests PASS

**Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 5: Commit**

```
feat: expand nav items with 6 groups and update filter for permissionless items
```

---

## Task 3: Restyle org sidebar (`app-sidebar.tsx`)

**Files:**
- Modify: `src/components/org/app-sidebar.tsx`

**Step 1: Restyle the sidebar**

Replace `src/components/org/app-sidebar.tsx` with refined version. Key changes:
- Active item: left border accent (`border-l-2 border-primary`) + subtle bg (`bg-sidebar-accent/50`), no full fill
- Group labels: uppercase, smaller, tracked
- Item gap: `gap-0.5` instead of default
- Simpler header (no chevron)
- Simpler footer

```tsx
"use client";

import Link from "next/link";
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
import { LogOut } from "lucide-react";
import * as Icons from "lucide-react";
import type { NavItem } from "@/lib/nav";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { ROUTES, NAV_GROUP_LABELS, NAV_GROUP_ORDER } from "@/constants";

type Props = {
  institutionName: string;
  userName: string;
  userEmail: string;
  navItems: NavItem[];
};

export function AppSidebar({ institutionName, userName, userEmail, navItems }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const groupedItems = NAV_GROUP_ORDER.map((group) => ({
    group,
    label: NAV_GROUP_LABELS[group],
    items: navItems.filter((item) => item.group === group),
  })).filter((g) => g.items.length > 0);

  async function handleSignOut() {
    await authClient.signOut();
    router.push(ROUTES.AUTH.SIGN_IN);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="bg-primary text-primary-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold">
            {institutionName.charAt(0)}
          </div>
          <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
            {institutionName}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groupedItems.map(({ group, label, items }) => (
          <SidebarGroup key={group} className="py-1">
            <SidebarGroupLabel className="text-[0.625rem] uppercase tracking-widest text-sidebar-foreground/50">
              {label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {items.map((item) => {
                  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[item.icon];
                  const isActive = pathname === item.href || (item.href !== ROUTES.ORG.DASHBOARD && pathname.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href as never} />}
                        isActive={isActive}
                        tooltip={item.label}
                        className={isActive ? "border-l-2 border-primary bg-sidebar-accent/50 rounded-l-none" : ""}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{item.label}</span>
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
              <DropdownMenuTrigger render={<SidebarMenuButton className="h-10" />}>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[0.625rem]">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium leading-none">{userName}</span>
                  <span className="text-muted-foreground text-[0.6875rem]">{userEmail}</span>
                </div>
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

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 3: Commit**

```
style: restyle org sidebar with Linear-inspired active state and compact spacing
```

---

## Task 4: Restyle admin sidebar (`admin-sidebar.tsx`)

**Files:**
- Modify: `src/components/platform/admin-sidebar.tsx`

**Step 1: Apply same visual refinements**

Key changes matching org sidebar:
- Active item: left border accent + subtle bg
- Tighter spacing
- Simpler header (no chevron, no ChevronsUpDown)
- Simpler footer
- Smaller avatar, subtler text

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
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
import { platformAuthClient } from "@/lib/auth-client";
import { ROUTES } from "@/constants";

const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
  { label: "Institutions", href: ROUTES.ADMIN.INSTITUTIONS, icon: Building2 },
];

type AdminSidebarProps = {
  adminName: string;
  adminEmail: string;
};

export function AdminSidebar({ adminName, adminEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await platformAuthClient.signOut();
    router.push(ROUTES.ADMIN.SIGN_IN);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
            <ShieldCheck className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">Platform Admin</span>
            <span className="truncate text-[0.6875rem] text-muted-foreground">Super Admin</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="text-[0.625rem] uppercase tracking-widest text-sidebar-foreground/50">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={isActive}
                      tooltip={label}
                      className={isActive ? "border-l-2 border-primary bg-sidebar-accent/50 rounded-l-none" : ""}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton className="h-10" />}>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[0.625rem]">
                    {adminName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium leading-none">{adminName}</span>
                  <span className="text-muted-foreground text-[0.6875rem]">{adminEmail}</span>
                </div>
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

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 3: Commit**

```
style: restyle admin sidebar to match org sidebar visual refresh
```

---

## Task 5: Restyle layout top bars

**Files:**
- Modify: `src/app/admin/(protected)/layout.tsx`
- Modify: `src/app/(org)/(protected)/layout.tsx`

**Step 1: Update admin layout top bar**

Key changes:
- Height: `h-12` (from `h-16`)
- Remove `<Separator>` between trigger and content
- Add search placeholder input with ⌘K hint
- Main content: `p-6` padding, `max-w-6xl mx-auto` centering

```tsx
import { redirect } from "next/navigation";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { AdminSidebar } from "@/components/platform/admin-sidebar";
import { ROUTES } from "@/constants";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { ProfileDropdown } from "@/components/platform/admin-header";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Search } from "lucide-react";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getPlatformSessionUser();

  if (!user || !user.isSuperAdmin) {
    redirect(ROUTES.ADMIN.SIGN_IN);
  }

  return (
    <SidebarProvider>
      <AdminSidebar adminName={user.name} adminEmail={user.email} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/50 px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center gap-2">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="h-8 w-full rounded-md border border-border/50 bg-muted/30 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-border focus:outline-none"
                readOnly
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 text-[0.625rem] text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ModeToggle />
            <ProfileDropdown name={user.name} email={user.email} />
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**Step 2: Update org layout top bar**

Same pattern. Remove unused `Separator` import.

```tsx
import { getCurrentInstitution } from "@/server/institutions/get-current";
import { requireOrgAccess } from "@/server/auth/require-org-access";
import { OrgContextProvider } from "@/components/providers/org-context";
import { AppSidebar } from "@/components/org/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NAV_ITEMS, filterNavItems } from "@/lib/nav";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Search } from "lucide-react";

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);

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
          userName={org.user.name}
          userEmail={org.user.email}
          navItems={visibleNavItems}
        />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/50 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-1 items-center gap-2">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-8 w-full rounded-md border border-border/50 bg-muted/30 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-border focus:outline-none"
                  readOnly
                />
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 text-[0.625rem] text-muted-foreground">
                  ⌘K
                </kbd>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ModeToggle />
            </div>
          </header>
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </OrgContextProvider>
  );
}
```

**Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 4: Commit**

```
style: compact top bar with search placeholder and max-width content area
```

---

## Task 6: Restyle data table and table components

**Files:**
- Modify: `src/components/ui/table.tsx`
- Modify: `src/components/platform/institution-list.tsx`

**Step 1: Update table component styling**

In `src/components/ui/table.tsx`, update:

- `TableHead`: change `h-10` to `h-9`, add `text-xs uppercase tracking-wider text-muted-foreground`, change `font-medium` to `font-normal`
- `TableRow`: change `hover:bg-muted/50` to `hover:bg-muted/30`
- `TableCell`: change `p-2` to `px-3 py-2`

Apply via Edit tool — change only these specific classes.

**Step 2: Update institution list — remove description**

In `src/components/platform/institution-list.tsx`, remove the `<p>` description element. Keep only the `<h2>` title and action button.

Updated component:

```tsx
"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { institutionColumns } from "@/components/platform/institution-columns";
import { ROUTES } from "@/constants";
import type { ListInstitutionsResult } from "@/server/institutions/queries";

type InstitutionListProps = {
  result: ListInstitutionsResult;
};

export function InstitutionList({ result }: InstitutionListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Institutions</h2>
        <Link href={ROUTES.ADMIN.NEW_INSTITUTION as never}>
          <Button size="sm">
            <PlusIcon className="mr-2 size-4" />
            New institution
          </Button>
        </Link>
      </div>

      <DataTable
        columns={institutionColumns}
        data={result.rows}
        pagination={{
          page: result.page,
          pageSize: result.pageSize,
          pageCount: result.pageCount,
          total: result.total,
        }}
        searchKey="name"
        searchPlaceholder="Filter institutions..."
      />
    </div>
  );
}
```

**Step 3: Update DataTable border wrapper**

In `src/components/ui/data-table.tsx`, change the table wrapper from `rounded-md border` to `rounded-md border border-border/50`.

**Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 5: Commit**

```
style: compact tables with Stripe-inspired headers and subtler borders
```

---

## Task 7: Restyle dashboard page and admin dashboard page

**Files:**
- Modify: `src/app/(org)/(protected)/dashboard/page.tsx`
- Modify: `src/app/admin/(protected)/dashboard/page.tsx`

**Step 1: Update org dashboard page**

Remove description paragraph. Clean up title:

```tsx
import { getCurrentInstitution } from "@/server/institutions/get-current";

export default async function DashboardPage() {
  const institution = await getCurrentInstitution();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-tight">
        Welcome to {institution.name}
      </h1>
    </div>
  );
}
```

**Step 2: Update admin dashboard page**

Remove description. Tighten layout. Use consistent spacing:

```tsx
import Link from "next/link";
import { Building2, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { countInstitutionsByStatus } from "@/server/institutions/queries";

export default async function AdminDashboardPage() {
  const [user, counts] = await Promise.all([
    getPlatformSessionUser(),
    countInstitutionsByStatus(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">
          Welcome back, {user?.name ?? "Admin"}
        </h1>
        <Link href={ROUTES.ADMIN.NEW_INSTITUTION}>
          <Button size="sm">
            <Plus className="mr-2 size-4" />
            New institution
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total institutions
            </CardTitle>
            <Building2 className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{counts.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{counts.active}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <AlertTriangle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{counts.suspended}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 4: Commit**

```
style: clean up dashboard pages with consistent spacing and no descriptions
```

---

## Task 8: Add placeholder pages for new nav items

**Files:**
- Create: `src/app/(org)/(protected)/classes/page.tsx`
- Create: `src/app/(org)/(protected)/teachers/page.tsx`
- Create: `src/app/(org)/(protected)/exams/page.tsx`
- Create: `src/app/(org)/(protected)/invoices/page.tsx`
- Create: `src/app/(org)/(protected)/messages/page.tsx`
- Create: `src/app/(org)/(protected)/announcements/page.tsx`
- Create: `src/app/(org)/(protected)/settings/page.tsx`

**Step 1: Create all placeholder pages**

Each page follows the same pattern as existing pages (e.g., `students/page.tsx`): resolve institution, check org access, assert permission, render title.

Example for `classes/page.tsx`:

```tsx
import { getCurrentInstitution } from "@/server/institutions/get-current";
import { requireOrgAccess, assertPermission } from "@/server/auth/require-org-access";
import { PERMISSIONS } from "@/constants";

export default async function ClassesPage() {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);
  assertPermission(org, PERMISSIONS.CLASSES.READ);

  return <h1 className="text-lg font-semibold tracking-tight">Classes</h1>;
}
```

Repeat for each page with its corresponding permission:
- `teachers/page.tsx` — `PERMISSIONS.TEACHERS.READ`, title "Teachers"
- `exams/page.tsx` — `PERMISSIONS.EXAMS.READ`, title "Exams"
- `invoices/page.tsx` — `PERMISSIONS.INVOICES.READ`, title "Invoices"
- `messages/page.tsx` — `PERMISSIONS.COMMUNICATION.READ`, title "Messages"
- `announcements/page.tsx` — `PERMISSIONS.COMMUNICATION.READ`, title "Announcements"
- `settings/page.tsx` — `PERMISSIONS.SETTINGS.READ`, title "Settings"

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 3: Commit**

```
feat: add placeholder pages for new nav items
```

---

## Task 9: Update existing placeholder pages to match new style

**Files:**
- Modify: `src/app/(org)/(protected)/attendance/page.tsx`
- Modify: `src/app/(org)/(protected)/grades/page.tsx`
- Modify: `src/app/(org)/(protected)/fees/page.tsx`
- Modify: `src/app/(org)/(protected)/reports/page.tsx`
- Modify: `src/app/(org)/(protected)/members/page.tsx`
- Modify: `src/app/(org)/(protected)/roles/page.tsx`
- Modify: `src/app/(org)/(protected)/admissions/page.tsx`

**Step 1: Update all existing placeholder `<h1>` tags**

Change from `text-2xl font-bold` to `text-lg font-semibold tracking-tight` for consistency across all placeholder pages.

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 3: Commit**

```
style: unify placeholder page title styling
```

---

## Task 10: Final verification

**Step 1: Run all tests**

Run: `bun test`
Expected: All tests PASS

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 3: Run dev server and visually verify**

Run: `bun run dev`
Verify:
- Sidebar shows 6 groups with correct icons
- Active item has left border accent
- Collapsed icon mode works
- Top bar is compact (48px) with search placeholder
- Tables have compact headers with uppercase muted text
- Content area is max-width centered
- Mobile responsive (sheet sidebar on small screens)

**Step 4: Final commit if any fixes needed**

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Expand constants (routes, permissions, nav groups) |
| 2 | Expand nav items + update filter + tests |
| 3 | Restyle org sidebar |
| 4 | Restyle admin sidebar |
| 5 | Restyle layout top bars |
| 6 | Restyle tables + institution list |
| 7 | Restyle dashboard pages |
| 8 | Add placeholder pages |
| 9 | Update existing page title styling |
| 10 | Final verification |
