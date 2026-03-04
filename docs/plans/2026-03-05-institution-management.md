# Institution Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the platform admin institution management module — list, create, view/edit, suspend, soft-delete institutions — under `admin/(protected)/institutions`.

**Architecture:** Server Actions + `useActionState`/`useTransition` for mutations. Server Components for data fetching via direct DB queries in `server/institutions/queries.ts`. Protected layout with `isSuperAdmin` guard and admin sidebar. `organization.deletedAt` soft-delete column added via migration.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM + PostgreSQL, Better Auth, react-hook-form + zod, shadcn/ui, bun:test

---

## Task 1: Add `deletedAt` to the `organization` table

**Files:**
- Modify: `src/db/schema/auth.ts`

**Step 1: Add `deletedAt` column**

In `src/db/schema/auth.ts`, find the `organization` table definition and add `deletedAt`:

```ts
export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
    institutionType: text("institution_type"),
    status: text("status", { enum: ["active", "suspended"] }).default("active"),
    deletedAt: timestamp("deleted_at"),  // ← add this line
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);
```

**Step 2: Generate and apply migration**

```bash
bun --env-file=.env.local drizzle-kit generate
bun --env-file=.env.local drizzle-kit migrate
```

Expected: migration file created in `drizzle/` and applied to DB.

**Step 3: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/db/schema/auth.ts drizzle/
git commit -m "feat: add deletedAt to organization table"
```

---

## Task 2: Institution zod schemas + unit tests

**Files:**
- Create: `src/server/institutions/schemas.ts`
- Create: `src/server/institutions/schemas.test.ts`

**Step 1: Write failing tests**

Create `src/server/institutions/schemas.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { createInstitutionSchema, updateInstitutionSchema } from "./schemas";

