# Repo Roadmap

## Purpose

This file is the repo-level roadmap.

Use it to answer:

- what is being driven right now
- what should happen next
- what can wait
- what product and architecture constraints are already locked

Keep this file forward-looking. Put factual implementation state in `docs/status.md`.

## Direction

- Build a school-first ERP around the target monorepo structure:
  - `apps/erp`
  - `apps/api-erp`
  - `packages/*`
- Keep NestJS as the source of truth for auth, tenant resolution, and business rules.
- Treat the frontend as a thin client over tenant-scoped APIs.
- Continue moving the repo away from legacy architecture and toward the Vite + NestJS split.

## Now

- Finish hardening the auth and onboarding foundation:
  - add password recovery delivery abstraction
  - add forgot-password throttling and abuse protection
  - audit tenant/session enforcement with tests
  - harden onboarding with backend tests
- Keep frontend work pragmatic while the visual system remains temporary.

## Next

1. Lock authorization primitives and shared constants.
2. Start the first real ERP domain slice:
   students + guardians + campus assignment.
3. Add tenant-aware backend tests around auth, onboarding, and campus context.
4. Define the first institution admin workflows on top of the new backend boundaries.

## Later

- Expand ERP domains after the identity and tenant core is stable:
  - staff
  - academics
  - attendance
  - exams
  - fees
- Move more shared UI and shared backend primitives into packages as patterns settle.
- Replace temporary frontend presentation with the intended ERP design system.

## Risks And Dependencies

- Password recovery is not production-ready until delivery and abuse protection are in place.
- Authorization work should not spread across the frontend; backend guards and tenant checks must stay authoritative.
- Legacy migration residue may still exist in the repo and should not become the basis for new work.

## Locked Product Decisions

- One institution = one tenant.
- Tenant is resolved from subdomain.
- Campus switching happens inside a tenant only.
- One user record per human identity.
- A user may be both staff and parent.
- Auth is NestJS Passport-based.
- Web auth uses HTTP-only cookies.
- Mobile is primary identifier.
- Email is secondary identifier.
- Theme customization is token-driven, not layout-driven.

## Locked Engineering Decisions

- Business rules belong in NestJS, not React.
- Frontend should keep business-facing client logic inside feature modules, not route pages.
- Shared constants must be used for domain values and route strings.
- New browser testing in local dev should use:
  - `https://erp.test`
  - `https://<tenant>.erp.test`
- Local dev should not default to `http://localhost:3000` for browser verification unless explicitly requested.

## Working Convention

When priorities change, update:

1. this file for roadmap sequencing and emphasis
2. `docs/status.md` for concise factual repo state
3. `docs/plans/*` for task-level implementation detail
