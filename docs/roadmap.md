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
  - `apps/web`
  - `apps/erp`
  - `apps/api-erp`
  - `packages/*`
- Keep NestJS as the source of truth for auth, tenant resolution, and business rules.
- Treat the frontend as a thin client over tenant-scoped APIs.
- Continue moving the repo away from legacy architecture and toward the Vite + NestJS split.

## Now

- Lock the next backend boundary on top of the new auth foundation:
  - extend authorization primitives and capability-driven APIs
  - turn the student and staff slices into fuller institution-admin workflows
  - add the first attendance workflow around daily class-section entry and day views
  - add shallow academics workflows such as exam terms and marks entry without expanding into report cards or analytics
  - turn the student and staff slices into fuller institution-admin workflows
  - keep the temporary ERP frontend thin over backend-owned rules
- Keep delivery integrations pragmatic:
  - replace recovery preview delivery with real SMS/email adapters when infra is ready

## Next

1. Add explicit authorization/capability primitives for institution admin workflows.
2. Expand the student slice from create/list into detail, edit, and safer guardian management flows.
3. Add integration coverage around staff create/edit flows and campus-safe role assignment.
4. Replace placeholder recovery delivery with production SMS/email providers.
5. Add broader tenant-aware integration coverage around auth, onboarding, and new ERP modules.

## Later

- Expand ERP domains after the identity and tenant core is stable:
  - academics
  - attendance
  - exams
- Deepen existing ERP domains after the initial operational slices are in place:
  - fees reporting and collection edge cases
- Move more shared UI and shared backend primitives into packages as patterns settle.
- Replace temporary frontend presentation with the intended ERP design system.

## Risks And Dependencies

- Password recovery still needs real SMS/email delivery providers before it is production-ready.
- Authorization work should not spread across the frontend; backend guards and tenant checks must stay authoritative.
- The new student slice relies on the updated membership model that allows one user to hold multiple member types inside a tenant.
- Destructive ERP operations must fail closed when live records still depend on the target entity; soft-delete alone is not a safe guard.
- Legacy migration residue may still exist in the repo and should not become the basis for new work.

## Locked Product Decisions

- One institution = one tenant.
- Tenant is resolved from subdomain.
- The root domain hosts public entry and onboarding, not tenant ERP workflows.
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
- Tenant-scoped destructive operations must block when the action would orphan, hide, or silently detach active business data.
- New browser testing in local dev should use:
  - `https://erp.test`
  - `https://<tenant>.erp.test`
- Local dev should not default to `http://localhost:3000` for browser verification unless explicitly requested.

## Working Convention

When priorities change, update:

1. this file for roadmap sequencing and emphasis
2. `docs/status.md` for concise factual repo state
3. `docs/plans/*` for task-level implementation detail
