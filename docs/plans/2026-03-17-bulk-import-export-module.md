# Bulk Import/Export Module

## Goal

Ship a staff-facing CSV data exchange workflow that schools can use from the relevant entity pages for spreadsheet onboarding and operational export without bypassing backend validation.

## Scope

- Per-page import/export entry points on:
  - students
  - staff
  - guardians
  - fee assignments
- CSV template download per entity
- Preview before execute
- Row-level import result reporting
- CSV export for current institution-scoped data
- Supported entities:
  - students
  - staff
  - guardians
  - fee assignments

## Backend Shape

- New Nest module: `data-exchange`
- Endpoints:
  - `GET /data-exchange/capabilities`
  - `GET /data-exchange/templates/:entityType`
  - `POST /data-exchange/imports/preview`
  - `POST /data-exchange/imports/execute`
  - `GET /data-exchange/exports/:entityType`
- CSV is uploaded through the ERP UI, read as text client-side, and validated server-side.
- Imports stay stateless: no job table, no staging table, no migration.
- Execution re-runs backend validation and then calls existing domain services where possible.

## Import Rules

### Students

- Row resolves campus, class, section, and academic year by name
- Up to three guardians can be supplied on one row
- Exactly one guardian must be primary
- Student create uses the existing student service so guardian creation/linking follows current domain rules

### Staff

- Row resolves campus by name
- Status supports `active | inactive | suspended`
- Create uses the existing staff service so onboarding and password-setup behavior stay consistent

### Guardians

- Row resolves campus and student admission number
- Import upserts guardian identity by mobile/email and links the guardian to the student
- Guardian import is one row per guardian-student relationship

### Fee Assignments

- Row resolves academic year, optional campus, fee structure, and student admission number
- Import creates full structure-based assignments through the existing fees service
- Campus-scoped structures still fail closed when student campus does not match

## Export Shape

- Students export one row per student with flattened guardian columns
- Staff export one row per staff member
- Guardians export one row per guardian-student link, or one row with blank student columns if the guardian has no active links
- Fee assignments export one row per student-to-fee-structure assignment set

## Frontend Shape

- Import/export launches from the relevant list pages instead of a central data-exchange route
- Each page opens the same shared sheet, scoped to that entity
- Import tab:
  - CSV file input
  - template download
  - preview table
  - execute action
- Export tab:
  - direct CSV download for the current entity
- Visibility stays permission-aware because the actions only render on the relevant staff pages

## Verification

- `bun run --cwd apps/api-erp typecheck`
- `bun run --cwd apps/api-erp openapi:export`
- `bun run --cwd apps/erp openapi:types`
- `bun run typecheck`
