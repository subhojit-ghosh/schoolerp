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
- Production Docker Compose stack for VPS deployment under `docker-compose.yml` and `ops/docker/*`
- HTTP-only cookie auth, Passport-based
- Institution-configurable delivery layer: per-tenant SMS (MSG91, Twilio) and email (Resend, SendGrid) provider config with encrypted credential storage, test send, and fallback to global providers
- Multi-campus tenant model; campus switching in session
- RBAC: permission constants, system role seeding, `PermissionGuard`, scope enforcement, role management UI, staff role assignment UI
- Shared list-page primitives: `EntityListPage`, `ServerDataTable`, URL-backed state, route-addressable sheets

## Customer-Usable — Working end to end

- **Auth** — login, logout, forgot-password, reset-password; delivery uses institution-configured provider when available, falls back to global
- **Onboarding** — school self-signup with live slug availability check, slug preview, password strength indicator, and required field indicators; provisions institution, campus, admin user, membership, session; post-signup guided setup wizard (academic year + first class) at `/setup`
- **Campus management** — list, create; settings route with URL-backed state and create sheet
- **Academic years** — list, create, edit; current-year enforcement; sheet flows
- **Classes and sections** — list, create, edit; section lifecycle (active/inactive); campus assignment; dependency guardrails on delete
- **Students** — list, create, edit, detail; enrollment tied to academic year/class/section; guardian linking; admission number
- **Student rollover** — source-year roster preview, section-to-section mapping, withdrawal handling, and academic-year progression into target current enrollment
- **Student 360** — operational student profile with attendance snapshot, fee snapshot, exam snapshot, guardian details, and recent activity timeline
- **Staff** — list, create, edit, detail; campus assignment; role assignment; active/inactive toggle; password-setup issuance on create
- **Guardians** — list, detail, edit; linked-student relationship management
- **Roles** — list, create, edit, delete; grouped permission picker; system role display
- **Fees** — fee structures list/create/edit/archive/delete, single and bulk assignment, dues view, payment collection, concessions, payment reversal, filtered collection reporting, and printable fee receipts from live payment data
  - Fee assignments now use hard delete guardrails (blocked when payments/adjustments exist) to avoid hidden soft-deleted blockers during installment/version workflows
- **Dashboard** — live tiles for enrolled students, staff count, today's attendance coverage, and total outstanding fees; quick links for attendance/exams/fees are enabled
- **Attendance** — daily class-wise marking flow with class/section names, day overview, and class/student attendance reports
- **Exams** — term management, marks entry, saved marks, and student report card view with grading scheme + dedicated printable report-card output
- **Subjects** — list, create, edit, active/inactive toggle, and delete guardrails when timetable dependencies exist
- **Timetable** — bell schedules with `draft | active | archived | deleted` lifecycle, section-scoped timetable versions, effective-date publishing/assignment, draft grid editing, section copy flow, teacher assignment, backend conflict checks, and shared assignment-based reads for ERP, teacher, family, and student timetable views
- **Calendar** — event list/create/edit, active/inactive toggle, and tenant-scoped calendar events
- **Admissions** — enquiry and application pipelines with list/create/edit flows, status tracking, tenant-scoped APIs, and printable application acknowledgements
- **Configurable admission fields** — tenant admins can define additional application/student fields, and the ERP renders and validates them without schema forks per school
- **Announcements / communication** — announcement list/create/edit/publish flows plus backend-driven in-app notification feed and mark-all-read support
- **Notifications** — in-app notification feed with support for announcement, fee payment, fee reversal, attendance absent, admission application, admission status change, and exam results events; outbound delivery via institution-configured SMS/email providers
- **Bulk import/export** — staff-facing CSV templates, preview, execute, and export flows for students, staff, guardians, and fee assignments
- **Student portal** — student dashboard plus working timetable, attendance, exams, results, announcements, and calendar routes in student context
- **Parent dashboard** — family portal with child switcher, attendance summary with stats and recent records, timetable by day, exam terms with report card links, fee dues with overdue highlighting, announcements, and calendar
- **Delivery settings** — institution admins can configure SMS (MSG91, Twilio) and email (Resend, SendGrid) providers from Settings > Delivery, with credential encryption and test send
- **Audit trail** — backend audit recording across all domain services (students, staff, guardians, classes, sections, subjects, campuses, academic years, calendar events, timetable, bell schedules, fees, attendance, exams, roles, admissions, announcements, library, delivery config) with ERP audit log UI (filterable by action, entity type, search)
- **Document outputs** — fee receipts, exam report cards, admission acknowledgements, transfer certificates, bonafide certificates, and character certificates; all printable with institution branding via shared `PrintDocumentShell`; certificate links (TC, Bonafide, Character) accessible directly from student detail page
- **Transport** — routes with stops (inline stop management per route), vehicles with driver info and route assignment, student transport assignments with pickup/dropoff type and date range; full CRUD with active/inactive lifecycle and audit trail; Transport nav group in ERP sidebar
- **Library** — book catalog with status and copy tracking, issue/return workflow with available copy decrement/increment, transaction history with overdue detection, staff member selection from institution roster; full audit trail

## Implemented But Not Customer-Usable — Needs work before showing to a customer

- Frontend presentation: some pages could use UX polish for customer demos.

## Missing for v1

- **Real SMS/email provider testing** — the delivery abstraction and provider implementations are built; institutions need to configure actual provider credentials and verify delivery end-to-end


## Planned Next — Feature-rich ERP breadth not yet implemented
- **Inventory** — stock, issue tracking, and basic procurement-adjacent workflows
- **Payroll** — salary structures, deductions, and payslip workflows after staff leave foundations
- **Hostel** — segment-specific boarding workflows if target schools require them
