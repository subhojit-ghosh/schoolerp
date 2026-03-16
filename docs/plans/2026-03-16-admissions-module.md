# Admissions Module (Enquiries + Applications)

## Goal
Ship a first usable admissions workflow for tenant ERP:
- admission enquiries list/create/edit
- admission applications list/create/edit
- tenant-scoped backend APIs with RBAC + scope guards
- ERP list/sheet UX aligned with existing CRUD patterns

## Backend
- Add `admission_enquiries` and `admission_applications` tables in `packages/database`.
- Add admission status enums and permissions in `@repo/contracts`.
- Add `AdmissionsModule` in `apps/api-erp` with:
  - `GET/POST/PATCH /admissions/enquiries`
  - `GET/POST/PATCH /admissions/applications`
- Enforce tenant filtering, campus scope filtering, and fail-closed lookups.
- Regenerate OpenAPI and ERP API types after API contract changes.

## Frontend
- Enable admissions navigation entries.
- Add route-addressable list/sheet pages:
  - `/admissions/enquiries`
  - `/admissions/applications`
  - `/admissions/enquiries/new`, `/admissions/enquiries/:enquiryId/edit`
  - `/admissions/applications/new`, `/admissions/applications/:applicationId/edit`
- Use shared list primitives (`EntityListPage`, `ServerDataTable`, URL query state).
- Use `react-hook-form` + `zod` forms for create/edit sheets.

## Data + Tooling
- Generate DB migration via `bun run db:generate`.
- Regenerate OpenAPI with `bun run api-erp:openapi`.
- Regenerate ERP API types with `bun run erp:openapi-types`.
- Run repo typecheck via `bun run typecheck`.
