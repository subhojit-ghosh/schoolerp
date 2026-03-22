import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { IconCopy } from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@repo/ui/components/ui/toggle-group";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
  EntityToolbarSecondaryAction,
} from "@/components/entities/entity-actions";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { ERP_ROUTES } from "@/constants/routes";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  BELL_SCHEDULE_LIST_SORT_FIELDS,
  useBellScheduleQuery,
  useBellSchedulesQuery,
} from "@/features/bell-schedules/api/use-bell-schedules";
import { useClassesQuery } from "@/features/classes/api/use-classes";
import { useSubjectsQuery } from "@/features/subjects/api/use-subjects";
import {
  useCopySectionTimetableMutation,
  useReplaceTimetableMutation,
  useTimetableQuery,
} from "@/features/timetable/api/use-timetable";
import { TimetableGrid } from "@/features/timetable/components/timetable-grid";
import {
  DEFAULT_SCHOOL_DAY_VALUES,
  type TimetableCellValue,
  type TimetableWeekday,
  WEEKDAY_OPTIONS,
} from "@/features/timetable/model/timetable-editor-schema";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

type ClassWithSections = {
  id: string;
  name: string;
  sections: Array<{ id: string; name: string }>;
};

type SubjectOption = {
  id: string;
  name: string;
  status: "active" | "inactive" | "deleted";
};

type BellScheduleSummary = {
  id: string;
  isDefault: boolean;
  status: "active" | "inactive" | "deleted";
};

function buildConflictKeys(entries: Record<string, TimetableCellValue>) {
  const groupedBySlot = new Map<string, string[]>();

  for (const [key, entry] of Object.entries(entries)) {
    if (!entry.staffId) {
      continue;
    }

    const [dayOfWeek, periodIndex] = key.split(":");
    const staffSlotKey = `${entry.staffId}:${dayOfWeek}:${periodIndex}`;
    const keys = groupedBySlot.get(staffSlotKey) ?? [];
    keys.push(key);
    groupedBySlot.set(staffSlotKey, keys);
  }

  return new Set(
    Array.from(groupedBySlot.values())
      .filter((keys) => keys.length > 1)
      .flat(),
  );
}

