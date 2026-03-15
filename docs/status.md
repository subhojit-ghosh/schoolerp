# Repo Status

## Purpose

This file is the concise factual state of the repository.

Use it to answer:

- what is implemented
- what is implemented but not strongly verified
- what is still in progress
- what is still missing

Keep this file evidence-based. Do not use it as a roadmap.

## Verified By Code

- The repo is organized around:
  - `apps/web`
  - `apps/erp`
  - `apps/api-erp`
  - `packages/*`
- NestJS owns auth and tenant-scoped backend rules in `apps/api-erp`.
- The root `erp.test` app now serves a public Next.js onboarding surface.
- The Vite ERP app is intended for `https://<tenant>.erp.test` only.
- The ERP frontend defaults to same-host `/api` calls.
- Mobile is the canonical login identifier and email is secondary.
- Auth/session context now supports one logged-in user switching between available tenant contexts such as staff and parent without re-authentication.
- Institution onboarding provisions:
  - institution
  - default campus
  - initial admin user
  - membership
  - initial session
- A minimal campus management slice now exists with:
  - tenant-scoped campus list/create APIs resolved from the subdomain
  - shared backend list-query parsing and paginated campus list responses for server-side search, sort, and pagination
  - backend-owned staff-context enforcement for campus management
  - slug collision protection for campus creation
  - ERP settings route now uses URL-backed list state and a route-addressable create sheet for `/settings/campuses/new`
  - auth session refresh after campus creation so the campus switcher picks up new records
- Password recovery backend exists with:
  - forgot-password endpoint
  - reset-password endpoint
  - one-time reset tokens
  - hashed reset tokens at rest
  - forgot-password throttling and abuse protection
  - delivery abstraction for reset delivery
  - session invalidation after password reset
- Password recovery frontend exists with:
  - forgot-password route
  - reset-password route
  - feature-level API hooks and schemas
  - route components that stay thin
- Automated backend coverage exists for:
  - tenant slug resolution
  - tenant membership/session selection paths in auth service
  - forgot-password throttling
  - onboarding slug collision and created-session context
- The first ERP domain slice exists with:
  - tenant-scoped student create/list/detail/update APIs resolved from the subdomain
  - shared backend list-query parsing and paginated student list responses for server-side search, sort, and pagination
  - guardian linking for one or more guardians per student
  - campus assignment stored on the backend
  - ERP frontend routes now use URL-backed list state for the student registry and a dedicated `/students/new` page for creation
  - ERP frontend routes and feature modules for student create/list/detail/edit
- A shallow academics structure slice exists with:
  - tenant-scoped class create/list/detail/update APIs resolved from the subdomain
  - shared backend list-query parsing and paginated class list responses for server-side search, sort, and pagination
  - optional campus-filtered class lookup for campus-safe downstream forms
  - nested section create/edit reconciliation owned by NestJS
  - section lifecycle now uses active/inactive records instead of delete/recreate semantics
  - backend guardrails that block class deletion or section archival when active students or current enrollments still depend on them
  - campus assignment stored on the backend
  - ERP frontend list route now uses URL-backed server table state and route-addressable sheet flows for `/classes/new` and `/classes/:classId/edit`
- A minimal academics slice exists with:
  - tenant-scoped academic year list/create/detail/update APIs resolved from the subdomain
  - shared backend list-query parsing and paginated academic-year list responses for server-side search, sort, and pagination
  - backend-owned current-year enforcement during create and edit
  - ERP frontend route now uses URL-backed list state and route-addressable sheet flows for `/academic-years/new` and `/academic-years/:academicYearId/edit`
  - backend-owned current student enrollment tied to academic year plus class/section
  - backend-enforced campus/class/section consistency for student placement and enrollment writes
  - ERP student forms now use campus-scoped class and section selections instead of free-text IDs
  - ERP frontend route and feature module for student creation/detail/listing
- A minimal staff slice now exists with:
  - tenant-scoped staff list/detail/create/update APIs resolved from the subdomain
  - shared backend list-query parsing and paginated staff list responses for server-side search, sort, and pagination
  - staff memberships backed by the existing `member` model
  - primary campus assignment plus campus-membership syncing
  - basic single-role assignment backed by `membership_roles`
  - ERP frontend routes now use URL-backed list state for the staff directory and a dedicated `/staff/new` page for creation
  - ERP frontend list/create/edit screens
