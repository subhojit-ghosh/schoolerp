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

## Implemented But Not Customer-Usable — Needs work before showing to a customer

- **Dashboard** — exists but shows almost no data. Only student count is live. No attendance summary, no fees outstanding, no staff count. Attendance quick-action is disabled ("Coming soon").
- **Attendance** — backend works, frontend form works, but: (1) attendance link is disabled in dashboard, (2) class selector shows raw IDs not names. Not usable by a teacher as-is.
- **Fees** — backend works, but frontend is three raw creation forms on one page. No structured list of fee categories, no proper assign-then-collect workflow. Not usable by a school admin as-is.
- **Exams** — backend has term create/list and batch marks entry. Frontend has term creation and marks entry form. No grading scheme, no report card, no subject-wise breakdown visible to a parent or student.

## In Progress

- Auth delivery: no SMS or email provider wired. Password reset tokens and staff password-setup links are generated but not delivered.
- Frontend presentation: many pages are functional but not polished enough for a customer demo.

## Missing for v1

- **Dashboard** real metrics: today's attendance summary, outstanding fees total, staff count
- **Attendance** class name display fix; enable nav link; teacher-friendly daily flow
- **Fees** proper list/assign/collect workflow replacing the current raw-form page
- **Exams** grading scheme, subject-wise marks, report card view per student per term
- **Student detail** unified view: profile, enrollment, attendance record, fee status, exam results
- **SMS/email delivery** for password reset and staff onboarding links
- **Timetable** — class-wise weekly schedule
- **Branding** — logo upload, favicon, display name, primary color applied to tenant shell
- **Notifications** — in-app feed wired to real events (fee due, absent streak, password-setup)
- **Onboarding polish** — public school signup flow usable without assistance