export function TimetablePage() {
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManage = isStaffContext(session);
  const canQuery = canManage && Boolean(institutionId);

  const classesQuery = useClassesQuery(canQuery, {
    limit: 50,
    page: 1,
    sort: "name",
    order: "asc",
  });
  const subjectsQuery = useSubjectsQuery(canQuery, {
    limit: 100,
    page: 1,
    sort: "name",
    order: "asc",
  });
  const bellSchedulesQuery = useBellSchedulesQuery(canQuery, {
    limit: 50,
    order: "asc",
    page: 1,
    sort: BELL_SCHEDULE_LIST_SORT_FIELDS.NAME,
  });

  const classes = useMemo(
    () => (classesQuery.data?.rows ?? []) as ClassWithSections[],
    [classesQuery.data?.rows],
  );
  const subjects = useMemo(
    () =>
      ((subjectsQuery.data?.rows ?? []) as SubjectOption[]).filter(
        (subject) => subject.status === "active",
      ),
    [subjectsQuery.data?.rows],
  );
  const defaultBellSchedule = useMemo(
    () =>
      ((bellSchedulesQuery.data?.rows ?? []) as BellScheduleSummary[]).find(
        (schedule) => schedule.isDefault && schedule.status === "active",
      ),
    [bellSchedulesQuery.data?.rows],
  );

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [visibleDays, setVisibleDays] = useState<string[]>(
    [...DEFAULT_SCHOOL_DAY_VALUES],
  );
  const [entries, setEntries] = useState<Record<string, TimetableCellValue>>({});
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copySourceClassId, setCopySourceClassId] = useState("");
  const [copySourceSectionId, setCopySourceSectionId] = useState("");

  useEffect(() => {
    if (classId || classes.length === 0) {
      return;
    }

    const firstClass = classes[0];
    if (firstClass) {
      setClassId(firstClass.id);
      setSectionId(firstClass.sections[0]?.id ?? "");
    }
  }, [classId, classes]);

  const selectedClass = useMemo(
    () => classes.find((schoolClass) => schoolClass.id === classId),
    [classId, classes],
  );

  useEffect(() => {
    if (!selectedClass) {
      return;
    }

    if (!selectedClass.sections.some((section) => section.id === sectionId)) {
      setSectionId(selectedClass.sections[0]?.id ?? "");
    }
  }, [sectionId, selectedClass]);

  const bellScheduleDetailQuery = useBellScheduleQuery(
    canQuery && Boolean(defaultBellSchedule?.id),
    defaultBellSchedule?.id,
  );
  const timetableQuery = useTimetableQuery(
    canQuery && Boolean(classId && sectionId),
    { classId, sectionId },
  );
  const replaceMutation = useReplaceTimetableMutation();
  const copyMutation = useCopySectionTimetableMutation();

  useEffect(() => {
    if (!timetableQuery.data) {
      setEntries({});
      return;
    }

    const nextEntries = Object.fromEntries(
      timetableQuery.data.entries.map((entry) => [
        `${entry.dayOfWeek}:${entry.periodIndex}`,
        {
          bellSchedulePeriodId: entry.bellSchedulePeriodId ?? null,
          id: entry.id,
          room: entry.room ?? "",
          staffId: entry.staffId ?? null,
          staffName: entry.staffName ?? null,
          subjectId: entry.subjectId,
          subjectName: entry.subjectName,
        } satisfies TimetableCellValue,
      ]),
    );

    setEntries(nextEntries);
  }, [timetableQuery.data]);

  const selectedCopyClass = useMemo(
    () => classes.find((schoolClass) => schoolClass.id === copySourceClassId),
    [classes, copySourceClassId],
  );

  const conflictKeys = useMemo(() => buildConflictKeys(entries), [entries]);
  const isBellSchedulePending =
    bellSchedulesQuery.isLoading ||
    (Boolean(defaultBellSchedule?.id) && bellScheduleDetailQuery.isLoading);
  const isPageLoading =
    classesQuery.isLoading || subjectsQuery.isLoading || isBellSchedulePending;

  async function handleSave() {
    if (!classId || !sectionId || !bellScheduleDetailQuery.data) {
      return;
    }

    const periodById = new Map(
      bellScheduleDetailQuery.data.periods.map((period) => [period.id, period]),
    );
    const periodByIndex = new Map(
      bellScheduleDetailQuery.data.periods.map((period) => [period.periodIndex, period]),
    );

    try {
      await replaceMutation.mutateAsync({
        params: { path: { sectionId } },
        body: {
          classId,
          entries: Object.entries(entries).flatMap(([key, entry]) => {
            const [dayOfWeek, periodIndexValue] = key.split(":");
            const periodIndex = Number(periodIndexValue);
            const period =
              (entry.bellSchedulePeriodId
                ? periodById.get(entry.bellSchedulePeriodId)
                : undefined) ?? periodByIndex.get(periodIndex);

            if (!period || period.isBreak) {
              return [];
            }

            return [
              {
                bellSchedulePeriodId: period.id,
                dayOfWeek: dayOfWeek as TimetableWeekday,
                endTime: period.endTime,
                periodIndex,
                room: entry.room || undefined,
                staffId: entry.staffId || undefined,
                startTime: period.startTime,
                subjectId: entry.subjectId,
              },
            ];
          }),
        },
      });

      toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.TIMETABLE));
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function handleCopy() {
    if (!classId || !sectionId || !copySourceClassId || !copySourceSectionId) {
      return;
    }

    try {
      await copyMutation.mutateAsync({
        params: { path: { sectionId } },
        body: {
          classId,
          sourceClassId: copySourceClassId,
          sourceSectionId: copySourceSectionId,
        },
      });

      toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.TIMETABLE));
      setCopyDialogOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timetable</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage timetable records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timetable</CardTitle>
          <CardDescription>
            Timetable administration is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <EntityPageShell width="full">
      <EntityPageHeader
        description="Build weekly class schedules by section with a bell-schedule-backed grid."
        title="Timetable"
      />

      <Card>
        <CardHeader>
          <CardTitle>Section scope</CardTitle>
          <CardDescription>Choose class and section before editing the grid.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="timetable-class">Class</FieldLabel>
            <FieldContent>
              <Select
                onValueChange={setClassId}
                value={classId}
                disabled={classesQuery.isLoading || classes.length === 0}
              >
                <SelectTrigger id="timetable-class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((schoolClass) => (
                    <SelectItem key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="timetable-section">Section</FieldLabel>
            <FieldContent>
              <Select
                onValueChange={setSectionId}
                value={sectionId}
                disabled={
                  classesQuery.isLoading ||
                  !selectedClass ||
                  selectedClass.sections.length === 0
                }
              >
                <SelectTrigger id="timetable-section">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {selectedClass?.sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
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
            <CardTitle>Loading timetable</CardTitle>
            <CardDescription>
              Fetching classes, subjects, and the active bell schedule for this campus.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : !defaultBellSchedule || !bellScheduleDetailQuery.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Set up a bell schedule first</CardTitle>
            <CardDescription>
              Timetable editing now uses the active default bell schedule for the current campus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={ERP_ROUTES.BELL_SCHEDULES}>Go to bell schedules</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Weekly schedule</CardTitle>
              <CardDescription>
                Assign subjects, teachers, and rooms into the weekly grid.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <EntityToolbarSecondaryAction
                type="button"
                onClick={() => setEntries({})}
              >
                Clear all
              </EntityToolbarSecondaryAction>
              <EntityToolbarSecondaryAction
                type="button"
                onClick={() => setCopyDialogOpen(true)}
              >
                <IconCopy data-icon="inline-start" />
                Copy from section
              </EntityToolbarSecondaryAction>
              <EntityFormPrimaryAction
                type="button"
                onClick={() => void handleSave()}
                disabled={replaceMutation.isPending || !classId || !sectionId}
              >
                {replaceMutation.isPending ? "Saving..." : "Save timetable"}
              </EntityFormPrimaryAction>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium">Visible days</p>
                <p className="text-sm text-muted-foreground">
                  Monday to Friday is the default. Add Saturday or Sunday if needed.
                </p>
              </div>
              <ToggleGroup
                type="multiple"
                value={visibleDays}
                onValueChange={(nextValue) =>
                  setVisibleDays(
                    nextValue.length > 0
                      ? (nextValue as TimetableWeekday[])
                      : [...DEFAULT_SCHOOL_DAY_VALUES],
                  )
                }
              >
                {WEEKDAY_OPTIONS.map((day: { label: string; value: TimetableWeekday }) => (
                  <ToggleGroupItem key={day.value} value={day.value}>
                    {day.label.slice(0, 3)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <TimetableGrid
              bellSchedule={{
                id: bellScheduleDetailQuery.data.id,
                name: bellScheduleDetailQuery.data.name,
                periods: bellScheduleDetailQuery.data.periods,
              }}
              classId={classId}
              conflictKeys={conflictKeys}
              days={WEEKDAY_OPTIONS.filter((day: { value: TimetableWeekday }) =>
                visibleDays.includes(day.value),
              )}
              entries={entries}
              subjects={subjects.map((subject) => ({
                id: subject.id,
                name: subject.name,
              }))}
              onCellChange={(key, value) => {
                setEntries((current) => {
                  const nextEntries = { ...current };
                  if (!value) {
                    delete nextEntries[key];
                    return nextEntries;
                  }

                  nextEntries[key] = value;
                  return nextEntries;
                });
              }}
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy from section</DialogTitle>
            <DialogDescription>
              Replace the current section timetable with another section's saved grid.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="copy-class">Source class</FieldLabel>
              <FieldContent>
                <Select
                  value={copySourceClassId}
                  onValueChange={(nextClassId) => {
                    setCopySourceClassId(nextClassId);
                    const nextClass = classes.find((item) => item.id === nextClassId);
                    setCopySourceSectionId(nextClass?.sections[0]?.id ?? "");
                  }}
                >
                  <SelectTrigger id="copy-class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((schoolClass) => (
                      <SelectItem key={schoolClass.id} value={schoolClass.id}>
                        {schoolClass.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="copy-section">Source section</FieldLabel>
              <FieldContent>
                <Select value={copySourceSectionId} onValueChange={setCopySourceSectionId}>
                  <SelectTrigger id="copy-section">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCopyClass?.sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          </div>
          <DialogFooter>
            <EntityFormSecondaryAction type="button" onClick={() => setCopyDialogOpen(false)}>
              Cancel
            </EntityFormSecondaryAction>
            <EntityFormPrimaryAction
              type="button"
              onClick={() => void handleCopy()}
              disabled={copyMutation.isPending || !copySourceClassId || !copySourceSectionId}
            >
              {copyMutation.isPending ? "Copying..." : "Copy timetable"}
            </EntityFormPrimaryAction>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EntityPageShell>
  );
}
