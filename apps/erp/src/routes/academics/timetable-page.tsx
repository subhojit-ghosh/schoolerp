import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { IconPlus, IconTrash } from "@tabler/icons-react";
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
  EntityFormPrimaryAction,
  EntityRowAction,
  EntityToolbarSecondaryAction,
} from "@/components/entities/entity-actions";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useClassesQuery } from "@/features/classes/api/use-classes";
import { useSubjectsQuery } from "@/features/subjects/api/use-subjects";
import {
  useDeleteTimetableEntryMutation,
  useReplaceTimetableMutation,
  useTimetableQuery,
} from "@/features/timetable/api/use-timetable";
import {
  timetableEditorFormSchema,
  type TimetableEditorFormValues,
  WEEKDAY_OPTIONS,
} from "@/features/timetable/model/timetable-editor-schema";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const DEFAULT_TIMETABLE_VALUES: TimetableEditorFormValues = {
  entries: [],
};

const EMPTY_TIMETABLE_ENTRY: TimetableEditorFormValues["entries"][number] = {
  dayOfWeek: WEEKDAY_OPTIONS[0].value,
  periodIndex: 1,
  startTime: "09:00",
  endTime: "09:45",
  subjectId: "",
  room: "",
};

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

function buildEmptyTimetableEntry(defaultSubjectId = "") {
  return {
    ...EMPTY_TIMETABLE_ENTRY,
    subjectId: defaultSubjectId,
  };
}

