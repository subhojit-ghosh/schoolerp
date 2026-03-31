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

## Phase 0b — Complete (backend + frontend)

All 5 Phase 0b items are implemented end-to-end:

- **Exams depth** — configurable grading scales (CRUD, institution default), exam types (unit_test/midterm/final/practical) with weightage and type badge, grace marks in marks entry, rank generation (dense ranking) with class/section rank on report cards, class analysis (per-subject avg/high/low/pass/fail/topper), pass/fail result, batch report cards print route
- **Attendance depth** — half-day status with orange button in marking UI, holiday integration via calendar events, monthly attendance register endpoint, consolidated class-wise report endpoint, chronic absentees endpoint
- **Fees depth** — fee categories (tuition/transport/hostel/lab/misc) dropdown on structure form, mode-wise collection report endpoint, late fee rules CRUD + calculation (flat/per-day with grace period and cap), demand notice generation endpoint, batch receipts endpoint
- **Document config** — new Settings > Documents page with signatory management (add/activate/deactivate), receipt numbering config (prefix/next number/pad length with preview), report card field toggles (rank/remarks/attendance/grading/result), sidebar nav item
- **Batch printing** — batch report cards page at /documents/batch-report-cards, batch receipts page at /documents/batch-receipts, both with CSS page-break-after for proper multi-page browser printing

## Phase 1 — Complete (10 items, First 5 Schools)

All Phase 1 items implemented end-to-end:

- **Guided setup checklist** — backend setup-status endpoint returns entity counts, dashboard shows interactive checklist with progress bar (academic years, classes, subjects, staff, students, fee structures) with dismiss + localStorage persistence
- **Leave management depth** — leave type categories (casual/sick/earned/comp_off/maternity/paternity), carry-forward days, half-day leave support, holiday integration (auto-excludes calendar holidays from leave day count), leave balance tracking per staff per academic year with allocation endpoint, team leave calendar showing approved leaves by date
- **Payroll depth** — attendance-based LOP deduction (absent days + half-day from staff attendance integrated into payroll processing), statutory salary component seeding (Basic, HRA, DA, Conveyance, PF employee/employer, ESI employee/employer, Professional Tax, TDS), bank transfer file export (CSV with NEFT format), download button on payroll run detail
- **Global search upgrade** — backend `/search` endpoint querying students (by name/admission number), staff (by name/employee ID), and fee receipts (by receipt number); Cmd+K now shows live backend search results above navigation items with type badges
- **Government compliance** — caste/category/religion/nationality/motherTongue/bloodGroup/aadharNumber fields on students, boardAffiliation/affiliationNumber/udiseCode/address/city/state/pincode/contactPhone/contactEmail on institution, staff-student ratio endpoint
- **Data export** — full institution data dump endpoint combining students, staff, guardians, and fee assignments into a single CSV download
- **PTM module** — sessions CRUD (title, date, time range, slot duration), auto-generate time slots per teacher, slot booking (student + parent), feedback recording with attendance marking, PTM sessions list page with create dialog
- **Student section transfer** — mid-year section/class transfer endpoint updates both student record and current enrollment in one operation with audit trail
- **Role-specific dashboards** — dashboard "For you" section shows context-aware insights: admin sees ratio/defaulters/audit, accountant sees collection/defaulters/payroll, teacher sees attendance/homework/PTM
- **Notification preferences** — per-user channel toggles (SMS/email/in-app), quiet hours configuration, digest mode (instant/daily/weekly), settings page under account

## Phase 2 — Complete (Module Depth, 10 modules)

All Phase 2 module depth items implemented end-to-end (backend + frontend):

- **Library depth** — fine collection (collect/waive on overdue returns), book reservation queue with position tracking and fulfill/cancel flow, member borrowing history endpoint, overdue detection and bulk mark-overdue, librarian dashboard (stat cards: books out/returned today, overdue count, pending reservations; popular books; recent transactions); reservation list page and dashboard page in ERP sidebar
- **Admissions depth** — document checklist management (CRUD for required documents per institution), application document tracking (per-application upload status: pending/uploaded/verified/rejected), convert-to-student pipeline (one-click: approved application → student record + enrollment + membership), waitlist management (waitlist applications with position, promote next when seat opens), registration fee recording on application
- **Hostel depth** — mess plan assignment to students (linked to bed allocation, active/inactive lifecycle), room transfer workflow (vacate old allocation, create new, record transfer history, adjust occupancy on both rooms), occupancy dashboard (building-wise and floor-wise capacity/occupied/available with bars), batch bed allocation; mess assignments, room transfers, and occupancy pages in ERP sidebar
- **Transport depth** — driver management as proper entity (CRUD with license, expiry, emergency contact), vehicle maintenance log (regular/repair/inspection with cost, date, next due, vendor), route-wise student list report, deactivate routes/vehicles with dependency checks (active assignments, active vehicles); drivers and maintenance pages in ERP sidebar
- **Inventory depth** — vendor management (CRUD with contact, GST, active/inactive), purchase order workflow (create PO with line items, order/cancel, GRN receive against PO auto-updating stock and transitioning PO status), department-wise issue tracking (departmentName on stock transactions), cost tracking (unitPriceInPaise on transactions); vendors and purchase orders pages in ERP sidebar
- **Homework depth** — student submission tracking (teacher marks submitted/not_submitted/late per student), file attachment support (attachmentUrl on homework and submissions), parent visibility toggle (parentVisible boolean), per-homework submission analytics (total/submitted/not_submitted/late/rate), class-wise completion analytics
- **Announcements depth** — class/section targeted announcements (targetClassId, targetSectionId), scheduled publishing (scheduledPublishAt with auto-publish), read receipt tracking per user (announcementReadReceipts table, mark-read and read-count endpoints), announcement categories (academic/disciplinary/general/urgent)
- **Students depth** — photo upload (photoUrl column), sibling linking (bidirectional sibling links with conflict checks), medical records (single record per student with allergies, conditions, medications, emergency info, doctor, insurance), disciplinary log (append-only incident records with severity, action taken, parent notification), previous school details (name, board, class), TC issuance workflow (issue TC, deactivate membership, unique TC number)
- **Staff depth** — document management (CRUD for appointment letters, qualifications, ID proofs with type categorization), teaching load analysis (periods per week from active timetable entries), campus transfer workflow (transfer between campuses with history, update primary campus and membership), reporting structure (reportingToMemberId), emergency contact relation field
- **Guardians depth** — communication preference (SMS/WhatsApp/email per user), cross-student fee summary (aggregate fee dues/paid/outstanding across all linked children), occupation and annual income range fields

