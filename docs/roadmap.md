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

## Now — Close remaining v1 blockers

These items still block full day-to-day v1 readiness:

1. **Student detail page** — one place to see a student's profile, current enrollment, attendance record, fee status, and exam results.
2. **SMS/email delivery** — wire a real provider for password reset and staff password-setup links. The current delivery stub means new staff cannot log in without manual intervention.
3. **Onboarding flow polish** — public school signup at `erp.test` should feel complete for self-serve trials without operator help.

## Next — Complete the remaining operational domains

1. **Notifications** — in-app feed scaffold exists; wire real events (fee due, absent streak, password-setup).
2. **Branding hardening** — ensure tenant logo, favicon, display name, and theme tokens are robust across tenant bootstrap and navigation.

## Then — Polish and close gaps

1. **Cross-module polish** — consistency pass across student/staff/fees/exams/attendance flows for copy, empty states, and action hierarchy.
2. **Operational quality** — eliminate rough UX edges that create support burden during pilot rollouts.

## Later — Post-v1 depth

- Attendance analytics, absent streak alerts, bulk import
- Exam ranking, analytics, report card PDF export
- Fee reminders, payment receipts, ledger export
- Staff leave and payroll foundations
- Parent portal with student-centric view
- Automated test coverage across all domains

## Risks And Dependencies

- Password reset and staff password-setup links are broken for production use until a real SMS/email provider is wired.
- Student detail still lacks a unified, cross-domain operational view.
- Onboarding still needs UX hardening for fully self-serve institution setup.
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
