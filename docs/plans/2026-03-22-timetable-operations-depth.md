# Timetable Operations Depth Plan

## Purpose

Extend the current timetable and bell schedule work from a usable editor into an operational school workflow. The missing layer is not “more CRUD”; it is the ability to prepare, review, activate, publish, and temporarily override schedules without disturbing the live school timetable.

This plan covers the real-school capabilities that are currently absent:
- draft, active, archived lifecycle
- effective dates and activation windows
- explicit timetable-to-bell-schedule assignment
- timetable versions and copy workflows
- teacher load and conflict review
- print/export and publish controls
- temporary schedules such as exams or half-days
- room/resource management
- substitutions and short-term overrides
- auditability and rollback

## Why This Matters

Schools rarely manage a single forever-timetable. They routinely need:
- next academic session planning
- exam-week schedule swaps
- summer or winter timing changes
- staff reshuffles after admissions growth or resignations
- principal review before rollout
- public release to staff, then later to parents

Without draft and activation workflows, the ERP forces admins to edit the live operating schedule directly. That is not safe enough for day-to-day school operations.

## Current Limitation Summary

### What Exists

- Bell schedules can be created per campus.
- One active default bell schedule is used by timetable and teacher schedule views.
- Timetable entries store `bellSchedulePeriodId`, denormalized times, subject, staff, room, and slot.
- Teacher conflicts and room conflicts are blocked on save.

### What Is Missing

- No draft bell schedule lifecycle in the UI or workflow.
- No timetable versioning.
- No effective date or scheduled activation.
- No explicit link saying “this class timetable uses schedule X”.
- No publish boundary between internal review and parent/student visibility.
- No temporary schedule layer for exams or special days.
- No substitution workflow for short-term teacher changes.

## Product Principles

### Principle 1 — Live and next must coexist

The current published timetable must remain stable while admins prepare the next one.

### Principle 2 — Activation must be explicit

Switching a schedule should be a deliberate publish action or scheduled effective-date event, not an accidental side effect of editing a template.

### Principle 3 — Timetables must be assignable, not inferred

Timetable views should resolve against an assigned timetable version and its assigned bell schedule, not by “whatever default schedule exists right now”.

### Principle 4 — Temporary overrides should not rewrite the base plan

Exam schedules, half-days, substitutions, and one-off closures should layer on top of the base timetable rather than mutate it.

### Principle 5 — Resolution must be deterministic across every consumer

Staff ERP, teacher view, family portal, student portal, print/export, and future attendance consumers must all resolve the same active timetable for the same date and scope. The system should not allow separate modules to infer “current timetable” differently.

## Target Domain Model

### 1. Bell Schedule Lifecycle

Upgrade bell schedules from a basic template list into managed artifacts.

Recommended lifecycle:
- `draft`
- `active`
- `archived`
- `deleted`

Meaning:
- `draft`: editable, not used by live timetable resolution
- `active`: available for assignment to published timetable versions
- `archived`: historical, read-only for operational purposes
- `deleted`: only for admin correction when unused

Important:
- remove the current coupling where “default active bell schedule” is the global timetable driver
- keep a concept of campus default only as an onboarding convenience, not as the core runtime model

### 2. Timetable Version

Add a first-class `timetable_versions` entity.

Suggested fields:
- `id`
- `institutionId`
- `campusId`
- `name`
- `scopeType` (`campus`, `class`, `section`, optional depending on final design)
- `academicYearId`
- `status` (`draft | published | archived`)
- `bellScheduleId`
- `effectiveFrom`
- `effectiveTo` nullable
- `publishedAt` nullable
- `notes` nullable
- `createdBy`
- `updatedBy`
- timestamps

Recommended model:
- a timetable version owns the intended weekly plan
- timetable entries belong to a timetable version, not directly to the campus “current state”
- sections/classes are assigned to a published timetable version

### 3. Timetable Assignment

Add an explicit assignment layer so live resolution does not depend on the default bell schedule.

Suggested entity:
- `timetable_assignments`

Fields:
- `id`
- `institutionId`
- `campusId`
- `classId` nullable
- `sectionId` nullable
- `timetableVersionId`
- `effectiveFrom`
- `effectiveTo` nullable
- `status`

Purpose:
- determines which published timetable version is currently active for a class/section
- allows future-dated assignments
- supports overlap checks

### 4. Timetable Overrides

Add a lightweight override model for temporary changes.

Suggested use cases:
- exam week
- PTM day
- half day
- assembly timing exception
- teacher substitution

Recommended entities:
- `timetable_overrides`
- `timetable_override_entries`

Override precedence:
1. substitution / day-specific override
2. temporary published override timetable
3. base published timetable version

### 5. Slot Type Semantics

Not every row should be modeled as a subject-teacher teaching period.

