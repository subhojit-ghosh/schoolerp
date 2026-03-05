# Education ERP Platform

A modular, multi-tenant, white-label ERP platform designed for schools and colleges.

The system supports student lifecycle management including admissions, academics, attendance, examinations, fees, staff management, and communication. It is built with a configurable academic engine to support primary schools, high schools, and colleges using a single core architecture.

The platform is designed to be scalable, extensible, and institution-type configurable, enabling different academic structures (year-based, semester-based, credit-based) without maintaining separate codebases.

## Technical Details

This project use `bun` as package manager. use `bun run typecheck` for typecheck.

Auth system we use - better auth (https://better-auth.com)
Database we use - PostgreSQL
ORM we use - Drizzle (https://orm.drizzle.team)

Keep all the plans in `./docs/plans`.

## Hard Rules

### No magic strings or magic numbers
**Never** use hardcoded string literals or numeric constants inline. Always define them in `src/constants/` and import from `@/constants`. This applies to:
- **Routes** — use `ROUTES.*` (e.g. `ROUTES.ADMIN.INSTITUTIONS`, not `"/admin/institutions"`)
- **Status values** — use `STATUS.*` (e.g. `STATUS.ORG.ACTIVE`, not `"active"`)
- **Roles** — use `ROLES.*`
- **Permissions** — use `PERMISSIONS.*`
- **Nav groups** — use `NAV_GROUPS.*`
- **Headers / cookies** — use `HEADERS.*` / `COOKIES.*`

The only exceptions are schema enum definitions in `src/db/schema/` (those are the source of truth) and the constants files themselves.

## Tool Commands

### Better Auth CLI
Use the new standalone CLI `bunx auth` (not the deprecated `@better-auth/cli`):
- `bunx auth generate --adapter drizzle --dialect postgresql` — generate Drizzle schema into `src/lib/auth-schema.ts`
- `bunx auth migrate` — only works with Kysely adapter; with Drizzle use drizzle-kit instead
- `bunx auth init` — scaffold full setup interactively

### Drizzle
- `bun run db:generate` — generate migration files from schema
- `bun run db:migrate` — apply migrations
- `drizzle.config.ts` schema must include both files: `["./src/db/schema/index.ts", "./src/db/schema/auth.ts"]`
- `drizzle-kit` does **not** auto-load `.env.local`. Use the `db:generate` / `db:migrate` / `db:studio` / `seed` scripts which already include this flag.

## Forms

**All forms must use `react-hook-form` + `zod`.** No exceptions.

shadcn now uses the **`<Field />`** component pattern (not the old `<Form>` wrapper). The old `FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` approach from `@/components/ui/form` is superseded.

Pattern (following https://ui.shadcn.com/docs/forms/react-hook-form):

```tsx
"use client";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

export function MyForm() {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: FormValues) { ... }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input {...field} type="email" />
            <FieldError>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
    </form>
  );
}
```

Packages installed: `react-hook-form`, `zod`, `@hookform/resolvers`.
shadcn component to add: `bunx shadcn add field`

## Server Actions

**All server actions must use `next-safe-action`.** The action client is in `src/lib/safe-action.ts`.

- `actionClient` — base client with error handling
- `superAdminAction` — extends `actionClient` with platform super-admin auth middleware
- Form actions that work with `useActionState` must use `.stateAction()`, not `.action()`
- Simple actions (suspend, delete, etc.) use `.action()` with an input schema
- FormData parsing uses `zod-form-data` (`zfd.formData()` wrapping the plain zod schema)
- DB-specific errors (e.g. unique violations) use `returnValidationErrors()` from `next-safe-action`
- Postgres error extraction utilities are in `src/server/errors/db-error.ts`

### Domain file structure

Every server-side domain follows this pattern:

```
src/server/{domain}/
  schemas.ts      — zod validation (plain + zfd.formData variants), types, UI constants
  queries.ts      — read operations (called from RSC/layouts)
  actions.ts      — write operations (next-safe-action, called from client)
```

Special files (not every domain needs these):
- `get-current.ts` — request-scoped context resolution (e.g. current institution from subdomain)

### Auth middleware

- Platform admin actions → use `superAdminAction` from `src/lib/safe-action.ts`
- Org-scoped actions → create `orgAction` middleware when needed (resolves org context + RBAC)
- Auth errors use `AuthError` class from `src/server/errors/auth-error.ts`

## Framework Discoveries

> **For AI agents:** When you discover something non-obvious about the framework, library version behavior, or a gotcha that bit us — add it here so future agents don't repeat the mistake.

### Next.js 16
- The middleware file is **`src/proxy.ts`** (not `middleware.ts`) — Next.js 16 renamed the convention.
- The exported function must be named **`proxy`** (not `middleware`).
- See: https://nextjs.org/docs/messages/middleware-to-proxy

### Better Auth
- `bunx auth migrate` only works with the **Kysely** adapter. With Drizzle, use `bun run db:migrate` instead.
- The new CLI is `bunx auth` — the old `@better-auth/cli` package is deprecated.
- `BETTER_AUTH_SECRET` env var must be set; auth.ts throws at startup if missing.

### shadcn / @base-ui/react
- This project's shadcn components are built on **`@base-ui/react`**, not Radix UI.
- **No `asChild` prop** — use the **`render` prop** instead: `render={<a href="..." />}` or `render={<Button variant="ghost" />}`.
- To render a `Button` as a link, wrap with `<Link>` directly: `<Link href="..."><Button>...</Button></Link>`.
- To render a trigger as a custom element: `<DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>`.
- Nesting `AlertDialogTrigger` inside a `DropdownMenuItem` causes issues — use state instead: `const [open, setOpen] = useState(false)` + `<AlertDialog open={open} onOpenChange={setOpen}>`.

### Zod v4
- This project uses **Zod v4**. `z.string().uuid()` is deprecated — use `z.uuid()` instead.
- Same for `z.string().email()` → `z.email()`, `z.string().url()` → `z.url()`, etc.

### Drizzle + PostgreSQL
- `sql` tagged template must be imported from `drizzle-orm`, **not** `drizzle-orm/pg-core`.
- PostgreSQL does not enforce UNIQUE constraints when the column value is `NULL`. Use a partial unique index (`WHERE column IS NULL`) for nullable unique columns.
- Use `postgres` (postgres.js) driver, not `pg`. No `@types/pg` needed.
- Guard the connection with `globalThis` caching to prevent HMR from exhausting the connection pool in dev.
