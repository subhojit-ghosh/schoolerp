# Education ERP Platform

A modular, multi-tenant ERP platform for Indian schools.

The product target is school-first SaaS:
- one institution tenant per subdomain or custom domain
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
- Tenant is resolved from the request hostname. Check custom domain first, then fall back to slug extraction from `*.erp.test`.
- Schools can point their own domain at the platform (CNAME). Store `customDomain` on the institution record.
- Do not build institution switching as a normal session feature.
- If an institution has multiple campuses, allow campus switching inside that tenant.

### Identity and auth
- Do **not** use Better Auth for new work.
- Use NestJS Passport-based auth in `apps/api-erp`.
- Auth is password-based. Do not build OTP-first or passwordless auth until DLT registration is complete.
- Use HTTP-only cookies for the web frontend. Do not store auth tokens in `localStorage`.
- Cookie domain must be set to the **exact request hostname** — not a wildcard. A session from `school1.erp.test` must never be valid at `school2.erp.test`.

#### Login per user type
- **Guardian** — Mobile + Password. Mobile is the identifier. Every parent in India knows their mobile number.
- **Staff / School Admin** — Mobile + Password. Email is an alternative identifier for tech-savvy staff.
- **Student** — Deferred. Guardian portal covers all student-facing data. Do not build student auth until there is explicit demand.
- **Platform Admin** — Email + Password + TOTP (2FA). Separate `platform_admins` table and Passport strategy. No overlap with school-facing auth.

#### First login for admin-added users
- When admin adds a guardian or staff member, backend creates a user with default password = their mobile number and `mustChangePassword = true`.
- On first login, force a password change before issuing a full session.
- Self-serve school signup sets `mustChangePassword = false` — admin goes directly to dashboard.
- Admin can reset any member's password from the ERP, which sets `mustChangePassword = true` again.

#### OTP — deferred, keep the door open
- DLT template approval takes 2–3 weeks. Do not block on it now.
- Keep a clean OTP service interface abstraction so it can be plugged in later without structural rewrites.
- `mobileVerifiedAt` and `emailVerifiedAt` exist on `user` for when OTP verification is added.

### User model
- User records are **per-tenant**. The `user` table has `institutionId`. Mobile is unique per institution, not globally.
- Same person at two schools = two separate user records, two separate passwords. This is intentional.
- Do **not** model staff, parent, or admin as separate login identities. Roles come from `member` records.
- A user can be both staff and guardian at the same institution via separate `member` records.
- Guardian access must support one guardian linked to multiple students.
- Student access must support multiple guardians for the same student.
- `member.userId` is nullable by design — students without login accounts have a `member` record but no `user` record. Do not make it not null.

### Scope
- Focus on ERP first.
- Platform admin exists as a separate `platform_admins` table and auth path, but there is no platform admin UI app yet. Build it when needed.
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

### Destructive operations must fail closed
- Destructive tenant ERP operations must never hard-delete business records from normal product workflows.
- Before any delete or deactivation, the backend must check for active dependents and throw `ConflictException` if found. Never rely on frontend confirmations as the protection layer.

#### Entity lifecycle — three tiers, not one universal pattern

Use a single `status` column as the source of truth. `deletedAt` is an audit timestamp only, never the primary filter.

**Tier 1 — Time-bound structural entities** (academic years, exam terms, fee structures):
- Status enum: `active | archived | deleted`
- `archived` = lifecycle ended naturally (year completed); still joinable from historical records
- `deleted` = admin correction; only allowed when no business data references the entity
- Keep `deletedAt` as audit-only timestamp set alongside `status = deleted`

**Tier 2 — Ongoing structural entities** (classes):
- Status enum: `active | inactive | deleted`
- `inactive` = suspended, not offered for enrollment
- `deleted` = admin correction; only allowed when no students or enrollments exist
- Keep `deletedAt` as audit-only timestamp set alongside `status = deleted`

**Tier 3 — Leaf reference entities** (sections):
- Status enum: `active | inactive` only — **no delete concept**
- Sections preserve identity forever because attendance and enrollment records reference them
- Reactivate a matching inactive section instead of inserting a duplicate name
- Never add `deletedAt` to sections

**Tier 4 — Transactional records** (attendance, payments, marks):
- No status field and no delete endpoint — append-only
- Corrections go through adjustment/reversal records, not deletes
- FK `onDelete: "restrict"` is the last line of defense

#### Query conventions
- Filter on `ne(entity.status, STATUS.X.DELETED)` not `isNull(entity.deletedAt)`
- Filter on `eq(entity.status, STATUS.X.ACTIVE)` for active-only reads
- `deletedAt` is never read in queries — it is write-only audit metadata

## Package Build Requirements

Internal packages (`packages/database`, `packages/contracts`, `packages/backend-core`) compile TypeScript to a `dist/` folder. The runtime (`api-erp`) imports the compiled JS, not the source.

- `packages/database` — `bun run --cwd packages/database build`
- `packages/contracts` — `bun run --cwd packages/contracts build`
- `packages/backend-core` — `bun run --cwd packages/backend-core build`