- A minimal guardian management slice now exists with:
  - tenant-scoped guardian list/detail/update APIs resolved from the subdomain
  - shared backend list-query parsing and paginated guardian list responses for server-side search, sort, and pagination
  - backend-owned guardian-student link, unlink, and primary reconciliation rules
  - ERP frontend guardian list route now uses URL-backed server table state and preserves query params when opening detail pages
  - ERP frontend guardian list and detail routes
  - guardian edit form plus linked-student relationship management forms
- The ERP now has a shared CRUD/list-page foundation with:
  - shared `EntityListPage`, `ServerDataTable`, and action-size primitives
  - URL-backed list state through `nuqs`
  - route-addressable sheet flows for small entities
  - dedicated page creation flows for larger entities such as students and staff
- A minimal attendance slice now exists with:
  - tenant-scoped class-section option lookup
  - daily attendance roster read/write APIs by campus, class, section, and date
  - simple saved day-view summaries for a selected date
  - ERP attendance entry and review flow on generated OpenAPI types
  - shared attendance status constants consumed by backend and frontend
- A shallow exams slice now exists with:
  - tenant-scoped exam term create/list APIs linked to academic years
  - backend-owned batch marks replacement and marks listing for an exam term
  - ERP frontend route for exam term creation, term selection, marks entry, and marks display
- A minimal fees slice now exists with:
  - tenant-scoped fee structure create/list APIs resolved from the subdomain
  - student fee assignment create/list APIs
  - payment entry API with backend-owned outstanding-balance checks
  - dues list API derived from fee assignments and payments
  - ERP frontend fee management route with thin forms over those APIs
- The ERP shell now changes navigation and dashboard behavior from backend-provided active context instead of separate role-specific login screens.
- Memberships now allow one user to hold multiple member types inside the same institution.
- A full RBAC system now exists with:
  - Phase 1: permission slug constants, system role seeding, `PermissionGuard`, `@RequirePermission()` applied to every ERP controller endpoint
  - Phase 2: scope enforcement — `resolveScopes()`, `ScopeGuard`, `@CurrentScopes()`, campus/section/class scope filters applied to all domain list queries
  - Phase 3: institution role management APIs (`GET/POST/PATCH/DELETE /roles`, `GET /permissions`) and ERP settings UI at `/settings/roles` with read-only system role display, custom role create/edit sheets with grouped permission picker, and delete with active-assignment guard

## Implemented But Not Strongly Verified

- Local `erp.test` cookie auth wiring appears to be configured correctly, but this file should only call it strongly verified when backed by repeatable tests or an explicit manual verification record.
- Recovery flow is covered at the service level, but this repo does not currently contain a stored browser verification artifact for the full flow.
- The student slice is covered by typecheck and targeted backend tests, but not yet by end-to-end browser automation.
- The academic-year slice is covered by typecheck and manual browser automation, but not yet by targeted backend tests.
- The classes and sections slice is covered by targeted backend tests for destructive dependency guardrails, plus schema generation, OpenAPI export, typecheck, and manual browser automation.
- The staff slice is covered by typecheck, OpenAPI regeneration, and manual browser automation, but not yet by targeted backend tests.
- The guardian slice is covered by typecheck, OpenAPI regeneration, and manual browser automation, but not yet by targeted backend tests.
- The campus slice is covered by typecheck, OpenAPI regeneration, and manual browser automation, but not yet by targeted backend tests.
- The student registry and create flow are covered by typecheck, OpenAPI regeneration, and manual browser automation, but not yet by targeted backend tests.
- The attendance slice is covered by repo typecheck and generated API types, but not yet by service tests or browser automation.
- The exams slice is covered by typecheck and OpenAPI regeneration, but not yet by targeted backend tests or browser automation.
- The fees slice is covered by typecheck and generated OpenAPI types, but not yet by targeted backend tests or end-to-end browser automation.

## In Progress

- Auth delivery infrastructure remains incomplete:
  - no SMS delivery provider yet
  - no email delivery provider yet
- Phase 4 RBAC (staff role assignment UI with scope picker) is not yet implemented.
- Frontend presentation remains temporary.

## Missing

- Broader integration coverage for tenant host routing and cookie auth in browser flows.
- Richer guardian lifecycle management beyond the current linked-student model.
- Automated coverage for academic-year create/edit flows.
- Broader student workflow test coverage.
- Richer staff workflows such as multi-role assignment UI with scope picker (Phase 4 RBAC), departments, leave, and payroll.
- Class allocation, timetable, and broader academic workflows beyond structure management.
- Attendance analytics, reporting, notifications, and import flows.
- Exam workflows beyond shallow term + marks entry, including report cards, ranking, analytics, and grading schemes.
- Fees reports, reminder automation, and accounting integrations.
