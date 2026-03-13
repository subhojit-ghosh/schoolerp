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
  - institution-scoped student create/list APIs
  - guardian linking for one or more guardians per student
  - campus assignment stored on the backend
  - ERP frontend routes and feature modules for student create/list/detail/edit
- A shallow academics structure slice exists with:
  - institution-scoped class create/list/detail/update APIs
  - nested section create/edit reconciliation owned by NestJS
  - campus assignment stored on the backend
  - ERP frontend routes and feature modules for class create/list/detail/edit
- A minimal academics slice exists with:
  - institution-scoped academic year list/create/detail/update APIs
  - backend-owned current-year enforcement during create and edit
  - ERP frontend route and feature module for academic year create/edit flows
  - backend-owned current student enrollment tied to academic year plus class/section
  - ERP frontend route and feature module for student creation/detail/listing
- A minimal staff slice now exists with:
  - institution-scoped staff list/detail/create/update APIs
  - staff memberships backed by the existing `member` model
  - primary campus assignment plus campus-membership syncing
  - basic single-role assignment backed by `membership_roles`
  - ERP frontend list/create/edit screens
- A minimal guardian management slice now exists with:
  - institution-scoped guardian list/detail/update APIs
  - backend-owned guardian-student link, unlink, and primary reconciliation rules
  - ERP frontend guardian list and detail routes
  - guardian edit form plus linked-student relationship management forms
- A minimal attendance slice now exists with:
  - tenant-scoped class-section option lookup
  - daily attendance roster read/write APIs by campus, class, section, and date
  - simple saved day-view summaries for a selected date
  - ERP attendance entry and review flow on generated OpenAPI types
  - shared attendance status constants consumed by backend and frontend
- A shallow exams slice now exists with:
  - institution-scoped exam term create/list APIs linked to academic years
  - backend-owned batch marks replacement and marks listing for an exam term
  - ERP frontend route for exam term creation, term selection, marks entry, and marks display
- The ERP shell now changes navigation and dashboard behavior from backend-provided active context instead of separate role-specific login screens.
- Memberships now allow one user to hold multiple member types inside the same institution.

## Implemented But Not Strongly Verified

- Local `erp.test` cookie auth wiring appears to be configured correctly, but this file should only call it strongly verified when backed by repeatable tests or an explicit manual verification record.
- Recovery flow is covered at the service level, but this repo does not currently contain a stored browser verification artifact for the full flow.
- The student slice is covered by typecheck and targeted backend tests, but not yet by end-to-end browser automation.
<<<<<<< HEAD
- The academic-year slice is covered by typecheck, but not yet by backend tests or browser automation.
- The classes and sections slice is covered by schema generation, OpenAPI export, and typecheck, but not by backend tests or browser automation.
- The staff slice is covered by typecheck, but not yet by targeted backend tests or browser automation.
- The guardian slice is covered by typecheck, but not yet by targeted backend tests or browser automation.
- The attendance slice is covered by repo typecheck and generated API types, but not yet by service tests or browser automation.
- The exams slice is covered by typecheck and OpenAPI regeneration, but not yet by targeted backend tests or browser automation.

## In Progress

- Auth delivery infrastructure remains incomplete:
  - no SMS delivery provider yet
  - no email delivery provider yet
- Authorization primitives are still thin beyond membership checks.
- Frontend presentation remains temporary.

## Missing

- Broader integration coverage for tenant host routing and cookie auth in browser flows.
- Student detail/edit workflows and richer guardian lifecycle management.
- Automated coverage for academic-year create/edit flows.
- Broader student workflow test coverage.
- Richer staff workflows such as multi-role assignment, advanced permissions, departments, leave, and payroll.
- Capability-oriented authorization APIs for institution admin flows.
- Class allocation, timetable, and broader academic workflows beyond structure management.
- Attendance analytics, reporting, notifications, and import flows.
- Exam workflows beyond shallow term + marks entry, including report cards, ranking, analytics, and grading schemes.
