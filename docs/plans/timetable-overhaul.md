# Timetable Module Overhaul Plan

## Purpose

Make the timetable module production-ready for Indian schools. The current module is a working but incomplete section-level schedule editor. This plan adds bell schedule templates, teacher assignment, conflict detection, a teacher view, a grid editor UI, and copy operations — in five phases that each leave the system shippable.

## Current State

**Schema** (`packages/database/src/schema/index.ts`):
- `timetable_entries` with: id, institutionId, campusId, classId, sectionId, subjectId, dayOfWeek, periodIndex, startTime, endTime, room (nullable), status, timestamps
- Partial unique index on `(sectionId, dayOfWeek, periodIndex)` where status != deleted
- No staffId/teacherId column
- Separate `subject_teacher_assignments` table (membershipId → subjectId) never joined into timetable queries

**Backend** (`apps/api-erp/src/modules/timetable/`):
- `GET /timetable?classId=&sectionId=` — fetch section timetable
- `PUT /timetable/sections/:sectionId` — full replace section timetable
- `DELETE /timetable/:entryId` — soft-delete one entry
- No cross-section conflict detection, no teacher assignment

**Frontend** (`apps/erp/src/routes/academics/timetable-page.tsx`):
- Single monolithic page with row-by-row `useFieldArray` editor
- Duplicate "Existing saved periods" card (same data shown twice)
- No teacher column, no grid view, no teacher view page

**Family/student portal**: Read-only timetable panels with duplicated query logic.

---

## Phase 1 — Bell Schedule Infrastructure

### Goal

Admins define period timings once per campus. The timetable editor uses these as period templates. Entries still carry raw `startTime`/`endTime` (denormalized copies) so portal reads remain simple.

### Architecture decision — denormalized times

When a user assigns a period to a slot, times are copied from the bell period into the entry. Changing a bell schedule does not silently mutate published timetable data — the published timetable is a snapshot. A `bellSchedulePeriodId` FK records provenance but is not used for time resolution.

### Schema changes

**New table: `bell_schedules`**

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | |
| `institutionId` | text NOT NULL FK → `organization.id` | cascade delete |
| `campusId` | text NOT NULL FK → `campus.id` | restrict delete |
| `name` | text NOT NULL | e.g. "Default Schedule", "Saturday Short Day" |
| `isDefault` | boolean NOT NULL default false | one default per campus |
| `status` | text enum `active \| inactive \| deleted` | Tier 2 entity |
| `createdAt` | timestamp NOT NULL | |
| `deletedAt` | timestamp | audit only |

Indexes:
- `bell_schedules_institution_idx` on `institutionId`
- `bell_schedules_campus_idx` on `campusId`
- Partial unique `bell_schedules_default_per_campus_idx` on `(campusId)` where `isDefault IS TRUE AND status != 'deleted'`

**New table: `bell_schedule_periods`**

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | |
| `bellScheduleId` | text NOT NULL FK → `bell_schedules.id` | cascade delete |
| `institutionId` | text NOT NULL FK → `organization.id` | cascade delete |
| `periodIndex` | integer NOT NULL | 1-based display order |
| `label` | text | optional e.g. "Break", "Period 1" |
| `startTime` | text NOT NULL | HH:MM 24h |
| `endTime` | text NOT NULL | HH:MM 24h |
| `isBreak` | boolean NOT NULL default false | break periods shown in grid but not assignable |
| `status` | text enum `active \| inactive` | Tier 3 — no delete concept |
| `createdAt` | timestamp NOT NULL | |
| `updatedAt` | timestamp NOT NULL | |

Indexes:
- `bell_schedule_periods_schedule_idx` on `bellScheduleId`
- Partial unique `bell_schedule_periods_slot_unique_idx` on `(bellScheduleId, periodIndex)` where `status = 'active'`

**Column additions to `timetable_entries`** (both nullable, single migration):
- `bellSchedulePeriodId` text FK → `bell_schedule_periods.id` onDelete set null
- `staffId` text FK → `member.id` onDelete restrict (included in Phase 1 migration so one migration covers all schema changes; wired in Phase 2)

Index: `timetable_entries_staff_idx` on `staffId`

**Constants** (`packages/contracts/src/index.ts`):
- `BELL_SCHEDULE_STATUS = { ACTIVE, INACTIVE, DELETED }`
- `BELL_SCHEDULE_PERIOD_STATUS = { ACTIVE, INACTIVE }`

### Backend: Bell Schedule module

