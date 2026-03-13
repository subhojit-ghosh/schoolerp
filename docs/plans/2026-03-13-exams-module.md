# Exams Module

## Goal

Add a shallow exams slice that proves the current Vite + Nest + shared-schema boundary without introducing deeper assessment features yet.

## Scope

- backend exam terms linked to academic years and scoped to one institution tenant
- backend marks list and replace flows for one exam term
- ERP exams page for:
  - creating a term
  - selecting a term
  - entering marks with `react-hook-form` + `zod`
  - displaying saved marks

## Explicitly Out Of Scope

- report cards
- ranking
- analytics
- grading scales
- class or section exam scheduling
- parent/student exam views

## Implementation Notes

- Keep authorization backend-owned through the existing staff-context requirement.
- Keep frontend business logic in feature modules under `apps/erp/src/features/exams`.
- Use shared route constants and backend error constants instead of inline repeated values.
- Keep the marks write path simple by replacing the full marks list for one exam term in a single backend operation.

## Verification

- regenerate Drizzle migration files for the new exam tables
- regenerate OpenAPI and frontend API types
- run workspace `bun run typecheck`