Package `exports` use conditional exports: `types` points at `.ts` source (for IDE and typecheck), `default` points at `dist/` (for runtime).

**In normal dev flow this is handled automatically.** The `dev` turbo task has `"dependsOn": ["^build"]`, so `turbo dev` (i.e. `bun run dev` from root) always builds dependency packages first using the turbo cache — instant on cache hit, auto-rebuilds only what changed.

**If running `api-erp` in isolation** (not via `turbo dev`), manually build the packages first, otherwise the API silently uses stale dist with missing columns or exports. The typecheck tools read TypeScript source directly and will pass even when dist is stale — build failures only surface at runtime.

**If adding a new internal package**, set its `package.json` exports with `types` → `./src/index.ts` and `default` → `./dist/index.js`, add a `paths` entry in `apps/api-erp/tsconfig.json`, and add a `build` script that runs `tsc`.

## Agent Rules

- **Never write migration files manually.** Migrations must be generated by the toolchain (`db:generate`, etc.) to stay in sync with schema snapshots and the journal.
- **Never pipe input to interactive CLI prompts.** If a command requires interactive terminal input (selection menus, confirmations), stop and ask the user to run it themselves in a terminal, then continue once they confirm.

## Tool Commands

### Drizzle
- `bun run db:generate` — generate migration files from schema
- `bun run db:migrate` — apply migrations
- `bun run db:studio` — open Drizzle Studio
- `drizzle-kit` does **not** auto-load `.env.local`. Use the repo scripts that already include the correct env-file handling.
- `bun run db:generate` may prompt interactively (e.g. asking whether a new column is a rename or a fresh column). **Never attempt to pipe input or write migrations manually.** Stop and ask the user to run the command themselves in a terminal and confirm when done.

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

#### Required field indicators

All required fields must show a red asterisk (`*`) next to their label. Use the `required` prop on `FieldLabel`:

```tsx
<FieldLabel required>Mobile Number</FieldLabel>
```

- Add `required` to every `FieldLabel` whose backing Zod schema field is not `.optional()`, `.nullish()`, or effectively optional via `.or(z.literal(""))`.
- Do **not** add `required` to display-only labels (e.g. campus Badge readouts), boolean checkboxes, or fields that are part of an all-or-nothing optional group where the whole group can be left blank.
- For fields that are conditionally required (only shown when another field is a certain value), add `required` since the field is always required when visible.

#### Placeholder text rules
- **Never use a realistic-looking value as a placeholder** (e.g. `placeholder="3500"` on a number field, `placeholder="9876543210"` on a phone field). It looks like pre-filled data and confuses users.
- Use descriptive or instructional placeholders only where they add genuine value (e.g. `placeholder="e.g. Term 1, April"` on a label field).
- For numeric fields (amounts, counts, IDs), omit the placeholder entirely — an empty field is clearer than a fake number.
- For optional text fields, a short note like `"Optional internal note"` is acceptable.
- This rule is especially important in ERP forms where admins scan many fields quickly.

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

### ERP CRUD and list pages
- New ERP CRUD/list pages should follow the shared list-page pattern already used by `Classes` and `Academic Years`.
- Prefer these shared frontend primitives instead of building one-off page/table shells:
  - `apps/erp/src/components/entity-list-page.tsx`
  - `apps/erp/src/components/server-data-table.tsx`
  - `apps/erp/src/components/route-entity-sheet.tsx`
  - `apps/erp/src/components/entity-actions.tsx`
  - `apps/erp/src/hooks/use-entity-list-query-state.ts`
- Use URL-backed list state for:
  - search
  - page
  - page size
  - sort field
  - sort order
- Preserve query params when navigating from a list page into a routed sheet and back again.
- For small entities, prefer route-addressable sheet flows:
  - `/entity/new`
  - `/entity/:id/edit`
- For larger or likely-to-grow entities, prefer dedicated create/detail/edit pages instead of sheets.
- Do not mix interaction models for the same entity. Pick one default per entity:
  - sheet/dialog flow
  - dedicated page flow
- Standard page structure for simple CRUD screens:
  - page header with title, description, primary action
  - separate bordered toolbar surface for search and future filters
  - separate bordered table card below
- Standard action hierarchy for ERP CRUD pages:
  - page CTA: `EntityPagePrimaryAction`
  - empty-state CTA: `EntityEmptyStateAction`
  - form submit: `EntityFormPrimaryAction`
  - form cancel/secondary: `EntityFormSecondaryAction`
  - toolbar secondary action: `EntityToolbarSecondaryAction`
  - row action: `EntityRowAction`
