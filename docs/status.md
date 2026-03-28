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
- **Classes and sections** — list, create, edit; section lifecycle (active/inactive); campus assignment; class teacher assignment per section; dependency guardrails on delete
- **Students** — list, create, edit, detail; enrollment tied to academic year/class/section; guardian linking; admission number
- **Student rollover** — source-year roster preview, section-to-section mapping, withdrawal handling, and academic-year progression into target current enrollment
- **Student 360** — operational student profile with attendance snapshot, fee snapshot, exam snapshot, guardian details, and recent activity timeline
- **Staff** — list, create, edit, detail; campus assignment; role assignment; active/inactive toggle; password-setup issuance on create
- **Guardians** — list, detail, edit; linked-student relationship management
- **Roles** — list, create, edit, delete; grouped permission picker; system role display
- **Fees** — fee structures list/create/edit/archive/delete, single and bulk assignment, dues view, payment collection, concessions, payment reversal, filtered collection reporting, printable fee receipts from live payment data, and automated daily fee reminders (cron at 08:00 UTC with 24h cooldown) plus manual remind trigger
  - Fee assignments now use hard delete guardrails (blocked when payments/adjustments exist) to avoid hidden soft-deleted blockers during installment/version workflows
- **Online payments** — payment gateway integration with Razorpay, Cashfree, PayU, and custom provider support; order creation, verification, webhook handling; institution-configurable gateway credentials via Settings > Payments
- **Dashboard** — live tiles for enrolled students, staff count, today's attendance coverage, and total outstanding fees; quick links for attendance/exams/fees are enabled
- **Attendance** — daily class-wise student marking flow with class/section names, day overview, and class/student attendance reports
- **Staff attendance** — daily staff attendance marking (present/absent/half-day/on-leave) per campus, day overview across campuses, and date-range staff attendance report with per-staff percentage
- **Exams** — term management, marks entry, saved marks, and student report card view with grading scheme + dedicated printable report-card output
- **Subjects** — list, create, edit, active/inactive toggle, and delete guardrails when timetable dependencies exist
- **Timetable** — bell schedules with `draft | active | archived | deleted` lifecycle, section-scoped timetable versions, effective-date publishing/assignment, draft grid editing, section copy flow, teacher assignment, backend conflict checks, and shared assignment-based reads for ERP, teacher, family, and student timetable views
- **Calendar** — event list/create/edit, active/inactive toggle, and tenant-scoped calendar events
- **Homework** — assignment list/create/edit with class/section/subject scoping, publish workflow, date range queries, full CRUD with audit trail
- **Leave management** — leave types (CRUD), staff leave applications with approval/rejection workflow, cancel flow; integrated with payroll for paid vs unpaid leave deduction
- **Admissions** — enquiry and application pipelines with list/create/edit flows, status tracking, tenant-scoped APIs, and printable application acknowledgements
- **Configurable admission fields** — tenant admins can define additional application/student fields, and the ERP renders and validates them without schema forks per school
- **Announcements / communication** — announcement list/create/edit/publish flows plus backend-driven in-app notification feed and mark-all-read support
- **Notifications** — in-app notification feed with support for announcement, fee payment, fee reversal, attendance absent, admission application, admission status change, and exam results events; outbound delivery via institution-configured SMS/email providers
- **Bulk import/export** — staff-facing CSV templates, preview, execute, and export flows for students, staff, guardians, and fee assignments
- **Student portal** — student dashboard plus working timetable, attendance, exams, results, announcements, and calendar routes in student context
- **Parent dashboard** — family portal with child switcher, attendance summary with stats and recent records, timetable by day, exam terms with report card links, fee dues with overdue highlighting, announcements, and calendar
- **Delivery settings** — institution admins can configure SMS (MSG91, Twilio) and email (Resend, SendGrid) providers from Settings > Delivery, with credential encryption and test send
- **Branding settings** — institution-level customization of logo, favicon, display name, primary/accent colors, fonts, border radius, and UI density; applied via CSS variables at app bootstrap
- **Audit trail** — backend audit recording across all domain services (students, staff, guardians, classes, sections, subjects, campuses, academic years, calendar events, timetable, bell schedules, fees, attendance, exams, roles, admissions, announcements, library, delivery config) with ERP audit log UI (filterable by action, entity type, search)
- **Document outputs** — fee receipts, exam report cards, admission acknowledgements, transfer certificates, bonafide certificates, character certificates, student ID cards, and staff ID cards; all printable with institution branding via shared `PrintDocumentShell`; certificate and ID card links accessible directly from student and staff detail pages
- **Reports** — student strength report (class-wise enrollment counts with campus filter), fee defaulter report (overdue students with outstanding amounts and days past due), attendance reports (class and student), fee collection summary, payroll monthly summary
- **Transport** — routes with stops (inline stop management per route), vehicles with driver info and route assignment, student transport assignments with pickup/dropoff type and date range; full CRUD with active/inactive lifecycle and audit trail; Transport nav group in ERP sidebar
- **Library** — book catalog with status and copy tracking, issue/return workflow with available copy decrement/increment, transaction history with overdue detection, staff member selection from institution roster; full audit trail

