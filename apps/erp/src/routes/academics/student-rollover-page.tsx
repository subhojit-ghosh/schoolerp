import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  IconArrowRight,
  IconCheck,
  IconChevronsUp,
  IconRefresh,
} from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@repo/ui/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { cn } from "@repo/ui/lib/utils";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  getActiveContext,
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useClassesQuery } from "@/features/classes/api/use-classes";
import { PERMISSIONS } from "@repo/contracts";
import {
  useExecuteStudentRolloverMutation,
  usePreviewStudentRolloverMutation,
} from "@/features/students/api/use-student-rollover";
import {
  getStudentRolloverPreviewSignature,
  STUDENT_ROLLOVER_STATUS_STYLES,
  studentRolloverFormSchema,
  toStudentRolloverBody,
  type StudentRolloverFormValues,
  type StudentRolloverPreview,
} from "@/features/students/model/student-rollover-form-schema";

const DEFAULT_VALUES: StudentRolloverFormValues = {
  sourceAcademicYearId: "",
  targetAcademicYearId: "",
  sectionMappings: [],
  withdrawnStudentIds: [],
};

export function StudentRolloverPage() {
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const activeContext = getActiveContext(session);
  const canManageStudents =
    isStaffContext(session) && hasPermission(session, PERMISSIONS.STUDENTS_MANAGE);

  const academicYearsQuery = useAcademicYearsQuery(institutionId, { limit: 50 });
  const classesQuery = useClassesQuery(Boolean(institutionId), { limit: 200 });
  const previewMutation = usePreviewStudentRolloverMutation();
  const executeMutation = useExecuteStudentRolloverMutation();
  const [preview, setPreview] = useState<StudentRolloverPreview | null>(null);
  const [lastPreviewSignature, setLastPreviewSignature] = useState<string | null>(
    null,
  );

  const { control, getValues, handleSubmit, resetField, setValue, watch } =
    useForm<StudentRolloverFormValues>({
      resolver: zodResolver(studentRolloverFormSchema),
      defaultValues: DEFAULT_VALUES,
    });
  const { fields, replace } = useFieldArray({
    control,
    name: "sectionMappings",
  });
  const values = watch();
  const currentSignature = useMemo(
    () => getStudentRolloverPreviewSignature(values),
    [values],
  );
  const isPreviewStale = Boolean(
    preview && lastPreviewSignature && lastPreviewSignature !== currentSignature,
  );
  const withdrawnStudentIds = new Set(values.withdrawnStudentIds);

  const academicYearOptions = useMemo(
    () =>
      (academicYearsQuery.data?.rows ?? []).map((year) => ({
        id: year.id,
        name: year.name,
        isCurrent: year.isCurrent,
        status: year.status,
      })),
    [academicYearsQuery.data?.rows],
  );

  const classOptions = useMemo(
    () =>
      (classesQuery.data?.rows ?? [])
        .filter((schoolClass) => schoolClass.status === "active")
        .map((schoolClass) => ({
          id: schoolClass.id,
          name: schoolClass.name,
          campusName: schoolClass.campusName,
          sections: schoolClass.sections,
        })),
    [classesQuery.data?.rows],
  );
  const previewError = previewMutation.error as Error | null | undefined;
  const executeError = executeMutation.error as Error | null | undefined;

  const sectionMetaBySource = useMemo(
    () =>
      new Map(
        (preview?.sections ?? []).map((section) => [
          `${section.sourceClassId}:${section.sourceSectionId}`,
          section,
        ]),
      ),
    [preview?.sections],
  );

  const summary = useMemo(() => {
    if (!preview) {
      return null;
    }

    let mappedStudentCount = 0;
    let unmappedStudentCount = 0;
    let withdrawnStudentCount = 0;

    for (const section of preview.sections) {
      for (const student of section.students) {
        if (withdrawnStudentIds.has(student.studentId)) {
          withdrawnStudentCount += 1;
          continue;
        }

        if (student.target) {
          mappedStudentCount += 1;
        } else {
          unmappedStudentCount += 1;
        }
      }
    }

    return {
      eligibleStudentCount: preview.summary.eligibleStudentCount,
      mappedStudentCount,
      unmappedStudentCount,
      withdrawnStudentCount,
      sourceSectionCount: preview.summary.sourceSectionCount,
      mappedSectionCount: preview.summary.mappedSectionCount,
    };
  }, [preview, withdrawnStudentIds]);

  async function loadRoster() {
    const currentValues = getValues();
    const rosterPreview = await previewMutation.mutateAsync({
      body: {
        sourceAcademicYearId: currentValues.sourceAcademicYearId,
        targetAcademicYearId: currentValues.targetAcademicYearId,
        sectionMappings: [],
        withdrawnStudentIds: [],
      },
    });

    replace(
      rosterPreview.sections.map((section) => ({
        sourceClassId: section.sourceClassId,
        sourceSectionId: section.sourceSectionId,
        targetClassId: "",
        targetSectionId: "",
      })),
    );
    setValue("withdrawnStudentIds", []);
    setPreview(rosterPreview);
    setLastPreviewSignature(
      getStudentRolloverPreviewSignature({
        ...currentValues,
        sectionMappings: rosterPreview.sections.map((section) => ({
          sourceClassId: section.sourceClassId,
          sourceSectionId: section.sourceSectionId,
          targetClassId: "",
          targetSectionId: "",
        })),
        withdrawnStudentIds: [],
      }),
    );
  }

  const handlePreview = handleSubmit(async (formValues) => {
    const nextPreview = await previewMutation.mutateAsync({
      body: toStudentRolloverBody(formValues),
    });

    setPreview(nextPreview);
    setLastPreviewSignature(getStudentRolloverPreviewSignature(formValues));
  });

  const handleExecute = handleSubmit(async (formValues) => {
    const result = await executeMutation.mutateAsync({
      body: toStudentRolloverBody(formValues),
    });

    toast.success(
      `${result.summary.mappedStudentCount} students rolled into ${result.targetAcademicYear.name}.`,
    );
    setPreview(result);
    setLastPreviewSignature(getStudentRolloverPreviewSignature(formValues));
  });

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student rollover</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sign in with an institution-backed session to run academic-year rollover.
        </CardContent>
      </Card>
    );
  }

  if (!canManageStudents) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student rollover</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Student rollover is available in Staff view with student-management access.
          You are currently in {activeContext?.label ?? "another"} view.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Student rollover</h1>
        <p className="text-sm text-muted-foreground">
          Move active students from one academic year into the next, remap their
          class and section, and mark non-continuing students as withdrawn.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rollover setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              control={control}
              name="sourceAcademicYearId"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Source academic year</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setPreview(null);
                      setLastPreviewSignature(null);
                      replace([]);
                      resetField("withdrawnStudentIds", { defaultValue: [] });
                    }}
                  >
                    <SelectTrigger className="h-10 w-full rounded-lg">
                      <SelectValue placeholder="Select source year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearOptions.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name}
                          {year.isCurrent ? " (Current)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={control}
              name="targetAcademicYearId"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Target academic year</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setPreview(null);
                      setLastPreviewSignature(null);
                      replace([]);
                      resetField("withdrawnStudentIds", { defaultValue: [] });
                    }}
                  >
                    <SelectTrigger className="h-10 w-full rounded-lg">
                      <SelectValue placeholder="Select target year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearOptions
                        .filter((year) => year.status === "active")
                        .map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
                            {year.isCurrent ? " (Current)" : ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="h-10 rounded-lg"
              disabled={
                !values.sourceAcademicYearId ||
                !values.targetAcademicYearId ||
                previewMutation.isPending
              }
              onClick={() => void loadRoster()}
              type="button"
            >
              <IconChevronsUp className="size-4" />
              Load source roster
            </Button>
            <Button
              className="h-10 rounded-lg"
              disabled={fields.length === 0 || previewMutation.isPending}
              onClick={() => void handlePreview()}
              type="button"
              variant="outline"
            >
              <IconRefresh className="size-4" />
              Refresh preview
            </Button>
            <Button
              className="h-10 rounded-lg"
              disabled={
                !preview ||
                isPreviewStale ||
                executeMutation.isPending ||
                Boolean(summary?.unmappedStudentCount)
              }
              onClick={() => void handleExecute()}
              type="button"
            >
              <IconCheck className="size-4" />
              Run rollover
            </Button>
          </div>

          {previewError ? (
            <p className="text-sm text-destructive">
              {previewError.message}
            </p>
          ) : null}
          {executeError ? (
            <p className="text-sm text-destructive">
              {executeError.message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {fields.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Section mappings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => {
              const sourceMeta = sectionMetaBySource.get(
                `${field.sourceClassId}:${field.sourceSectionId}`,
              );
              const selectedTargetClassId = values.sectionMappings[index]?.targetClassId;
              const targetSections =
                classOptions.find((option) => option.id === selectedTargetClassId)
                  ?.sections ?? [];

              return (
                <div
                  key={field.id}
                  className="grid gap-4 rounded-xl border border-border/70 p-4 lg:grid-cols-[1.4fr_1fr_1fr]"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {sourceMeta?.sourceClassName} / {sourceMeta?.sourceSectionName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sourceMeta?.sourceCampusName} · {sourceMeta?.studentCount ?? 0} students
                    </p>
                  </div>

                  <Controller
                    control={control}
                    name={`sectionMappings.${index}.targetClassId`}
                    render={({ field: targetClassField }) => (
                      <Field>
                        <FieldLabel>Target class</FieldLabel>
                        <Select
                          value={targetClassField.value}
                          onValueChange={(value) => {
                            targetClassField.onChange(value);
                            setValue(
                              `sectionMappings.${index}.targetSectionId`,
                              "",
                            );
                          }}
                        >
                          <SelectTrigger className="h-10 w-full rounded-lg">
                            <SelectValue placeholder="Leave unmapped" />
                          </SelectTrigger>
                          <SelectContent>
                            {classOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.name} · {option.campusName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  <Controller
                    control={control}
                    name={`sectionMappings.${index}.targetSectionId`}
                    render={({ field: targetSectionField }) => (
                      <Field>
                        <FieldLabel>Target section</FieldLabel>
                        <Select
                          disabled={!selectedTargetClassId}
                          value={targetSectionField.value}
                          onValueChange={targetSectionField.onChange}
                        >
                          <SelectTrigger className="h-10 w-full rounded-lg">
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                          <SelectContent>
                            {targetSections.map((section) => (
                              <SelectItem key={section.id} value={section.id}>
                                {section.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {summary ? (
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Eligible students" value={summary.eligibleStudentCount} />
          <SummaryCard label="Mapped" value={summary.mappedStudentCount} />
          <SummaryCard label="Unmapped" value={summary.unmappedStudentCount} />
          <SummaryCard label="Withdrawn" value={summary.withdrawnStudentCount} />
        </div>
      ) : null}

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPreviewStale ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                The mapping or withdrawal selection changed after the last preview.
                Refresh preview before running rollover.
              </div>
            ) : null}

            {preview.sections.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
                No active students are currently enrolled in the selected source year.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Current placement</TableHead>
                    <TableHead>Target placement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px] text-right">Withdraw</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.sections.flatMap((section) =>
                    section.students.map((student) => {
                      const isWithdrawn = withdrawnStudentIds.has(student.studentId);
                      const status = isWithdrawn
                        ? "withdrawn"
                        : student.target
                          ? "mapped"
                          : "unmapped";

                      return (
                        <TableRow key={student.studentId}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{student.fullName}</p>
                              <p className="text-sm text-muted-foreground">
                                {student.admissionNumber}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <p>
                                {student.source.className} / {student.source.sectionName}
                              </p>
                              <p className="text-muted-foreground">
                                {student.source.campusName}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isWithdrawn ? (
                              <span className="text-sm text-muted-foreground">
                                Not continuing
                              </span>
                            ) : student.target ? (
                              <div className="space-y-1 text-sm">
                                <p>
                                  {student.target.className} / {student.target.sectionName}
                                </p>
                                <p className="text-muted-foreground">
                                  {student.target.campusName}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-amber-700">
                                No target mapping
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "border capitalize",
                                STUDENT_ROLLOVER_STATUS_STYLES[
                                  status as keyof typeof STUDENT_ROLLOVER_STATUS_STYLES
                                ],
                              )}
                              variant="outline"
                            >
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Checkbox
                              checked={isWithdrawn}
                              onCheckedChange={(checked) => {
                                const nextValues = checked
                                  ? [...values.withdrawnStudentIds, student.studentId]
                                  : values.withdrawnStudentIds.filter(
                                      (id) => id !== student.studentId,
                                    );
                                setValue("withdrawnStudentIds", nextValues, {
                                  shouldDirty: true,
                                });
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    }),
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-5">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <IconArrowRight className="size-4 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
