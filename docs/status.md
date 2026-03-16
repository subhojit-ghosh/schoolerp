# Repo Status

## Purpose

This file is the concise factual state of the repository.

Use it to answer:

- what is implemented and customer-usable
- what is implemented but not yet customer-usable (rough/incomplete)
- what is still missing for v1

Keep this file evidence-based. Do not use it as a roadmap.

## Testing Policy

**No tests until v1 is functionally complete.** Do not write, suggest, or plan any automated test coverage until the full v1 feature set is built and working. Testing is a post-v1 concern.

## Infrastructure — Solid

- Monorepo: `apps/web`, `apps/erp`, `apps/api-erp`, `packages/*`
- NestJS owns auth, tenant resolution, and all business rules
- Vite ERP frontend for `https://<tenant>.erp.test`
- Same-host `/api` routing via Caddy
- HTTP-only cookie auth, Passport-based
- Multi-campus tenant model; campus switching in session
- RBAC: permission constants, system role seeding, `PermissionGuard`, scope enforcement, role management UI, staff role assignment UI
- Shared list-page primitives: `EntityListPage`, `ServerDataTable`, URL-backed state, route-addressable sheets

## Customer-Usable — Working end to end

- **Auth** — login, logout, forgot-password, reset-password (delivery is stub-only, not yet wired to SMS/email)
- **Onboarding** — school self-signup provisions institution, campus, admin user, membership, session
- **Campus management** — list, create; settings route with URL-backed state and create sheet
- **Academic years** — list, create, edit; current-year enforcement; sheet flows
- **Classes and sections** — list, create, edit; section lifecycle (active/inactive); campus assignment; dependency guardrails on delete
- **Students** — list, create, edit, detail; enrollment tied to academic year/class/section; guardian linking; admission number
- **Staff** — list, create, edit, detail; campus assignment; role assignment; active/inactive toggle; password-setup issuance on create
- **Guardians** — list, detail, edit; linked-student relationship management
- **Roles** — list, create, edit, delete; grouped permission picker; system role display
- **Fees** — fee structures list/create/edit/archive/delete, single and bulk assignment, dues view, payment collection, concessions, payment reversal, and filtered collection reporting
  - Fee assignments now use hard delete guardrails (blocked when payments/adjustments exist) to avoid hidden soft-deleted blockers during installment/version workflows
- **Dashboard** — live tiles for enrolled students, staff count, today's attendance coverage, and total outstanding fees; quick links for attendance/exams/fees are enabled
- **Attendance** — daily class-wise marking flow with class/section names, day overview, and class/student attendance reports
- **Exams** — term management, marks entry, saved marks, and student report card view with grading scheme + printable output

## Implemented But Not Customer-Usable — Needs work before showing to a customer

- Frontend presentation: many pages are functional but not polished enough for a customer demo.

## In Progress

- Auth delivery: no SMS or email provider wired. Password reset tokens and staff password-setup links are generated but not delivered.

## Missing for v1

- **Student detail** unified view: profile, enrollment, attendance record, fee status, exam results
- **SMS/email delivery** for password reset and staff onboarding links
- **Timetable** — class-wise weekly schedule
- **Branding** — logo upload, favicon, display name, primary color applied to tenant shell
- **Notifications** — in-app feed wired to real events (fee due, absent streak, password-setup)
- **Onboarding polish** — public school signup flow usable without assistance