The system should support typed timetable slots such as:
- teaching period
- break
- lunch
- assembly
- library
- lab
- sports
- free / supervised study

This can live on the timetable entry or on a reusable slot classification model, but the UI and downstream consumers should not be forced to represent every non-break activity as a fake subject assignment.

## Timetable Resolution Contract

### Goal

Define one consistent rule for determining the live timetable for any given date, campus, class, section, staff member, guardian, or student.

### Recommended precedence

1. active substitution override for the exact date and slot
2. active temporary override timetable assignment for the exact date range and scope
3. active published timetable assignment for the exact date range and scope
4. no timetable found

### Scope specificity

When multiple assignments exist, prefer the most specific applicable scope:
1. section
2. class
3. campus

### Consumers that must share this contract

- ERP section timetable page
- ERP teacher schedule page
- family portal timetable cards
- student portal timetable cards
- print/export endpoints
- future attendance and substitution workflows

## Feature Plan

## Phase 1 — Bell Schedule Lifecycle and Activation Readiness

### Goal

Separate draft preparation from live use.

### Scope

- Extend bell schedule status model to support `draft | active | archived | deleted`
- Remove dependence on “current default” as the only runtime driver
- Keep `isDefault` only for suggested defaults in new timetable creation, not live resolution
- Add list filtering by lifecycle state
- Add explicit actions:
  - create draft
  - mark active
  - archive
  - duplicate

### UI changes

- Bell schedule list adds status filters and clearer action labels
- Bell schedule sheet shows status and usage context
- Add “Duplicate schedule” row action

### Outcome

Schools can prepare alternative bell schedules without affecting live timetable rendering.

## Phase 2 — Timetable Versioning

### Goal

Make timetables versioned operational records instead of a single mutable section grid.

### Scope

- Add `timetable_versions`
- Move timetable entries under a version
- Add create-from-existing flow
- Allow draft timetable versions
- Store bell schedule assignment on the timetable version
- Add academic-year scoping rules so multiple years can coexist cleanly

### UI changes

- Timetable page starts with version scope, not just class/section
- New version actions:
  - new version
  - duplicate current
  - rename
  - archive
- Section/class editing works inside a selected version

### Outcome

Admins can prepare “Session 2026”, “Exam Week”, or “Revised Term 2” versions safely.

## Phase 3 — Effective Dates and Scheduled Activation

### Goal

Support future go-live without manual same-day switching.

### Scope

- Add `effectiveFrom` and optional `effectiveTo` to published timetable assignments
- Block overlapping assignments for the same section/class scope
- Add activation workflow:
  - publish now
  - publish from chosen date
- Resolve active timetable by date

### UI changes

- Publish dialog with:
  - effective from
  - optional end date
  - assignment scope summary
- Timeline/list of active and future assignments per section/class

### Outcome

Schools can prepare the next timetable in advance and activate it on a known date.

## Phase 4 — Review, Load, and Conflict Dashboard

### Goal

Help admins review whether a draft timetable is operationally safe before publishing.

### Scope

- Teacher load summary:
  - periods per day
  - periods per week
  - gaps / overload
- Subject load summary per class/section
- Room usage summary
- Conflict review panel:
  - teacher double-booking
  - room double-booking
  - unassigned slots
  - break anomalies

### UI changes

- Add side review panel or dedicated review screen for a timetable version
- Add visual chips:
  - overloaded
  - under-assigned
  - conflict
  - unpublished changes

### Outcome

Admins can validate a draft timetable before release instead of discovering issues after activation.

## Phase 5 — Copy, Bulk Changes, and Rapid Editing

### Goal

Make large timetable updates practical at school scale.

### Scope

- Copy class/section timetable inside the same version
- Copy from one version to another
- Bulk teacher replacement
- Bulk room replacement
- Bulk subject-slot shift for a section or grade
- Multi-cell selection and fill operations where feasible
- CSV/Excel-friendly import for large timetable setup or migration

### UI changes

- “Copy from version”
- “Replace teacher”
- “Replace room”
- “Apply to selected sections”

### Outcome

Schools can respond to staffing or operational changes quickly without repetitive manual edits.

## Phase 6 — Publication and Audience Controls

### Goal

Separate internal readiness from staff/guardian visibility.

### Scope

- Internal draft view for admins only
- Staff-visible published timetable
- Parent/student-visible published timetable with optional delay
- Publish notes / change summary
- Publish notifications and change communication hooks for affected staff and families

### UI changes

- Publication state badges:
  - draft
  - internally approved
  - staff published
  - guardian published
- Publish action with visibility controls

### Outcome

Schools can review internally first, then release externally when ready.

## Phase 7 — Temporary Schedules and Exceptions

### Goal

Handle exam weeks and other short-run timetable exceptions without destroying the base timetable.

