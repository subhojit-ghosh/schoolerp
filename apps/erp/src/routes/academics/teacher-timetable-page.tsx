import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@repo/ui/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { isStaffContext } from "@/features/auth/model/auth-context";
import {
  BELL_SCHEDULE_LIST_SORT_FIELDS,
  useBellScheduleQuery,
  useBellSchedulesQuery,
} from "@/features/bell-schedules/api/use-bell-schedules";
import { useStaffQuery } from "@/features/staff/api/use-staff";
import { TimetableGrid } from "@/features/timetable/components/timetable-grid";
import { useTeacherTimetableQuery } from "@/features/timetable/api/use-timetable";
import {
  DEFAULT_SCHOOL_DAY_VALUES,
  type TimetableCellValue,
  WEEKDAY_OPTIONS,
  type TimetableWeekday,
} from "@/features/timetable/model/timetable-editor-schema";

const DEFAULT_TEACHER_DAYS: TimetableWeekday[] = [...DEFAULT_SCHOOL_DAY_VALUES];

type StaffRow = {
  id: string;
  name: string;
  status: "active" | "inactive" | "suspended";
};

type BellScheduleSummary = {
  id: string;
  isDefault: boolean;
  status: "active" | "inactive" | "deleted";
};

export function TeacherTimetablePage() {
  useDocumentTitle("Teacher Timetable");
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const canQuery = isStaffContext(session) && Boolean(institutionId);
  const [staffId, setStaffId] = useState("");
  const staffQuery = useStaffQuery(institutionId, {
    limit: 100,
    page: 1,
    sort: "name",
    order: "asc",
    status: ["active", "inactive", "suspended"],
  });
  const bellSchedulesQuery = useBellSchedulesQuery(canQuery, {
    limit: 50,
    order: "asc",
    page: 1,
    sort: BELL_SCHEDULE_LIST_SORT_FIELDS.NAME,
  });
  const staffRows = useMemo(
    () => (staffQuery.data?.rows ?? []) as StaffRow[],
    [staffQuery.data?.rows],
  );
  const defaultBellSchedule = useMemo(
    () =>
      ((bellSchedulesQuery.data?.rows ?? []) as BellScheduleSummary[]).find(
        (schedule) => schedule.isDefault && schedule.status === "active",
      ),
    [bellSchedulesQuery.data?.rows],
  );
  const bellScheduleDetailQuery = useBellScheduleQuery(
    canQuery && Boolean(defaultBellSchedule?.id),
    defaultBellSchedule?.id,
  );
  const teacherTimetableQuery = useTeacherTimetableQuery(canQuery, staffId);
  const isBellSchedulePending =
    bellSchedulesQuery.isLoading ||
    (Boolean(defaultBellSchedule?.id) && bellScheduleDetailQuery.isLoading);
  const isTeacherPending = Boolean(staffId) && teacherTimetableQuery.isLoading;
  const isPageLoading =
    staffQuery.isLoading || isBellSchedulePending || isTeacherPending;

  useEffect(() => {
    if (!staffId && staffRows.length > 0) {
      setStaffId(staffRows[0]!.id);
    }
  }, [staffId, staffRows]);

  const entries = useMemo<Record<string, TimetableCellValue>>(() => {
    if (!teacherTimetableQuery.data) {
      return {};
    }

    return Object.fromEntries(
      teacherTimetableQuery.data.entries.map((entry) => [
        `${entry.dayOfWeek}:${entry.periodIndex}`,
        {
          bellSchedulePeriodId: entry.bellSchedulePeriodId ?? null,
          classId: entry.classId,
          className: entry.className,
          id: entry.id,
          room: entry.room ?? "",
          sectionId: entry.sectionId,
          sectionName: entry.sectionName,
          staffId: entry.staffId ?? null,
          staffName: entry.staffName ?? null,
          subjectId: entry.subjectId,
          subjectName: entry.subjectName,
        } satisfies TimetableCellValue,
      ]),
    );
  }, [teacherTimetableQuery.data]);

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teacher Schedule</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to view teacher
            schedules.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canQuery) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teacher Schedule</CardTitle>
          <CardDescription>
            You don't have access to this section.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <EntityPageShell width="full">
      <EntityPageHeader
        description="Review a staff member's weekly teaching load in the same timetable grid."
        title="Teacher Schedule"
      />

      <Card>
        <CardHeader>
          <CardTitle>Staff member</CardTitle>
          <CardDescription>
            Select a teacher to review their week.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="teacher-select">Teacher</FieldLabel>
            <FieldContent>
              <Select
                value={staffId}
                onValueChange={setStaffId}
                disabled={staffQuery.isLoading || staffRows.length === 0}
              >
                <SelectTrigger id="teacher-select" className="max-w-sm">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {staffRows.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        </CardContent>
      </Card>

      {isPageLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading teacher schedule</CardTitle>
            <CardDescription>
              Fetching teachers, the active bell schedule, and the selected
              weekly load.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : staffRows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No teachers available</CardTitle>
            <CardDescription>
              Add at least one staff member before using the teacher timetable
              view.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : !defaultBellSchedule || !bellScheduleDetailQuery.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Set up a bell schedule first</CardTitle>
            <CardDescription>
              Teacher schedule view uses the active default bell schedule to
              render rows.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {teacherTimetableQuery.data?.staffName ?? "Teacher schedule"}
            </CardTitle>
            <CardDescription>
              Read-only view across Monday to Friday by default.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimetableGrid
              bellSchedule={{
                id: bellScheduleDetailQuery.data.id,
                name: bellScheduleDetailQuery.data.name,
                periods: bellScheduleDetailQuery.data.periods,
              }}
              days={WEEKDAY_OPTIONS.filter((day: { value: TimetableWeekday }) =>
                DEFAULT_TEACHER_DAYS.includes(day.value),
              )}
              entries={entries}
              readOnly
              subjects={[]}
              viewMode="teacher"
            />
          </CardContent>
        </Card>
      )}
    </EntityPageShell>
  );
}
