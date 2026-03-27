# Growth Features Plan

## Goal

Build the full feature set needed to attract and retain paying schools. All modules must be built to production quality — not prototypes. Sequencing is by revenue impact.

---

## Phase 1 — Online Payment Gateway (provider-agnostic)

### Architecture principle
Same pattern as the delivery system: abstract interface → pluggable providers → per-institution encrypted config. The fee collection flow never knows which PG is active.

### 1.1 Contracts (`packages/contracts/src/index.ts`)

```
PAYMENT_PROVIDERS: { RAZORPAY, PAYU, CASHFREE, CUSTOM, DISABLED }
PAYMENT_ORDER_STATUSES: { PENDING, PAID, FAILED, EXPIRED }
PERMISSIONS.INSTITUTION_PAYMENT_MANAGE: "institution:payment:manage"
FEE_PAYMENT_METHODS.ONLINE: "online"   // add to existing enum
```

### 1.2 DB Schema (`packages/database/src/schema/payment.ts`)

**`institution_payment_config`**
```
id, institutionId (unique FK), provider enum, credentials (encrypted text),
webhookSecret (encrypted text nullable), displayLabel (nullable),
isActive bool default true, createdAt, updatedAt
```

**`payment_orders`**
```
id, institutionId FK, feeAssignmentId FK,
amountInPaise int, currency text default 'INR',
status enum [pending, paid, failed, expired],
provider text, externalOrderId (nullable), externalPaymentId (nullable),
externalSignature (nullable), checkoutData (text - encrypted, provider-specific JSON for frontend SDK),
paidAt (nullable timestamp), failedAt (nullable timestamp),
expiresAt timestamp (15 min from creation),
createdAt, updatedAt
UNIQUE(institutionId, externalOrderId) — partial where externalOrderId IS NOT NULL
```

Also add `onlinePaymentOrderId text nullable FK → payment_orders` to `fee_payments`.
Also add `online` to `FEE_PAYMENT_METHOD_ENUM` in schema.

### 1.3 Provider interface (`apps/api-erp/src/modules/payment-gateway/payment-gateway.types.ts`)

```typescript
interface PaymentGatewayProvider {
  readonly provider: PaymentProviderType
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>
  parseWebhookEvent(payload: Buffer, signature: string): Promise<WebhookPaymentEvent | null>
}

CreateOrderInput: { internalOrderId, amountInPaise, currency, customerName, customerMobile, customerEmail?, description }
CreateOrderResult: { externalOrderId, checkoutData: Record<string, unknown> }
VerifyPaymentInput: { externalOrderId, externalPaymentId, externalSignature }
VerifyPaymentResult: { success: boolean, externalPaymentId: string }
WebhookPaymentEvent: { type: 'payment.captured'|'payment.failed', externalOrderId, externalPaymentId, amountInPaise }
```

### 1.4 Provider implementations (`apps/api-erp/src/modules/payment-gateway/providers/`)

Plain classes (not @Injectable), constructed with credentials from DB:

- `razorpay.provider.ts` — Razorpay Orders API + HMAC-SHA256 signature verification
- `payu.provider.ts` — PayU payment hash generation + success hash verification
- `cashfree.provider.ts` — Cashfree Orders API v2
- `custom-webhook.provider.ts` — Records order, expects manual webhook call; useful for any other PG
- `disabled.provider.ts` — Throws BadRequestException

### 1.5 `PaymentGatewayConfigService`
CRUD for institution_payment_config. Same pattern as DeliveryConfigService:
`getConfig(institutionId)`, `upsertConfig(...)`, `deactivateConfig(...)`, `resolveProvider(institutionId)` → instantiated provider

### 1.6 `PaymentOrderService`
- `createOrder(institutionId, feeAssignmentId, scopes)` — validates assignment is outstanding, calls provider.createOrder(), stores payment_order, returns checkout data
- `verifyAndConfirm(institutionId, orderId, verifyInput)` — calls provider.verifyPayment(), updates order status → paid, calls feesService.createFeePayment() with method=online
- `handleWebhook(institutionId, payload, signature)` — parse event, find order, verify, confirm
- `getOrderStatus(institutionId, orderId)` — for frontend polling
- Cron: expire pending orders older than 15 min (status → expired)