### Scope

- Temporary override timetable version with fixed date window
- Day-specific override entries
- Alternate day patterns:
  - Saturday short day
  - Week A / Week B
  - exam block timetable
- Calendar-aware handling where holiday or closure dates suppress timetable visibility

### UI changes

- Override creation flow:
  - choose date range
  - choose target scope
  - choose whether it fully replaces or partially overrides

### Outcome

The system can represent real school calendar exceptions cleanly.

## Phase 8 — Room and Resource Management

### Goal

Replace free-text room handling with operational room/resource scheduling.

### Scope

- Add managed rooms/resources
- Assign room type or specific room
- Conflict checks for rooms/labs
- Room timetable view

### Future-compatible resources

- lab
- music room
- library period room
- smart classroom
- sports ground slot

### Outcome

Room usage becomes schedulable and conflict-safe.

## Phase 9 — Substitutions and Short-Term Teacher Cover

### Goal

Support daily operational changes without mutating the base published timetable.

### Scope

- Mark teacher unavailable for a date or date range
- Add substitute assignment per slot/day
- Keep original teacher for history, substitute for operational view
- Staff daily substitution list

### UI changes

- “Assign substitute” action from teacher/day view
- Daily cover board for coordinators

### Outcome

Schools can manage absences without rewriting the weekly timetable.

## Phase 10 — Print, Export, and Noticeboard Outputs

### Goal

Support the practical outputs schools need for classrooms and communication.

### Scope

- Print-friendly section timetable
- Print-friendly teacher timetable
- PDF export
- CSV export
- Noticeboard-friendly condensed layout

### Outcome

Schools can operationalize the timetable outside the ERP UI.

## Phase 11 — Audit, Approval, and Rollback

### Goal

Make timetable operations traceable and reversible.

### Scope

- Audit entries for:
  - schedule creation
  - draft edits
  - publish/unpublish
  - activation changes
  - substitution assignment
- Approval flow:
  - draft prepared
  - approved by coordinator/principal
- Rollback to prior published version

### Outcome

Timetable changes become governable for real institutions.

## Migration And Compatibility

### Goal

Move from the current section-level live timetable table to versioned assignments without breaking existing portal reads.

### Required migration steps

- Create an initial published timetable version per active campus or academic-year scope from existing live data
- Backfill existing timetable entries into that initial published version
- Preserve existing `bellSchedulePeriodId`, subject, staff, room, and denormalized time values
- Create assignments so current portal and ERP reads resolve to the migrated published version
- Switch all timetable consumers to the shared resolution contract before deleting old live-only assumptions

### Compatibility rule

Do not leave family portal, student portal, teacher view, and section timetable on different read paths during migration. The migration is only complete when every consumer resolves through the same version-and-assignment logic.

## Data Model Recommendations

### Recommended sequence

Implement in this order:
1. bell schedule lifecycle cleanup
2. timetable versions
3. timetable assignments with effective dates
4. publish/activation workflow
5. overrides and substitutions

### Important rule

Do not keep expanding the current section-level live table as the main abstraction. That path makes future-dated publishing, overrides, and rollback much harder. The system now needs a version-and-assignment model.

## UX Recommendations

### Admin views

- Bell schedules
- Timetable versions
- Activation calendar
- Draft review / conflict review
- Teacher load screen
- Room/resource board
- Daily substitution board

### User-facing expectations

- Staff should always see the currently active published timetable
- Guardians/students should never see draft data
- Admins should be able to compare current vs next before publishing

## Suggested Delivery Order

### Must-have operational core

1. Bell schedule lifecycle cleanup
2. Timetable versioning
3. Effective dates and scheduled activation
4. Explicit timetable assignment
5. Shared timetable resolution contract
6. Review/conflict/load dashboard

### High-value next

7. Copy and bulk changes
8. Publication controls
9. Temporary schedules and overrides
10. Print/export

### Operational depth after that

11. Room/resource management
12. Substitutions
13. Approval, audit, rollback

## Out Of Scope For This Plan

- automated tests before v1 functional completion
- AI timetable auto-generation
- payroll-linked teacher workload accounting
- advanced optimization solver for automatic timetable generation

## Success Criteria

The timetable system is operationally ready when a school can:
- prepare next term’s timetable without touching the current one
- review teacher load and conflicts before publish
- activate a timetable on a chosen future date
- run temporary schedules for exams or short days
- publish different states to admin, staff, and guardians safely
- substitute a teacher for a day without mutating the base weekly plan
- import or clone a large timetable without re-entering every row manually
- represent non-teaching slots without faking them as subjects
- get the same active timetable result in ERP, teacher view, family portal, and student portal
- print/export the current schedule cleanly
- audit and roll back timetable changes when needed
