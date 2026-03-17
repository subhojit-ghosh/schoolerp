# Audit Trail Module

## Goal

Add a tenant-scoped audit trail foundation for sensitive ERP mutations so operational actions are traceable before broader v1 hardening work continues.

## Implemented Scope

- Added shared audit constants and `audit:read` permission in `@repo/contracts`
- Added `audit_logs` table in `packages/database` with actor, action, entity, summary, metadata, and created-at fields
- Added NestJS audit module with:
  - tenant-scoped `GET /audit-logs`
  - paginated filtering by action, entity type, actor user, and search
- Wired audit logging into the first roadmap-critical mutation paths:
  - role create/update/delete
  - attendance day mark/update
  - exam marks replace
  - fee payment reversal
  - student rollover execute

## Current Constraints

- This is backend-first. There is no ERP UI screen for the audit trail yet.
- Coverage is intentionally narrow to the highest-risk actions first. More sensitive mutations still need audit hooks, including fee adjustments, role assignment changes, admissions approvals, and announcement publish actions.
- Audit records currently store structured metadata for inspection but do not yet support per-entity detail views or export flows.

## Next Expansion

1. Add ERP admin UI for audit trail browsing with filters and entity-linked navigation.
2. Extend audit hooks to staff role assignment, fee adjustments, timetable replacement, admissions approvals, and communication publish flows.
3. Add document-ready actor and entity labels where the current summary is still generic.
