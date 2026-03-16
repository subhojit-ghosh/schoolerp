# Fees Module Production Readiness Plan

## Purpose

Define the path from the current functional fees module to a production-grade finance workflow suitable for real school operations.

This plan is based on the current implemented code in:
- `apps/api-erp/src/modules/fees/*`
- `apps/erp/src/features/fees/*`
- `packages/database/src/schema/index.ts`

## Current State (Code Audit)

The current module already includes:
- fee structure create/list/edit/archive/delete
- installment support per structure
- structure duplication
- single-student assignment and bulk class assignment
- dues listing (including overdue filter)
- payment recording
- concession/adjustment entries
- payment reversal entries
- collection summary reporting

Important implemented protections:
- installment edits blocked after any assignment is created (`FEE_INSTALLMENTS_LOCKED`)
- structure delete blocked when assignments exist
- assignment delete blocked when payments exist
- payment amount and adjustment amount cannot exceed outstanding
- campus-scope access checks on assignment flows

## Gaps To Close For Production

### 1) Lifecycle and immutability model is incomplete

- Fee structure updates currently modify the same record.
- Production flow should prefer explicit versioning once assigned:
  - no in-place structural edits after first assignment
  - create next version and re-assign policy-driven populations

### 2) Ledger model is not yet explicit append-only accounting

- `fee_payments` uses `deletedAt`; transactional records should be append-only.
- Payment reversals exist, but receipts, cancellation reasons, and numbering are not yet formalized as first-class records.
- No single unified ledger stream for demand, payment, concession, reversal, refund, penalty.

### 3) Assignment granularity is installment-centric, not demand-centric

- One assignment row per installment is generated, which works for minimal flows.
- Production fee operations need explicit demand entities and allocation entries to support:
  - split allocations
  - deterministic reconciliation
  - future refunds/adjustments without overloaded semantics

### 4) Payment and reconciliation scope is minimal

- Payment methods are limited (`cash`, `upi`, `bank_transfer`, `card`).
- Missing lifecycle states such as `recorded`, `pending_confirmation`, `settled`, `failed`, `reversed`.
- No reconciliation queue for gateway/bank mismatch handling.

### 5) Concession model lacks governance

- Adjustment supports waiver/discount with optional reason.
- Missing policy controls:
  - approver identity
  - approval workflow (maker-checker for sensitive amounts)
  - effective scope/rule templates (student/class/campus)

### 6) Reporting is summary-only

- Current report is collection summary by structure.
- Missing finance operations reports:
  - demand vs collection by period
  - aging buckets
  - cashier daily close
  - concessions impact
  - channel-wise reconciliation status

### 7) UX lock-state behavior is inconsistent with backend rules

- Fee structure UI still exposes editable installment fields and shows backend error on save.
- For production, lock state must be visible before edit attempt:
  - disabled controls
  - clear lock reason
  - primary action changes from `Save changes` to `Create new version`

### 8) Query and soft-delete conventions need hardening

- Fees code relies on `deletedAt` filters in several places.
- Repo conventions require status-driven filtering as source of truth for lifecycle entities and append-only transactional behavior.

## Target Production Model

## Domain model

- `fee_plan` (structural entity): status-driven lifecycle and version lineage
- `fee_plan_installment` (immutable once published)
- `fee_plan_assignment_batch` (who was assigned, when, by rule)
- `fee_demand` (student payable line items generated from published plan)
- `fee_transaction` (append-only ledger entries)
- `fee_transaction_allocation` (how a payment/refund/adjustment applies to demands)
- `fee_receipt` and `fee_receipt_event` (issue/cancel/reissue audit)
- `fee_penalty_rule` and generated `fee_penalty_entry`
- `fee_concession_policy` and approved `fee_concession_grant`
- `fee_reconciliation_record` (gateway/bank settlement lifecycle)

## Status policy

- Structural entities (`fee_plan`): `active | archived | deleted` (deleted only when no business references)
- Ongoing non-transactional entities: status-based, no hard delete from product flows
- Transactional entities (`fee_transaction`, allocations, receipt events): append-only, no delete endpoints

## Phase Plan

