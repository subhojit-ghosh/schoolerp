# Attendance Module Plan

## Goal

Add a minimal tenant-scoped attendance slice for staff users:

- daily attendance entry by class, section, campus, and date
- simple saved day view summaries
- backend-owned validation and roster integrity
- thin ERP frontend flows on generated OpenAPI types

## Scope

- Shared attendance status constants in `packages/contracts`
- Student class and section assignment stored on the backend
- Attendance persistence in `packages/database`
- NestJS attendance APIs in `apps/api-erp`
- ERP attendance screen in `apps/erp`

## Out Of Scope

- analytics
- reports
- notifications
- bulk import
- separate classes domain beyond minimal class/section strings on students
