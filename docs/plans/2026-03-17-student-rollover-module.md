# Student Rollover Module

## Goal

Ship an operational academic-year rollover flow so schools can move active students into the next academic year without spreadsheets.

## Scope

- Backend preview endpoint for source-year enrollments
- Backend execute endpoint for rollover writes
- Section-level mapping from source placement to target placement
- Student-level withdraw handling for non-continuing students
- ERP staff page for:
  - selecting source and target academic years
  - loading source roster
  - mapping each source section to a target class and section
  - previewing mapped, unmapped, and withdrawn students
  - executing rollover

## Current Implementation

- Source roster is read from active `student_current_enrollments` for the selected source academic year.
- Target year must be an active academic year.
- Target placements use active classes and active sections only.
- Execute flow:
  - updates `student_current_enrollments` to the target academic year for continuing students
  - updates `students.classId` and `students.sectionId`
  - updates `member.primaryCampusId` and ensures `campus_memberships`
  - marks withdrawn students as `member.status = inactive`
  - removes withdrawn students from active current enrollment by setting `deletedAt`

## Deliberate Constraints

- Mapping is section-scoped, not whole-class scoped, so schools can split sections differently year to year.
- Withdraw is the only per-student override in this first version.
- Historical enrollment detail is still limited by the current single-row `student_current_enrollments` model.

## Follow-up

- Bulk import/export should come next so rollover exceptions and onboarding can still use spreadsheets when needed.
- Audit trail should follow soon after because rollover is an operationally sensitive bulk mutation.
