import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUSES } from "@repo/contracts";
import { IconCheck, IconRefresh } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { cn } from "@repo/ui/lib/utils";

import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useAttendanceClassSectionsQuery,
  useAttendanceDayQuery,
  useAttendanceOverviewQuery,
  useUpsertAttendanceDayMutation,
} from "@/features/attendance/api/use-attendance";
import {
  attendanceEntryFormSchema,
  attendanceSelectionSchema,
  DEFAULT_ATTENDANCE_SELECTION_VALUES,
  UNSET_ATTENDANCE_STATUS,
  type AttendanceEntryFormValues,
  type AttendanceSelectionValues,
} from "@/features/attendance/model/attendance-form-schema";
import { ATTENDANCE_PAGE_COPY } from "@/features/attendance/model/attendance-page.constants";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const STATUS_CONFIG = {
  [ATTENDANCE_STATUSES.PRESENT]: {
    active: "bg-green-600 text-white border-green-600 hover:bg-green-600",
    idle: "border-border text-muted-foreground hover:border-green-500 hover:text-green-600",
  },
  [ATTENDANCE_STATUSES.ABSENT]: {
    active: "bg-red-600 text-white border-red-600 hover:bg-red-600",
    idle: "border-border text-muted-foreground hover:border-red-500 hover:text-red-600",
  },
  [ATTENDANCE_STATUSES.LATE]: {
    active: "bg-amber-500 text-white border-amber-500 hover:bg-amber-500",
    idle: "border-border text-muted-foreground hover:border-amber-400 hover:text-amber-600",
  },
  [ATTENDANCE_STATUSES.EXCUSED]: {
    active: "bg-blue-600 text-white border-blue-600 hover:bg-blue-600",
    idle: "border-border text-muted-foreground hover:border-blue-500 hover:text-blue-600",
  },
} as const;

const STATUS_OPTIONS = [
  ATTENDANCE_STATUSES.PRESENT,
  ATTENDANCE_STATUSES.ABSENT,
  ATTENDANCE_STATUSES.LATE,
  ATTENDANCE_STATUSES.EXCUSED,
] as const;

type StatusPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

