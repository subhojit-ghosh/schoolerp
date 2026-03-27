# Repo Roadmap

## Purpose

This file is the repo-level roadmap.

Use it to answer:

- what is being driven right now
- what should happen next
- what can wait
- what product and architecture constraints are already locked

Keep this file forward-looking. Put factual implementation state in `docs/status.md`.

## Goal

Ship a fully functional v1 that a real school can use day-to-day. Every feature must be complete enough for a paying customer to rely on it — not a prototype, not a demo with placeholders. The bar is: can a school admin use this to run their school tomorrow?

## Testing Policy

**No tests until v1 is functionally complete.** Do not write, suggest, or plan integration tests, unit tests, e2e tests, or any automated test coverage until the full v1 feature set is built and working. Focus entirely on shipping functional product. Testing is a post-v1 concern.

## Direction

- Build a school-first ERP around the target monorepo structure:
  - `apps/web`
  - `apps/erp`
  - `apps/api-erp`
  - `packages/*`
- Keep NestJS as the source of truth for auth, tenant resolution, and business rules.
- Treat the frontend as a thin client over tenant-scoped APIs.
- Every screen a customer sees must be usable, not a placeholder.

## Now — Validate and harden for pilot

The core v1 feature set is built and transport is complete. Remaining work is validation and hardening:

1. **End-to-end delivery testing** — institutions need to configure actual SMS/email provider credentials (Settings > Delivery) and verify password reset and notification delivery works end-to-end in production.
2. **OpenAPI regeneration** — run `bun run openapi:export` inside `apps/api-erp` (with `DATABASE_URL` set) to regenerate the OpenAPI spec and ERP API client types after the transport module deployment; this replaces the `as any` casts in the transport frontend with proper TypeScript types.

## Next — Add the common breadth schools expect in a feature-rich ERP

1. **Cross-module polish** — consistency pass across student/staff/fees/exams/attendance/admissions flows for copy, empty states, and action hierarchy.
2. **Operational quality** — eliminate rough UX edges that create support burden during pilot rollouts.

## Later — Post-v1 depth

- Attendance analytics and absent streak automation
- Exam analytics, deeper reporting, and ranking
- Finance depth: receipts hardening, ledger export, accounting-adjacent workflows
- Inventory and stock workflows
- Payroll after staff leave and attendance foundations are stable
- Hostel and other segment-specific extensions where the target schools require them
- Automated test coverage across all domains

## Risks And Dependencies

- Password reset and staff password-setup links rely on a real SMS/email provider being configured per-institution (Settings > Delivery). Without a configured provider, delivery falls back to global config; verify global config is set in production env before go-live.
- OpenAPI spec is stale until `bun run openapi:export` is run with a live database; transport frontend uses `as any` casts until then.
- Business rules must stay in NestJS; any shortcut that pushes authorization or domain logic into the frontend creates a security gap.

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
