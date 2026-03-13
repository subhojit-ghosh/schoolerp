# Education ERP Platform

A modular, multi-tenant ERP platform for Indian schools.

The product target is school-first SaaS:
- one institution tenant per subdomain
- support for multi-campus inside a tenant
- one human can have multiple contexts, such as staff and parent
- consistent product structure for every institution
- controlled branding customization through theme tokens, not custom layouts

## Technical Details

This project uses `bun` as the package manager. Use `bun run typecheck` from the repo root for workspace typechecking.

This repository is a Turbo monorepo. The target architecture is:
- `apps/erp` — Vite + React school ERP frontend
- `apps/api-erp` — NestJS backend for auth and ERP domains
- `packages/*` — shared libraries

Repo-level roadmap is tracked in `./docs/roadmap.md`.
- Read it before starting substantial work to understand current priorities and sequencing.
- Update it when roadmap priorities, sequencing, or constraints change.
- Keep `docs/roadmap.md` forward-looking and concise.
- Use `./docs/status.md` for concise factual implementation state.
- Use `docs/plans/*` for task-specific implementation detail.

Current repo contents may still contain legacy apps from the previous architecture. Treat those as migration state, not as the target structure.

Core stack:
- Frontend — `Vite`, `React`, `TypeScript`, `shadcn/ui`, `Radix UI`, `Tailwind CSS`
- Backend — `NestJS`, `Passport`, `PostgreSQL`, `Drizzle`
- Auth — HTTP-only cookie auth issued by NestJS
- Forms — `react-hook-form` + `zod`

Keep all plans in `./docs/plans`.

## Product Decisions

These are not open questions anymore. Build to these defaults unless the user explicitly changes them.

### Tenant model
- One institution = one tenant.
- Tenant is resolved from the subdomain.
- Do not build institution switching as a normal session feature.
- If an institution has multiple campuses, allow campus switching inside that tenant.

### Identity and auth
- Do **not** use Better Auth for new work.
- Use NestJS Passport-based auth in `apps/api-erp`.
- Primary login identifier is mobile number.
- Secondary identifier is email.
- Auth method for v1 is password-based login.
- Do **not** build OTP-first or passwordless auth in v1.
- Use HTTP-only cookies for the web frontend. Do not store auth tokens in `localStorage`.

### User model
- Model one `user` per human identity.
- Do **not** model staff, parent, or admin as separate login identities.
- A user can be both staff and parent at the same time.
- Parent access must support one guardian linked to multiple students.
- Student access must support multiple guardians for the same student.

### Scope
- Focus on ERP first.
- Do **not** build a dedicated platform admin app in v1.
- Use self-serve school signup to create institutions for testing and onboarding.
- Signup should create:
  - institution
  - initial school admin user
  - initial membership/role
  - default campus if needed

### Branding
- Keep one shared product structure across all tenants.
- Allow institution-level branding through constrained theme settings only.
- Supported branding for v1:
  - logo
  - favicon
  - display name
  - primary color
  - secondary or accent color
- Do **not** allow tenant-specific layout forks or arbitrary CSS editing.

## Hard Rules

### No magic strings or magic numbers
**Never** use hardcoded string literals or numeric constants inline for repeated domain values. Put them in shared constants and import them.

Examples:
- route segments
- status values
- role keys
- permission keys
- cookie names
- header names
- query parameter names

Exceptions:
- schema enum definitions in their schema source files
- constants files themselves
- one-off library arguments that are not project domain values

### Frontend/backend boundary
- Business rules belong in NestJS, not in the frontend.
- The frontend should be a thin client over the API.
- Do not recreate auth, authorization, tenant resolution, or domain validation logic in React unless it is purely for UX convenience.

### Shared code ownership
- Shared UI belongs in packages, not copied across apps.
- Shared DB schema and migrations belong in `packages/database`.
- Shared Nest infrastructure belongs in `packages/backend-core`.
- Keep package boundaries clean. Do not import app-local code into another app just because it exists already.

## Tool Commands

