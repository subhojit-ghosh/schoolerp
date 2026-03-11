# NestJS Backend + Disposable Frontend Split

## Goal

Restructure the product so the backend becomes the long-lived system of record and the UI becomes replaceable. The immediate target is a NestJS backend with a separate web frontend, while keeping the door open for a future mobile app without rebuilding the business layer again.

## Why This Change Makes Sense

The current codebase is a Next.js app where backend behavior is still embedded inside the frontend runtime:

- auth is exposed through Next route handlers
- write operations are implemented as Next server actions
- request context depends on `next/headers`
- cache invalidation depends on `revalidatePath`
- access control resolution is tied to the Next request lifecycle

That means the UI is not actually disposable today. Replacing the UI would also mean rewriting most of the backend behavior that currently lives inside the app.

## Recommendation

Move to a monorepo with clear application boundaries:

- `apps/api` = NestJS backend
- `apps/web` = Next.js frontend
- `apps/mobile` = future mobile app
- `packages/contracts` = shared API DTOs, validation schemas, generated client types
- `packages/config` = shared TypeScript, ESLint, and tooling config

The backend should own:

- authentication
- authorization and RBAC
- institution resolution
- academic engine rules
- database access
- background jobs
- audit logging
- public API contracts

The frontend should own:

- rendering
- forms
- view state
- local UI composition
- API consumption only

## Important Architectural Decision

Do not recreate the current pattern in Nest by letting the web app keep direct DB access or business logic helpers.

The split only works if:

- frontend never imports Drizzle or database schema
- frontend never imports auth internals
- frontend never executes business rules directly
- frontend talks to backend only through HTTP APIs or a generated SDK

If that boundary is weak, the frontend will still not be disposable.

## Current Coupling Points To Extract

These areas are currently good candidates for extraction into Nest modules:

### Auth

Current code:

- `src/lib/auth.ts`
- `src/app/api/auth/[...all]/route.ts`
- `src/proxy.ts`
- `src/server/auth/*`

Problem:

- session handling is built around Better Auth + Next integration
- request-scoped access checks use Next headers and server component context

Target:

- Nest auth module
- explicit auth endpoints
- explicit current-user endpoint
- explicit org context resolution strategy

### Institutions

Current code:

- `src/server/institutions/*`

Problem:

- creation and updates are implemented as server actions
- redirect and cache revalidation are mixed into the write path

Target:

- Nest institutions module with service, controller, DTOs, guards

### Roles and Members

Current code:

- `src/server/roles/*`
- `src/server/members/*`

Problem:

- authorization and validation are mixed with Next action wrappers

Target:

- Nest RBAC module
- Nest members module
- shared permission guard strategy

### Academic Years

Current code:

- `src/server/academic-years/*`

Problem:

- business rules are close to reusable already, but still wrapped in Next-specific action flow

Target:

- Nest academic module or settings module

## Suggested Target Stack

### Backend

- NestJS
- PostgreSQL
- Drizzle ORM
- Zod at boundaries where useful, or class-validator if you want idiomatic Nest DTOs
- OpenAPI generation for web/mobile client consumption

### Frontend

- Keep Next.js for the web frontend if you want fast iteration
- Treat it as a pure client of the API, not as the backend host

### Mobile

- Expo / React Native later
- consume the same API and auth flow as web

## Auth Strategy Recommendation

If mobile support is a real goal, do not design the new backend around web-only assumptions.

Preferred direction:

- Nest owns authentication
- use short-lived access tokens plus refresh token rotation, or another mobile-friendly session model
- keep authorization checks on the API, not in the frontend

The current Better Auth + Next setup is optimized around the Next app. If Better Auth is retained, it should be hosted behind the backend boundary instead of leaking frontend framework assumptions into the app again.

## Migration Strategy

Do not do a big-bang rewrite. Extract in vertical slices.

### Phase 1: Restructure Repository

Create a workspace layout:

- `apps/web`
- `apps/api`
- `packages/contracts`

