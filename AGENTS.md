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

## Tool Commands

### Better Auth CLI
Use the new standalone CLI `bunx auth` (not the deprecated `@better-auth/cli`):
- `bunx auth generate --adapter drizzle --dialect postgresql` — generate Drizzle schema into `src/lib/auth-schema.ts`
- `bunx auth migrate` — only works with Kysely adapter; with Drizzle use drizzle-kit instead
- `bunx auth init` — scaffold full setup interactively

### Drizzle
- `bunx drizzle-kit generate` — generate migration files from schema
- `bunx drizzle-kit migrate` — apply migrations
- `drizzle.config.ts` schema must include both files: `["./src/lib/schema.ts", "./src/lib/auth-schema.ts"]`
- `drizzle-kit` does **not** auto-load `.env.local`. Use `bun --env-file=.env.local drizzle-kit <cmd>` or the `db:studio` / `seed` scripts which already include this flag.

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

## Framework Discoveries

> **For AI agents:** When you discover something non-obvious about the framework, library version behavior, or a gotcha that bit us — add it here so future agents don't repeat the mistake.

### Next.js 16
- The middleware file is **`src/proxy.ts`** (not `middleware.ts`) — Next.js 16 renamed the convention.
- The exported function must be named **`proxy`** (not `middleware`).
- See: https://nextjs.org/docs/messages/middleware-to-proxy

### Better Auth
- `bunx auth migrate` only works with the **Kysely** adapter. With Drizzle, use `bunx drizzle-kit migrate` instead.
- The new CLI is `bunx auth` — the old `@better-auth/cli` package is deprecated.
- `BETTER_AUTH_SECRET` env var must be set; auth.ts throws at startup if missing.

### Drizzle + PostgreSQL
- `sql` tagged template must be imported from `drizzle-orm`, **not** `drizzle-orm/pg-core`.
- PostgreSQL does not enforce UNIQUE constraints when the column value is `NULL`. Use a partial unique index (`WHERE column IS NULL`) for nullable unique columns.
- Use `postgres` (postgres.js) driver, not `pg`. No `@types/pg` needed.
- Guard the connection with `globalThis` caching to prevent HMR from exhausting the connection pool in dev.