- Use the shared action wrappers instead of ad hoc `Button` sizing/radius classes so button height and corner radius stay intentional across pages.
- **CTA label conventions** — follow these exactly to stay consistent across all pages:
  - Page CTA (create): `"New [entity]"` — e.g. `"New class"`, `"New academic year"`. Never use "Add" or "Create".
  - Empty-state CTA: same label as the page CTA — `"New [entity]"`. Do not use "Create first…" or "Add first…".
  - Sheet/dialog title (create): `"New [entity]"` — matches the page CTA.
  - Sheet/dialog title (edit): `"Edit [entity]"`.
  - Form submit (create): `"Create [entity]"` — e.g. `"Create class"`.
  - Form submit (edit): `"Save changes"`.
  - Form cancel: `"Cancel"`.
  - Destructive confirm: `"Delete [entity]"`.
  - Page titles: title case — e.g. `"Academic Years"`, not `"Academic years"`.
- Current action sizing defaults:
  - page CTA: `h-11`, `rounded-lg`
  - empty-state CTA: `h-10`, `rounded-lg`
  - form actions: `h-10`, `rounded-lg`
  - toolbar secondary action: `h-8`, `rounded-lg`
  - row action: `h-8`, `rounded-md`
- If a list API is still array-based and the page is being converted to the shared pattern, upgrade the backend endpoint to the shared paginated list contract with server-side search/sort/pagination.
- After changing a list endpoint from array response to paginated response, update every downstream frontend consumer of that endpoint before finishing.
- Preferred paginated list response shape:
  - `rows`
  - `total`
  - `page`
  - `pageSize`
  - `pageCount`
- Preferred list query params:
  - `q`
  - `page`
  - `limit`
  - `sort`
  - `order`
- When list contracts change:
  - regenerate OpenAPI from `apps/api-erp`
  - regenerate ERP API types
  - run repo typecheck

## Backend Rules

### Auth
- Use NestJS Passport for auth.
- Primary web auth transport is HTTP-only cookie-based session/auth cookies.
- Cookie domain must be the exact request hostname. Never use a wildcard domain.
- Mobile number is the primary login identifier. Email is an alternative for staff.
- On every authenticated request, verify `user.institutionId === resolvedTenant.id`. Reject if mismatched.

### API boundaries
- Keep onboarding/provisioning isolated as its own backend module.
- Tenant ERP concerns should live in domain modules such as students, guardians, staff, campuses, academics, attendance, exams, and fees.
- Route namespaces and guards should make tenant scope explicit.

### Tenant resolution
- Resolve the active institution from the request hostname. Check `customDomain` first, then extract slug from `*.erp.test`.
- The session identifies the user.
- After session deserialization, verify `user.institutionId` matches the resolved tenant. Reject if not.
- Campus context can be stored in session or preference after tenant resolution.

## Domain Modeling Rules

### Identity
- User records are institution-scoped. Mobile is unique per institution, not globally.
- Roles and access are modeled through `member` records, not separate user tables per persona.

### Memberships
- Staff/admin access comes from institution memberships and roles.
- Guardian access comes from guardian relationships to students.
- The same user can have both staff and guardian `member` records within the same institution.

### Data modeling
- Mobile number is unique per institution, not globally.
- Keep institution ownership explicit in all tenant-scoped entities.
- Do not rely on frontend state to define tenant or campus ownership.

### Guardian and staff data entry
- Admin-led entry only. Do not build invite flows.
- On submit, backend looks up user by `(institutionId, mobile)`.
- If found with same role: return a clear error before hitting the DB constraint.
- If found with different role: create a new `member` record only. Do not overwrite name or email.
- If not found: create user with default password = mobile number, `mustChangePassword = true`, then create `member` record.

## Framework Discoveries

> **For AI agents:** When you discover something non-obvious about the framework, library version behavior, or a gotcha that bit us, add it here immediately so future agents do not repeat it.

### React Router v7
- In `apps/erp`, prefer `react-router` imports for route APIs, hooks, and components such as `Link`, `Navigate`, `Outlet`, `createBrowserRouter`, `useNavigate`, `useLocation`, `useParams`, and `useSearchParams`.
- For DOM-specific providers in browser apps, import `RouterProvider` from `react-router/dom`.
- Do not add new `react-router-dom` imports for React Router v7 work unless a migration step explicitly requires the compatibility package.

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
- Cookie domain must be the **exact request hostname**, not a wildcard. Set it dynamically from the incoming request.
- Local dev: `demo.erp.test` → cookie domain `demo.erp.test`. Do not use `.erp.test`.
- Custom domains: `portal.school.com` → cookie domain `portal.school.com`.
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
- `apps/api-erp` uses Swagger CLI plugin metadata generation via `src/generate-metadata.ts` plus `SwaggerModule.loadPluginMetadata()`.
- In `*.dto.ts` files, do not add `@ApiProperty()` or `@ApiPropertyOptional()` when they only repeat a simple inferred TypeScript shape. The plugin already infers plain property docs, optionality, arrays, enums, and defaults for OpenAPI generation.
- Keep Swagger property decorators only when they carry real OpenAPI metadata the plugin cannot express clearly on its own, such as `nullable: true`, explicit nested/lazy `type`, `isArray` for nested DTO refs, schema composition, examples/descriptions, formats, or other schema overrides.
- After DTO refactors, regenerate OpenAPI and confirm the generated document is semantically unchanged before treating the cleanup as safe.

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