Move the current Next app into `apps/web` first without changing behavior.

Reason:

- this gives you a clean repo shape before rewriting backend concerns
- it also prevents Nest setup from being bolted awkwardly into the existing root

### Phase 2: Establish Shared Contracts

Create shared request and response contracts for:

- auth
- institutions
- members
- roles
- academic years

Avoid duplicating validation logic separately in web and API. The shared contract package should become the stable seam between disposable UI and durable backend.

### Phase 3: Build Nest Foundation

Create core Nest modules:

- `AuthModule`
- `DatabaseModule`
- `InstitutionsModule`
- `MembersModule`
- `RolesModule`
- `AcademicYearsModule`
- `HealthModule`

Also add:

- exception filters
- request logging
- auth guards
- permission guards
- organization context resolver

### Phase 4: Move Read APIs First

Start with GET endpoints before writes.

Suggested order:

1. institution context
2. current user / session
3. list institutions
4. list members
5. list roles
6. list academic years

Reason:

- easier to validate
- frontend can start consuming backend without changing mutation flows immediately

### Phase 5: Move Mutations

Replace server actions one domain at a time:

1. institutions
2. academic years
3. roles
4. members

For each migrated action:

- add Nest endpoint
- switch frontend form submit to API call
- remove Next server action
- remove `revalidatePath` dependency

### Phase 6: Remove Next-Owned Backend Concerns

After all major domains are moved:

- remove `src/server/*` write paths
- remove `next-safe-action` from backend concerns
- shrink `src/lib/auth.ts` usage in web
- keep only frontend session consumption logic, or replace it entirely with API-based auth

### Phase 7: Prepare Mobile Readiness

Before building mobile, ensure:

- auth flow works without browser-only assumptions
- all important user flows are exposed as API endpoints
- permissions are enforced by backend
- file uploads and notifications have explicit backend support

## Proposed Nest Module Mapping

Translate the current domain structure directly where possible:

- `src/server/institutions/*` -> `apps/api/src/modules/institutions/*`
- `src/server/members/*` -> `apps/api/src/modules/members/*`
- `src/server/roles/*` -> `apps/api/src/modules/roles/*`
- `src/server/academic-years/*` -> `apps/api/src/modules/academic-years/*`
- `src/server/auth/*` -> `apps/api/src/modules/auth/*`

This reduces cognitive churn and makes the extraction incremental instead of conceptual.

## What To Keep From The Current App

Keep:

- database schema
- constants
- domain naming
- permission model
- institution and membership concepts
- Drizzle usage patterns

Do not keep as architecture:

- server actions as business layer
- `revalidatePath` in write flows
- `next/headers` as a core dependency
- route-handler-owned auth as the long-term backend

## Risks

### Risk 1: Rebuilding Too Much At Once

If auth, RBAC, institutions, and UI are all rewritten together, progress will stall and confidence will drop quickly.

Mitigation:

- move one domain at a time
- keep web working during extraction

### Risk 2: Keeping Hidden Coupling

If the web app still imports backend code directly, the split becomes cosmetic.

Mitigation:

- enforce package boundaries
- allow the frontend to consume only contracts and generated client code

### Risk 3: Auth Becomes Web-Only Again

If the new auth setup depends on browser cookies only, the mobile app will pay the price later.

Mitigation:

- choose a backend-owned session strategy that supports both browser and mobile clients

## Recommended Immediate Next Steps

1. Convert the repository into a workspace layout without changing app behavior.
2. Scaffold `apps/api` with NestJS.
3. Move database access ownership to the backend plan, even if web temporarily still reads directly during transition.
4. Define contracts for auth, institutions, members, roles, and academic years.
5. Migrate read endpoints first, then mutations.

## Opinionated Call

This is the right move if your main problem is that UI experimentation keeps forcing full-project rewrites.

What you need is not a prettier frontend architecture. You need a backend that survives frontend restarts. NestJS plus a strict API boundary solves that. A rewritten frontend inside the same Next-centric backend model does not.
