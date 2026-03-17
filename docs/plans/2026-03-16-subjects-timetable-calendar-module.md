# Subjects, Timetable, and Calendar Modules

## Scope

Implement tenant-scoped ERP modules in `apps/api-erp` and `apps/erp` for:
- subjects
- timetable
- calendar

## Backend

- Added DB schema tables:
  - `subjects`
  - `timetable_entries`
  - `calendar_events`
- Generated migration:
  - `packages/database/drizzle/0021_aberrant_landau.sql`
- Added Nest modules:
  - `subjects`
  - `timetable`
  - `calendar`
- Added API routes, DTOs, validation schemas, controllers, and services.
- Enforced destructive safety rules:
  - subject disable/delete blocked when active timetable entries depend on subject.

## Frontend

- Added ERP pages/routes:
  - `/subjects` list + route sheet create/edit
  - `/timetable` class-section weekly editor
  - `/calendar` list + route sheet create/edit
- Added API hooks and form schemas for all three modules.
- Enabled sidebar navigation entries for subjects, timetable, and calendar.

## Integration

- Regenerated OpenAPI from `apps/api-erp`.
- Regenerated ERP API types in `apps/erp`.
- Ran repository typecheck (`bun run typecheck`) and resolved introduced errors.
