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
- **Student rollover** — source-year roster preview, section-to-section mapping, withdrawal handling, and academic-year progression into target current enrollment
- **Student 360** — operational student profile with attendance snapshot, fee snapshot, exam snapshot, guardian details, and recent activity timeline
- **Staff** — list, create, edit, detail; campus assignment; role assignment; active/inactive toggle; password-setup issuance on create
- **Guardians** — list, detail, edit; linked-student relationship management
- **Roles** — list, create, edit, delete; grouped permission picker; system role display
- **Fees** — fee structures list/create/edit/archive/delete, single and bulk assignment, dues view, payment collection, concessions, payment reversal, and filtered collection reporting
  - Fee assignments now use hard delete guardrails (blocked when payments/adjustments exist) to avoid hidden soft-deleted blockers during installment/version workflows
- **Dashboard** — live tiles for enrolled students, staff count, today's attendance coverage, and total outstanding fees; quick links for attendance/exams/fees are enabled
- **Attendance** — daily class-wise marking flow with class/section names, day overview, and class/student attendance reports
- **Exams** — term management, marks entry, saved marks, and student report card view with grading scheme + printable output
- **Subjects** — list, create, edit, active/inactive toggle, and delete guardrails when timetable dependencies exist
- **Timetable** — class/section weekly schedule editor with replace flow and per-entry deletion
- **Calendar** — event list/create/edit, active/inactive toggle, and tenant-scoped calendar events
- **Admissions** — enquiry and application pipelines with list/create/edit flows, status tracking, and tenant-scoped APIs
- **Announcements / communication** — announcement list/create/edit/publish flows plus backend-driven in-app notification feed and mark-all-read support

## Implemented But Not Customer-Usable — Needs work before showing to a customer

- Frontend presentation: many pages are functional but not polished enough for a customer demo.
- **Parent dashboard** — visible but still placeholder-grade.
- **Student dashboard** — visible but still placeholder-grade.

## In Progress

- Auth delivery: no SMS or email provider wired. Password reset tokens and staff password-setup links are generated but not delivered.

## Missing for v1

- **SMS/email delivery** for password reset and staff onboarding links
- **Notifications depth** — expand the feed beyond announcement-publish events into fee due, absent streak, password-setup, admissions, and approval workflows
- **Bulk import/export** for students, staff, guardians, and fee data
- **Audit trail** for sensitive operational and financial mutations
- **Document outputs** such as fee receipts, acknowledgements, and certificate/report-card-ready exports
- **Onboarding polish** — public school signup flow usable without assistance

## Planned Next — Feature-rich ERP breadth not yet implemented

- **Library** — catalog, issue/return, member history, and fines
- **Transport** — routes, stops, vehicles, and student transport assignment
- **Staff leave management** — leave balances, requests, approvals, and calendar visibility
- **Inventory** — stock, issue tracking, and basic procurement-adjacent workflows
- **Payroll** — salary structures, deductions, and payslip workflows after staff leave foundations
- **Hostel** — segment-specific boarding workflows if target schools require them
