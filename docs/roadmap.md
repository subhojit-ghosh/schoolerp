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

1. **SMS/email delivery** — wire a real provider for password reset, staff password-setup, and future school communications. The current delivery stub means new staff cannot log in without manual intervention.
2. **Onboarding flow polish** — public school signup at `erp.test` should feel complete for self-serve trials without operator help.
3. **Notifications depth** — expand beyond announcement-publish events into fee due, absent streak, password-setup, admissions, and approval workflows so the ERP feels operational instead of module-siloed.

## Next — Close operational gaps a real school hits quickly

1. **Bulk import/export** — schools need fast onboarding and spreadsheet interoperability for students, staff, guardians, and fee data.
2. **Audit trail** — sensitive actions such as fee reversals, marks replacement, attendance corrections, role changes, and rollover actions need traceable history.
3. **Document outputs** — fee receipts, report cards, admission acknowledgements, and certificate-ready output are part of daily school operations.
4. **Branding hardening** — ensure tenant logo, favicon, display name, and theme tokens are robust across tenant bootstrap, printing, and navigation.

## Then — Add the common breadth schools expect in a feature-rich ERP

1. **Parent portal completion** — dues, attendance, report cards, notices, and student-centric actions must work outside the staff dashboard.
2. **Student portal completion** — student view is still placeholder-grade and must become useful for timetable, attendance, exams, and notices.
3. **Library** — catalog, issue/return, member history, and fine tracking are common school ERP expectations.
4. **Transport** — routes, stops, vehicle mapping, and student transport assignment are common operational requirements.
5. **Staff leave management** — leave requests, balances, approvals, and calendar visibility should land before payroll.
6. **Cross-module polish** — consistency pass across student/staff/fees/exams/attendance/admissions flows for copy, empty states, and action hierarchy.
7. **Operational quality** — eliminate rough UX edges that create support burden during pilot rollouts.

## Later — Post-v1 depth

- Attendance analytics and absent streak automation
- Exam analytics, deeper reporting, and ranking
- Finance depth: receipts hardening, ledger export, accounting-adjacent workflows
- Inventory and stock workflows
- Payroll after staff leave and attendance foundations are stable
- Hostel and other segment-specific extensions where the target schools require them
- Automated test coverage across all domains

## Risks And Dependencies

- Password reset and staff password-setup links are broken for production use until a real SMS/email provider is wired.
- Parent and student dashboards are still placeholder-grade.
- Schools will still fall back to spreadsheets for bulk onboarding until import/export workflows exist.
- A broader, feature-rich ERP direction increases surface area; sequencing discipline is required so common breadth modules do not derail core v1 blockers.
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
