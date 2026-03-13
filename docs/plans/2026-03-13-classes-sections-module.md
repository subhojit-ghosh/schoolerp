# Classes And Sections Module

## Goal

Add a shallow tenant-scoped classes and sections module that validates the current Vite + NestJS split without pulling timetable, allocation, or other advanced workflows into the slice.

## Scope

- Add shared persistence for institution-scoped classes and nested sections.
- Add NestJS list/create/detail/update endpoints under the tenant institution boundary.
- Keep backend ownership for tenant access, campus validation, uniqueness checks, and section reconciliation.
- Add ERP list/create/detail/edit flows using `react-hook-form` + `zod`.
- Regenerate OpenAPI and ERP API types after the backend contract changes.

## Deliberate Non-Goals

- No timetable setup.
- No teacher allocation.
- No class promotion or academic planning workflow.
- No separate sections module outside the class detail flow.

## Data Shape

- `classes`
  - `institutionId`
  - `campusId`
  - `name`
  - optional `code`
  - `displayOrder`
  - soft delete
- `sections`
  - `institutionId`
  - `classId`
  - `name`
  - `displayOrder`
  - soft delete

## Backend Contract

- `GET /institutions/{institutionId}/classes`
- `POST /institutions/{institutionId}/classes`
- `GET /institutions/{institutionId}/classes/{classId}`
- `PATCH /institutions/{institutionId}/classes/{classId}`

The payload includes nested sections so the React layer stays thin and the backend remains the source of truth for reconciliation.

## Frontend Shape

- `apps/erp/src/features/classes/api`
- `apps/erp/src/features/classes/model`
- `apps/erp/src/features/classes/ui`
- `apps/erp/src/routes/classes-page.tsx`
- `apps/erp/src/routes/class-detail-page.tsx`

## Verification

- Generate Drizzle migration from schema changes.
- Export OpenAPI from `apps/api-erp`.
- Regenerate ERP typed API bindings.
- Run `bun run typecheck` from the repo root.
