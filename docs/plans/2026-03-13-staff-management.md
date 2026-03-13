# Staff Management Module

## Goal

Add a minimal tenant-scoped staff management slice that uses the existing membership model and keeps business rules in NestJS.

## Scope

- Staff list, detail, create, and update APIs in `apps/api-erp`
- Institution role options API for basic assignment during create/edit
- Thin ERP list/create/edit screens in `apps/erp`
- Campus assignment stored on `member.primaryCampusId` and synced to `campus_memberships`
- Single optional active role assignment stored through `membership_roles`

## Non-Goals

- payroll
- leave management
- department hierarchy
- rich permission editors
- multi-role staff management

## Implementation Notes

- Keep one `user` per human and reuse an existing user identity when mobile/email already maps to that human.
- Reject duplicate staff memberships for the same user inside one institution.
- Keep `memberType` fixed to `staff` for this module; role assignment is the configurable part of the membership.
- Use `react-hook-form` and `zod` for all frontend forms.
