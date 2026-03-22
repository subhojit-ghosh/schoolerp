# Attendance Platform Expansion Plan

## Goal

Replace the current minimal daily attendance slice with a production-grade attendance platform that can support the common school attendance patterns without schema rewrites later.

The target is not "one screen that can mark attendance". The target is:

- correct attendance against the current student roster
- institution-configurable attendance modes
- operationally fast marking flows for staff
- correction and audit coverage for sensitive changes
- reporting that schools can rely on for daily work, parent communication, and compliance-style review
- operational controls strong enough for schools to trust the data after disputes, late changes, and month-end review

## Product Outcome

The attendance module should be able to support these real-world school patterns:

1. **Daily attendance**
- One final status per student for a school day.

2. **Session-wise attendance**
- Morning attendance.
- After-break / afternoon recheck.
- Optional multiple named sessions per day.

3. **Period-wise attendance**
- Attendance per bell period or teaching slot.
- Suitable for higher classes, subject teachers, and stricter discipline tracking.

4. **Late-arrival and correction workflows**
- Mark late.
- Convert absent to present or late later in the day.
- Record excuse and reason.
- Keep a change history for who changed what and why.

5. **Reporting across all supported modes**
- Daily completion and coverage views.
- Class-wise and student-wise reports.
- Monthly summaries.
- Defaulter / irregular attendance views.
- Unmarked / pending attendance visibility.

The module does **not** need to support every uncommon edge case in v1 of the redesign, but the architecture must not block:

- exam attendance
- activity / event attendance
- staff attendance as a separate future domain
- gate-device or biometric integrations

It should also be able to handle these operational scenarios without data-model changes:

- students admitted after the school day has already started
- same-day transfers between sections
- student withdrawal after attendance history already exists
- no-class / holiday / exam-only dates where normal attendance should not be expected
- substitute or admin marking on behalf of the usual teacher
- month-end attendance closure and authorized reopen
- parent or admin disputes about historical attendance changes

## Current Problems To Fix First

The current implementation is a minimal daily attendance slice and has structural limitations:

- Attendance is still driven from legacy `students.classId` and `students.sectionId` reads instead of the current-enrollment model.
- The uniqueness model is effectively "one row per student per date", which blocks clean support for session-wise and period-wise attendance.
- Reporting is based on basic recorded rows only and does not model expected attendance sessions, pending attendance, or completeness.
- There is no attendance session lifecycle such as draft, completed, finalized, or corrected.
- There is no durable correction reason model and no per-entry change history.
- The marking UI is too manual for normal class sizes.

## Locked Design Direction

Build attendance around **attendance sessions** and **attendance entries**, not a single daily record per student.

The core rule is:

- one attendance-taking event = one session
- one student mark within that event = one attendance entry

Examples:

- Daily mode: one session for `Class 2 / Section A / 2026-03-22 / full-day`
- Session-wise mode: one session for `Class 2 / Section A / 2026-03-22 / morning`, another for `after-break`
- Period-wise mode: one session for `Class 9 / Section B / 2026-03-22 / period 4`

This lets the product support multiple attendance models without changing the fundamental storage model each time.

## Domain Model

### 1. Attendance configuration

Add an institution-scoped attendance configuration model.

Suggested concerns:

- `studentAttendanceMode`
  - `daily`
  - `session`
  - `period`
- `sessionTypes`
  - examples: `morning`, `after_break`, `afternoon`
- `allowLateMarking`
- `allowExcusedStatus`
- `allowRemarks`
- `requireCorrectionReason`
- `allowTeacherEditAfterSubmit`
- `finalizationCutoffPolicy`
- `reportingMethod`
  - how percent is computed for daily vs session vs period mode
- `lowAttendanceThresholdPercent`
- `absentStreakAlertThreshold`
- `lateCountAlertThreshold`
- `defaultClosurePolicy`
- `teacherCanReopenOwnSubmittedAttendance`
- `parentVisibleReasonPolicy`
- `effectiveFrom`
  - so policy changes are versioned over time, not overwritten blindly

This configuration should be backend-owned and tenant-scoped.

### 2. Attendance sessions

Create an `attendance_sessions` table as the operational parent record.

Suggested fields:

