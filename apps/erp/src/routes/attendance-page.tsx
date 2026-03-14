import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUSES } from "@repo/contracts";
import {
  IconCalendarStats,
  IconCheck,
  IconListDetails,
} from "@tabler/icons-react";
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
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
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
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useAttendanceClassSectionsQuery,
  useAttendanceDayQuery,
  useAttendanceDayViewQuery,
  useUpsertAttendanceDayMutation,
} from "@/features/attendance/api/use-attendance";
import {
  attendanceDayViewSchema,
  attendanceEntryFormSchema,
  attendanceSelectionSchema,
  DEFAULT_ATTENDANCE_DAY_VIEW_VALUES,
  DEFAULT_ATTENDANCE_SELECTION_VALUES,
  DEFAULT_ATTENDANCE_STATUS,
  type AttendanceDayViewValues,
  type AttendanceEntryFormValues,
  type AttendanceSelectionValues,
} from "@/features/attendance/model/attendance-form-schema";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const ATTENDANCE_STATUS_OPTIONS = [
  ATTENDANCE_STATUSES.PRESENT,
  ATTENDANCE_STATUSES.ABSENT,
  ATTENDANCE_STATUSES.LATE,
  ATTENDANCE_STATUSES.EXCUSED,
] as const;

export function AttendancePage() {
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageAttendance = isStaffContext(session);
  const managedInstitutionId = canManageAttendance ? institutionId : undefined;
  const campuses = session?.campuses ?? [];
  const [activeFilters, setActiveFilters] =
    useState<AttendanceSelectionValues | null>(null);
  const [dayViewFilters, setDayViewFilters] = useState<AttendanceDayViewValues>(
    DEFAULT_ATTENDANCE_DAY_VIEW_VALUES,
  );

  const selectionForm = useForm<AttendanceSelectionValues>({
    resolver: zodResolver(attendanceSelectionSchema),
    defaultValues: {
      ...DEFAULT_ATTENDANCE_SELECTION_VALUES,
      campusId: session?.activeCampus?.id ?? "",
    },
  });
  const dayViewForm = useForm<AttendanceDayViewValues>({
    resolver: zodResolver(attendanceDayViewSchema),
    defaultValues: DEFAULT_ATTENDANCE_DAY_VIEW_VALUES,
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
  const classSectionsQuery = useAttendanceClassSectionsQuery(
    managedInstitutionId,
    selectedCampusId || undefined,
  );
  const attendanceDayQuery = useAttendanceDayQuery(
    managedInstitutionId,
    activeFilters,
  );
  const attendanceDayViewQuery = useAttendanceDayViewQuery(
    managedInstitutionId,
    dayViewFilters,
  );
  const saveAttendanceMutation = useUpsertAttendanceDayMutation(
    managedInstitutionId,
    activeFilters,
    dayViewFilters,
  );
  const saveAttendanceError = saveAttendanceMutation.error as
    | Error
    | null
    | undefined;

  useEffect(() => {
    if (!session?.activeCampus?.id) {
      return;
    }

    selectionForm.setValue("campusId", session.activeCampus.id);
  }, [selectionForm, session?.activeCampus?.id]);

  useEffect(() => {
    const day = attendanceDayQuery.data;

    if (!day) {
      return;
    }

    entryForm.reset({
      attendanceDate: day.attendanceDate,
      campusId: day.campusId,
      classId: day.classId,
      sectionId: day.sectionId,
      entries: day.entries.map((entry) => ({
        studentId: entry.studentId,
        status: entry.status ?? DEFAULT_ATTENDANCE_STATUS,
      })),
    });
  }, [attendanceDayQuery.data, entryForm]);

  async function handleLoadRoster(values: AttendanceSelectionValues) {
    setActiveFilters(values);
  }

  async function handleSaveAttendance(values: AttendanceEntryFormValues) {
    if (!institutionId) {
      return;
    }

    await saveAttendanceMutation.mutateAsync({
      body: values,
    });

    toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.ATTENDANCE));
  }

  function handleLoadFromDayView(record: {
    attendanceDate: string;
    campusId: string;
    classId: string;
    sectionId: string;
  }) {
    selectionForm.reset(record);
    setActiveFilters(record);
  }

  async function handleLoadDayView(values: AttendanceDayViewValues) {
    setDayViewFilters(values);
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage daily
            attendance.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageAttendance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>
            Attendance entry is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const classSections = classSectionsQuery.data ?? [];
  const dayViewRows = attendanceDayViewQuery.data ?? [];
  const currentDay = attendanceDayQuery.data;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
      <div className="flex flex-col gap-6">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <IconCalendarStats className="mr-1.5 size-3.5" />
                Daily attendance
              </Badge>
            </div>
            <CardTitle>Entry by class and section</CardTitle>
            <CardDescription>
              Select the campus, class, section, and date, then submit the full
              roster for that day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={selectionForm.handleSubmit(handleLoadRoster)}>
              <FieldGroup className="gap-4 md:grid md:grid-cols-2">
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
                          value={field.value || undefined}
                        >
                          <SelectTrigger aria-invalid={fieldState.invalid}>
                            <SelectValue placeholder="Select campus" />
                          </SelectTrigger>
                          <SelectContent>
                            {campuses.map((campus) => (
                              <SelectItem key={campus.id} value={campus.id}>
                                {campus.name}
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
                          value={field.value || undefined}
                        >
                          <SelectTrigger aria-invalid={fieldState.invalid}>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from(
                              new Set(
                                classSections.map((item) => item.classId),
                              ),
                            ).map((classId) => (
                              <SelectItem key={classId} value={classId}>
                                {classId}
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
                          value={field.value || undefined}
                        >
                          <SelectTrigger aria-invalid={fieldState.invalid}>
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                          <SelectContent>
                            {classSections
                              .filter(
                                (item) => item.classId === selectedClassId,
                              )
                              .map((item) => (
                                <SelectItem
                                  key={`${item.classId}-${item.sectionId}`}
                                  value={item.sectionId}
                                >
                                  {item.sectionId} ({item.studentCount})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />
                <div className="md:col-span-2">
                  <Button type="submit">Load roster</Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Roster</CardTitle>
            <CardDescription>
              Mark every student for the selected day. The backend validates the
              submitted roster against the institution scope.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceDayQuery.isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Loading attendance roster...
              </div>
            ) : currentDay ? (
              <form onSubmit={entryForm.handleSubmit(handleSaveAttendance)}>
                <FieldGroup className="gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{currentDay.classId}</Badge>
                    <Badge variant="outline">{currentDay.sectionId}</Badge>
                    <Badge variant="secondary">{currentDay.campusName}</Badge>
                    <Badge variant="outline">
                      {currentDay.totalStudents} students
                    </Badge>
                  </div>

                  <div className="grid gap-3">
                    {currentDay.entries.map((entry, index) => (
                      <div
                        key={entry.studentId}
                        className="grid gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-[minmax(0,1fr)_180px]"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {entry.fullName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Admission {entry.admissionNumber}
                          </p>
                        </div>
                        <Controller
                          control={entryForm.control}
                          name={`entries.${index}.status`}
                          render={({ field, fieldState }) => (
                            <Field
                              data-invalid={fieldState.invalid || undefined}
                            >
                              <FieldContent>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger
                                    aria-invalid={fieldState.invalid}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ATTENDANCE_STATUS_OPTIONS.map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {ATTENDANCE_STATUS_LABELS[status]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FieldError>
                                  {fieldState.error?.message}
                                </FieldError>
                              </FieldContent>
                            </Field>
                          )}
                        />
                      </div>
                    ))}
                  </div>

                  {saveAttendanceError ? (
                    <FieldError>{saveAttendanceError.message}</FieldError>
                  ) : null}

                  <Button
                    disabled={saveAttendanceMutation.isPending}
                    type="submit"
                  >
                    <IconCheck className="mr-1.5 size-4" />
                    {saveAttendanceMutation.isPending
                      ? "Saving..."
                      : "Save attendance"}
                  </Button>
                </FieldGroup>
              </form>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
                Load a roster to start attendance entry.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <IconListDetails className="mr-1.5 size-3.5" />
              Day view
            </Badge>
          </div>
          <CardTitle>Saved attendance snapshots</CardTitle>
          <CardDescription>
            Review the class-wise records already submitted for a selected day.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={dayViewForm.handleSubmit(handleLoadDayView)}>
            <FieldGroup className="gap-3">
              <Controller
                control={dayViewForm.control}
                name="attendanceDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Date</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        type="date"
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />
              <Button type="submit" variant="outline">
                Refresh day view
              </Button>
            </FieldGroup>
          </form>

          {attendanceDayViewQuery.isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading day view...
            </div>
          ) : dayViewRows.length ? (
            <div className="grid gap-3">
              {dayViewRows.map((row) => (
                <button
                  key={`${row.campusId}-${row.classId}-${row.sectionId}`}
                  className="rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/30"
                  onClick={() => handleLoadFromDayView(row)}
                  type="button"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{row.classId}</Badge>
                    <Badge variant="outline">{row.sectionId}</Badge>
                    <Badge variant="secondary">{row.campusName}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {row.totalStudents} marked • Present {row.counts.present} •
                    Absent {row.counts.absent} • Late {row.counts.late} •
                    Excused {row.counts.excused}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-muted/20 px-5 py-10 text-center text-sm text-muted-foreground">
              No attendance records saved for this date yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