## Phase 2 — Complete (Platform Infrastructure, Cross-cutting, New Modules, 13 items)

All remaining Phase 2 items implemented end-to-end (backend + frontend):

### Platform Infrastructure
- **Domain event infrastructure** — `domain_events` Postgres table as event store, `DomainEventsService.publish()` that participates in the caller's DB transaction, 10-second interval poller that processes pending events through registered listeners, retry with configurable max attempts, admin event list/retry endpoints for debugging
- **Automated workflows** — event listener registration at module init; 8 workflow handlers: attendance.absent → guardian notification, attendance.absent.streak → class teacher alert, fee.overdue → guardian reminder, fee.payment.received → guardian confirmation, admission.approved → staff conversion suggestion, leave.approved/rejected → applicant notification, announcement.published → audience notification. All create in-app notifications via existing notifications table.
- **Actionable dashboard** — "Needs Attention" feed (unmarked attendance, pending leaves, overdue fees with total amounts, absence streaks 3+, pending admissions, pending expense approvals), role-aware filtering by user permissions, dismiss per item, trend indicators (attendance rate week-over-week, fee collection vs target, enrollment changes)

### Cross-cutting
- **File uploads** — Multer-based upload module with local storage at `uploads/<institutionId>/<entityType>/`, 10MB limit, allowed types (images, PDF, doc/xls), metadata tracking in `file_uploads` table, download endpoint with `sendFile`, reusable `FileUploadField` React component with drag-and-drop, progress bar, and delete button
- **Campus filtering** — added optional `campusId` filter parameter to homework, library books, library transactions, inventory items, and inventory transaction list endpoints
- **Bulk import/export** — extended data-exchange module with 3 new entity types: library books (title/author/isbn/publisher/genre/copies), calendar holidays (title/dates/description), inventory items (name/category/sku/unit/stock/location); CSV templates, preview, execute, and export flows
- **PWA** — `manifest.json` (standalone, /dashboard start), service worker with cache-first for static assets and network-first for API, offline queue for attendance/marks POST requests with IndexedDB storage and sync-on-reconnect, install prompt banner, offline indicator banner
- **Keyboard shortcuts** — `Alt+D` dashboard, `Alt+A` attendance, `Alt+F` fees, `Alt+S` students, `Alt+M` exams, `Alt+H` homework, `Alt+N` context-dependent new entity, `Ctrl+K` command palette; respects editable fields; shortcuts dialog updated with all bindings

### Must-haves
- **DPDPA compliance** — consent tracking (per-user per-purpose with grant/withdraw and IP logging), sensitive data access audit log (who viewed what, when, from where), configurable session controls (max concurrent sessions, timeout minutes, require re-auth for sensitive ops), data masking utilities (Aadhar, mobile, email), settings page with session config form and access log table

### New Modules
- **Expense management** — expense categories (CRUD with budget head codes, hierarchy support), expense records (CRUD with campus/department/vendor/receipt tracking), 4-step workflow (draft → submitted → approved/rejected → paid), approval with rejection reason, payment recording with method/reference, expense summary reports by category/month/department; expense categories and expenses list pages in sidebar under Finance
- **Scholarship management** — scholarship types (merit, need-based, sports, government pre/post-matric, minority, SC/ST), application workflow (apply, approve with auto-created fee concession, reject), DBT tracking (not_applied → applied → sanctioned → disbursed), renewal support (period-based expiry, renew from expired application), max recipients cap; scholarships and applications list pages in sidebar under People
- **Emergency broadcast** — multi-channel alerts (SMS/email/in-app via channels array), targeted by campus/class/section/transport route, 3 priority levels (normal/high/critical), pre-built templates (school closure, early dismissal, security alert, weather alert, transport delay), delivery log per recipient per channel with status tracking, recipient resolution from target type; broadcasts list page in sidebar under Communication
- **Income tracking** — categorized income records (donation, grant, government aid, rental, canteen, admission fee, other), campus-scoped, source entity tracking, reference numbers, receipt upload link, income summary by category and month; income records list page in sidebar under Finance

## Implemented But Not Customer-Usable — Needs work before showing to a customer

- No items currently in this category.

## Missing for v1

- **Real SMS/email provider testing** — the delivery abstraction and provider implementations are built; institutions need to configure actual provider credentials and verify delivery end-to-end. **Intentionally deferred to the very last step of v1.**

## Planned Next
- See roadmap.md for Phase 3+ items