### 1.7 `PaymentGatewayConfigController` (`GET/PUT/DELETE /settings/payment`)
- Permission: INSTITUTION_PAYMENT_MANAGE
- Same structure as DeliveryConfigController

### 1.8 `PaymentOrderController`
```
POST /fees/payment-orders          — create order (returns checkoutData for frontend SDK)
GET  /fees/payment-orders/:id      — get status (for polling after redirect)
POST /fees/payment-orders/:id/verify — client-side verify after Razorpay success callback
POST /webhooks/payment/:provider   — public endpoint, no auth, uses webhookSecret HMAC
```

### 1.9 `PaymentGatewayModule` + `PaymentGatewaySettingsModule`
Same separation as delivery to avoid circular deps.

### 1.10 Frontend

**Settings > Payment Gateway** (`apps/erp/src/routes/settings/payment-page.tsx`)
- Single card (one PG per institution)
- Provider dropdown, dynamic credential fields, webhook URL display (readonly), test button

**Pay Online flow** (in `CollectPaymentSheetRoute`)
- If institution has active PG config: show "Pay online" button in addition to manual methods
- Clicking creates the order → opens payment modal
- Modal: Razorpay standard checkout / PayU redirect / Cashfree
- After success: poll `/fees/payment-orders/:id` → on paid → close modal, refresh dues

**`use-payment-gateway.ts`** — React Query hooks

---

## Phase 2 — Automated Fee Reminders

### Architecture
Rule-based scheduler. Institutions configure rules (X days before due, on due date, X days overdue) and the message template. A cron job runs daily and dispatches via the delivery system.

### 2.1 DB Schema (`packages/database/src/schema/reminders.ts`)
**`fee_reminder_rules`**
```
id, institutionId FK, name, isActive bool,
triggerType enum [days_before_due, on_due_date, days_after_due],
triggerDays int nullable (null when triggerType = on_due_date),
channel enum [sms, email, both],
messageTemplate text (supports variables: {{studentName}}, {{amount}}, {{dueDate}}, {{institutionName}}),
createdAt, updatedAt
```

**`fee_reminder_log`**
```
id, institutionId FK, feeAssignmentId FK, ruleId FK,
sentAt timestamp, channel, recipientMobile/Email,
status enum [sent, failed], errorMessage nullable
```

### 2.2 `FeeReminderService`
- `runDailyReminders(institutionId)` — called by cron
- For each active rule: query overdue/upcoming fee_assignments, find guardian contacts, send via DeliveryService, log result
- `listRules(institutionId)`, `upsertRule(...)`, `deleteRule(...)`

### 2.3 Frontend — Settings > Fee Reminders
- Rule list with enable/disable toggle
- Add/edit rule: trigger type, days, channel, template with variable hints
- Reminder log table (last 30 days)

---

## Phase 3 — Homework & Assignments

### 3.1 DB Schema (`packages/database/src/schema/homework.ts`)
**`homework`**
```
id, institutionId FK, campusId FK, classId FK, sectionId FK nullable (null = all sections),
subjectId FK nullable, title, description (text nullable), dueDate date,
attachmentUrls (text array nullable), createdByMemberId FK,
status enum [active, archived], createdAt, updatedAt
```

**`homework_submissions`**
```
id, institutionId FK, homeworkId FK, studentId FK,
status enum [pending, submitted, graded], submittedAt timestamp nullable,
grade text nullable, feedback text nullable, attachmentUrls (text array nullable),
gradedByMemberId FK nullable, gradedAt timestamp nullable, createdAt, updatedAt
UNIQUE(homeworkId, studentId)
```

### 3.2 Services + Controllers
- `HomeworkService`: create, list (by class/section/subject/date), detail, update, archive; auto-create submissions for enrolled students on create
- `HomeworkController`: staff CRUD + student GET

### 3.3 Frontend
- Staff: Teaching > Homework — list by class/section, create/edit/archive, view submissions, grade
- Student portal: "Homework" tab — pending list, submission status
- Parent portal: "Homework" tab — child's homework due

---

## Phase 4 — Staff Leave Management