### Drizzle
- `bun run db:generate` — generate migration files from schema
- `bun run db:migrate` — apply migrations
- `bun run db:studio` — open Drizzle Studio
- `drizzle-kit` does **not** auto-load `.env.local`. Use the repo scripts that already include the correct env-file handling.

## Frontend Rules

### Frontend framework
- The ERP frontend target is `Vite + React`.
- Do **not** add new ERP functionality to the old Next.js app.
- If legacy Next.js code still exists during migration, treat it as temporary.

### shadcn / Radix UI
- The new ERP app should use `shadcn/ui` with `Radix UI` primitives.
- Do not preserve old `@base-ui/react` assumptions from the previous app unless a migration task explicitly requires it.
- Prefer a shared `packages/ui` design system built on top of shadcn patterns.

### Forms
**All forms must use `react-hook-form` + `zod`.** No exceptions.

Use the shadcn field pattern:

```tsx
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const MOBILE_MIN_LENGTH = 10;

const schema = z.object({
  mobile: z.string().min(MOBILE_MIN_LENGTH),
});

type FormValues = z.infer<typeof schema>;

export function ExampleForm() {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mobile: "" },
  });

  function onSubmit(values: FormValues) {
    void values;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="mobile"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Mobile Number</FieldLabel>
            <Input {...field} inputMode="tel" />
            <FieldError>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
    </form>
  );
}
```

### Theming and white-label
- Theme customization must be token-driven.
- Institution admins can customize branding tokens, not component structure.
- Apply tenant branding via CSS variables at app bootstrap.
- Vite does not need SSR for this. Fetch branding before mounting the main app shell or show a short branded loading state.
- Favicon and document title should be updated dynamically after branding loads.
- Prefer semantic tokens such as `--primary`, `--accent`, `--sidebar-primary`, not random per-component overrides.

## Backend Rules

### Auth
- Use NestJS Passport for auth.
- Primary web auth transport is HTTP-only cookie-based session/auth cookies.
- Mobile number is the canonical login identifier for v1.
- Email is secondary and may be optional depending on role.
- Design the schema so `mobileVerifiedAt` and `emailVerifiedAt` can be added later without painful refactors.

### API boundaries
- Keep onboarding/provisioning isolated as its own backend module.
- Tenant ERP concerns should live in domain modules such as students, guardians, staff, campuses, academics, attendance, exams, and fees.
- Route namespaces and guards should make tenant scope explicit.

### Tenant resolution
- Resolve the active institution from the request hostname/subdomain.
- The session identifies the user.
- Authorization checks whether that user can access the resolved tenant.
- Campus context can be stored in session or preference after tenant resolution.

## Domain Modeling Rules

### Identity
- Use a single user identity table for authentication.
- Roles and access should be modeled through memberships and relationships, not separate user tables per persona.

### Memberships
- Staff/admin access should come from institution memberships and roles.
- Parent access should come from guardian relationships to students.
- The same user can have both membership-based and guardian-based access in the same institution.

### Data modeling
- Mobile number should be globally unique at the user identity level.
- Keep institution ownership explicit in tenant-scoped entities.
- Do not rely on frontend state to define tenant or campus ownership.

## Framework Discoveries

> **For AI agents:** When you discover something non-obvious about the framework, library version behavior, or a gotcha that bit us, add it here immediately so future agents do not repeat it.

### Vite + Tenant branding
- For the ERP app, tenant branding should be fetched at bootstrap and applied via CSS variables before or during initial render.
- A short loading shell is acceptable. This app is an authenticated ERP, not an SEO-first public site.
- Favicon, title, and other head branding can be updated dynamically on the client after branding is loaded.
- Local dev now uses same-host routing behind Caddy: `https://erp.test` for the public root app and `https://<tenant>.erp.test` for tenant ERP access.
- In local dev and production-style routing, the frontend should call the backend via same-host `/api`, not direct `localhost:4000` URLs.
- Vite must allow the custom local hosts in `server.allowedHosts` and `preview.allowedHosts`, or the dev server will block `erp.test` host headers.
- When manually testing in a browser or using browser automation, always use `https://erp.test` or `https://<tenant>.erp.test`, not `http://localhost:3000`, unless the user explicitly asks for a localhost-only override.
- To visually verify UI changes in the browser, use the `playwright-cli` skill. Do not ask the user to take screenshots manually.
- Demo tenant credentials: `https://demo.erp.test` — mobile `6291633219`, password `Password@01`
- On this manual Vite app, `shadcn add` can materialize literal `@/` and `@repo/` directories instead of resolving aliases to `src/*` or workspace package paths. After CLI installs, verify the output paths immediately and move files into the real source directories if needed.

