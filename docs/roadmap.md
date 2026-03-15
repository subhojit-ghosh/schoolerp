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

## Now — Make the core daily workflow usable

These are the things a school uses every single day. They must work completely.

1. **Dashboard** — real metrics a principal wants to see at a glance: student count, staff count, today's attendance summary, total outstanding fees. No placeholder cards.
2. **Attendance** — daily class-wise marking must work end to end. Class selector must show class names, not raw IDs. Attendance link must be enabled in the nav and dashboard. A teacher should be able to open the app and mark attendance in under a minute.
3. **Fees** — fee collection must be a proper workflow: structured list of fee categories, assign to students, record payment, see who still owes. Not three raw forms on one page.

## Next — Complete the remaining operational domains

1. **Exams** — full marks entry per subject, grading scheme, and a printable/viewable report card per student per term.
2. **Student detail page** — one place to see a student's profile, current enrollment, attendance record, fee status, and exam results. This is what a parent or admin looks at when they call about a student.
3. **SMS/email delivery** — wire a real provider for password reset and staff password-setup links. The current delivery stub means new staff cannot log in without manual intervention.

## Then — Polish and close gaps

1. **Notifications** — in-app feed is scaffolded; wire real events (fee due, absent streak, password-setup).
2. **Timetable** — class-wise weekly schedule. Required before the product is complete for a school day.
3. **Branding** — logo upload, favicon, display name, and primary color applied to the tenant ERP shell. Required before any school would use it publicly.
4. **Onboarding flow** — public school signup at `erp.test` must be polished enough that a new school can self-serve without assistance.

## Later — Post-v1 depth

- Attendance analytics, absent streak alerts, bulk import
- Exam ranking, analytics, report card PDF export
- Fee reminders, payment receipts, ledger export
- Staff leave and payroll foundations
- Parent portal with student-centric view
- Automated test coverage across all domains

## Risks And Dependencies

- Password reset and staff password-setup links are broken for production use until a real SMS/email provider is wired.
- Attendance class selector shows raw IDs — blocks teachers from using it reliably.
- The fees page UX is too raw to hand to a school admin.
- Dashboard shows almost no data — first thing a customer sees, last thing that should be empty.
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
