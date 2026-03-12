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
  - `apps/erp`
  - `apps/api-erp`
  - `packages/*`
- NestJS owns auth and tenant-scoped backend rules in `apps/api-erp`.
- The ERP frontend defaults to same-host `/api` calls.
- Mobile is the canonical login identifier and email is secondary.
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
  - session invalidation after password reset
- Password recovery frontend exists with:
  - forgot-password route
  - reset-password route
  - feature-level API hooks and schemas
  - route components that stay thin

## Implemented But Not Strongly Verified

- Local `erp.test` cookie auth wiring appears to be configured correctly, but this file should only call it strongly verified when backed by repeatable tests or an explicit manual verification record.
- Recovery flow appears fully implemented end to end, but this repo does not currently contain automated coverage or a stored verification artifact for the full browser flow.

## In Progress

- Auth delivery infrastructure remains incomplete:
  - no SMS delivery yet
  - no email delivery yet
  - no forgot-password throttling or abuse protection yet
- Frontend presentation remains temporary.

## Missing

- Automated backend tests for onboarding hardening.
- Automated tests for tenant/session enforcement.
- The first full ERP domain slice for students, guardians, and campus assignment.
