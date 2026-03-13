# Minimal Fees Module

## Scope

- Add a minimal tenant-scoped fees slice for institution staff in:
  - `apps/api-erp`
  - `apps/erp`
  - `packages/database`
- Include only:
  - fee structures
  - student fee assignment
  - payment entry
  - dues listing
- Exclude:
  - reports
  - reminders
  - accounting integrations

## Backend Shape

- Keep business rules in NestJS.
- Resolve tenant scope from the institution route parameter plus authenticated session context.
- Model persistence with:
  - `fee_structures`
  - `fee_assignments`
  - `fee_payments`
- Enforce backend checks for:
  - academic year and campus ownership
  - structure uniqueness by institution/year/scope/name
  - one active assignment per student per structure
  - campus-scoped structure to student campus matching
  - payment amount not exceeding outstanding balance

## Frontend Shape

- Add one ERP fees route.
- Keep route logic orchestration-only and push forms/API calls into feature modules.
- Use `react-hook-form` + `zod` for:
  - structure creation
  - assignment creation
  - payment entry
- Read list data from generated OpenAPI types and backend-owned DTOs.

## Verification

- Regenerate Drizzle migration.
- Regenerate OpenAPI JSON and ERP API types.
- Run `bun run typecheck` from repo root.
