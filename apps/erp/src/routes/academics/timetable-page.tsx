import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { IconCopy, IconPlus, IconSend } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
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
import { Field, FieldContent, FieldLabel } from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@repo/ui/components/ui/toggle-group";
import {
  EntityFormPrimaryAction,
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
  useCreateTimetableVersionMutation,
  usePublishTimetableVersionMutation,
  useReplaceTimetableMutation,
  useSetTimetableVersionStatusMutation,
  useTimetableQuery,
  useTimetableVersionsQuery,
} from "@/features/timetable/api/use-timetable";
import { TimetableGrid } from "@/features/timetable/components/timetable-grid";
import {
  DEFAULT_SCHOOL_DAY_VALUES,
  type TimetableCellValue,
  type TimetableWeekday,
  WEEKDAY_OPTIONS,
} from "@/features/timetable/model/timetable-editor-schema";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { extractApiError } from "@/lib/api-error";
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
  name: string;
  status: "draft" | "active" | "archived" | "deleted";
};

type TimetableVersionSummary = {
  id: string;
  name: string;
  bellScheduleId: string;
  bellScheduleName: string;
  status: "draft" | "published" | "archived";
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isLive: boolean;
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

function buildDraftName(existingCount: number) {
  return `Draft ${existingCount + 1}`;
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getVersionBadgeLabel(version: TimetableVersionSummary | undefined) {
  if (!version) {
    return "Version";
  }

  if (version.isLive) {
    return "Live";
  }

  return version.status;
}

function getVersionBadgeVariant(
  version: TimetableVersionSummary | undefined,
): "default" | "outline" | "secondary" {
  if (!version) {
    return "outline";
  }

  if (version.isLive) {
    return "default";
  }

  if (version.status === "draft") {
    return "secondary";
  }

  return "outline";
}

function getVersionSelectLabel(version: TimetableVersionSummary) {
  return `${version.name} • ${version.status}${version.isLive ? " • Live" : ""}`;
}

export function TimetablePage() {
  useDocumentTitle("Timetable");
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
  const bellSchedules = useMemo(
    () => (bellSchedulesQuery.data?.rows ?? []) as BellScheduleSummary[],
    [bellSchedulesQuery.data?.rows],
  );
  const defaultBellSchedule = useMemo(
    () => bellSchedules.find((schedule) => schedule.isDefault),
    [bellSchedules],
  );

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [visibleDays, setVisibleDays] = useState<string[]>([
    ...DEFAULT_SCHOOL_DAY_VALUES,
  ]);
  const [entries, setEntries] = useState<Record<string, TimetableCellValue>>(
    {},
  );
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copySourceClassId, setCopySourceClassId] = useState("");
  const [copySourceSectionId, setCopySourceSectionId] = useState("");
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishEffectiveFrom, setPublishEffectiveFrom] =
    useState(getTodayDateString());
  const [publishEffectiveTo, setPublishEffectiveTo] = useState("");

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

  const versionsQuery = useTimetableVersionsQuery(
    canQuery && Boolean(classId && sectionId),
    { classId, sectionId },
  );
  const versions = useMemo(
    () => (versionsQuery.data ?? []) as TimetableVersionSummary[],
    [versionsQuery.data],
  );

  useEffect(() => {
    if (versions.length === 0) {
      setSelectedVersionId("");
      return;
    }

    if (versions.some((version) => version.id === selectedVersionId)) {
      return;
    }

    const preferredVersion =
      versions.find((version) => version.status === "draft") ??
      versions.find((version) => version.isLive) ??
      versions[0];

    setSelectedVersionId(preferredVersion?.id ?? "");
  }, [selectedVersionId, versions]);

  const selectedVersion = useMemo(
    () => versions.find((version) => version.id === selectedVersionId),
    [selectedVersionId, versions],
  );

  const bellScheduleDetailQuery = useBellScheduleQuery(
    canQuery && Boolean(selectedVersion?.bellScheduleId),
    selectedVersion?.bellScheduleId,
  );
  const timetableQuery = useTimetableQuery(
    canQuery && Boolean(classId && sectionId),
    {
      classId,
      sectionId,
      versionId: selectedVersionId || undefined,
    },
  );
  const replaceMutation = useReplaceTimetableMutation();
  const copyMutation = useCopySectionTimetableMutation();
  const createVersionMutation = useCreateTimetableVersionMutation();
  const publishVersionMutation = usePublishTimetableVersionMutation();
  const setVersionStatusMutation = useSetTimetableVersionStatusMutation();

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
    Boolean(selectedVersion?.bellScheduleId) &&
    bellScheduleDetailQuery.isLoading;
  const isPageLoading =
    classesQuery.isLoading ||
    subjectsQuery.isLoading ||
    bellSchedulesQuery.isLoading ||
    versionsQuery.isLoading ||
    isBellSchedulePending;
  const canEditSelectedVersion = selectedVersion?.status === "draft";

  async function handleCreateVersion() {
    if (!classId || !sectionId) {
      return;
    }

    const bellScheduleId =
      selectedVersion?.bellScheduleId ?? defaultBellSchedule?.id;

    if (!bellScheduleId) {
      toast.error(
        "Create a bell schedule first before starting a timetable draft.",
      );
      return;
    }

    try {
      const version = await createVersionMutation.mutateAsync({
        body: {
          classId,
          sectionId,
          name: buildDraftName(versions.length),
          bellScheduleId,
          duplicateFromVersionId: selectedVersionId || undefined,
        },
      });

      setSelectedVersionId(version.id);
      toast.success("Draft timetable version created.");
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not create timetable version. Please try again.",
        ),
      );
    }
  }

  async function handleSave() {
    if (
      !classId ||
      !sectionId ||
      !selectedVersionId ||
      !bellScheduleDetailQuery.data
    ) {
      return;
    }

    const periodById = new Map(
      bellScheduleDetailQuery.data.periods.map((period) => [period.id, period]),
    );
    const periodByIndex = new Map(
      bellScheduleDetailQuery.data.periods.map((period) => [
        period.periodIndex,
        period,
      ]),
    );

    try {
      await replaceMutation.mutateAsync({
        params: { path: { sectionId } },
        body: {
          classId,
          versionId: selectedVersionId,
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
      toast.error(
        extractApiError(error, "Could not save timetable. Please try again."),
      );
    }
  }

  async function handleCopy() {
    if (
      !classId ||
      !sectionId ||
      !selectedVersionId ||
      !copySourceClassId ||
      !copySourceSectionId
    ) {
      return;
    }

    try {
      await copyMutation.mutateAsync({
        params: { path: { sectionId } },
        body: {
          classId,
          versionId: selectedVersionId,
          sourceClassId: copySourceClassId,
          sourceSectionId: copySourceSectionId,
        },
      });

      toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.TIMETABLE));
      setCopyDialogOpen(false);
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not copy timetable. Please try again."),
      );
    }
  }

  async function handlePublish() {
    if (!selectedVersionId) {
      return;
    }

    try {
      await publishVersionMutation.mutateAsync({
        params: {
          path: {
            versionId: selectedVersionId,
          },
        },
        body: {
          effectiveFrom: publishEffectiveFrom,
          effectiveTo: publishEffectiveTo || undefined,
        },
      });

      toast.success("Timetable version published.");
      setPublishDialogOpen(false);
      setPublishEffectiveTo("");
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not publish timetable version. Please try again.",
        ),
      );
    }
  }

  async function handleArchive() {
    if (!selectedVersionId) {
      return;
    }

    try {
      await setVersionStatusMutation.mutateAsync({
        params: {
          path: {
            versionId: selectedVersionId,
          },
        },
        body: {
          status: "archived",
        },
      });
      toast.success("Timetable version archived.");
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not archive timetable version. Please try again.",
        ),
      );
    }
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timetable</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage timetable
            records.
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
            Timetable administration is available in Staff view. You are
            currently in {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <EntityPageShell width="full" className="gap-4">
      <EntityPageHeader
        className="max-w-4xl"
        description="Prepare timetable drafts, review a selected version, and publish changes on an explicit effective date."
        title="Timetable"
      />

      <Card className="border-border/70 shadow-sm">
        <CardContent className="grid gap-3 p-4 xl:grid-cols-[minmax(0,220px)_minmax(0,160px)_minmax(0,1fr)] xl:items-end">
          <Field className="space-y-2">
            <FieldLabel htmlFor="timetable-class">Class</FieldLabel>
            <FieldContent>
              <Select
                onValueChange={setClassId}
                value={classId}
                disabled={classesQuery.isLoading || classes.length === 0}
              >
                <SelectTrigger id="timetable-class" className="h-10 rounded-xl">
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

          <Field className="space-y-2">
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
                <SelectTrigger
                  id="timetable-section"
                  className="h-10 rounded-xl"
                >
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

          <div className="flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-muted/[0.14] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                Editing scope
              </p>
              {selectedClass && sectionId ? (
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-0.5 font-medium"
                >
                  {selectedClass.name} •{" "}
                  {selectedClass.sections.find(
                    (section) => section.id === sectionId,
                  )?.name ?? "—"}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Pick the class and section once. Versions, publishing, and the
              grid stay scoped here.
            </p>
          </div>
        </CardContent>
      </Card>

      {isPageLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading timetable</CardTitle>
            <CardDescription>
              Fetching classes, subjects, bell schedules, and timetable versions
              for this section.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : bellSchedules.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Set up a bell schedule first</CardTitle>
            <CardDescription>
              Timetable versions must point at an explicit bell schedule before
              any draft can be prepared.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={ERP_ROUTES.BELL_SCHEDULES}>Go to bell schedules</Link>
            </Button>
          </CardContent>
        </Card>
      ) : versions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Create the first timetable draft</CardTitle>
            <CardDescription>
              Start from the section&apos;s default bell schedule, then publish
              the draft when it is ready to go live.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => void handleCreateVersion()}>
              <IconPlus data-icon="inline-start" />
              New version
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader className="gap-4 border-b border-border/60 bg-muted/[0.12] px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3">
              <Field className="max-w-xl space-y-2">
                <FieldLabel htmlFor="timetable-version">Version</FieldLabel>
                <FieldContent>
                  <Select
                    value={selectedVersionId}
                    onValueChange={setSelectedVersionId}
                  >
                    <SelectTrigger
                      id="timetable-version"
                      className="h-10 rounded-xl bg-background"
                    >
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          {getVersionSelectLabel(version)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <div className="rounded-2xl border border-border/70 bg-background/95 px-4 py-3">
                <div className="flex flex-col gap-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">
                        {selectedVersion?.name ?? "No version selected"}
                      </p>
                      <Badge
                        variant={getVersionBadgeVariant(selectedVersion)}
                        className="capitalize"
                      >
                        {getVersionBadgeLabel(selectedVersion)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="rounded-full bg-muted px-2.5 py-1">
                        Bell schedule:{" "}
                        <span className="font-medium text-foreground">
                          {selectedVersion?.bellScheduleName ?? "—"}
                        </span>
                      </span>
                      {selectedVersion?.effectiveFrom ? (
                        <span className="rounded-full bg-muted px-2.5 py-1">
                          Effective from:{" "}
                          <span className="font-medium text-foreground">
                            {selectedVersion.effectiveFrom}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
                    <EntityToolbarSecondaryAction
                      type="button"
                      onClick={() => void handleCreateVersion()}
                    >
                      <IconPlus data-icon="inline-start" />
                      New version
                    </EntityToolbarSecondaryAction>
                    <EntityToolbarSecondaryAction
                      type="button"
                      onClick={() => setCopyDialogOpen(true)}
                      disabled={!canEditSelectedVersion}
                    >
                      <IconCopy data-icon="inline-start" />
                      Copy from section
                    </EntityToolbarSecondaryAction>
                    <EntityToolbarSecondaryAction
                      type="button"
                      onClick={() => setPublishDialogOpen(true)}
                      disabled={!canEditSelectedVersion}
                    >
                      <IconSend data-icon="inline-start" />
                      Publish
                    </EntityToolbarSecondaryAction>
                    <EntityToolbarSecondaryAction
                      type="button"
                      onClick={() => void handleArchive()}
                      disabled={!selectedVersion || selectedVersion.isLive}
                    >
                      Archive
                    </EntityToolbarSecondaryAction>
                    <EntityFormPrimaryAction
                      type="button"
                      onClick={() => void handleSave()}
                      className="ml-auto"
                      disabled={
                        replaceMutation.isPending ||
                        !classId ||
                        !sectionId ||
                        !selectedVersionId ||
                        !canEditSelectedVersion
                      }
                    >
                      {replaceMutation.isPending
                        ? "Saving..."
                        : "Save timetable"}
                    </EntityFormPrimaryAction>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Visible days
                </p>
                <p className="text-sm text-muted-foreground">
                  Start with Monday to Friday, then add weekend days only when
                  this version uses them.
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
                className="w-full justify-start rounded-xl bg-muted/40 p-1 lg:w-auto lg:justify-end"
              >
                {WEEKDAY_OPTIONS.map(
                  (day: { label: string; value: TimetableWeekday }) => (
                    <ToggleGroupItem
                      key={day.value}
                      value={day.value}
                      className="min-w-11 rounded-lg px-3 text-xs font-medium"
                    >
                      {day.label.slice(0, 3)}
                    </ToggleGroupItem>
                  ),
                )}
              </ToggleGroup>
            </div>

            <div className="rounded-xl border border-border/70 bg-background px-4 py-2.5 text-sm text-muted-foreground">
              {selectedVersion?.status === "draft"
                ? "Editing a draft version. Saving updates this draft only until you publish it."
                : selectedVersion?.isLive
                  ? `Viewing the live published version${selectedVersion.effectiveFrom ? ` from ${selectedVersion.effectiveFrom}` : ""}. Create a new draft to prepare changes safely.`
                  : "Viewing a non-live version. Drafts can be edited; published versions are read-only snapshots."}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            {selectedVersion && bellScheduleDetailQuery.data ? (
              <TimetableGrid
                bellSchedule={{
                  id: bellScheduleDetailQuery.data.id,
                  name: bellScheduleDetailQuery.data.name,
                  periods: bellScheduleDetailQuery.data.periods,
                }}
                classId={classId}
                conflictKeys={conflictKeys}
                days={WEEKDAY_OPTIONS.filter(
                  (day: { value: TimetableWeekday }) =>
                    visibleDays.includes(day.value),
                )}
                entries={entries}
                subjects={subjects.map((subject) => ({
                  id: subject.id,
                  name: subject.name,
                }))}
                onCellChange={(key, value) => {
                  if (!canEditSelectedVersion) {
                    return;
                  }

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
            ) : null}
          </CardContent>
        </Card>
      )}

      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy from section</DialogTitle>
            <DialogDescription>
              Replace the selected draft version with another section&apos;s
              current timetable.
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
                    const nextClass = classes.find(
                      (item) => item.id === nextClassId,
                    );
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
                <Select
                  value={copySourceSectionId}
                  onValueChange={setCopySourceSectionId}
                >
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
            <EntityToolbarSecondaryAction
              type="button"
              onClick={() => setCopyDialogOpen(false)}
            >
              Cancel
            </EntityToolbarSecondaryAction>
            <EntityFormPrimaryAction
              type="button"
              onClick={() => void handleCopy()}
            >
              Copy timetable
            </EntityFormPrimaryAction>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish timetable version</DialogTitle>
            <DialogDescription>
              Publishing creates the live assignment window for this version.
              The current live timetable stays untouched until the effective
              start date.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="publish-from" required>
                Effective from
              </FieldLabel>
              <FieldContent>
                <Input
                  id="publish-from"
                  type="date"
                  value={publishEffectiveFrom}
                  onChange={(event) =>
                    setPublishEffectiveFrom(event.target.value)
                  }
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="publish-to">Effective to</FieldLabel>
              <FieldContent>
                <Input
                  id="publish-to"
                  type="date"
                  value={publishEffectiveTo}
                  onChange={(event) =>
                    setPublishEffectiveTo(event.target.value)
                  }
                />
              </FieldContent>
            </Field>
          </div>
          <DialogFooter>
            <EntityToolbarSecondaryAction
              type="button"
              onClick={() => setPublishDialogOpen(false)}
            >
              Cancel
            </EntityToolbarSecondaryAction>
            <EntityFormPrimaryAction
              type="button"
              onClick={() => void handlePublish()}
            >
              Publish timetable
            </EntityFormPrimaryAction>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EntityPageShell>
  );
}