### Phase 1: Production UX and guardrail alignment (short-term)

- Add lock-state response fields on fee structure detail:
  - `isInstallmentLocked`
  - `lockReason`
  - `assignmentCount`
- Update fee structure edit UI:
  - disable installment add/remove/reorder/edit when locked
  - show non-destructive lock banner near schedule section
  - replace submit CTA with `Create new version` route action
- Keep existing backend `FEE_INSTALLMENTS_LOCKED` as final defense.

### Phase 2: Plan versioning and assignment generation

- Introduce immutable fee plan version records.
- Add `create-next-version` API from existing plan.
- Add assignment generation modes:
  - single student
  - class
  - campus
  - filtered cohort (future-ready)
- Store assignment run metadata (`createdBy`, filters snapshot, counts, skipped reasons).

### Phase 3: Ledger and allocation refactor

- Introduce append-only `fee_transaction` and `fee_transaction_allocation`.
- Map current payment create/reverse paths to ledger entries.
- Replace outstanding computation with demand minus allocations.
- Ensure all totals (assignment, dues, reports) derive from ledger+allocation, not ad-hoc sums.

### Phase 4: Payment lifecycle and reconciliation

- Expand payment channel metadata:
  - provider
  - channel reference IDs
  - settlement identifiers
  - instrument details where applicable (masked)
- Add payment/reconciliation statuses and transitions.
- Build reconciliation APIs and exception views.

### Phase 5: Concessions and controls

- Split concession into:
  - policy definition
  - grant request
  - approval event
  - applied ledger adjustment
- Add maker-checker for configurable thresholds.
- Require mandatory reason for high-impact concession operations.

### Phase 6: Production reporting and exports

- Add report endpoints and ERP pages for:
  - demand vs collection (period and structure breakdown)
  - outstanding aging buckets
  - concessions and waivers summary
  - daily cashier summary
  - reconciliation exceptions
- Add downloadable CSV export per report.

## API Evolution

- Preserve current endpoints for compatibility while introducing v2 resources.
- New endpoints should follow existing list contract (`rows`, `total`, `page`, `pageSize`, `pageCount`).
- Maintain shared query keys: `q`, `page`, `limit`, `sort`, `order`.

Suggested additions:
- `POST /fees/plans/:id/create-next-version`
- `POST /fees/assignments/runs`
- `GET /fees/ledger`
- `GET /fees/reconciliation`
- `POST /fees/concessions/requests`
- `POST /fees/concessions/:id/approve`
- `GET /fees/reports/aging`
- `GET /fees/reports/demand-vs-collection`

## Data Migration Strategy

- Keep current tables live while introducing ledger tables.
- Dual-write from payment/adjustment operations during transition.
- Backfill historical rows into ledger format by migration scripts.
- Switch reads to ledger-derived views after parity verification.
- Remove legacy computation paths only after parity sign-off.

## Permissions and Roles

- Keep existing permissions:
  - `fees:read`
  - `fees:manage`
  - `fees:collect`
- Add granular permissions for production controls:
  - `fees:reconcile`
  - `fees:concession:approve`
  - `fees:refund`
  - `fees:report:export`

## Operational Readiness Checklist

- Idempotent payment ingestion for online channels.
- Immutable audit trail on every financial mutation.
- Deterministic receipt numbering strategy per tenant/campus.
- Conflict-safe concurrency on outstanding balance changes.
- Clear reversal/refund traceability to original transactions.
- No destructive delete of transactional finance records.

## Delivery Sequence

1. UX lock-state alignment and `create-next-version` entrypoint.
2. Plan versioning model + assignment run metadata.
3. Ledger + allocation tables and dual-write rollout.
4. Reconciliation lifecycle and operations UI.
5. Concession approvals and permission hardening.
6. Full production reporting and export surfaces.

## Definition Of Done (Production Fees v1)

- Finance team can run end-to-end fee operations without data ambiguity.
- No in-place mutation of published assigned structures.
- Every monetary change is traceable through append-only audit history.
- Reconciliation and reversal workflows are operationally usable.
- Reporting covers collection, outstanding, concessions, and aging.