### Next.js + Root domain
- The public root-domain app lives separately from the tenant ERP app. Use `apps/web` for `https://erp.test` and keep tenant workflows out of it.
- Next.js dev behind `https://erp.test` needs `allowedDevOrigins` configured in `next.config.*`, or the dev server can reject the proxied custom origin.

### Local DNS + Caddy
- Local wildcard tenant DNS is set up through `dnsmasq` with `address=/.erp.test/127.0.0.1` and macOS resolver file `/etc/resolver/test`.
- Use a global Caddy config to terminate HTTPS and route `erp.test` plus `*.erp.test`.
- Current local routing shape is:
  - `/api*` -> Nest on `127.0.0.1:4000`
  - all other paths -> Vite on `127.0.0.1:3000`
- Homebrew `dnsmasq` may need to be started with `sudo brew services start dnsmasq` because DNS port `53` requires elevated privileges.
- Homebrew `caddy` can fail if its service account cannot read the local PKI files for `local_certs`; if that happens, check the service user, PKI path permissions, or run Caddy manually while debugging.

### Cookie auth + local domains
- Local HTTPS cookie auth is now tested successfully with cookie domain `.erp.test`.
- With same-host `/api` routing, auth/session persistence works across redirects and hard reloads on `https://<tenant>.erp.test`.
- For local HTTPS, backend cookie defaults should stay `Secure=true`; if local auth breaks, verify the request is actually coming through Caddy over HTTPS and not directly over plain HTTP.

### NestJS Configuration
- In `apps/api-erp`, use Nest's official `@nestjs/config` via `ConfigModule.forRoot()` for env loading and validation.
- Prefer namespaced config with `registerAs()` for backend concerns.
- API env files belong to the backend app only. Do not read frontend env files from the backend.

### NestJS + Passport
- Keep auth ownership in NestJS.
- Do not let frontend libraries become the source of truth for sessions or authorization.
- Guards and backend authorization checks are mandatory even if the frontend also hides unauthorized UI.

### NestJS + Scalar
- Serve Scalar from Nest using `@scalar/nestjs-api-reference` and a generated OpenAPI document from `@nestjs/swagger`.
- Prefer exposing `/reference` for docs and `/openapi.json` for machine-readable OpenAPI.
- `apps/api-erp` OpenAPI export boots the real Nest app and therefore requires `DATABASE_URL` to be set even for schema generation. If Turbo wrappers fail on `api-erp:openapi` with little output, retry with `DATABASE_URL=...` in the environment and, if needed, run `bun run openapi:export` inside `apps/api-erp` for the direct error.

### Zod v4
- This project uses `Zod v4`.
- Use `z.uuid()` instead of `z.string().uuid()`.
- Use `z.email()` instead of `z.string().email()`.
- Use `z.url()` instead of `z.string().url()`.

### Drizzle + PostgreSQL
- Import `sql` from `drizzle-orm`, not `drizzle-orm/pg-core`.
- PostgreSQL UNIQUE constraints do not treat `NULL` values as duplicates. Use partial unique indexes where required.
- Use the `postgres` driver, not `pg`.
- Shared persistence primitives belong in `packages/database`.
- Drizzle migration files belong in `packages/database/drizzle`.

### Legacy repo state
- The repository may still contain the previous Next.js ERP app and Better Auth code during migration.
- Do not extend that legacy architecture for new work.
- If a migration task touches legacy files, treat them as transitional and move the system toward `apps/erp` and `apps/api-erp`.