export function TimetablePage() {
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const activeCampusId = session?.activeCampus?.id;
  const canManage = isStaffContext(session);
  const canQuery = canManage && Boolean(institutionId && activeCampusId);

  const classesQuery = useClassesQuery(canQuery, {
    campusId: activeCampusId,
    limit: 50,
    page: 1,
    sort: "name",
    order: "asc",
  });
  const subjectsQuery = useSubjectsQuery(canQuery, {
    campusId: activeCampusId,
    limit: 50,
    page: 1,
    sort: "name",
    order: "asc",
  });

  const classes = useMemo(
    () => (classesQuery.data?.rows ?? []) as ClassWithSections[],
    [classesQuery.data?.rows],
  );
  const subjects = useMemo(
    () => (subjectsQuery.data?.rows ?? []) as SubjectOption[],
    [subjectsQuery.data?.rows],
  );
  const activeSubjects = useMemo(
    () => subjects.filter((subject) => subject.status === "active"),
    [subjects],
  );
  const defaultSubjectId =
    activeSubjects.length === 1 ? activeSubjects[0]!.id : "";

  const [classId, setClassId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");

  useEffect(() => {
    if (classId) {
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
    [classes, classId],
  );

  useEffect(() => {
    if (!selectedClass) {
      return;
    }

    const hasSection = selectedClass.sections.some(
      (section) => section.id === sectionId,
    );

    if (!hasSection) {
      setSectionId(selectedClass.sections[0]?.id ?? "");
    }
  }, [sectionId, selectedClass]);

  const timetableQuery = useTimetableQuery(
    canQuery && Boolean(classId && sectionId && activeCampusId),
    {
      campusId: activeCampusId ?? "",
      classId,
      sectionId,
    },
  );

  const replaceMutation = useReplaceTimetableMutation();
  const deleteMutation = useDeleteTimetableEntryMutation();

  const { control, handleSubmit, reset, formState } = useForm<TimetableEditorFormValues>({
    resolver: zodResolver(timetableEditorFormSchema),
    defaultValues: DEFAULT_TIMETABLE_VALUES,
  });

  const entryFieldArray = useFieldArray({
    control,
    name: "entries",
    keyName: "fieldKey",
  });

  useEffect(() => {
    if (!timetableQuery.data) {
      reset(DEFAULT_TIMETABLE_VALUES);
      return;
    }

    reset({
      entries: timetableQuery.data.entries.map((entry) => ({
        dayOfWeek: entry.dayOfWeek,
        periodIndex: entry.periodIndex,
        startTime: entry.startTime,
        endTime: entry.endTime,
        subjectId: entry.subjectId,
        room: entry.room ?? "",
      })),
    });
  }, [reset, timetableQuery.data]);

  async function handleDeleteEntry(entryId: string) {
    await deleteMutation.mutateAsync({
      params: {
        path: {
          entryId,
        },
      },
    });

    toast.success(ERP_TOAST_MESSAGES.deleted(ERP_TOAST_SUBJECTS.TIMETABLE));
  }

  async function handleSave(values: TimetableEditorFormValues) {
    if (!activeCampusId || !classId || !sectionId) {
      return;
    }

    await replaceMutation.mutateAsync({
      params: {
        path: {
          sectionId,
        },
      },
      body: {
        campusId: activeCampusId,
        classId,
        entries: values.entries.map((entry) => ({
          dayOfWeek: entry.dayOfWeek,
          periodIndex: entry.periodIndex,
          startTime: entry.startTime,
          endTime: entry.endTime,
          subjectId: entry.subjectId,
          room: entry.room || undefined,
        })),
      },
    });

    toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.TIMETABLE));
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
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Timetable</h1>
        <p className="text-sm text-muted-foreground">
          Build weekly class schedules by section.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Section scope</CardTitle>
          <CardDescription>
            Choose class and section before editing timetable entries.
          </CardDescription>
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
                disabled={!selectedClass || selectedClass.sections.length === 0}
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

      <Card>
        <CardHeader>
          <CardTitle>Weekly schedule</CardTitle>
          <CardDescription>
            Add periods for the selected section and save the full schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
            <div className="flex justify-end">
              <EntityToolbarSecondaryAction
                type="button"
                onClick={() =>
                  entryFieldArray.append(buildEmptyTimetableEntry(defaultSubjectId))
                }
              >
                <IconPlus data-icon="inline-start" />
                Add period
              </EntityToolbarSecondaryAction>
            </div>

            <div className="rounded-lg border divide-y">
              {entryFieldArray.fields.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    No timetable entries yet.
                  </p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Add the first period to start building the weekly schedule
                    for this section.
                  </p>
                  <EntityToolbarSecondaryAction
                    onClick={() =>
                      entryFieldArray.append(
                        buildEmptyTimetableEntry(defaultSubjectId),
                      )
                    }
                    type="button"
                  >
                    <IconPlus data-icon="inline-start" />
                    Add first period
                  </EntityToolbarSecondaryAction>
                </div>
              ) : (
                <>
                  <div className="hidden px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:grid lg:grid-cols-[160px_110px_130px_130px_1fr_140px_auto]">
                    <span>Day</span>
                    <span>Period</span>
                    <span>Start</span>
                    <span>End</span>
                    <span>Subject</span>
                    <span>Room</span>
                    <span className="text-right">Action</span>
                  </div>
                  {entryFieldArray.fields.map((entry, index) => (
                    <div
                      key={entry.fieldKey}
                      className="grid gap-3 px-3 py-3 lg:grid-cols-[160px_110px_130px_130px_1fr_140px_auto]"
                    >
                      <Controller
                        control={control}
                        name={`entries.${index}.dayOfWeek`}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent>
                              {WEEKDAY_OPTIONS.map((day) => (
                                <SelectItem key={day.value} value={day.value}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />

                      <Controller
                        control={control}
                        name={`entries.${index}.periodIndex`}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldContent>
                              <Input
                                {...field}
                                type="number"
                                min={1}
                                value={String(field.value ?? 1)}
                                onChange={(event) =>
                                  field.onChange(event.target.valueAsNumber || 1)
                                }
                              />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />

                      <Controller
                        control={control}
                        name={`entries.${index}.startTime`}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldContent>
                              <Input {...field} type="time" />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />

                      <Controller
                        control={control}
                        name={`entries.${index}.endTime`}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldContent>
                              <Input {...field} type="time" />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />

                      <Controller
                        control={control}
                        name={`entries.${index}.subjectId`}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldContent>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                  {activeSubjects.map((subject) => (
                                    <SelectItem key={subject.id} value={subject.id}>
                                      {subject.name}
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
                        control={control}
                        name={`entries.${index}.room`}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldContent>
                              <Input {...field} placeholder="Room (optional)" value={field.value ?? ""} />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />

                      <EntityRowAction
                        type="button"
                        onClick={() => entryFieldArray.remove(index)}
                      >
                        <IconTrash data-icon="inline-start" className="size-3.5" />
                        Remove
                      </EntityRowAction>
                    </div>
                  ))}
                </>
              )}
            </div>

            {formState.errors.entries?.message ? (
              <p className="text-sm text-destructive">
                {formState.errors.entries.message}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <EntityFormPrimaryAction
                type="submit"
                disabled={replaceMutation.isPending || !classId || !sectionId}
              >
                {replaceMutation.isPending ? "Saving..." : "Save timetable"}
              </EntityFormPrimaryAction>
            </div>
          </form>
        </CardContent>
      </Card>

      {timetableQuery.data?.entries.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Existing saved periods</CardTitle>
            <CardDescription>
              Remove individual periods from the saved timetable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {timetableQuery.data.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <p className="text-sm text-muted-foreground">
                  {WEEKDAY_OPTIONS.find((day) => day.value === entry.dayOfWeek)?.label},{" "}
                  Period {entry.periodIndex} • {entry.startTime} - {entry.endTime} • {entry.subjectName}
                  {entry.room ? ` • ${entry.room}` : ""}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => void handleDeleteEntry(entry.id)}
                  disabled={deleteMutation.isPending}
                >
                  <IconTrash className="size-3.5" />
                  Delete
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
