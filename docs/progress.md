# Repo Progress

## Purpose

This file is the repo-level execution tracker.

Use it to answer:

- what is already done
- what is currently in progress
- what is next
- what architectural constraints are already locked

Update this file whenever a meaningful backend or architecture milestone lands.

## Current Status

### Completed

- Monorepo split is active around the target structure:
  - `apps/erp`
  - `apps/api-erp`
  - `packages/*`
- NestJS backend is the source of truth for auth and tenant-scoped business rules.
- ERP frontend is using same-host `/api` calls and is treated as disposable UI.
- Mobile-first auth model is established:
  - mobile is canonical identity
  - email is secondary login identifier
  - username-based primary auth is not adopted
- Cookie-based auth is working with local `erp.test` routing.
- Institution onboarding provisions:
  - institution
  - default campus
  - initial admin user
  - membership
  - initial session
- Password recovery backend is implemented:
  - forgot-password endpoint
  - reset-password endpoint
  - one-time reset tokens
  - reset token hashing at rest
  - session invalidation after password reset
- Password recovery frontend feature layer is implemented:
  - forgot-password route
  - reset-password route
  - feature-level API hooks and schemas
  - route components kept thin
- Recovery flow was verified on `https://erp.test`:
  - sign in with old password
  - request reset
  - reset password
  - old password rejected
  - new password accepted

### In Progress

- Auth is functional, but delivery infrastructure is still incomplete:
  - no SMS delivery yet
  - no email delivery yet
  - no forgot-password throttling or abuse protection yet
- Frontend design is intentionally temporary and expected to be replaced.

### Next Recommended

1. Add password recovery delivery abstraction.
2. Add forgot-password rate limiting and abuse protection.
3. Audit tenant/session enforcement with tests.
4. Harden onboarding with backend tests.
5. Lock authorization primitives and shared constants.
6. Start the first real ERP domain slice:
   students + guardians + campus assignment.

## Locked Product Decisions

- One institution = one tenant.
- Tenant is resolved from subdomain.
- Campus switching happens inside a tenant only.
- One user record per human identity.
- A user may be both staff and parent.
- Auth is NestJS Passport-based.
- Web auth uses HTTP-only cookies.
- Mobile is primary identifier.
- Email is secondary identifier.
- Theme customization is token-driven, not layout-driven.

## Locked Engineering Decisions

- Business rules belong in NestJS, not React.
- Frontend should keep business-facing client logic inside feature modules, not route pages.
- Shared constants must be used for domain values and route strings.
- New browser testing in local dev should use:
  - `https://erp.test`
  - `https://<tenant>.erp.test`
- Local dev should not default to `http://localhost:3000` for browser verification unless explicitly requested.

## Working Convention

When a task is finished, update:

1. this file for repo-level progress
2. `docs/plans/*` for plan-level detail if the task had a dedicated plan

