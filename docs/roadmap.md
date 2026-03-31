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

Ship a production-grade school ERP that a real Indian school can use for daily operations. The bar: can a school admin run their school on this tomorrow?

## Testing Policy

**No tests until v1 is functionally complete.** Do not write, suggest, or plan any automated test coverage until the full v1 feature set is built and working. Testing is a post-v1 concern.

## Direction

- School-first ERP on: `apps/web`, `apps/erp`, `apps/api-erp`, `packages/*`
- NestJS is source of truth for auth, tenant resolution, and business rules
- Frontend is a thin client over tenant-scoped APIs
- Every screen a customer sees must be usable, not a placeholder

## Now — Phase 2 fully complete, entering Phase 3

Phase 2 is fully complete — all 23 items done (module depth, platform infrastructure, cross-cutting, new modules). All migrations applied.

Remaining:

1. **End-to-end delivery testing** *(very last step)* — configure actual SMS/email provider credentials and verify delivery works in production

## Post-v1 — From CRUD to connected platform

v1 delivers 35+ working modules. Post-v1 shifts the product from isolated data-entry screens into a connected, workflow-driven system that tells admins what to do — not just where to type.

### Execution phases — priority order

Everything below is grouped into phases. Each phase has a clear gate: do not start the next phase until the current one is shippable. Detailed specs for each item are in the sections that follow.

---

#### Phase 0a — Quick fixes ~~(1–2 weeks)~~ COMPLETE

All 8 items done, plus 42 additional UX/polish items pulled forward from Phase 1 and the visual polish specs. See `docs/status.md` for the full list of what was implemented.

---

#### Phase 0b — Day-1 module depth (before first paying school)

Gate: Fees, attendance, and exams are production-complete for Indian schools. Print outputs are configurable.

| # | Item | Section reference |
|---|------|-------------------|
| 1 | Fees module depth — installment-wise payments, fee categories, mode-wise reports, late fee calc | Module depth: Fees |
| 2 | Attendance module depth — half-day status, monthly register view, holiday integration | Module depth: Attendance |
| 3 | Exams module depth — grading scale config, multiple exam types, rank generation, class analysis | Module depth: Exams |
| 4 | Document & print configuration — receipt numbering, signatory management, report card field toggles, live preview | Document & print configuration |
| 5 | Batch printing — print 60 report cards / 200 receipts at once as single PDF | Print reliability & efficiency |

---

#### Phase 1 — First 5 schools ~~(earn trust, reduce support load)~~ COMPLETE

All 10 items done. See `docs/status.md` for the full list of what was implemented.

---

#### Phase 2 — Scale to 20+ schools (automation, reduce manual work)

Gate: Schools see value beyond data entry — automated alerts, workflows, actionable insights.

**Module depth (items 4–13): COMPLETE.** See `docs/status.md` for the full list.

| # | Item | Status |
|---|------|--------|
| 1 | Domain event infrastructure — Postgres event store + BullMQ + poller fallback | **Done** |
| 2 | Automated workflows — absence SMS, fee overdue reminders, streak alerts | **Done** |
| 3 | Actionable dashboard — "needs attention" feed, inline actions, trend indicators | **Done** |
| 4 | Library depth — fine collection, reservation queue, borrowing history, overdue alerts, librarian dashboard | **Done** |
| 5 | Admissions depth — convert-to-student pipeline, registration fee, document checklist, waitlist promotion | **Done** |
| 6 | Hostel depth — mess plan assignment, fee integration, room transfer, occupancy dashboard | **Done** |
| 7 | Transport depth — fee integration, route-wise report, driver management, delete/deactivate | **Done** |
| 8 | Inventory depth — purchase orders, vendor management, department-wise issue, cost tracking | **Done** |
| 9 | Homework depth — submission tracking, file attachments, parent visibility, completion analytics | **Done** |
| 10 | Announcements depth — class-targeted, scheduled publishing, read tracking, categories | **Done** |
| 11 | Students depth — photo upload, sibling linking, medical records, disciplinary log, TC workflow | **Done** |
| 12 | Staff depth — document management, teaching load analysis, campus transfer, emergency contacts | **Done** |
| 13 | Guardians depth — communication preference, cross-student fee summary, occupation fields | **Done** |
| 14 | File uploads wired to forms — student photos, homework, staff docs, admission docs | **Done** |
| 15 | Campus filtering — consistent campus filter on all list endpoints | **Done** |
| 16 | Bulk import/export — library books, calendar holidays, inventory items | **Done** |
| 17 | PWA — installable, push notifications, offline attendance and marks entry | **Done** |
| 18 | Keyboard shortcuts — attendance, fees, marks power-user shortcuts | **Done** |
| 19 | DPDPA compliance — consent tracking, data masking, sensitive data access audit, session limits | **Done** |
| 20 | Expense management — track expenses by category, department, budget head | **Done** |
| 21 | Scholarship management — types, application workflow, auto-apply to fees, DBT tracking | **Done** |
| 22 | Emergency broadcast — multi-channel instant alert with delivery confirmation | **Done** |
| 23 | Income beyond fees — donations, grants, government aid, rental income, canteen revenue | **Done** |

---

#### Phase 3 — Market position (differentiation, stickiness)

Gate: Schools choose us over competitors because of features they can't get elsewhere.

| # | Item | Section reference |
|---|------|-------------------|
| 1 | Communication platform — WhatsApp as first-class channel, templates, delivery tracking, per-student log | Platform theme 4 |
| 2 | WhatsApp-native parent experience — two-way interactions, fee payment links, attendance queries | Competitive edge: WhatsApp |
| 3 | Smart defaults by board type — auto-configure grading, exam patterns, class naming on onboarding | Competitive edge: Smart defaults |
| 4 | QR-based operations — ID card scan, QR attendance, receipt verification, library barcode | Competitive edge: QR |
| 5 | Automated government reports — one-click UDISE+, RTE dashboard, affiliation renewal data | Competitive edge: Government reports |
| 6 | Multi-language — Hindi UI, bilingual documents, SMS templates in parent's language | Must-haves: Multi-language |
| 7 | Analytics & trends — trend lines, section comparisons, cohort tracking, anomaly detection | Platform theme 5 |
| 8 | Approval workflows — generalized engine for concessions, certificates, expenses, procurement | Platform theme 6 |
| 9 | Complaint & grievance management — ticket workflow, SLA tracking, anonymous option | New modules: Complaints |
| 10 | Scheduled report delivery — recurring PDF/Excel reports via email | New modules: Scheduled reports |
| 11 | Dark mode — user-togglable full app dark mode | Visual & interaction polish |
| 12 | Visitor management — front desk check-in, student pickup authorization, visitor log | Nice-to-haves: Visitor management |
| 13 | Student diary / daily remarks — replace physical school diary | Nice-to-haves: Student diary |
| 14 | Lesson planning — syllabus coverage tracking, plan templates, timetable alignment | Nice-to-haves: Lesson planning |
| 15 | Parent engagement scoring — track engagement, surface disengaged parents | Competitive edge: Parent engagement |
| 16 | In-app help — contextual tooltips, knowledge base, report-a-problem, changelog | In-app help & support |
| 17 | Onboarding tours — first-visit module walkthroughs | In-app help & support |