- `id`
- `institutionId`
- `campusId`
- `academicYearId`
- `classId`
- `sectionId`
- `attendanceDate`
- `mode`
  - `daily`
  - `session`
  - `period`
- `sessionKey`
  - nullable for daily mode
  - values like `morning`, `after_break`
- `bellScheduleId`
  - nullable
- `bellSchedulePeriodId`
  - nullable for period mode
- `status`
  - `draft`
  - `completed`
  - `finalized`
- `takenByMembershipId`
- `takenForMembershipId`
  - nullable
  - useful when a substitute, coordinator, or admin marks on behalf of the expected teacher
- `takenAt`
- `finalizedByMembershipId`
- `finalizedAt`
- `closedAt`
- `closedByMembershipId`
- `reopenedAt`
- `reopenedByMembershipId`
- `reopenReason`
- `notExpectedReason`
  - nullable
  - used when attendance is intentionally not expected for a session
- `createdAt`
- `updatedAt`

Uniqueness should depend on the mode:

- daily: one session per class-section-date
- session-wise: one session per class-section-date-sessionKey
- period-wise: one session per class-section-date-period

### 3. Attendance entries

Create an `attendance_entries` table.

Suggested fields:

- `id`
- `attendanceSessionId`
- `institutionId`
- `studentId`
- `status`
  - `present`
  - `absent`
  - `late`
  - `excused`
- `lateMinutes`
- `remark`
- `excuseReason`
- `reasonCode`
  - nullable standardized reason key
- `markedByMembershipId`
- `markedAt`
- `updatedByMembershipId`
- `updatedAt`

Uniqueness:

- one row per `attendanceSessionId + studentId`

### 4. Attendance change log

Create an immutable change log table for sensitive modifications.

Suggested fields:

- `id`
- `attendanceEntryId`
- `institutionId`
- `oldStatus`
- `newStatus`
- `oldLateMinutes`
- `newLateMinutes`
- `oldRemark`
- `newRemark`
- `oldReasonCode`
- `newReasonCode`
- `reason`
- `changedByMembershipId`
- `changedAt`

This is separate from broad audit logs. Broad audit stays useful, but the attendance domain needs entry-level history.

### 5. Attendance reason catalog

Add a tenant-scoped reason catalog for standardized attendance reasons.

Suggested uses:

- medical leave
- approved leave
- transport delay
- competition / school activity
- exam duty
- weather disruption

This should support:

- active/inactive lifecycle
- applicability rules
  - absent only
  - late only
  - excused only
- optional parent-visible label

Use reason codes in attendance entries and retain free text as optional supplemental context.

### 6. Optional expected-session model

If completeness reporting needs to be exact, add an expected-session source.

Options:

1. Derive expected sessions from config plus active roster.
2. Derive expected sessions from timetable and bell schedules for period mode.
3. Persist generated expected sessions per date.

Recommended direction:

- Daily mode: derive expected class-section-day coverage from current enrollments.
- Session-wise mode: derive expected sessions from configured session types.
- Period-wise mode: derive expected sessions from timetable plus bell schedules.

Do not mark something "complete" just because some attendance rows exist.

### 7. Attendance calendar / working-day rules

Attendance reporting cannot be correct if the system does not know whether attendance was expected on a date.

Use a backend-owned expected-attendance calendar derived from:

- academic year boundaries
- campus working days
- calendar events and holidays
- exam-only or special schedule days
- optional class-section-specific exceptions later

Reporting must distinguish:

- attendance expected but not yet taken
- attendance not expected
- attendance intentionally skipped because the class had no instructional session

Do not treat every calendar date as a working attendance date.

### 8. Attendance closure model

Schools often want attendance to stop drifting after the day or month is effectively over.

Support at least two closure layers:

1. **Session closure**
- a specific attendance session is locked
- normal teacher edits stop

2. **Period closure**
- a date range such as a month is closed for operational reporting
- reopening requires elevated access and an explicit reason

Closure history should be queryable in reports and audit views.

## Source Of Truth For Roster

Attendance must use **current enrollments**, not legacy class/section fields on the student record.

Use `student_current_enrollments` as the roster source for:

- loading attendance rosters
- determining which class-section combinations are active
- overview completion counts
- student placement shown in reports

Roster generation must also define an effective-attendance rule for edge cases:

- whether a student admitted on a date is expected for that same date
- whether a same-day section transfer should appear in the old section, new section, or both depending on timestamp and mode
- whether withdrawn students remain visible in historical reports but not in future expected rosters

Legacy student placement fields can continue to exist during migration, but attendance must stop depending on them.

## Product Rules

### Marking lifecycle

Use a clear lifecycle for attendance sessions:

- `draft`
  - partially marked, editable
- `completed`
  - all expected students marked, still editable if policy allows
- `finalized`
  - locked from normal teacher edits
  - corrections require a restricted workflow and reason

### Correction workflow

Support:

- teacher correction before finalization
- admin correction after finalization
- mandatory reason for post-finalization changes
- entry-level history and broad audit log event
- explicit reopen flow where policy requires a locked session to be reopened before changes
- dispute-friendly historical visibility of original value, changed value, actor, and reason

### Completeness semantics

Track these separately:

- `not_started`
- `in_progress`
- `completed`
- `finalized`
- `closed`
- `not_expected`

For overview and reporting, do not reduce everything to a boolean `marked`.

### Status semantics

Keep current statuses for v1 of the redesign:

- `present`
- `absent`
- `late`
- `excused`

Do not add half-day or custom statuses until the session model lands. Half-day is better represented later as:

- two sessions where one is absent and one is present
- or a dedicated configurable extension if needed

### Reason semantics

Support both:

- standardized reason code
- optional free-text operator remark

This gives schools consistency in reporting while still allowing case-specific notes.

### Derived daily summary semantics

When a school uses session-wise or period-wise attendance, the system still needs a derived day-level answer for dashboards, parent views, and summary reports.

Define backend aggregation rules for converting multi-session attendance into a day summary such as:

- full present
- partial absent
- full absent
- late present

Do not leave day-level reporting to frontend guesswork.

### Ownership semantics

Attendance must distinguish between:

- who was expected to mark attendance
- who actually marked attendance
- whether the mark was entered directly, delegated, or corrected later

This matters for:

- teacher accountability
- substitute workflows
- pending-attendance reports
- audit review

## Reporting Scope

Reporting must cover both recorded attendance and operational completeness.

### A. Operational daily reports

1. **Daily coverage overview**
- By date
- By campus
- By class-section
- By session / period completeness where applicable
- Shows `not started / in progress / completed / finalized`

2. **Missing attendance report**
- Which sections or sessions are still pending
- Which teachers or scopes are incomplete
- Whether the pending item is owned by the assigned teacher, a substitute, or an admin queue

3. **Correction activity report**
- Which attendance sessions were edited after submission or finalization

4. **Attendance expectation report**
- Which sections were expected to mark attendance
- Which sections were exempt because of holiday, exam, or no scheduled teaching

5. **Closure and reopen report**
- which sessions or periods were closed
- which ones were reopened
- who reopened them and why

### B. Class-wise attendance reports

1. **Date-range class report**
- Student rows
- Date/session/period columns depending on mode
- Present / absent / late / excused counts
- Attendance percent

2. **Monthly class summary**
- Working days or expected sessions
- student totals
- irregular attendance indicators
- class completion rate

3. **Mode-aware consolidated class summary**
- for session-wise or period-wise schools
- one row per student with both detailed session totals and derived day totals

4. **Exception class report**
- frequent absentees
- repeated late arrivals
- students below threshold
- students with many partial-day misses

5. **Roster reconciliation report**
- expected students
- actually marked students
- newly admitted or transferred students affecting the roster
- corrected mismatches

### C. Student-wise attendance reports

1. **Student detailed history**
- all records in range
- mode-aware session details

2. **Student summary**
- present / absent / late / excused totals
- attendance percent
- absent streak
- trend over recent period
- derived day totals when institution uses session-wise or period-wise mode

3. **Student monthly rollup**
- one row per month
- total expected
- total marked
- present percent

4. **Student exception history**
- corrections made to the student's attendance
- excused entries with reasons
- repeated late arrivals

5. **Student dispute trail**
- original mark
- corrected mark
- reason
- actor
- timestamps

### D. Parent-facing attendance outputs

Later, but the backend should support:

- recent attendance summary
- monthly summary
- absent streak
- late events
- parent-visible reasons where allowed by policy
- clear distinction between unmarked attendance and confirmed absence

### E. Export and print

Production reporting should support:

- CSV export for class-wise reports
- CSV export for student-wise reports
- CSV export for daily completion / pending reports
- CSV export for correction / reopen activity
- printable class summary view
- printable student attendance statement

## UX Plan

### 1. Attendance setup

Add a settings area for attendance configuration.

Suggested screens:

- attendance mode
- session type setup
- late/correction/finalization rules
- reporting thresholds
- reason catalog management
- closure policy settings

### 2. Take attendance

The marking flow should branch by mode but keep one shared structure:

- date
- class
- section
- session selector or period selector when applicable
- roster
- bulk actions
- save state

Required operator features:

- `Mark all present`
- bulk change selected students
- visible counts while marking
- quick keyboard-friendly workflow
- persistent warning for unmarked students
- clear draft/completed/finalized state
- indication of who is newly admitted / transferred when that affects the expected roster
- explicit "attendance not expected" or "session not scheduled" state where applicable
- delegated marking indicators
- reopen-required messaging when the session is locked
- standardized reason selection where the chosen status requires or encourages it

### 3. Overview

Replace the current binary overview with a true operational overview:

- grouped by date and campus
- class-section rows
- session rows if session-wise or period-wise
- completion state
- quick drill-in
- teacher ownership / substitute marking context
- not-expected and closed states

### 4. Reports

Keep a separate reports route, but expand it to:

- by class
- by student
- daily completion
- exceptions / low attendance
- exports
- correction history
- closure / reopen activity
- reconciliation views

## API Plan

The backend should evolve toward endpoints like:

- `GET /attendance/config`
- `PUT /attendance/config`
- `GET /attendance/reasons`
- `POST /attendance/reasons`
- `PATCH /attendance/reasons/:reasonId`
- `GET /attendance/sessions`
- `POST /attendance/sessions`
- `GET /attendance/sessions/:id`
- `POST /attendance/sessions/:id/entries`
- `POST /attendance/sessions/:id/finalize`
- `POST /attendance/sessions/:id/close`
- `POST /attendance/sessions/:id/reopen`
- `POST /attendance/sessions/:id/not-expected`
- `POST /attendance/entries/:id/correct`
- `GET /attendance/overview`
- `GET /attendance/reports/class`
- `GET /attendance/reports/student`
- `GET /attendance/reports/daily-completion`
- `GET /attendance/reports/exceptions`
- `GET /attendance/reports/reconciliation`
- `GET /attendance/reports/corrections`
- `GET /attendance/reports/closure-activity`
- `GET /attendance/exports/class`
- `GET /attendance/exports/student`
- `GET /attendance/exports/daily-completion`

Keep business rules in NestJS:

- expected roster validation
- session uniqueness
- finalization lock rules
- correction permission checks
- percent calculation rules
- derived daily summary rules
- expected-attendance calendar rules
- closure and reopen permission rules
- delegated marking rules
- reason-code applicability rules
- parent-visible explanation rules

## Migration Strategy

Do this in controlled phases to avoid breaking existing attendance data.

### Phase 1. Foundation refactor

- Introduce new attendance schema: sessions, entries, change log.
- Keep current daily UI working behind a compatibility layer if needed.
- Stop using legacy student placement fields for attendance reads.
- Use current enrollments for roster generation.

### Phase 2. Daily mode parity

- Rebuild current daily attendance flow on top of sessions and entries.
- Add draft/completed/finalized state.
- Add remarks and correction reasons.
- Add improved overview completeness.
- Add expected-working-day awareness.
- Add close and reopen flow.
- Add delegated marking support.

Success condition:

- existing daily attendance use case still works
- overview is accurate
- reports use the new model
- corrected and reopened sessions are traceable

### Phase 3. Session-wise mode

- Add institution config for session-wise attendance.
- Add configurable session keys such as morning and after-break.
- Update overview and reports to be session-aware.

Success condition:

- schools can choose session-wise mode without schema change

### Phase 4. Period-wise mode

- Link attendance sessions to bell schedule periods and timetable context.
- Build teacher-friendly period attendance selection.
- Add period-aware reporting.

Success condition:

- period attendance works for timetable-driven schools

### Phase 5. Reporting hardening