describe("createInstitutionSchema", () => {
  test("accepts valid input", () => {
    const result = createInstitutionSchema.safeParse({
      name: "Springfield Elementary",
      slug: "springfield-elementary",
      institutionType: "primary_school",
    });
    expect(result.success).toBe(true);
  });

  test("rejects empty name", () => {
    const result = createInstitutionSchema.safeParse({
      name: "",
      slug: "springfield-elementary",
      institutionType: "primary_school",
    });
    expect(result.success).toBe(false);
  });

  test("rejects slug with spaces", () => {
    const result = createInstitutionSchema.safeParse({
      name: "Springfield Elementary",
      slug: "springfield elementary",
      institutionType: "primary_school",
    });
    expect(result.success).toBe(false);
  });

  test("rejects slug with uppercase", () => {
    const result = createInstitutionSchema.safeParse({
      name: "Springfield Elementary",
      slug: "Springfield",
      institutionType: "primary_school",
    });
    expect(result.success).toBe(false);
  });

  test("rejects empty institutionType", () => {
    const result = createInstitutionSchema.safeParse({
      name: "Springfield Elementary",
      slug: "springfield-elementary",
      institutionType: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateInstitutionSchema", () => {
  test("accepts partial update (name only)", () => {
    const result = updateInstitutionSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  test("rejects empty name", () => {
    const result = updateInstitutionSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  test("rejects slug with uppercase in update", () => {
    const result = updateInstitutionSchema.safeParse({ slug: "Bad-Slug" });
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
bun test src/server/institutions/schemas.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement schemas**

Create `src/server/institutions/schemas.ts`:

```ts
import { z } from "zod";

const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only");

export const createInstitutionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: slugSchema,
  institutionType: z.string().min(1, "Institution type is required"),
});

export const updateInstitutionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  slug: slugSchema.optional(),
  institutionType: z.string().min(1).optional(),
});

export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;
export type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>;

// UI-level constants — stored as plain text in DB
export const INSTITUTION_TYPES = [
  { value: "primary_school", label: "Primary School" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
] as const;
```

**Step 4: Run tests to verify they pass**

```bash
bun test src/server/institutions/schemas.test.ts
```

Expected: all tests pass.

**Step 5: Commit**

```bash
git add src/server/institutions/schemas.ts src/server/institutions/schemas.test.ts
git commit -m "feat: add institution zod schemas"
```

---

## Task 3: Institution DB queries

**Files:**
- Create: `src/server/institutions/queries.ts`

**Step 1: Create queries file**

Create `src/server/institutions/queries.ts`:

```ts
import "server-only";
import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { eq, isNull, desc } from "drizzle-orm";

export type InstitutionRow = {
  id: string;
  name: string;
  slug: string;
  institutionType: string | null;
  status: "active" | "suspended" | null;
  createdAt: Date;
};

export async function listInstitutions(): Promise<InstitutionRow[]> {
  return db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      institutionType: organization.institutionType,
      status: organization.status,
      createdAt: organization.createdAt,
    })
    .from(organization)
    .where(isNull(organization.deletedAt))
    .orderBy(desc(organization.createdAt));
}

export async function getInstitutionById(id: string): Promise<InstitutionRow | null> {
  const [row] = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      institutionType: organization.institutionType,
      status: organization.status,
      createdAt: organization.createdAt,
    })
    .from(organization)
    .where(eq(organization.id, id))
    .limit(1);

  // Return null if not found or soft-deleted
  if (!row || row.status === null) return null;
  return row;
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/server/institutions/queries.ts
git commit -m "feat: add institution DB queries"
```

---

## Task 4: Institution server actions

**Files:**
- Create: `src/server/institutions/actions.ts`

**Step 1: Create actions file**

Create `src/server/institutions/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import {
  createInstitutionSchema,
  updateInstitutionSchema,
} from "./schemas";

type ActionResult = { error: string } | { success: true };

async function assertSuperAdmin() {
  const user = await getPlatformSessionUser();
  if (!user?.isSuperAdmin) {
    throw new Error("Unauthorized");
  }
}

function generateId() {
  return crypto.randomUUID();
}

export async function createInstitution(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();

    const parsed = createInstitutionSchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      institutionType: formData.get("institutionType"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
    }

    const { name, slug, institutionType } = parsed.data;

    await db.insert(organization).values({
      id: generateId(),
      name,
      slug,
      institutionType,
      createdAt: new Date(),
      status: "active",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong";
    return { error: message };
  }

  revalidatePath("/admin/institutions");
  redirect("/admin/institutions");
}

export async function updateInstitution(
  id: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();

    const parsed = updateInstitutionSchema.safeParse({
      name: formData.get("name") || undefined,
      slug: formData.get("slug") || undefined,
      institutionType: formData.get("institutionType") || undefined,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
    }

    await db
      .update(organization)
      .set(parsed.data)
      .where(eq(organization.id, id));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong";
    return { error: message };
  }

  revalidatePath("/admin/institutions");
  revalidatePath(`/admin/institutions/${id}`);
  redirect("/admin/institutions");
}

export async function suspendInstitution(id: string): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
    await db
      .update(organization)
      .set({ status: "suspended" })
      .where(eq(organization.id, id));
    revalidatePath("/admin/institutions");
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong";
    return { error: message };
  }
}

export async function restoreInstitution(id: string): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
    await db
      .update(organization)
      .set({ status: "active" })
      .where(eq(organization.id, id));
    revalidatePath("/admin/institutions");
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong";
    return { error: message };
  }
}

export async function deleteInstitution(id: string): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
    await db
      .update(organization)
      .set({ deletedAt: new Date() })
      .where(eq(organization.id, id));
    revalidatePath("/admin/institutions");
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong";
    return { error: message };
  }
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/server/institutions/actions.ts
git commit -m "feat: add institution server actions"
```

---

## Task 5: Admin sidebar component

**Files:**
- Create: `src/components/platform/admin-sidebar.tsx`

**Step 1: Create admin sidebar**

Create `src/components/platform/admin-sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformSignOutButton } from "@/components/platform/platform-sign-out-button";

const NAV_ITEMS = [
  { label: "Institutions", href: "/admin/institutions", icon: Building2 },
];

type AdminSidebarProps = {
  adminName: string;
};

export function AdminSidebar({ adminName }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-svh w-60 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-sm font-semibold tracking-tight">Platform Admin</span>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              pathname.startsWith(href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-3">
        <p className="text-muted-foreground mb-2 truncate px-1 text-xs">{adminName}</p>
        <PlatformSignOutButton />
      </div>
    </aside>
  );
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/components/platform/admin-sidebar.tsx
git commit -m "feat: add admin sidebar component"
```

---

## Task 6: Admin protected layout

**Files:**
- Create: `src/app/admin/(protected)/layout.tsx`

**Step 1: Create protected layout**

Create `src/app/admin/(protected)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { AdminSidebar } from "@/components/platform/admin-sidebar";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getPlatformSessionUser();

  if (!user) {
    redirect("/admin/auth/sign-in");
  }

  if (!user.isSuperAdmin) {
    redirect("/admin/auth/sign-in");
  }

  return (
    <div className="flex h-svh">
      <AdminSidebar adminName={user.name} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/app/admin/(protected)/layout.tsx
git commit -m "feat: add admin protected layout"
```

---

## Task 7: Institution list page + table component

**Files:**
- Create: `src/app/admin/(protected)/institutions/page.tsx`
- Create: `src/components/platform/institution-list.tsx`
- Create: `src/components/platform/institution-actions.tsx`

**Step 1: Create institution actions component (suspend/restore/delete buttons)**

Create `src/components/platform/institution-actions.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  suspendInstitution,
  restoreInstitution,
  deleteInstitution,
} from "@/server/institutions/actions";

type InstitutionActionsProps = {
  id: string;
  status: "active" | "suspended" | null;
};

export function InstitutionActions({ id, status }: InstitutionActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSuspend() {
    startTransition(async () => {
      await suspendInstitution(id);
      router.refresh();
    });
  }

  function handleRestore() {
    startTransition(async () => {
      await restoreInstitution(id);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteInstitution(id);
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={`/admin/institutions/${id}`}>Edit</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {status === "active" ? (
            <DropdownMenuItem onClick={handleSuspend} disabled={isPending}>
              Suspend
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleRestore} disabled={isPending}>
              Restore
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete institution?</AlertDialogTitle>
          <AlertDialogDescription>
            This will soft-delete the institution. The subdomain will stop working.
            The data is preserved in the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Step 2: Check which shadcn components need to be added**

```bash
bunx shadcn add dropdown-menu alert-dialog
```

(Skip any already installed.)

**Step 3: Create institution list table component**

Create `src/components/platform/institution-list.tsx`:

```tsx
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InstitutionActions } from "@/components/platform/institution-actions";
import { INSTITUTION_TYPES } from "@/server/institutions/schemas";
import type { InstitutionRow } from "@/server/institutions/queries";
import { PlusIcon } from "lucide-react";

function typeLabel(value: string | null) {
  if (!value) return "—";
  return (
    INSTITUTION_TYPES.find((t) => t.value === value)?.label ?? value
  );
}

type InstitutionListProps = {
  institutions: InstitutionRow[];
};

export function InstitutionList({ institutions }: InstitutionListProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Institutions</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {institutions.length} institution{institutions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/institutions/new">
            <PlusIcon className="mr-2 size-4" />
            New institution
          </Link>
        </Button>
      </div>

      {institutions.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
          No institutions yet. Create the first one.
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst) => (
                <tr key={inst.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{inst.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {inst.slug}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{typeLabel(inst.institutionType)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={inst.status === "active" ? "default" : "secondary"}
                    >
                      {inst.status ?? "active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <InstitutionActions id={inst.id} status={inst.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Create the list page (Server Component)**

Create `src/app/admin/(protected)/institutions/page.tsx`:

```tsx
import { listInstitutions } from "@/server/institutions/queries";
import { InstitutionList } from "@/components/platform/institution-list";

export default async function InstitutionsPage() {
  const institutions = await listInstitutions();
  return <InstitutionList institutions={institutions} />;
}
```

**Step 5: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 6: Commit**

```bash
git add src/app/admin/(protected)/institutions/page.tsx \
        src/components/platform/institution-list.tsx \
        src/components/platform/institution-actions.tsx
git commit -m "feat: add institution list page and table"
```

---

## Task 8: Create institution page + form

**Files:**
- Create: `src/app/admin/(protected)/institutions/new/page.tsx`
- Create: `src/components/platform/create-institution-form.tsx`

**Step 1: Create the form component**

Create `src/components/platform/create-institution-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInstitution } from "@/server/institutions/actions";
import {
  createInstitutionSchema,
  INSTITUTION_TYPES,
  type CreateInstitutionInput,
} from "@/server/institutions/schemas";

export function CreateInstitutionForm() {
  const [state, action, isPending] = useActionState(createInstitution, null);

  const { control, handleSubmit, formState: { errors } } = useForm<CreateInstitutionInput>({
    resolver: zodResolver(createInstitutionSchema),
    defaultValues: { name: "", slug: "", institutionType: "" },
  });

  return (
    <form action={action} className="flex flex-col gap-5">
      {state && "error" in state && (
        <p className="text-destructive rounded-md bg-destructive/10 px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input {...field} name="name" placeholder="Springfield Elementary" />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="slug"
        render={({ field }) => (
          <Field>
            <FieldLabel>Subdomain slug</FieldLabel>
            <Input {...field} name="slug" placeholder="springfield-elementary" />
            <FieldError>{errors.slug?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="institutionType"
        render={({ field }) => (
          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              name="institutionType"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{errors.institutionType?.message}</FieldError>
          </Field>
        )}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create institution"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/institutions">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
```

**Step 2: Create the page**

Create `src/app/admin/(protected)/institutions/new/page.tsx`:

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateInstitutionForm } from "@/components/platform/create-institution-form";

export default function NewInstitutionPage() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>New institution</CardTitle>
            <CardDescription>
              Create a new institution. The slug becomes its subdomain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateInstitutionForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Step 3: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/app/admin/(protected)/institutions/new/page.tsx \
        src/components/platform/create-institution-form.tsx
git commit -m "feat: add create institution page and form"
```

---

## Task 9: Edit institution page + form

**Files:**
- Create: `src/app/admin/(protected)/institutions/[id]/page.tsx`
- Create: `src/components/platform/edit-institution-form.tsx`

**Step 1: Create the edit form component**

Create `src/components/platform/edit-institution-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateInstitution } from "@/server/institutions/actions";
import {
  updateInstitutionSchema,
  INSTITUTION_TYPES,
  type UpdateInstitutionInput,
} from "@/server/institutions/schemas";
import type { InstitutionRow } from "@/server/institutions/queries";

type EditInstitutionFormProps = {
  institution: InstitutionRow;
};

export function EditInstitutionForm({ institution }: EditInstitutionFormProps) {
  const boundAction = updateInstitution.bind(null, institution.id);
  const [state, action, isPending] = useActionState(boundAction, null);

  const { control, formState: { errors } } = useForm<UpdateInstitutionInput>({
    resolver: zodResolver(updateInstitutionSchema),
    defaultValues: {
      name: institution.name,
      slug: institution.slug,
      institutionType: institution.institutionType ?? "",
    },
  });

  return (
    <form action={action} className="flex flex-col gap-5">
      {state && "error" in state && (
        <p className="text-destructive rounded-md bg-destructive/10 px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input {...field} name="name" />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="slug"
        render={({ field }) => (
          <Field>
            <FieldLabel>Subdomain slug</FieldLabel>
            <Input {...field} name="slug" />
            <FieldError>{errors.slug?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="institutionType"
        render={({ field }) => (
          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select
              value={field.value ?? ""}
              onValueChange={field.onChange}
              name="institutionType"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{errors.institutionType?.message}</FieldError>
          </Field>
        )}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/institutions">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
```

**Step 2: Create the edit page (Server Component)**

Create `src/app/admin/(protected)/institutions/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditInstitutionForm } from "@/components/platform/edit-institution-form";
import { getInstitutionById } from "@/server/institutions/queries";

type EditInstitutionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditInstitutionPage({ params }: EditInstitutionPageProps) {
  const { id } = await params;
  const institution = await getInstitutionById(id);

  if (!institution) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{institution.name}</CardTitle>
                <CardDescription className="mt-1 font-mono text-xs">
                  {institution.slug}
                </CardDescription>
              </div>
              <Badge variant={institution.status === "active" ? "default" : "secondary"}>
                {institution.status ?? "active"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <EditInstitutionForm institution={institution} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Step 3: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/app/admin/(protected)/institutions/[id]/page.tsx \
        src/components/platform/edit-institution-form.tsx
git commit -m "feat: add edit institution page and form"
```

---

## Task 10: Update root page — redirect platform admin to institutions

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Update the platform admin branch**

In `src/app/page.tsx`, find the block that renders `<PlatformDashboard sessionUser={sessionUser} />` at the bottom and replace it with a redirect:

```tsx
// Replace:
return <PlatformDashboard sessionUser={sessionUser} />;

// With:
redirect("/admin/institutions");
```

Also remove the now-unused `PlatformDashboard` import from the file.

**Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 3: Verify the dev server**

```bash
bun run dev
```

Navigate to `localhost:3000` (no subdomain). Expected flow:
1. → redirects to `/admin/auth/sign-in` (if not signed in)
2. → sign in as super admin
3. → redirects to `/admin/institutions`
4. → institutions list renders (empty state or seeded data)
5. → "New institution" creates one, appears in list
6. → Clicking edit navigates to `/admin/institutions/[id]`
7. → Suspend/restore toggles status badge
8. → Delete shows confirmation dialog, soft-deletes on confirm

**Step 4: Run all tests**

```bash
bun test
```

Expected: all tests pass.

**Step 5: Final typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redirect platform admin root to institutions list"
```

---

## Summary of files changed

| Action | File |
|--------|------|
| Modify | `src/db/schema/auth.ts` |
| Create | `src/server/institutions/schemas.ts` |
| Create | `src/server/institutions/schemas.test.ts` |
| Create | `src/server/institutions/queries.ts` |
| Create | `src/server/institutions/actions.ts` |
| Create | `src/components/platform/admin-sidebar.tsx` |
| Create | `src/app/admin/(protected)/layout.tsx` |
| Create | `src/app/admin/(protected)/institutions/page.tsx` |
| Create | `src/components/platform/institution-list.tsx` |
| Create | `src/components/platform/institution-actions.tsx` |
| Create | `src/app/admin/(protected)/institutions/new/page.tsx` |
| Create | `src/components/platform/create-institution-form.tsx` |
| Create | `src/app/admin/(protected)/institutions/[id]/page.tsx` |
| Create | `src/components/platform/edit-institution-form.tsx` |
| Modify | `src/app/page.tsx` |
| Generate | `drizzle/` migration files |
