# Institution Management — Design

**Date:** 2026-03-05
**Scope:** Platform admin (`admin/` routes) — list, create, view/edit, suspend, soft-delete institutions.

---

## Goals

- Platform super admin can manage the full institution lifecycle from the admin UI.
- Establish the app-wide mutation pattern (Server Actions + `useActionState` / `useTransition`).

---

## Route Structure

```
src/app/admin/
  (protected)/
    layout.tsx                  ← isSuperAdmin guard + admin shell sidebar
    institutions/
      page.tsx                  ← list all institutions
      new/
        page.tsx                ← create institution form
      [id]/
        page.tsx                ← view / edit institution
```

`(protected)` is a Next.js route group — does not appear in URLs. Mirrors the `(org)/(protected)` convention. All future admin modules (users, settings, etc.) live here.

The root `/` on the main domain redirects to `/admin/institutions` after login.

---

## Schema Change

Add `deletedAt` to the `organization` table in `src/db/schema/auth.ts`:

```ts
deletedAt: timestamp("deleted_at"),
```

- `deletedAt IS NULL` — visible in admin list.
- `status = 'suspended'` — visible with a suspended badge; subdomain blocked by proxy.
- `deletedAt IS NOT NULL` — hidden from all queries (soft-deleted).

No other schema changes needed. `name`, `slug`, `status` (`active`|`suspended`), `institutionType` (text), `createdAt` already exist.

Generate and apply migration via `bunx drizzle-kit generate` + `bunx drizzle-kit migrate`.

---

## Institution Types

Stored as `text` (no DB enum). Defined set for UI validation:

```ts
const INSTITUTION_TYPES = ["primary_school", "high_school", "college"] as const;
```

Adding a new type in the future requires no migration — only a UI update.

---

## App-Wide Mutation Pattern

### Form mutations — `useActionState`

```tsx
"use client";
const [state, action, isPending] = useActionState(createInstitution, null);
// <form action={action}> — action receives FormData, validated server-side with zod
```

Forms still use `react-hook-form` + `zod` for client-side validation per CLAUDE.md. The `action` prop on `<form>` handles the server call.

### Non-form mutations — `startTransition`

```tsx
"use client";
const [isPending, startTransition] = useTransition();
startTransition(async () => await suspendInstitution(id));
```

Used for suspend / restore / delete action buttons.

### Action return type

```ts
type ActionResult<T = void> = { error: string } | { success: true; data?: T };
```

Never throw to the client. Actions call `revalidatePath` then `redirect` for navigation mutations, or just `revalidatePath` for in-place refreshes.

---

## File Structure

```
src/
  app/admin/(protected)/
    layout.tsx
    institutions/
      page.tsx
      new/page.tsx
      [id]/page.tsx

  components/platform/
    admin-sidebar.tsx             ← platform nav + sign out
    institution-list.tsx          ← table: name, slug, type badge, status badge, actions menu
    create-institution-form.tsx   ← useActionState + react-hook-form + zod
    edit-institution-form.tsx     ← useActionState + react-hook-form + zod
    institution-actions.tsx       ← suspend / restore / delete buttons (useTransition)

  server/institutions/
    actions.ts                    ← "use server": create, update, suspend, restore, delete
    queries.ts                    ← server-only reads: list, getById

  db/schema/auth.ts               ← add deletedAt to organization
```

`queries.ts` — plain async functions, no `"use server"`. Imported directly into Server Components.
`actions.ts` — `"use server"` directive, mutations only. Each action:
1. Parses + validates input with zod
2. Asserts `isSuperAdmin` independently (no trust from layout)
3. Executes DB mutation
4. Calls `revalidatePath` / `redirect`

---

## Institution List (table columns)

| Column | Notes |
|--------|-------|
| Name | plain text |
| Slug | monospace, subdomain hint |
| Type | badge (`primary_school` → "Primary School", etc.) |
| Status | badge (`active` green / `suspended` yellow) |
| Actions | dropdown: Edit, Suspend/Restore, Delete |

Filtered: `WHERE deleted_at IS NULL`, ordered by `created_at DESC`.

---

## Deactivate vs Delete

- **Suspend** — sets `status = 'suspended'`. Proxy blocks subdomain. Reversible.
- **Restore** — sets `status = 'active'`. Re-enables subdomain.
- **Delete** — sets `deletedAt = now()`. Hides from all UI. Requires confirmation dialog (`AlertDialog`). Irreversible from UI (data preserved in DB).

---

## Key Constraints

- Every action independently asserts `isSuperAdmin` — layout guard is UX only.
- `deletedAt` filter applied in all queries — deleted institutions never surface.
- Slug uniqueness enforced at DB level (existing `organization_slug_uidx` index).
- `redirect()` must be called after `revalidatePath()` — `redirect` throws, nothing after it runs.