---

#### Phase 4 — Platform business (monetization, scale infrastructure)

Gate: The business can sustain itself — billing, admin tools, multi-school operations.

| # | Item | Section reference |
|---|------|-------------------|
| 1 | Subscription & billing — plan tiers, usage tracking, invoices, payment collection, dunning | Platform & business: Billing |
| 2 | Platform admin panel — institution directory, revenue dashboard, feature flags, impersonation | Platform & business: Admin panel |
| 3 | School chain / group management — consolidated dashboards, cross-branch reports, centralized policies | Platform & business: School chains |
| 4 | Budget planning — annual budget by department, actuals vs budget tracking | New modules: Finance |
| 5 | Petty cash management — daily register, approvals, reconciliation | New modules: Finance |
| 6 | Cash book and bank book — basic double-entry, daily cash/bank balance | New modules: Finance |
| 7 | Tally export — fee collection and expense data in Tally-compatible format | New modules: Finance |
| 8 | Financial year reports — income vs expenditure, balance sheet basics, audit-ready data | New modules: Finance |
| 9 | API & webhooks — event subscriptions for third-party systems, public API for school websites | API & integrations |
| 10 | SSO for school chains — one login across all branches | API & integrations |
| 11 | Calendar sync — iCal feed for Google Calendar / Apple Calendar | API & integrations |
| 12 | House system & co-curricular — house assignment, points, inter-house competitions | Nice-to-haves: House system |
| 13 | Alumni tracking — directory, batch listing, achievement tracking | Nice-to-haves: Alumni |
| 14 | Incident & disciplinary records — incident log, severity levels, parent notification | Nice-to-haves: Disciplinary |
| 15 | Automated test coverage — integration tests for critical paths across all domains | Cross-cutting depth |
| 16 | Feedback loop — in-app feature requests, NPS surveys, release notes | Feedback & communication loop |

---

#### Phase 5 — Intelligence & advanced (at-scale features, post-v2)

Gate: Platform has 50+ schools and enough data for meaningful intelligence.

| # | Item | Section reference |
|---|------|-------------------|
| 1 | Smart scheduling — constraint-based timetable auto-generation, substitute suggestions, exam optimization | Platform theme 7 |
| 2 | Predictive insights — dropout risk scoring, fee collection forecasting, anomaly detection | Competitive edge: AI layer |
| 3 | Custom report builder — filter-based, save & share, visualization | New modules: Custom reports |
| 4 | School benchmarking — anonymized, opt-in, cross-school comparisons | Competitive edge: Benchmarking |
| 5 | Exam answer sheet scanning — OMR via phone camera, auto-populate marks | Competitive edge: OMR |
| 6 | White-label for resellers — reseller branding, dashboard, commission tracking | Platform & business: White-label |
| 7 | Accessibility — keyboard navigation, screen reader, high contrast, font scaling | Accessibility |
| 8 | RTL support — Urdu medium schools | Must-haves: Multi-language |
| 9 | Form 16 generation — statutory compliance | Module depth: Payroll |
| 10 | Online application portal — public-facing admissions with separate auth | Module depth: Admissions |

---

### Detailed specs — reference sections

Everything below provides the detailed specifications referenced in the phase tables above.

### Platform themes

#### 1. Domain event infrastructure (foundation — everything depends on this)

Architectural layer, not user-facing. Modules publish domain events, other modules react.

- **Postgres `domain_events` table** as source of truth. Event insert happens in the same DB transaction as the business write — events are never lost.
- **BullMQ (Redis-backed)** for async processing. Workers pick up events, run listeners, mark processed. Built-in retries, dead-letter, backoff.
- **Poller cron as fallback** — sweeps `pending` events every 30–60s and re-pushes to BullMQ. Covers Redis/BullMQ downtime. Events are delayed, never dropped.
- **Clean publishing interface** — modules call `eventService.publish()`, not BullMQ directly. Processor is swappable without touching domain code.
- No Kafka, no RabbitMQ. One NestJS monolith, one Postgres, one Redis. Introduce a dedicated broker only if scale demands it.
- `domain_events` schema lives in `packages/database`. Redis becomes a required infrastructure dependency.

#### 2. Automated workflows & triggers (first consumers of the event bus)

Cross-module reactions that create real operational value:

- `attendance.marked` (absent) → auto-notify parent via SMS/WhatsApp
- `attendance.absent.streak(3+)` → flag on dashboard, alert class teacher
- `fee.overdue(>N days)` → auto-send reminder to guardian
- `admission.approved` → auto-create student record + fee assignment
- `leave.approved` → suggest substitute teacher for timetable
- `fee.payment.received` → notify guardian with receipt
- Workflow definitions are code-level listener registrations, not a visual workflow builder (that's post-v2 if ever).

#### 3. Actionable dashboard (surfaces what workflows produce)

Transform the dashboard from scorecard to daily command center:

- **"Needs attention" feed** — unmarked attendance, pending approvals, overdue fee batches, absence streak flags
- **Inline actions** — approve, send reminder, dismiss — without navigating away
- **Trend indicators** — attendance ↑/↓ vs last week, fee collection % of monthly target
- **Role-aware** — school admin sees everything, class teacher sees their classes, accountant sees fees

#### 4. Communication platform (delivery channel for workflows)

- WhatsApp as first-class channel alongside SMS and email
- Event-driven message templates — fee reminder, absence alert, exam result
- Per-student/guardian communication log — every message sent, across all channels
- Delivery tracking — sent, delivered, failed, read (where channel supports it)
- Template management UI for institution admins

#### 5. Analytics & trends (needs data accumulation)

- Trend lines — attendance rate over weeks, fee collection month-over-month
- Comparisons — section vs section, this year vs last year
- Cohort tracking — follow a batch of students across academic years
- Anomaly detection — "Class 8B attendance dropped 15% this week"
- Drill-down from dashboard tiles into filtered detail views

#### 6. Approval workflows (extends existing leave pattern)

- Generalize the leave approval flow into a reusable approval engine
- Fee concession requests with multi-level approval
- Certificate issuance approvals (TC, bonafide)
- Expense/procurement approvals
- Configurable approval chains per institution and action type

#### 7. Smart scheduling (most complex, least urgent)

- Constraint-based timetable auto-generation (teacher availability, room capacity, subject hours per week)
- Substitute teacher suggestions when staff is on leave
- Exam schedule optimization (avoid heavy subjects on consecutive days)
- Room/resource conflict detection across timetables

### Document & print configuration (Settings > Documents)

Every school prints differently. Current print outputs are hardcoded layouts. Schools need admin-configurable document settings before they can use print outputs in production.

#### General document settings
- Signatory management — define authorized signatories (name, designation) once, reuse across all documents
- Paper size defaults (A4/A5/letter) per document type
- Institution header — logo placement, address lines, affiliation number, contact info
- Color vs B&W optimized output toggle

#### Fee receipts
- Receipt number format — configurable prefix, starting number, auto-increment sequence
- Fields toggle — which fields appear (student class/section, payment mode, transaction ID, installment breakdown)
- Custom footer text — terms & conditions, bank details, "This is a computer-generated receipt" line
- Authorized signatory selection
- Duplicate receipt marking

#### Report cards
- Grading scale display toggle and configuration
- Co-scholastic / activity marks section toggle
- Attendance summary toggle
- Class teacher remarks field toggle
- Principal remarks / signature block
- Custom header fields (house, roll number, DOB display)
- Rank display toggle
- Pass/fail threshold display

#### Certificates (TC, bonafide, character)
- Editable body text with merge fields (`{{studentName}}`, `{{fatherName}}`, `{{class}}`, `{{admissionNumber}}`, `{{dateOfBirth}}`, etc.)
- Serial number format and auto-increment
- Signatory selection (1 or 2 signatories with name + designation)
- Date format preference
- Seal/watermark toggle

#### ID cards (student + staff)
- Fields toggle — blood group, transport route, emergency contact, barcode
- Photo size and placement
- Card orientation (portrait/landscape)
- Background color or image

#### Live preview
- All document configuration screens must show a live preview as admin changes settings
- Preview uses real sample data, not placeholder text

### Module depth — making each module production-complete

Each module currently has basic CRUD. Below is what each module needs to be usable by a real school day-to-day. Build alongside or after the platform themes above.

#### Fees (day-1 critical)
- Installment-wise payment tracking — pay against a specific installment, not just the full assignment
- Fee categories — tag structures as tuition / transport / hostel / lab / misc for reporting
- Sibling concession rules — auto-apply discount when multiple siblings are enrolled
- Demand notice generation — printable per-student fee demand with installment breakdown
- Mode-wise collection report — filter collection by cash/cheque/online/date range/class
- Cheque bounce workflow — mark cheque dishonored, auto-reverse payment, flag student
- Online payment gateway wired to fee collection (gateway module exists, needs integration)
- Late fee auto-calculation based on days past due date

#### Attendance (day-1 critical)
- Period-wise / subject-wise attendance — not just daily
- Half-day attendance status
- Absent auto-SMS to parent on marking (requires event bus)
- Attendance regularization — parent/student submits justification, admin approves
- Monthly attendance register view — printable class register format
- Consolidated report — chronic absentees, late arrivals, attendance percentage by class
- Holiday integration — auto-exclude holidays from working day count
- Bulk import from biometric/external device (CSV)

#### Exams (day-1 critical)
- Exam schedule — which paper on which day, with hall/room assignment
- Multiple exam types — unit test, mid-term, final, practical, with configurable weightage
- Grading scale configuration per institution — percentage-to-grade mapping
- Subject-wise pass/fail thresholds
- Grace marks / moderation — admin can add grace marks before finalizing
- Class-level marks analysis — average, highest, lowest, pass/fail count, topper
- Rank generation — class rank, section rank
- Co-scholastic / activity marks — separate section on report card
- Hall ticket generation
- Multi-section marks entry — one teacher enters marks for their subject across all sections

#### Leave management
- Leave balance tracking — per-staff consumption against annual quota
- Carry-forward logic — configurable per leave type
- Half-day leave
- Holiday calendar integration — holidays auto-excluded from leave day count
- Comp-off / earned leave types
- Team leave calendar — visual view of who is on leave on a given day
- Notification to approver on new application (requires event bus)
- Leave encashment

#### Payroll
- Attendance-based LOP deduction — auto-calculate from staff attendance (requires attendance integration)
- PF / ESI / TDS statutory deduction templates (India-specific)
- Bank transfer file export — NEFT/RTGS bulk payment file format
- Payslip email/SMS delivery to staff
- Arrears calculation
- Advance salary / loan deduction tracking
- Salary revision comparison view — old vs new components
- Form 16 generation (deferred — complex compliance)

#### Library
- Fine collection workflow — calculate fine on overdue return, collect or waive
- Book reservation / hold queue — student requests a book that's currently issued
- Member borrowing history — all past issues for a student or staff
- Overdue auto-alert — daily check flags overdue books, notifies borrower (requires event bus)
- Bulk book catalog import (CSV)
- Book delete / deactivate with dependency check
- Librarian dashboard — books out today, overdue count, popular books

#### Hostel
- Mess plan assignment to students — link a mess plan to a bed allocation
- Hostel fee integration — hostel + mess charges flow into the Fees module
- Room transfer workflow — move student between rooms with history
- Occupancy dashboard — building-wise, floor-wise occupancy percentage
- Room allocation history — vacated students stay in audit trail
- Batch allocation — assign an entire section to a building

#### Transport
- Transport fee integration — route/stop-based fee auto-assigned via Fees module
- Route-wise student list report
- Driver management — separate entity, not a free-text field on vehicle
- Vehicle maintenance log
- Delete / deactivate routes and vehicles with dependency checks
- Daily trip log (optional, for schools that track pickup/drop times)

#### Inventory
- Purchase order workflow — create PO, receive against PO (GRN), auto-update stock
- Vendor / supplier management — vendor records, contact, past orders
- Department-wise issue tracking — who requested, who approved, which department
- Cost tracking — purchase price per item, stock valuation
- Approval workflow for stock-out requests

#### Admissions
- Convert application to student — one-click pipeline from admitted → student record + enrollment + fee assignment
- Registration fee collection at application stage
- Document checklist — required documents per application, upload tracking
- Waitlist auto-promotion — when a seat opens, next waitlisted student is notified
- Online application portal (deferred — public-facing, needs separate auth)

#### Calendar
- Visual calendar view — month/week grid, not just a list
- Recurring events — weekly assembly, monthly PTM
- Government holiday import — bulk add from a standard list
- Leave module integration — holidays appear in leave day calculation
- Attendance integration — holidays auto-marked as non-working days

#### Homework
- Student submission tracking — mark submitted/not submitted per student
- File attachment upload — wire the upload module to homework
- Parent visibility — homework appears in guardian portal
- Per-student completion marking by teacher
- Homework completion analytics — class-wise submission rates

#### Announcements / Communication
- Class/section targeted announcements — not just all/staff/students/guardians
- Scheduled publishing — set a future publish date
- SMS/WhatsApp delivery on publish (requires communication platform)
- Read receipt tracking per user
- Announcement categories — academic, disciplinary, general, urgent

#### Students
- Photo upload — wire upload module to student form
- Sibling linking — link students who are siblings for fee concession and parent views
- Medical records — allergies, conditions, emergency medical info
- Disciplinary log — incident records with date, description, action taken
- Previous school details — for transfer students
- TC issuance workflow — deactivate enrollment, generate TC, mark student as withdrawn

#### Staff
- Document management — appointment letter, qualification certificates, ID proof uploads
- Teaching load analysis — periods assigned vs capacity, workload balance report
- Campus transfer workflow — move staff between campuses with history
- Emergency contact records
- Reporting structure — HOD / line manager designation

#### Guardians
- Communication preference — preferred channel (SMS/WhatsApp/email) per guardian
- Cross-student fee summary — one view of outstanding fees across all linked children
- Occupation / income fields — for scholarship eligibility assessment

### New modules — workflows that don't exist yet

#### Finance & accounting (beyond fee collection)
- **Expense management** — school buys supplies, pays vendors, maintenance costs. Track expenses by category, department, budget head. Receipt upload.
- **Budget planning** — annual budget by department/budget head. Track actuals vs budget with variance alerts.
- **Petty cash management** — daily petty cash register with approvals and reconciliation.
- **Income beyond fees** — donations, grants, government aid, rental income, canteen revenue. Categorized income tracking.
- **Cash book and bank book** — basic double-entry for school accounting. Daily cash/bank balance.
- **Tally export** — many Indian schools use Tally for statutory accounting. Export fee collection and expense data in Tally-compatible format.
- **Financial year reports** — income vs expenditure statement, balance sheet basics, audit-ready data.

#### Scholarship management
- **Scholarship types** — merit-based, need-based, sports quota, government schemes (pre-matric, post-matric, minority, SC/ST).
- **Application and approval workflow** — student/parent applies, admin reviews, approves/rejects.
- **Auto-apply to fee structure** — approved scholarship creates a fee concession automatically.
- **Government scholarship DBT tracking** — track Direct Benefit Transfer status per student (applied, sanctioned, disbursed, rejected).
- **Renewal tracking** — scholarships that need annual renewal, flag expiring ones.
- **Reports** — scholarship-wise student list, amount disbursed, pending applications.

#### Complaint & grievance management
- **Parent/staff complaint submission** — academic, behavioral, infrastructure, fees, transport concerns.
- **Ticket-style workflow** — submitted → assigned → in-progress → resolved → closed.
- **SLA tracking** — configurable resolution time targets. Flag overdue complaints.
- **Assignment** — route complaints to relevant staff (class teacher, accountant, transport in-charge).
- **Anonymous complaint option** — for sensitive issues.
- **Reports** — complaint categories, resolution time, repeat issues, satisfaction.
- **Communication log** — all messages between complainant and assigned staff.

#### Emergency broadcast
- **Instant message to all parents** — school closure (weather, security, water/power), emergency alert.
- **Multi-channel simultaneous** — SMS + WhatsApp + push + in-app notification. All channels fire at once.
- **Delivery confirmation dashboard** — how many reached, how many pending, how many failed. Per-channel breakdown.
- **Pre-built templates** — "School closed tomorrow due to ___", "Early dismissal today at ___", "Security alert: ___". Admin fills in the blank and sends.
- **Priority override** — bypasses normal communication rate limits and cooldowns.
- **Targeted emergency** — by campus, by class, by transport route (e.g., "Bus Route 5 delayed by 30 mins").

#### Student section transfer (mid-year)
- **Transfer workflow** — move student from 5A to 5B with reason, effective date, admin approval.
- **Attendance continuity** — historical attendance stays with original section. New attendance records start in new section.
- **Fee and timetable update** — section-specific fees or timetable auto-adjust.
- **Transfer history** — visible in student 360 view.
- **Bulk section rebalancing** — move multiple students between sections to balance class sizes.

#### Scheduled report delivery
- **Admin configures recurring reports** — "Send attendance summary every Monday at 8am to principal."
- **Per-role defaults** — accountant gets fee collection on 1st of month, class teacher gets class attendance weekly.
- **PDF/Excel via email** — generated and delivered without anyone logging in.
- **Custom report subscriptions** — any saved report filter can be scheduled.
- **Delivery log** — which reports were sent, when, to whom.

#### Custom report builder (post-v2)
- **Filter-based report creation** — select entity (students, fees, attendance), add filters, choose columns, group by, sort.
- **Save and share** — saved reports visible to creator or shared with roles.
- **Export** — PDF, Excel, CSV from any custom report.
- **Visualization** — basic charts (bar, line, pie) from report data.
- **Template library** — pre-built report templates for common school needs.

### Accessibility (cross-cutting, non-negotiable long-term)

- **Keyboard navigation** — all pages fully navigable without a mouse.
- **Screen reader support** — ARIA labels, roles, and landmarks on all interactive elements.
- **High contrast mode** — toggle for visually impaired users.
- **Font size adjustment** — user preference for text scaling.
- **Focus indicators** — visible focus rings on all interactive elements.
- Not a selling point in demos, but a legal and ethical requirement. Competitors ignore it — doing it right is a quiet differentiator.

### API & integrations (enables ecosystem, reduces vendor lock-in objection)

- **Webhook support** — third-party systems subscribe to domain events (new student enrolled, fee paid, attendance marked). Configurable per institution.
- **Public REST API for school websites** — pull announcements, events, gallery, achievements for the school's public website. Read-only, API key authenticated.
- **Tally integration** — export fee collection and expense data in Tally-compatible XML/JSON format. Many Indian schools use Tally for statutory accounting.
- **SSO for school chains** — management staff logs in once, accesses all branches. SAML/OIDC support for enterprise chains.
- **Calendar sync** — export school calendar as iCal feed. Teachers and parents subscribe in Google Calendar / Apple Calendar.
- **API rate limiting and versioning** — protect the platform, maintain backward compatibility as the API evolves.

### Cross-cutting depth (applies to all modules)

- **File uploads wired to forms** — student photos, homework attachments, staff documents, admission documents. Upload module exists but is not connected to most domain forms.
- **Campus filtering** — all list endpoints must consistently filter by campus when the user has campus context active.
- **Bulk import/export** — CSV import with preview and validation for every major entity (library books, calendar holidays, inventory items). Student/staff/guardian/fee import already exists.
- **Automated test coverage** — after all module depth work is done, not before.

### Platform & business layer (your business, not the school's)

This is what you need to run as a SaaS company, not just deliver software to schools.

#### Subscription & billing management
- Plan tiers — free trial, basic, premium, enterprise. Feature gating per tier.
- Usage tracking — active students, staff count, storage used.
- Invoice generation — monthly/annual invoices per institution.
- Payment collection — Razorpay/Stripe subscription for institution billing.
- Dunning — auto-remind schools with overdue platform payments. Grace period before feature lockdown.
- Plan upgrade/downgrade — self-serve from school admin settings.

#### Platform admin panel
- Institution directory — all schools on the platform, onboarding status, plan, active users, last login.
- Revenue dashboard — MRR, churn, plan distribution, growth trends.
- Support ticket visibility — see open issues per school.
- Feature flag management — enable/disable features per institution or plan tier.
- Impersonation — platform admin can log into any school's ERP for support (with audit trail).
- Bulk communication — message all schools about maintenance, updates, new features.

#### School chain / group management
- One management group oversees multiple branches (institutions).
- Consolidated dashboards — attendance, fee collection, enrollment across all branches.
- Cross-branch reports — compare performance between branches.
- Centralized policy management — fee structures, leave policies, grading scales pushed from HQ to branches.
- Group-level user — management staff logs in once, switches between branches.
- Shared master data — salary templates, fee structure templates shared across branches.

#### White-label for resellers
- Education consultants and state-level distributors resell school ERPs.
- Reseller branding — their logo, domain, colors on the platform.
- Reseller dashboard — their schools, revenue share, onboarding pipeline.
- Reseller-scoped feature configuration — which features their schools can access.
- Commission tracking and payout reports.

### Must-haves — schools will ask about these before buying

#### Government compliance (India-specific)

Phase 1 basics (data fields):
- **Caste/category tracking** — SC/ST/OBC/General/EWS on student records. Required for every government report, scholarship application, and RTE compliance.
- **CBSE / ICSE / State board affiliation fields** — affiliation number, DISE code, school category, recognition details. Displayed on certificates and reports automatically.
- **Income certificate / BPL tracking** — for scholarship eligibility, fee concession rules, and RTE admission priority.
- **Staff-student ratio reports** — auto-calculated from current data, required for CBSE affiliation renewal.
- **Category-wise enrollment statistics** — gender, caste, age-group breakdowns for government reporting.

Phase 3 automation (covered by "Automated government reports" in Competitive edge):
- UDISE+ one-click export, RTE 25% dashboard, affiliation renewal data pack — see Competitive edge section for full specs.

#### Mobile app
- **PWA at minimum** — installable on Android/iOS, push notifications, app-like experience. Indian school staff and parents live on phones, not desktops.
- **Offline-capable attendance and marks entry** — rural and semi-urban schools have unreliable internet. Teacher marks attendance offline, syncs when connectivity returns.
- **Parent mobile experience** — this is the single biggest feature parents compare ERPs on. Fee status, attendance, report cards, announcements — all accessible without opening a browser.
- **Low-end Android optimization** — majority of Indian parents use budget phones. Keep bundle size small, avoid heavy animations.

#### Multi-language support
- **UI translation** — Hindi at minimum, then regional languages (Bengali, Tamil, Telugu, Marathi, etc.).
- **Bilingual document output** — report cards and certificates in English + regional language. Many state boards require this.
- **SMS/WhatsApp templates in parent's preferred language** — message language preference per guardian, templates stored in multiple languages.
- **RTL support** — Urdu medium schools exist. Keep the door open architecturally.

#### Data ownership and portability
- **Full data export** — complete institution data dump (students, staff, fees, attendance, marks, all records) in standard CSV/Excel format. Schools panic about vendor lock-in; this removes the objection.
- **Migration-in tool** — import from other ERPs or manual records. CSV import with field mapping, preview, and validation. Reduces onboarding friction from weeks to days.
- **Backup download** — admin can download a full backup at any time, not just on request.

#### PTM (Parent-Teacher Meeting)
- **Slot booking** — admin publishes available time slots per class teacher. Parents pick a slot. Teacher sees their schedule. Avoids the chaos of first-come-first-served.
- **PTM feedback recording** — teacher records what was discussed, follow-up actions, next review date per student.
- **PTM attendance tracking** — which parents showed up, which didn't. Flag absent parents for follow-up.
- **PTM reports** — participation rates by class, historical PTM records per student.

#### Security & DPDPA compliance
- **DPDPA (Digital Personal Data Protection Act)** — India's data protection law is not optional. Consent tracking for data collection, data retention policies, right to erasure requests, data processing records.
- **Role-based data masking** — accountant sees fee data but not student medical info. Teacher sees their class but not other staff salary data. Field-level visibility rules, not just page-level access.
- **Sensitive data access audit** — who viewed Aadhaar numbers, who exported student data, who accessed salary information. Separate from the general audit log.
- **Concurrent session limits** — school admin configures max active sessions per user. Prevent credential sharing.
- **IP whitelisting** — optional per-institution restriction. Allow ERP access only from school network IPs.
- **Data retention policies** — auto-archive or flag records older than configured retention period. Configurable per entity type.
- **Consent management** — record parent consent for photo usage, data sharing, communication preferences. Track consent version and date.

### Nice-to-haves — schools appreciate, won't reject you without

#### Visitor management
- Front desk check-in — visitor name, purpose, whom to meet, phone number, photo capture via webcam/phone camera.
- Student pickup authorization — parent sends OTP or shows QR code, guard verifies before releasing student. Safety compliance for premium schools.
- Visitor log — searchable history with date, time in/out, purpose.
- Visitor reports — frequency, peak times, purpose breakdown.
- Digital visitor pass — printable or QR-based, with exit verification.

#### Alumni tracking
- Alumni directory — graduated students with batch year, last known contact, current status.
- Achievement tracking — higher education, career milestones, awards.
- Batch-wise listing and search.
- Schools showcase alumni achievements on websites and during admissions.

#### House system and co-curricular
- House assignment for students — auto or manual assignment at enrollment.
- House points tracking — add/deduct points with reason and category (academic, sports, discipline, cultural).
- Inter-house competition management — events, participants, results, standings.
- House leaderboard — visible to students and staff.
- Sports day / annual day event management — event list, participant registration, results recording.

#### Lesson planning
- Teachers create weekly/monthly lesson plans mapped to syllabus chapters.
- Admin/HOD reviews and approves plans.
- Syllabus coverage tracking — percentage completed per subject per section per term.
- Lesson plan templates — reusable across sections and academic years.
- Alignment with timetable — link lesson plans to timetable periods.

#### Student diary / daily remarks
- Teacher sends daily remarks per student — behavior, homework status, classwork performance, notes.
- Parent sees remarks in the app — replaces the physical school diary every Indian school uses.
- Admin can view diary entries for any student.
- Remark categories — academic, behavioral, appreciation, concern.
- Weekly/monthly summary view for parents.

#### Incident and disciplinary records
- Incident log — date, description, students involved, witnesses, action taken.
- Severity levels — minor (verbal warning) to major (suspension, expulsion).
- Parent notification on incidents.
- Historical record per student — visible in student 360 view.
- Patterns and repeat offender flags.

### Competitive edge — what makes schools choose us over other ERPs

#### WhatsApp-native parent experience (biggest differentiator for Indian market)
- **Not just push notifications** — actual two-way interactions via WhatsApp Business API.
- Parent texts `fees` → gets outstanding balance with payment link.
- Parent texts `attendance` → gets this month's attendance summary with percentage.
- Parent texts `report card` → gets PDF of latest report card.
- Parent texts `timetable` → gets today's or tomorrow's class schedule.
- **Fee payment via WhatsApp** — UPI payment link in the chat, payment confirmation auto-recorded.
- **Broadcast lists** — class-wise, section-wise parent groups for targeted announcements.
- 95% of Indian parents are on WhatsApp. If the parent never needs to download a separate app or open a browser, that's the pitch.

#### Smart defaults by board type (zero-config onboarding)
- School selects CBSE / ICSE / State board during onboarding.
- System auto-configures:
  - Grading scale (CBSE 9-point, ICSE percentage-based, state board specific)
  - Exam pattern (FA1/FA2/SA1/SA2 for CBSE, term-based for ICSE)
  - Co-scholastic categories and descriptors
  - Report card format matching board requirements
  - Class structure (I–XII for CBSE, I–X for state boards, nursery/LKG/UKG naming)
  - Subject templates per class (standard subjects pre-populated)
- Reduces setup from days to minutes. No other ERP does this well.

#### QR-based operations
- **QR on student/staff ID card** → guard scans at gate for instant profile + photo verification.
- **QR attendance** — teacher scans classroom QR code, opens attendance marking page for that section. Faster than navigating menus.
- **QR fee receipt** — parent scans printed receipt to verify authenticity on the school portal.
- **QR library** — scan book barcode to issue/return. Scan student ID to pull borrowing history.
- **QR visitor pass** — digital pass generated at check-in, scanned at exit for time tracking.

#### Predictive insights and AI layer (post-v2)
- **Dropout risk scoring** — attendance decline + fee default + marks drop → composite risk score. Flag at-risk students for class teacher intervention.
- **Fee collection forecasting** — predict monthly collection based on historical payment patterns. Help schools plan cash flow.
- **Optimal section composition** — suggest section assignments balancing gender ratio, academic level, feeder school distribution.
- **Anomaly detection** — "Class 8B attendance dropped 15% this week" or "Fee collection in April is 30% below last year's April" — surfaced proactively.
- **Intervention recommendations** — "Students with this attendance pattern have a 60% chance of failing Math. Consider remedial classes."
- This is where AI adds real value — not chatbot gimmicks, but actionable operational intelligence.

#### Automated government report generation
- **One-click UDISE+ form** — pre-filled from existing ERP data, admin reviews and submits.
- **RTE compliance dashboard** — live status of 25% quota, category-wise admission numbers, gap alerts.
- **Affiliation renewal data pack** — all data CBSE/ICSE/state board asks for during renewal, exported in required format.
- **Staff qualification compliance** — flag staff who don't meet NCTE/board requirements for their assigned role.
- Schools spend 2–4 weeks compiling these reports manually every year. One-click generation is a tangible time-saver admins can quantify.

#### Parent engagement scoring
- Track: app opens, fee payment timeliness, PTM attendance, homework acknowledgment, diary views.
- Compute engagement score per guardian — high, medium, low, disengaged.
- Surface disengaged parents to class teacher for proactive outreach.
- Engagement trends over time — is a parent becoming less involved?
- Class-wise engagement report — which classes have the most/least engaged parents?
- No school ERP tracks this. Schools care deeply about parent involvement but have zero data on it.

#### School benchmarking (opt-in, anonymized, at-scale feature)
- "Your attendance rate is 92% — top 15% of schools in your city."
- "Your fee collection rate is 78% — average for schools your size is 85%."
- "Your student-teacher ratio is 28:1 — CBSE recommends 30:1."
- Benchmarks by school size, board, city, fee bracket.
- Only works at scale with multiple schools on the platform. Powerful retention tool — schools stay to keep their benchmarks.
- Fully anonymized — no school sees another school's raw data.

#### Exam answer sheet scanning (post-v2)
- Teacher prints structured answer sheets (OMR-style or grid format).
- Scans completed sheets via phone camera.
- System reads marks using OCR/image processing, populates exam marks table.
- Teacher reviews and confirms before saving.
- Eliminates manual marks entry for objective exams and structured assessments.
- Especially valuable for large schools with 500+ students per class.

### User experience & polish — what makes it feel production-grade

Features don't matter if the product feels rough. This section covers the UX quality bar that makes a school admin say "this is solid" instead of "this feels half-done." Build these alongside feature work, not after.

#### Onboarding & first-time experience
- **Guided setup checklist** — after signup, a persistent checklist: "Step 1: Add classes. Step 2: Add sections. Step 3: Import students. Step 4: Create fee structure..." with progress bar. Schools see 35 empty modules — that's overwhelming without guidance.
- **Setup progress dashboard** — "Your school is 40% configured. You haven't set up: fee structures, timetable, exam terms." Visible until setup is complete.
- **Sample data / demo mode** — let the school explore with realistic fake data before entering real data. One click to wipe sample data when ready to go live.
- **Video walkthroughs** — 2-minute embedded videos per module. Non-tech school admins don't read documentation. Play button on each module's empty state.
- ~~**Import wizard**~~ — Done. 3-step flow (download template → preview with validation → execute) for students, staff, guardians, and fee assignments.

#### Indian formatting & conventions

Already done: ₹ with Indian number formatting (lakhs/crores via `en-IN` locale), DD Mon YYYY date format.

Still needed:
- **Academic year format** — "2025–26" not "2025-2026". Every Indian school writes it this way.
- **Phone numbers** — +91 prefix handling, 10-digit validation, display as XXXXX-XXXXX.
- **Class naming** — configurable: "Class VI" (Roman, CBSE style) vs "Class 6" (Arabic) vs "Std. 6" (state board style). Set once in school settings, applied everywhere.
- **Honorifics** — "Shri", "Smt.", "Mr.", "Mrs.", "Dr." on certificates and formal documents. Configurable per staff/guardian.

#### Error handling & user-friendly messages
- **Human-readable errors everywhere** — "This mobile number is already registered for another staff member" not "duplicate key value violates unique constraint" or "409 Conflict."
- **Inline field validation** — validate as the user types or on blur. Don't wait for form submission to show 5 errors at once.
- **Conflict resolution** — "Another user just updated this student's record. Here's what they changed. Keep your version or accept theirs?"
- **Graceful failures** — if SMS delivery fails, show "Message queued, will retry" not a red error screen. If a report takes long, show progress not a timeout.
- **Reasonable value warnings** — fee amount of ₹50,00,000? Probably a typo. Age 45 for a student? Warn, don't block.

#### Session & form safety
- **Auto-save drafts** — attendance marking, marks entry, long forms periodically auto-save. Teacher marks 60 students, session expires, nothing is lost.
- **Session expiry warning** — "Your session expires in 5 minutes. Click to stay logged in." Don't silently redirect to login and lose in-progress work.
- **Form recovery** — browser crashes or tab closes accidentally. On return, offer to restore the in-progress form from localStorage.
- **Unsaved changes guard** — navigating away from a form with unsaved changes shows a confirmation dialog.

#### Global search & navigation
- **Command palette (Ctrl+K)** — type a student name, staff name, receipt number, admission number → jump directly to the record. Search across all entities from one input.
- **Breadcrumbs** — when 3 levels deep (Fees → Structure → Installments), show the path back. Never lose context.
- **Recently visited** — quick access to last 10 pages/records. Power users revisit the same records frequently.
- **Sticky academic year & campus context** — visible at all times in the header. Don't make users re-select on every page.
- **Quick switcher** — jump between modules without scrolling through the sidebar.

#### Keyboard shortcuts for power users
- **Attendance marking** — arrow keys to move between students, single key to toggle present/absent/late. A teacher marking 60 students needs this to be fast.
- **Fee collection** — Tab through fields, Enter to save, shortcut to open next payment. Accountants collect fees all day.
- **Marks entry** — Tab between students, auto-advance to next cell. Enter to save row.
- **Global shortcuts** — `?` shows shortcut reference on any page. `Ctrl+K` for search. `Ctrl+N` for new record in current module.

#### Empty states that guide
- Every empty list should explain *why this matters* and *what to do next*. Not just "No records found."
- Example: Empty class list → "Classes are the foundation of your school. Each class contains sections where students are enrolled. Create your first class to start organizing your school." + action button.
- Empty states should link to help content or the setup checklist where relevant.

#### Role-specific dashboards
- **Principal** — school overview, key metrics, pending approvals, trend charts, flagged students.
- **Class teacher** — their class attendance today, pending homework reviews, upcoming exams, student alerts, parent communication.
- **Accountant** — today's collections, pending dues, cheque clearance, cash book balance, fee defaulters.
- **Parent** — their children's attendance, upcoming fees with due dates, recent marks, today's homework, announcements.
- Each role should feel like the app was built *just for them*. Not one generic dashboard with everything.

#### Notification & alert preferences
- **Per-user notification settings** — which events trigger notifications, which channels (in-app, SMS, email, WhatsApp).
- **Quiet hours** — no SMS/WhatsApp after 8pm. Configurable per institution.
- **Digest mode** — batch low-priority notifications into a daily summary instead of 15 individual alerts.
- **Do not disturb** — teacher can mute during class hours.
- **Unsubscribe from specific notification types** — parent doesn't want daily homework reminders but wants fee alerts.

#### Print reliability & efficiency
- **Print preview that matches actual output** — no surprises. WYSIWYG. Test with real printers, not just browser print preview.
- **Batch printing** — print 60 report cards, 200 fee receipts, 500 ID cards at once. Generate PDF with all records, paginated correctly.
- **Paper-efficient layouts** — 2 fee receipts per A4, 8 ID cards per A4, configurable. Schools care about paper costs.
- **Print queue / bulk PDF download** — for schools where the printer is in another room. Generate → download → print separately.
- **Consistent headers** — institution logo, name, address, affiliation number on every printed page. Configured once, applied everywhere.

#### Data validation & guardrails
- **Duplicate detection** — adding a student with same name + DOB + father's name? Warn before creating. Same for staff with same mobile.
- **Date sanity checks** — DOB in the future? Admission date before DOB? Exam date on a holiday? Fee due date in the past?
- **Completion checks before major actions** — "You're about to finalize report cards. 3 sections still have unmarked exams. Continue anyway?" with a list of gaps.
- **Referential integrity warnings** — "Deleting this fee structure will affect 120 assigned students. Here's the impact." Show before confirming.

#### Perceived performance
- **Skeleton/shimmer loading** — never show blank screens. Show the layout shape while data loads.
- **Optimistic updates** — mark attendance, UI updates immediately, syncs in background. Don't block the teacher for a network round-trip.
- **Fast list pages** — paginated, virtualized for large lists. Page 47 loads as fast as page 1.
- **Image lazy loading** — student photos in lists load as you scroll, not all 500 at once.
- **Prefetch on hover** — when user hovers on a student row, prefetch the detail page data. Click feels instant.

#### Trust signals
- **Last login display** — "You last logged in on 27 Mar 2026 at 3:45 PM from Chrome, Windows." Visible on dashboard.
- **Receipt authenticity** — QR code or verification URL on every printed fee receipt. Parent scans to verify on school portal.
- **Data accuracy context** — attendance percentage shows "Based on 180 working days" not just "92%". Fee outstanding shows "As of 28 Mar 2026."
- **Change log visible to admin** — who changed what, when, on any record. Clickable from the record detail page, not buried in a separate audit module.

#### In-app help & support
- **Contextual tooltips** — hover on "Fee Structure" label → "A fee structure defines what a student pays for the year. Create one per fee type." Brief, helpful, not patronizing.
- **In-app knowledge base** — searchable help articles without leaving the ERP. Covers setup guides, common workflows, FAQs.
- **Report a problem** — button on every page. Captures screenshot, URL, browser info, user context. Sends to support with one click.
- **What's new changelog** — visible to admins. "New in March: Staff attendance, ID cards, fee defaulter report." Schools should know the product is improving.
- **Onboarding tours** — first time visiting a module, brief walkthrough highlighting key features. Dismissable, won't repeat.

#### Feedback & communication loop
- **In-app feature request** — schools can submit feature requests. Vote on existing requests. Shows "Planned" / "In progress" / "Shipped" status.
- **NPS / satisfaction survey** — periodic in-app survey. "How likely are you to recommend this to another school?" Track over time.
- **Release notes notification** — after a major update, a non-intrusive banner: "3 new features added this month. See what's new."

#### Visual & interaction polish (from live UI audit)

Issues observed in the current ERP UI that must be fixed for enterprise-grade quality:

**Login & auth flow:**
- ~~Login button loading spinner~~ — Done. Shows "Signing in…" text while in-flight.
- ~~Login error messages~~ — Done. Auth errors are mapped to human-readable messages with fallback.

**Sidebar navigation:**
- 13+ top-level nav items forces scrolling on laptop screens to reach Reports and Academic Setup. Group related items or support a collapsible/pinned favorites model.
- Consider a "Favorites" or "Pinned" section at the top of the sidebar — schools use 5–6 modules daily, not all 13.
- Sidebar collapse (icon-only mode) exists but needs tooltip labels on hover when collapsed.

**Dashboard:**
- Current dashboard is 4 stat tiles + quick access cards. Needs upgrade to a command center:
  - Add today's date prominently.
  - Quick access cards should show contextual counts ("3 classes unmarked" on Attendance, "₹12,000 collected today" on Fees), not just be navigation links.
  - Add a "Needs attention" section below tiles.
  - Add trend arrows or sparklines on stat tiles (↑ 5% vs last week).

**Tables & data density:**
- Table rows are spacious — fine for small data sets but needs a compact/comfortable/spacious density toggle for admins managing 100+ records.
- Row hover state should reveal quick actions (edit, view) without scrolling to the Actions column.
- Column headers should have sort indicators even when not actively sorted — shows the table is sortable.
- Consider sticky table headers for long lists — header scrolls out of view on pages with 20+ rows.

**Forms:**
- Student create form is dense with many fields in a single scroll. Break into visual sections with cards or collapsible groups: "Personal Info", "Enrollment", "Guardians."
- Add section headers with subtle dividers between form groups.
- Long forms should have a sticky footer with Save/Cancel buttons — don't make users scroll to the bottom to submit.
- Required field indicators (red asterisk) should be consistent across all forms.

**Module-specific layout issues:**
- Exams page uses a non-standard two-column card layout that mixes form creation with reference sections. Should follow the standard list-page pattern used everywhere else.
- Calendar page is a list table, not a calendar. The name "Calendar" sets wrong expectations — add a visual month/week grid view.
- Attendance page requires 3 dropdown selections (date, class, section) before showing anything. For class teachers who do this daily, auto-select their assigned section and today's date.

**General visual improvements:**
- **Dark mode** — Phase 3. Sidebar is dark but content area is light. User-togglable full app dark mode.
- **Density toggle** — Phase 1. Comfortable (default), compact (data-heavy users), spacious (accessibility). Persisted in user preferences.
- **Responsive behavior** — verify the ERP is usable on tablet (iPad) screens. Many school admins use tablets.
- **Loading states** — skeleton shimmer exists on some pages (good), but ensure every page has it. No page should ever show a blank white content area while loading.
- **Animation polish** — sidebar expand/collapse, sheet open/close, dropdown open should have subtle 150ms transitions. Not flashy, just smooth.
- **Favicon and tab title** — should show the school name and update dynamically. Multiple tabs open should be distinguishable: "Students · Demo School" vs "Fees · Demo School."

## Risks And Dependencies

- Password reset and staff password-setup links rely on a real SMS/email provider being configured per-institution (Settings > Delivery). Without a configured provider, delivery falls back to global config; verify global config is set in production env before go-live.
- Business rules must stay in NestJS; any shortcut that pushes authorization or domain logic into the frontend creates a security gap.
- Post-v1 event infrastructure adds Redis as a required dependency. Plan Redis provisioning alongside BullMQ work.
- WhatsApp Business API requires Meta approval and a verified business number. Start the application process early — it can take weeks.
- UDISE+ form format changes annually. Build the export as a configurable template, not a hardcoded layout.
- Offline/PWA sync requires conflict resolution strategy — define "last write wins" vs "queue and review" per entity type before building.
- Multi-language UI requires i18n infrastructure (string extraction, translation file management, RTL CSS) — plan this as a foundational step before translating individual screens.
- OMR/answer sheet scanning depends on image processing accuracy — prototype and validate with real Indian school answer sheets before committing to the feature.
- School benchmarking requires a critical mass of schools on the platform (50+ in a region) to be statistically meaningful. Do not build until user base supports it.
- DPDPA compliance is a legal requirement, not a feature. Prioritize consent management and data access audit before scaling to many schools.
- Tally integration format varies by Tally version (Tally Prime vs Tally ERP 9). Validate with real school accountants before shipping.
- School chain management introduces multi-tenant-of-tenants complexity. Design the group → institution hierarchy carefully before building.
- Subscription billing must handle Indian payment quirks — UPI autopay limits, GST on SaaS invoices, annual vs monthly preference by school segment.
- Custom report builder is high-effort, high-risk for scope creep. Consider a curated report template library first before opening fully custom reports.

## Working Convention

Locked product and engineering decisions are defined in `CLAUDE.md`. Do not duplicate them here.

When priorities change, update:

1. this file for roadmap sequencing and emphasis
2. `docs/status.md` for concise factual repo state
3. `docs/plans/*` for task-level implementation detail