### 4.1 DB Schema (`packages/database/src/schema/leave.ts`)
**`leave_types`**
```
id, institutionId FK, name, description, defaultDaysPerYear int,
isPaidLeave bool, isActive bool, createdAt, updatedAt
```

**`staff_leave_balances`**
```
id, institutionId FK, memberId FK, leaveTypeId FK, academicYearId FK,
totalDays int, usedDays int, pendingDays int,
UNIQUE(memberId, leaveTypeId, academicYearId)
```

**`staff_leave_requests`**
```
id, institutionId FK, memberId FK, leaveTypeId FK, academicYearId FK,
startDate date, endDate date, totalDays int,
reason text, status enum [pending, approved, rejected, cancelled],
reviewedByMemberId FK nullable, reviewNotes text nullable,
reviewedAt timestamp nullable, createdAt, updatedAt
```

### 4.2 Services
- `LeaveTypesService`: CRUD for leave types (admin)
- `StaffLeaveService`: request leave, approve/reject (manager), list requests, balance summary
- Balance calculation: totalDays - usedDays - pendingDays

### 4.3 Frontend
- Settings > Leave Types (admin)
- Staff > Leave — list own requests, apply new leave
- Staff detail > Leave tab (manager/admin view: approve/reject)
- Dashboard widget: pending leave approvals count

---

## Phase 5 — Parent-Teacher Messaging

### 5.1 DB Schema (`packages/database/src/schema/messages.ts`)
**`message_threads`**
```
id, institutionId FK, campusId FK,
type enum [direct, class_broadcast],
title nullable (for broadcasts),
createdByMemberId FK, createdAt, updatedAt
```

**`message_thread_participants`**
```
id, threadId FK, memberId FK, lastReadAt timestamp nullable, joinedAt,
UNIQUE(threadId, memberId)
```

**`messages`**
```
id, institutionId FK, threadId FK, senderMemberId FK,
body text, attachmentUrls text array nullable,
createdAt
```

### 5.2 Services
- `MessagingService`: createDirectThread (parent↔teacher), sendMessage, listThreads, listMessages, markRead
- Class broadcast: teacher sends to all parents of a class/section
- Unread count endpoint for notification badge

### 5.3 Frontend
- Messages section in nav (with unread badge)
- Thread list + message view
- Compose: select teacher (for parent) or select class/parent (for staff)
- Parent portal: Messages tab

---

## Phase 6 — Analytics & Reports Dashboard

### 6.1 New endpoints (aggregates, no new tables)
- `GET /analytics/fee-collection` — monthly collection chart, collection rate %, top defaulters
- `GET /analytics/attendance` — daily trend chart, class-wise heatmap, chronic absentee list
- `GET /analytics/exam-performance` — class average per term, subject-wise bar chart, rank distribution
- `GET /analytics/admissions` — enquiry→application→enrollment funnel by month
- `GET /analytics/enrollment` — student count trend, class-wise breakdown

### 6.2 Frontend — Reports > Analytics
- 4 tabs: Finance, Attendance, Exams, Admissions
- Charts using recharts or similar (already in deps check needed)
- Date range picker, campus filter

---

## Phase 7 — Online Admissions Portal (public-facing)

### 7.1 Public form
A separate page (or embedded widget) accessible without login: `https://<tenant>.erp.test/apply`
- Shows institution branding, admission fields, fee info
- Parent fills form → creates admission_application record
- Confirmation email/SMS to parent (via delivery system)

### 7.2 Backend
- Public endpoint: `POST /admissions/public/apply` (no auth, tenant-resolved from hostname)
- Rate limiting: 5 requests per IP per hour
- CAPTCHA-ready interface (honeypot field for now, real CAPTCHA later)

### 7.3 Frontend (`apps/erp/src/routes/public/apply-page.tsx`)
Multi-step: student info → guardian info → review → submit → confirmation

---

## Phase 8 — Library Management

### 8.1 DB Schema (`packages/database/src/schema/library.ts`)
**`library_books`**: id, institutionId, campusId, title, author, isbn, category, totalCopies, availableCopies, status, createdAt
**`library_members`**: id, institutionId, memberId FK, memberType (student/staff), isActive
**`library_issues`**: id, institutionId, bookId FK, libraryMemberId FK, issuedAt date, dueDate date, returnedAt date nullable, fineAmountInPaise int default 0, status (issued/returned/overdue)