**New module:** `apps/api-erp/src/modules/bell-schedules/`

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/bell-schedules` | `ACADEMICS_READ` | List bell schedules for active campus (paginated) |
| POST | `/bell-schedules` | `ACADEMICS_MANAGE` | Create a bell schedule |
| GET | `/bell-schedules/:scheduleId` | `ACADEMICS_READ` | Get schedule with periods |
| PUT | `/bell-schedules/:scheduleId` | `ACADEMICS_MANAGE` | Update name / isDefault |
| PATCH | `/bell-schedules/:scheduleId/status` | `ACADEMICS_MANAGE` | Set status |
| PUT | `/bell-schedules/:scheduleId/periods` | `ACADEMICS_MANAGE` | Full-replace periods |

Service logic:
- `createBellSchedule` — if `isDefault: true`, unset existing default in same transaction
- `setScheduleStatus` — check no active timetable entries reference this schedule before delete; reject removing the only default
- `replaceSchedulePeriods` — validate end > start, unique contiguous periodIndex, at least one non-break period; transaction: deactivate all existing, insert new

Error messages:
- `SCHEDULE_NOT_FOUND`, `SCHEDULE_NAME_EXISTS`, `SCHEDULE_HAS_TIMETABLE_ENTRIES`
- `PERIOD_INVALID_TIME_RANGE`, `PERIOD_DUPLICATE_INDEX`, `DEFAULT_SCHEDULE_REQUIRED`

### Backend: TimetableService refactor

- Extract private `fetchSectionTimetableEntries(institutionId, campusId, classId, sectionId)` helper
- Update select to include `staffId`, `staffName` (left join member → user), `bellSchedulePeriodId`
- Update `family.service.ts` and `student-portal.service.ts` to inject `TimetableService` and call the helper — eliminates duplicated queries before Phase 2 adds new columns

### Frontend: Bell Schedules admin page

- New route: `/academics/bell-schedules` — `EntityListPage` + `RouteEntitySheet` pattern
- List columns: name, period count, isDefault badge, status, actions
- Periods editor within the sheet: compact `useFieldArray` table (index, label, start, end, break toggle)
- Sidebar link under Academics

---

## Phase 2 — Teacher Assignment

### Goal

Each timetable entry records which staff member teaches that period. The form shows a teacher select per row.

### Backend changes

**`timetable.schemas.ts`:** Add `staffId: z.uuid().optional()` to entry body schema.

**`timetable.service.ts`:**
- Add `assertStaffMembersAvailable(institutionId, campusId, staffIds[])` — checks each staffId is a non-deleted staff member in the same institution/campus
- Wire into `replaceSectionTimetable` after `assertSubjectsAvailable`
- Update insert to include `staffId`

**New endpoint: `GET /timetable/staff-options?classId=&subjectId=`**

Returns `{ preferred: StaffOptionDto[], others: StaffOptionDto[] }`:
- `preferred`: staff with `subject_teacher_assignment` for that subject (and matching classId or null classId)
- `others`: all other active staff in campus

**DTO updates:**
- `ReplaceTimetableEntryBodyDto`: add `staffId?: string`
- `TimetableEntryDto`: add `staffId: string | null`, `staffName: string | null`

### Frontend changes

- Add `useTimetableStaffOptionsQuery(enabled, { classId, subjectId })` hook
- Add `staffId` to form schema
- Add teacher `<Select>` column after subject in row editor, grouped into "Assigned to subject" / "Other staff"
- When `subjectId` changes, clear `staffId` if no longer in options

---

## Phase 3 — Cross-Section Conflict Detection

### Goal

Backend-enforced hard errors when saving a section timetable that would double-book a teacher or room.

### Backend changes

All logic in `timetable.service.ts`:

**`assertNoTeacherConflicts(institutionId, campusId, sectionId, entries)`**

Query `timetable_entries` where:
- Same institution and campus, different section, status != deleted
- `staffId IN (non-null staffIds from entries)`
- Matching `(dayOfWeek, periodIndex)` pairs

Build composite `or(and(eq(day, d), eq(period, p), inArray(staffId, [...])))` conditions. Throw `ConflictException` naming the teacher, day, and period.

**`assertNoRoomConflicts(institutionId, campusId, sectionId, entries)`**

Same approach for rooms: query where `room IN (non-null rooms)` AND matching day+period pairs from other sections.

**Order in `replaceSectionTimetable`:**
1. `getSectionScope`
2. `assertSubjectsAvailable`
3. `assertStaffMembersAvailable`
4. `assertNoTeacherConflicts`
5. `assertNoRoomConflicts`
6. Transaction: soft-delete existing, insert new

Conflict checks run **before** the transaction so they read committed state and are not confused by the in-progress delete of the current section's own entries.

### Frontend

No changes needed — the existing mutation `onError` surfaces the 409 error message via toast. Verify this handler exists; add if missing.

---

## Phase 4 — Grid Editor and UX Cleanup

### Goal

Replace row-by-row editor with a weekly grid (days as columns, bell periods as rows). Remove the duplicate "Existing saved periods" card.

Requires Phase 1 (bell schedules) because the grid's period rows come from the active bell schedule.

### New components

**`apps/erp/src/features/timetable/components/timetable-grid.tsx`**

Props: `bellSchedule`, `days`, `entries` (indexed by `day:period`), `subjects`, `staffOptions`, `onCellChange`, `readOnly`

CSS grid/table. Columns = school days. Rows = bell schedule periods. Period row headers show index, label, time range.

**`apps/erp/src/features/timetable/components/timetable-cell.tsx`**

Props: `entry`, `subjects`, `staffOptions`, `isBreak`, `onAssign`, `onClear`, `readOnly`

- Break period: dimmed "Break" label, not interactive
- Empty: dashed button that opens popover (subject select + teacher select + room input)
- Filled: chip with subject, teacher, room; action menu (edit, clear)

### Page refactor

- Remove `useFieldArray`; replace with local `Map<string, CellValue>` state keyed by `"${day}:${period}"`
- Remove "Existing saved periods" card entirely
- Add school-days toggle (Mon-Fri default, show/hide Sat/Sun)
- If no bell schedule for campus: show "Set up a Bell Schedule first" with link to `/academics/bell-schedules`
- "Save timetable" serializes the map into entries array, filling `startTime`/`endTime` from bell schedule periods

### UX rules

- Empty cells: low-contrast "+" indicator
- Client-side conflict warning: yellow border if same teacher appears in same row across columns (optimistic only — backend enforces)
- Grid horizontally scrollable on small screens, min cell width 120px
- "Clear all" secondary action resets local state

---

## Phase 5 — Teacher View and Copy Operations

### Goal

Admins view any staff member's full weekly schedule. Sections can copy timetable from another section.

### Backend: Teacher schedule view

**`GET /timetable/teacher?staffId=`** — `ACADEMICS_READ`

Query `timetable_entries` joined with subjects, classSections, schoolClasses where `staffId = ?` and campus match.

Returns:
```json
{
  "staffId": "...",
  "staffName": "...",
  "entries": [
    {
      "id", "dayOfWeek", "periodIndex", "startTime", "endTime",
      "subjectId", "subjectName",
      "classId", "className",
      "sectionId", "sectionName",
      "room"
    }
  ]
}
```

### Backend: Copy section timetable

**`POST /timetable/sections/:sectionId/copy-from`**

Body: `{ classId, sourceClassId, sourceSectionId }`

Service logic:
1. Validate target and source sections belong to same institution/campus
2. Fetch source entries; throw if empty
3. Run `assertNoTeacherConflicts` and `assertNoRoomConflicts` using source entries mapped to target sectionId
4. Transaction: soft-delete target entries, insert copies with new IDs

Error messages: `COPY_SOURCE_EMPTY`, `COPY_SOURCE_NOT_FOUND`, `COPY_SAME_SECTION`

### Frontend: Teacher Schedule Page

**New route:** `/academics/timetable/teacher`

- Page header: "Teacher Schedule"
- Staff member select (query active staff for campus)
- Read-only `TimetableGrid` with `readOnly=true`
- Cells show class + section name and subject name

### Frontend: Copy Section Operation

- `EntityToolbarSecondaryAction` "Copy from section" on timetable grid page
- Opens `Dialog` with source class select → source section select
- Calls copy-from endpoint; invalidates timetable query on success
- 409 conflicts surface via `toast.error`

---

## Implementation Map

### Files to create

| File | Phase |
|---|---|
| `apps/api-erp/src/modules/bell-schedules/bell-schedules.module.ts` | 1 |
| `apps/api-erp/src/modules/bell-schedules/bell-schedules.controller.ts` | 1 |
| `apps/api-erp/src/modules/bell-schedules/bell-schedules.service.ts` | 1 |
| `apps/api-erp/src/modules/bell-schedules/bell-schedules.dto.ts` | 1 |
| `apps/api-erp/src/modules/bell-schedules/bell-schedules.schemas.ts` | 1 |
| `apps/erp/src/features/bell-schedules/api/use-bell-schedules.ts` | 1 |
| `apps/erp/src/features/bell-schedules/model/bell-schedule-schema.ts` | 1 |
| `apps/erp/src/routes/academics/bell-schedules-page.tsx` | 1 |
| `apps/erp/src/features/timetable/components/timetable-grid.tsx` | 4 |
| `apps/erp/src/features/timetable/components/timetable-cell.tsx` | 4 |
| `apps/erp/src/routes/academics/teacher-timetable-page.tsx` | 5 |

### Files to modify

| File | Phases |
|---|---|
| `packages/database/src/schema/index.ts` | 1 |
| `packages/contracts/src/index.ts` | 1 |
| `apps/api-erp/src/constants/api-routes.ts` | 1, 5 |
| `apps/api-erp/src/constants/errors.ts` | 1, 2, 3, 5 |
| `apps/api-erp/src/constants/status.ts` | 1 |
| `apps/api-erp/src/modules/timetable/timetable.service.ts` | 1, 2, 3, 5 |
| `apps/api-erp/src/modules/timetable/timetable.controller.ts` | 2, 5 |
| `apps/api-erp/src/modules/timetable/timetable.dto.ts` | 2 |
| `apps/api-erp/src/modules/timetable/timetable.schemas.ts` | 2 |
| `apps/api-erp/src/modules/family/family.service.ts` | 1 |
| `apps/api-erp/src/modules/student-portal/student-portal.service.ts` | 1 |
| `apps/api-erp/src/app.module.ts` | 1 |
| `apps/erp/src/features/timetable/api/use-timetable.ts` | 2, 5 |
| `apps/erp/src/features/timetable/model/timetable-editor-schema.ts` | 2, 4 |
| `apps/erp/src/routes/academics/timetable-page.tsx` | 2, 4, 5 |
| ERP sidebar nav | 1, 5 |

---

## Build Sequence

### Phase 1

1. Add constants to `packages/contracts`
2. Add `bellSchedules`, `bellSchedulePeriods` tables and two new columns on `timetableEntries` to schema
3. User runs `bun run db:generate` then `bun run db:migrate`
4. Build packages
5. Add route keys, error messages, status constants to backend
6. Implement bell schedules module (service → controller → module → register in app)
7. Extract `fetchSectionTimetableEntries` helper in `TimetableService`
8. Update family/student-portal services to use the helper
9. Regenerate OpenAPI and ERP API types; typecheck
10. Implement frontend bell schedules page with hooks and schemas
11. Add sidebar link

### Phase 2

1. Add `staffId` to backend schemas and DTOs
2. Add `assertStaffMembersAvailable` and `listTeacherOptions` to service
3. Add `GET /timetable/staff-options` endpoint
4. Regenerate OpenAPI and ERP API types; typecheck
5. Add staff options hook and teacher select to frontend editor

### Phase 3

1. Add `assertNoTeacherConflicts` and `assertNoRoomConflicts` to service
2. Wire into `replaceSectionTimetable` before transaction
3. Add conflict error messages
4. Verify frontend error toast handling

### Phase 4

1. Implement `TimetableGrid` and `TimetableCell` components
2. Refactor timetable page: remove useFieldArray, use Map state, mount grid, remove duplicate card
3. Add school-days toggle and bell schedule empty state

### Phase 5

1. Add `getTeacherSchedule` and `copySectionTimetable` to service
2. Add teacher view and copy-from endpoints
3. Regenerate OpenAPI and ERP API types; typecheck
4. Implement teacher schedule page with read-only grid
5. Add copy-from dialog to timetable page
6. Add sidebar link

---

## Critical Details

### Staff deletion guard

`onDelete: restrict` on `timetableEntries.staffId → member.id` means deleting a staff membership with timetable entries fails at the DB level. Add a check to `StaffService.deleteStaff` that throws `ConflictException("Cannot delete a staff record that is assigned in the timetable.")`.

### Conflict check ordering

Conflict checks run **before** the transaction (delete + insert). Inside the transaction, the current section's entries would already be soft-deleted, potentially masking real conflicts. Reading committed state gives accurate results.

### Performance

- Conflict queries use `timetable_entries_staff_idx` and `timetable_entries_scope_idx`. For a school with a few thousand entries this is fast without optimization.
- `listTeacherOptions` is a small lookup (hundreds of staff per campus max).
- Grid renders at most 7 × 12 = 84 cells.

### OpenAPI and type generation

After each phase that changes endpoints or DTOs:
1. `bun run openapi:export` in `apps/api-erp` (requires `DATABASE_URL`)
2. Regenerate ERP API types
3. `bun run typecheck` from repo root