function StatusPicker({ value, onChange }: StatusPickerProps) {
  return (
    <div className="flex items-center gap-1">
      {STATUS_OPTIONS.map((status) => {
        const config = STATUS_CONFIG[status];
        const isActive = value === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={cn(
              "h-8 rounded-md border px-3 text-xs font-medium transition-colors",
              isActive ? config.active : config.idle,
            )}
          >
            {ATTENDANCE_STATUS_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
}

const TODAY = new Date().toISOString().slice(0, 10);

const ATTENDANCE_TAB_VALUES = {
  MARK: "mark",
  OVERVIEW: "overview",
} as const;

export function AttendancePage() {
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageAttendance = isStaffContext(session);
  const managedInstitutionId = canManageAttendance ? institutionId : undefined;
  const campuses = session?.campuses ?? [];
  const [activeFilters, setActiveFilters] =
    useState<AttendanceSelectionValues | null>(null);
  const [overviewDate, setOverviewDate] = useState(TODAY);
  const [overviewDraft, setOverviewDraft] = useState(TODAY);
  const [activeTab, setActiveTab] = useState<string>(
    ATTENDANCE_TAB_VALUES.MARK,
  );

  const selectionForm = useForm<AttendanceSelectionValues>({
    resolver: zodResolver(attendanceSelectionSchema),
    defaultValues: {
      ...DEFAULT_ATTENDANCE_SELECTION_VALUES,
      campusId: session?.activeCampus?.id ?? "",
    },
  });
  const entryForm = useForm<AttendanceEntryFormValues>({
    resolver: zodResolver(attendanceEntryFormSchema),
    defaultValues: {
      ...DEFAULT_ATTENDANCE_SELECTION_VALUES,
      entries: [],
    },
  });

  const selectedCampusId = useWatch({
    control: selectionForm.control,
    name: "campusId",
  });
  const selectedClassId = useWatch({
    control: selectionForm.control,
    name: "classId",
  });
  const selectedSectionId = useWatch({
    control: selectionForm.control,
    name: "sectionId",
  });

  const classSectionsQuery = useAttendanceClassSectionsQuery(
    managedInstitutionId,
    selectedCampusId || undefined,
  );
  const attendanceDayQuery = useAttendanceDayQuery(
    managedInstitutionId,
    activeFilters,
  );
  const overviewQuery = useAttendanceOverviewQuery(managedInstitutionId, {
    date: overviewDate,
  });
  const saveAttendanceMutation = useUpsertAttendanceDayMutation(
    managedInstitutionId,
    activeFilters,
    overviewDate,
  );
  const saveAttendanceError = saveAttendanceMutation.error as
    | Error
    | null
    | undefined;

  useEffect(() => {
    if (!session?.activeCampus?.id) return;
    selectionForm.setValue("campusId", session.activeCampus.id);
  }, [selectionForm, session?.activeCampus?.id]);

  useEffect(() => {
    const day = attendanceDayQuery.data;
    if (!day) return;

    entryForm.reset({
      attendanceDate: day.attendanceDate,
      campusId: day.campusId,
      classId: day.classId,
      sectionId: day.sectionId,
      entries: day.entries.map((entry) => ({
        studentId: entry.studentId,
        status: entry.status ?? UNSET_ATTENDANCE_STATUS,
      })),
    });
  }, [attendanceDayQuery.data, entryForm]);

  async function handleLoadRoster(values: AttendanceSelectionValues) {
    setActiveFilters(values);
  }

  async function handleSaveAttendance(values: AttendanceEntryFormValues) {
    if (!institutionId) return;

    const unmarked = values.entries.filter(
      (e) => e.status === UNSET_ATTENDANCE_STATUS,
    );
    if (unmarked.length > 0) {
      toast.error(
        `${unmarked.length} student${unmarked.length === 1 ? "" : "s"} not marked yet.`,
      );
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await saveAttendanceMutation.mutateAsync({ body: values as any });
    toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.ATTENDANCE));
  }

  function handleLoadFromOverview(item: {
    attendanceDate?: string;
    campusId: string;
    classId: string;
    sectionId: string;
  }) {
    const record = {
      attendanceDate: item.attendanceDate ?? overviewDate,
      campusId: item.campusId,
      classId: item.classId,
      sectionId: item.sectionId,
    };
    selectionForm.reset(record);
    setActiveFilters(record);
    setActiveTab(ATTENDANCE_TAB_VALUES.MARK);
  }

  const classSections = classSectionsQuery.data ?? [];
  const currentDay = attendanceDayQuery.data;
  const overviewItems = overviewQuery.data ?? [];

  const uniqueClasses = Array.from(
    new Map(
      classSections.map((item) => [item.classId, item.className]),
    ).entries(),
  );
  const sectionsForSelectedClass = classSections.filter(
    (item) => item.classId === selectedClassId,
  );

  useEffect(() => {
    if (!selectedClassId) {
      return;
    }

    const onlySection = sectionsForSelectedClass[0];
    const hasCurrentSection = sectionsForSelectedClass.some(
      (item) => item.sectionId === selectedSectionId,
    );

    if (sectionsForSelectedClass.length === 1 && onlySection) {
      if (selectedSectionId !== onlySection.sectionId) {
        selectionForm.setValue("sectionId", onlySection.sectionId);
      }
      return;
    }

    if (!hasCurrentSection && selectedSectionId) {
      selectionForm.setValue("sectionId", "");
    }
  }, [
    selectedClassId,
    selectedSectionId,
    sectionsForSelectedClass,
    selectionForm,
  ]);

  const markedCount = overviewItems.filter((i) => i.marked).length;
  const totalCount = overviewItems.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {ATTENDANCE_PAGE_COPY.TITLE}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ATTENDANCE_PAGE_COPY.DESCRIPTION}
        </p>
      </div>

      {!institutionId || !canManageAttendance ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
          {!institutionId
            ? "Sign in with an institution-backed session to manage attendance."
            : `Attendance entry is available in Staff view. You are currently in ${activeContext?.label ?? "another"} view.`}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value={ATTENDANCE_TAB_VALUES.MARK}>Mark</TabsTrigger>
            <TabsTrigger value={ATTENDANCE_TAB_VALUES.OVERVIEW}>
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Mark tab */}
          <TabsContent value={ATTENDANCE_TAB_VALUES.MARK} className="mt-4">
            <div className="flex flex-col gap-4">
              {/* Filters toolbar */}
              <div className="rounded-xl border border-border/70 bg-card px-4 py-4">
                <form onSubmit={selectionForm.handleSubmit(handleLoadRoster)}>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Controller
                      control={selectionForm.control}
                      name="attendanceDate"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel>Date</FieldLabel>
                          <FieldContent>
                            <Input
                              {...field}
                              aria-invalid={fieldState.invalid}
                              max={TODAY}
                              type="date"
                            />
                            <FieldError>{fieldState.error?.message}</FieldError>
                          </FieldContent>
                        </Field>
                      )}
                    />
                    <Controller
                      control={selectionForm.control}
                      name="campusId"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel>Campus</FieldLabel>
                          <FieldContent>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                selectionForm.setValue("classId", "");
                                selectionForm.setValue("sectionId", "");
                              }}
                              value={field.value ?? ""}
                            >
                              <SelectTrigger
                                aria-invalid={fieldState.invalid}
                              >
                                <SelectValue placeholder="Select campus" />
                              </SelectTrigger>
                              <SelectContent>
                                {campuses.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FieldError>{fieldState.error?.message}</FieldError>
                          </FieldContent>
                        </Field>
                      )}
                    />
                    <Controller
                      control={selectionForm.control}
                      name="classId"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel>Class</FieldLabel>
                          <FieldContent>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                selectionForm.setValue("sectionId", "");
                              }}
                              value={field.value ?? ""}
                            >
                              <SelectTrigger
                                aria-invalid={fieldState.invalid}
                              >
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                              <SelectContent>
                                {uniqueClasses.map(([classId, className]) => (
                                  <SelectItem key={classId} value={classId}>
                                    {className}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FieldError>{fieldState.error?.message}</FieldError>
                          </FieldContent>
                        </Field>
                      )}
                    />
                    <Controller
                      control={selectionForm.control}
                      name="sectionId"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel>Section</FieldLabel>
                          <FieldContent>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ""}
                            >
                              <SelectTrigger
                                aria-invalid={fieldState.invalid}
                              >
                                <SelectValue placeholder="Select section" />
                              </SelectTrigger>
                              <SelectContent>
                                {sectionsForSelectedClass.map((item) => (
                                  <SelectItem
                                    key={item.sectionId}
                                    value={item.sectionId}
                                  >
                                    {item.sectionName} ({item.studentCount})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FieldError>{fieldState.error?.message}</FieldError>
                          </FieldContent>
                        </Field>
                      )}
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" type="submit">
                      Load students
                    </Button>
                  </div>
                </form>
              </div>

              {/* Mark attendance list */}
              <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
                {attendanceDayQuery.isLoading ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    Loading students…
                  </div>
                ) : currentDay ? (
                  <form
                    onSubmit={entryForm.handleSubmit(handleSaveAttendance)}
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {currentDay.className} — {currentDay.sectionName}
                        </span>
                        <Badge variant="secondary">
                          {currentDay.campusName}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {currentDay.totalStudents} students
                        </span>
                      </div>
                      <Button
                        disabled={saveAttendanceMutation.isPending}
                        size="sm"
                        type="submit"
                      >
                        <IconCheck className="mr-1.5 size-3.5" />
                        {saveAttendanceMutation.isPending
                          ? "Saving…"
                          : "Save attendance"}
                      </Button>
                    </div>

                    {/* Student rows */}
                    <div className="divide-y divide-border/60">
                      {currentDay.entries.map((entry, index) => (
                        <div
                          key={entry.studentId}
                          className="flex items-center justify-between gap-4 px-5 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {entry.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.admissionNumber}
                            </p>
                          </div>
                          <Controller
                            control={entryForm.control}
                            name={`entries.${index}.status`}
                            render={({ field }) => (
                              <StatusPicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                      ))}
                    </div>

                    {saveAttendanceError ? (
                      <div className="border-t px-5 py-3">
                        <p className="text-sm text-destructive">
                          {saveAttendanceError.message}
                        </p>
                      </div>
                    ) : null}
                  </form>
                ) : (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    {ATTENDANCE_PAGE_COPY.EMPTY_ROSTER}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Overview tab */}
          <TabsContent value={ATTENDANCE_TAB_VALUES.OVERVIEW} className="mt-4">
            <div className="flex flex-col gap-4">
              {/* Date filter */}
              <div className="rounded-xl border border-border/70 bg-card px-4 py-4">
                <div className="flex items-end gap-3">
                  <Field className="max-w-xs">
                    <FieldLabel>Date</FieldLabel>
                    <FieldContent>
                      <Input
                        type="date"
                        max={TODAY}
                        value={overviewDraft}
                        onChange={(e) => setOverviewDraft(e.target.value)}
                      />
                    </FieldContent>
                  </Field>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOverviewDate(overviewDraft)}
                  >
                    <IconRefresh className="mr-1.5 size-3.5" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Overview list */}
              <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
                {overviewItems.length > 0 && (
                  <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
                    <span className="text-sm font-medium text-foreground">
                      All class sections
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {markedCount} of {totalCount} marked
                    </span>
                  </div>
                )}
                {overviewQuery.isLoading ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    Loading…
                  </div>
                ) : overviewItems.length > 0 ? (
                  <div className="divide-y divide-border/60">
                    {overviewItems.map((item) => (
                      <button
                        key={`${item.campusId}-${item.classId}-${item.sectionId}`}
                        type="button"
                        className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors hover:bg-muted/30"
                        onClick={() => handleLoadFromOverview(item)}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {item.className} — {item.sectionName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.campusName} · {item.studentCount} students
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.marked && item.counts ? (
                            <div className="flex gap-3 text-xs">
                              <span className="text-green-700 dark:text-green-400">
                                P {item.counts.present}
                              </span>
                              <span className="text-red-600 dark:text-red-400">
                                A {item.counts.absent}
                              </span>
                              <span className="text-amber-600 dark:text-amber-400">
                                L {item.counts.late}
                              </span>
                              <span className="text-blue-600 dark:text-blue-400">
                                E {item.counts.excused}
                              </span>
                            </div>
                          ) : null}
                          <Badge
                            variant={item.marked ? "secondary" : "outline"}
                            className={
                              item.marked
                                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                                : "text-muted-foreground"
                            }
                          >
                            {item.marked ? "Marked" : "Pending"}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    {ATTENDANCE_PAGE_COPY.EMPTY_OVERVIEW}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