### 8.2 Services + Controllers: catalog CRUD, issue/return, overdue list, fine management

### 8.3 Frontend: Library section in Academic Setup > Library (catalog, issue flow, member list, overdue report)

---

## Phase 9 — Transport Management

### 9.1 DB Schema (`packages/database/src/schema/transport.ts`)
**`transport_vehicles`**: id, institutionId, campusId, vehicleNumber, type, capacity, driverName, driverMobile, isActive
**`transport_routes`**: id, institutionId, campusId, name, departureTime, arrivalTime, isActive
**`transport_stops`**: id, routeId, name, stopOrder, pickupTime, dropTime
**`student_transport`**: id, institutionId, studentId FK, routeId FK, stopId FK, enrollmentId FK, boardingType (pickup/drop/both), isActive
  UNIQUE(studentId, enrollmentId)

### 9.2 Services + Controllers: vehicle CRUD, route CRUD, stop management, student assignment
### 9.3 Frontend: Settings > Transport section (vehicles, routes, stops); student detail > Transport tab; parent portal > Transport tab showing route/stop/timing

---

## Phase 10 — Payroll

Depends on Phase 4 (leave management) being stable.

### 10.1 DB Schema (`packages/database/src/schema/payroll.ts`)
**`salary_structures`**: id, institutionId, name, components (jsonb array of {name, type: fixed/percentage_of_basic, value}), isActive
**`staff_salary_assignments`**: id, institutionId, memberId FK, structureId FK, basicAmountInPaise, effectiveFrom date, effectiveTo date nullable
**`payroll_runs`**: id, institutionId, month (YYYY-MM), status (draft/approved/disbursed), createdAt
**`payroll_slips`**: id, institutionId, runId FK, memberId FK, grossInPaise, deductionsInPaise, netInPaise, leaveDays int, components (jsonb), status (draft/approved), createdAt

### 10.2 Services: run payroll for a month (auto-calculate from salary assignments + leave deductions), approve, generate slip PDFs

### 10.3 Frontend: Staff > Payroll section; payslip printable document

---

## Phase 11 — WhatsApp Integration

Uses WhatsApp Business API (Meta Cloud API or BSP like Interakt/Gupshup).

### 11.1 Add `whatsapp` to DELIVERY_PROVIDERS
### 11.2 `WhatsAppProvider` implementing DeliveryProvider interface
### 11.3 Credential fields: `accessToken`, `phoneNumberId`, `wabaId`, `templateNamespace`
### 11.4 Template management: send approved HSM templates for fee reminders, attendance, results

---

## Phase 12 — Progressive Web App (PWA)

### 12.1 Add `vite-plugin-pwa` to `apps/erp`
### 12.2 Service worker: cache shell, offline page, push notifications
### 12.3 Web push notifications: subscribe parent device, send via web push on notification creation
### 12.4 App manifest: icon, name, theme_color from institution branding

---

## Phase 13 — Multi-language UI

### 13.1 `i18next` + `react-i18next` setup
### 13.2 Locale files: `en`, `hi` (Hindi) to start
### 13.3 Language switcher in account settings (persisted per user)
### 13.4 Backend locale-aware error messages

---

## DB migration notes

After each schema phase, user must run:
```bash
bun run db:generate   # interactive
bun run db:migrate
```

## Execution order

1. Phase 1 (Payment Gateway) — start immediately
2. Phase 2 (Fee Reminders) — quick win, builds on delivery
3. Phase 3 (Homework) — daily teacher habit
4. Phase 4 (Staff Leave) — admin stickiness
5. Phase 5 (Messaging) — parent engagement
6. Phase 6 (Analytics) — management buy-in
7. Phase 7 (Online Admissions Portal) — school marketing tool
8. Phase 8 (Library) — common expectation
9. Phase 9 (Transport) — bus-route schools
10. Phase 10 (Payroll) — highest stickiness, depends on leave
11. Phase 11 (WhatsApp) — differentiator
12. Phase 12 (PWA) — mobile experience
13. Phase 13 (Multi-language) — tier-2/3 market expansion
