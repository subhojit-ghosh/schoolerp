# Destructive Operation Safety

## Problem

Soft-deleting a class section can hide still-active students from normal ERP queries because student reads only join active classes and sections.

## Rule

- Destructive ERP operations must fail closed.
- Do not allow delete or reconciliation to proceed when active business data still depends on the target record.
- Soft-delete does not count as safe if it would orphan, hide, or silently detach live records.

## Immediate enforcement

- Block class deletion when active students or current enrollments still reference the class.
- Treat sections as stable records with active/inactive lifecycle, not delete/recreate rows.
- Block section archival during class updates when active students or current enrollments still reference the section.
- Reactivate a matching inactive section instead of inserting a duplicate row with the same logical name.
- Cover these rules with backend tests in `apps/api-erp`.

## Follow-up audit standard

- For every future delete or removal flow, check both direct active records and secondary active projections that join only non-deleted parents.
- Prefer backend-owned conflict errors over frontend-only warnings.