- daily coverage report
- missing attendance report
- monthly summaries
- exceptions and threshold reports
- exports and printable outputs
- derived day summaries for session-wise and period-wise institutions
- holiday / no-attendance expectation awareness
- reconciliation reporting
- closure / reopen reporting
- reason-aware and dispute-friendly student history

### Phase 6. Operational intelligence

- low-attendance thresholds and backend flags
- absent streak flags
- repeated late-arrival flags
- action-oriented exception views

Success condition:

- schools can identify attendance risk and operational gaps without manual spreadsheet work

## Data Migration Notes

Existing `attendance_records` data can be migrated into:

- one `attendance_session` per unique current daily grouping
- one `attendance_entry` per existing student row

Recommended migration mapping for existing data:

- old record set grouped by `(institutionId, campusId, classId, sectionId, attendanceDate)`
- new session with `mode = daily`
- entries copied under that session

Preserve old `markedByMembershipId`, `createdAt`, and `updatedAt` where possible.

Do not remove legacy attendance storage until:

- all reads are moved
- all writes are moved
- reports are moved
- data migration is verified

## Decisions Needed Before Implementation

These are product decisions, not engineering details:

1. For v1 of the redesign, should schools choose exactly one student attendance mode per institution, or can different campuses/classes use different modes?
Recommended: one mode per institution first. Per-campus or per-class mode adds complexity fast.

2. Should session-wise mode use fixed built-in session keys, or configurable labels?
Recommended: configurable labels with a small default set.

3. Should finalized attendance be editable by admins directly, or only through an explicit correction action?
Recommended: explicit correction action only.

4. How should attendance percent be computed in period-wise mode?
Recommended: based on expected sessions in the selected range, not just marked rows.

5. Should class teachers only mark their own assigned sections in period mode, or can broader staff roles mark any permitted section?
Recommended: broader permission plus scope enforcement first, teacher-specific restriction later if needed.

6. For same-day admissions or transfers, from what point should the student count in expected attendance?
Recommended: support an effective-from timestamp rule in the backend model, but use a simple institution-level policy first.

7. Should holidays and no-class dates come only from the calendar module, or does attendance need its own override layer?
Recommended: use calendar and academic-year data first, but keep an attendance-specific override capability in reserve.

8. Should monthly closure be mandatory for institutions that want compliance-style reporting?
Recommended: optional by institution policy, but the capability should exist from the start.

9. Should parent-facing attendance reasons expose the internal reason text, the standardized reason label, or both?
Recommended: standardized parent-safe label by policy, with internal free text hidden by default.

## Out Of Scope For This Plan

These should not block the attendance platform redesign:

- biometric device integration
- RFID / gate hardware integrations
- automated absent notifications
- payroll linkage for staff attendance
- custom per-school attendance formulas
- leave management for staff
- hostel attendance
- transport boarding attendance
- exam-hall attendance as a separate specialized workflow

The redesign should leave the door open for them, but not depend on them.

## Production Readiness Tiers

### Mandatory for production-ready attendance

- current-enrollment-based roster correctness
- sessions and entries model
- daily mode rebuilt on the new model
- draft / completed / finalized / closed lifecycle
- reopen and correction workflow with reasons
- delegated marking support
- working-day and not-expected attendance rules
- accurate overview completeness
- class-wise and student-wise reports
- pending / missing attendance reporting
- reconciliation reporting
- exports for core reports
- auditability for sensitive changes

### Strongly recommended for high-quality production use

- session-wise attendance mode
- reason catalog management
- closure activity reporting
- dispute-friendly student attendance history
- low-attendance thresholds and exception views
- parent-visible explanation rules

### Advanced but can follow after core production readiness

- period-wise attendance mode
- deeper operational intelligence and threshold automation
- parent notification workflows
- hardware integration support
- specialized attendance variants for exam, hostel, or transport contexts

## Deliverable Definition

This plan is complete when the repo can implement an attendance module that:

- uses current enrollments correctly
- supports daily, session-wise, and period-wise attendance without schema redesign
- provides operational overview and reporting beyond simple record lists
- preserves correction history
- distinguishes expected attendance from non-working or exempt dates
- provides derived day-level summaries even when raw attendance is session-wise or period-wise
- supports closure, reopen, delegated marking, and reason-aware corrections
- gives administrators the reports needed to reconcile, dispute-review, and export attendance confidently
- can be extended later for notifications, parent communication, and hardware integrations