- **Hostel** — buildings (boys/girls/co-ed), rooms with floor/capacity/occupancy tracking, bed allocations with student assignment and vacate flow, mess plans with monthly fee tracking; active/inactive lifecycle, full audit trail
- **Inventory** — categories, items with SKU/unit/minimum-stock/location, stock transactions (purchase/issue/return/adjustment), item detail with transaction history, low-stock alert view; active/inactive lifecycle, full audit trail

- **Payroll** — salary components (earning/deduction, fixed/percentage, taxable/statutory), salary templates with multi-component composition, staff salary assignments with per-component overrides, payroll run lifecycle (draft → processed → approved → paid) with automatic leave integration (paid vs unpaid leave deduction from approved leave applications), payslip generation with line-item breakdown, printable payslips via PrintDocumentShell, monthly summary and staff salary history reports; all amounts in paise, percentages in basis points; full audit trail; HR nav group with Salary Components, Salary Templates, Salary Assignments, Payroll Runs

## Phase 0a — Complete (50 items, 190+ files changed)

All pilot-ready polish done. Covers error handling, Indian formatting, UX improvements, and structural upgrades:

- **Error handling** — `extractApiError()` utility; 146 unprotected `mutateAsync` calls across 84 files now have try-catch + user-friendly error toasts; human-readable messages everywhere
- **Indian formatting** — academic year "2025-26" format (16 files); ₹ lakhs/crores currency (already present); DD Mon YYYY dates (already present); phone numbers formatted as "+91 XXXXX-XXXXX" on detail pages and "XXXXX-XXXXX" in tables (12 files)
- **Dynamic tab titles** — all 82+ pages show "Page · School Name ERP" in the browser tab
- **Breadcrumbs** — shared component wired into 14 nested/detail pages, replacing "Back to X" links
- **Form improvements** — student form split into visual sections (Personal Info, Enrollment, Guardian Details); inline validation on blur (`mode: "onTouched"` on 62 forms); unsaved changes guard on 7 form pages; auto-save drafts with localStorage recovery on 4 form pages; sticky form footers on 5 long forms; date sanity warnings (staff DOB, fee amounts, fee due dates); honorific field (Mr./Mrs./Dr./Shri/Smt.) on staff and guardian forms
- **Table upgrades** — sticky headers; sort indicators on unsorted columns; table density toggle (compact/comfortable/spacious); differentiated empty search states; prefetch on hover (students page)
- **Sidebar & navigation** — favorites/pinning (up to 6 modules); recently visited in Cmd+K; keyboard shortcut help overlay (`?` key); sidebar auto-collapses on tablet widths
- **Dashboard** — today's date prominently displayed; last login info; contextual quick access subtitles
- **Session management** — session expiry warning toast after 25min idle; auto-redirect after 30min
- **Documents & print** — receipt verification reference + URL; "View history" links on detail pages; password strength indicator on change/reset password; mobile-friendly print CSS (receipts, ID cards)
- **Visual polish** — animation transitions on sidebar, dropdowns, selects (150ms); consistent mutation loading states on submit buttons; calendar month grid view alongside list view; exams page normalized to standard layout; lazy image component for future avatar support; duplicate detection warning on student create; exam marks completion badges and warnings

## Implemented But Not Customer-Usable — Needs work before showing to a customer

- No items currently in this category.

## Missing for v1

- **Real SMS/email provider testing** — the delivery abstraction and provider implementations are built; institutions need to configure actual provider credentials and verify delivery end-to-end. **Intentionally deferred to the very last step of v1.**

## Planned Next — Post-v1 depth
- See roadmap.md for post-v1 feature depth items (Phase 0b → Phase 1 → ...)
