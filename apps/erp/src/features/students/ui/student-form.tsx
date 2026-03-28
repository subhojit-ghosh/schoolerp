import { GUARDIAN_RELATIONSHIPS } from "@repo/contracts";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconAlertTriangle, IconTrash, IconUserPlus } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  EMPTY_CURRENT_ENROLLMENT,
  GUARDIAN_RELATIONSHIP_OPTIONS,
  studentFormSchema,
  type StudentFormValues,
} from "@/features/students/model/student-form-schema";
import { useClassesQuery } from "@/features/classes/api/use-classes";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import type { AdmissionFormFieldRecord } from "@/features/admissions/model/admission-custom-fields";
import { HONORIFICS, formatAcademicYear } from "@/lib/format";
import { AdmissionCustomFieldsSection } from "@/features/admissions/ui/admission-custom-fields-section";
import { DraftRecoveryBanner } from "@/components/feedback/draft-recovery-banner";
import { useFormAutoSave } from "@/hooks/use-form-auto-save";
import { useStudentDuplicateCheck } from "@/features/students/hooks/use-student-duplicate-check";

const DEFAULT_GUARDIAN: StudentFormValues["guardians"][number] = {
  honorific: "",
  name: "",
  mobile: "",
  email: "",
  relationship: GUARDIAN_RELATIONSHIPS.GUARDIAN,
  isPrimary: true,
};

type AcademicYearOption = {
  id: string;
  name: string;
  isCurrent: boolean;
};

type ClassOption = {
  id: string;
  name: string;
  status: "active" | "inactive" | "deleted";
  sections: Array<{
    id: string;
    name: string;
  }>;
};

type StudentFormProps = {
  autoSaveKey?: string;
  campusName?: string;
  campusId?: string;
  academicYears: AcademicYearOption[];
  customFields: AdmissionFormFieldRecord[];
  defaultValues: StudentFormValues;
  errorMessage?: string;
  institutionId?: string;
  isPending?: boolean;
  mode?: "create" | "edit";
  onCancel?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onAutoSaveReady?: (clearDraft: () => void) => void;
  onSubmit: (values: StudentFormValues) => Promise<void> | void;
  submitLabel: string;
};

export function StudentForm({
  autoSaveKey,
  campusName,
  campusId,
  academicYears,
  customFields,
  defaultValues,
  errorMessage,
  institutionId,
  isPending = false,
  mode = "create",
  onCancel,
  onDirtyChange,
  onAutoSaveReady,
  onSubmit,
  submitLabel,
}: StudentFormProps) {
  const { control, handleSubmit, reset, setValue, watch, formState } =
    useForm<StudentFormValues>({
      resolver: zodResolver(studentFormSchema),
      mode: "onTouched",
      defaultValues,
    });

  const autoSave = useFormAutoSave({
    key: autoSaveKey ?? "student-form",
    watch,
    reset,
    isDirty: formState.isDirty,
  });

  const onAutoSaveReadyRef = useRef(onAutoSaveReady);
  onAutoSaveReadyRef.current = onAutoSaveReady;
  useEffect(() => {
    onAutoSaveReadyRef.current?.(autoSave.clearDraft);
  }, [autoSave.clearDraft]);

  const stableOnDirtyChange = useCallback(
    (dirty: boolean) => onDirtyChange?.(dirty),
    [onDirtyChange],
  );

  useEffect(() => {
    stableOnDirtyChange(formState.isDirty);
  }, [formState.isDirty, stableOnDirtyChange]);

  const selectedClassId = useWatch({
    control,
    name: "classId",
  });
  const selectedSectionId = useWatch({
    control,
    name: "sectionId",
  });
  const selectedEnrollmentClassId = useWatch({
    control,
    name: "currentEnrollment.classId",
  });
  const selectedEnrollmentAcademicYearId = useWatch({
    control,
    name: "currentEnrollment.academicYearId",
  });
  const selectedEnrollmentSectionId = useWatch({
    control,
    name: "currentEnrollment.sectionId",
  });
  const watchedFirstName = useWatch({ control, name: "firstName" });
  const watchedLastName = useWatch({ control, name: "lastName" });

  const guardiansFieldArray = useFieldArray({
    control,
    name: "guardians",
  });

  const classesQuery = useClassesQuery(Boolean(campusId));
  const classOptions = useMemo(
    () =>
      ((classesQuery.data?.rows ?? []) as ClassOption[]).filter(
        (item) => item.status === "active",
      ),
    [classesQuery.data?.rows],
  );
  const selectedClass = useMemo(
    () => classOptions.find((item) => item.id === selectedClassId) ?? null,
    [classOptions, selectedClassId],
  );
  const sectionOptions = useMemo(
    () => selectedClass?.sections ?? [],
    [selectedClass],
  );
  const selectedEnrollmentClass = useMemo(
    () =>
      classOptions.find((item) => item.id === selectedEnrollmentClassId) ??
      null,
    [classOptions, selectedEnrollmentClassId],
  );
  const enrollmentSectionOptions = useMemo(
    () => selectedEnrollmentClass?.sections ?? [],
    [selectedEnrollmentClass],
  );
  const duplicateCheck = useStudentDuplicateCheck(
    mode === "create" ? institutionId : undefined,
    {
      firstName: watchedFirstName ?? "",
      lastName: watchedLastName ?? "",
      classId: selectedClassId ?? "",
      className: selectedClass?.name ?? "",
    },
  );

  const defaultEnrollmentAcademicYearId = useMemo(() => {
    if (academicYears.length === 0) {
      return "";
    }

    if (academicYears.length === 1) {
      return academicYears[0]!.id;
    }

    return (
      academicYears.find((academicYear) => academicYear.isCurrent)?.id ?? ""
    );
  }, [academicYears]);

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (classesQuery.isLoading) {
      return;
    }

    if (!selectedClassId) {
      if (selectedSectionId) {
        setValue("sectionId", "", { shouldDirty: true, shouldValidate: true });
      }
      return;
    }

    if (!selectedClass) {
      setValue("classId", "", { shouldDirty: true, shouldValidate: true });
      if (selectedSectionId) {
        setValue("sectionId", "", { shouldDirty: true, shouldValidate: true });
      }
      return;
    }

    if (
      selectedSectionId &&
      !sectionOptions.some((section) => section.id === selectedSectionId)
    ) {
      setValue("sectionId", "", { shouldDirty: true, shouldValidate: true });
    }

    if (selectedClass && sectionOptions.length === 1 && !selectedSectionId) {
      setValue("sectionId", sectionOptions[0]!.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [
    classesQuery.isLoading,
    sectionOptions,
    selectedClass,
    selectedClassId,
    selectedSectionId,
    setValue,
  ]);

  useEffect(() => {
    if (classesQuery.isLoading || !campusId) {
      return;
    }

    if (classOptions.length === 1 && !selectedClassId) {
      setValue("classId", classOptions[0]!.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [
    classOptions,
    classesQuery.isLoading,
    campusId,
    selectedClassId,
    setValue,
  ]);

  useEffect(() => {
    if (classesQuery.isLoading) {
      return;
    }

    if (!selectedEnrollmentClassId) {
      if (selectedEnrollmentSectionId) {
        setValue("currentEnrollment.sectionId", "", {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      return;
    }

    if (!selectedEnrollmentClass) {
      setValue("currentEnrollment.classId", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (selectedEnrollmentSectionId) {
        setValue("currentEnrollment.sectionId", "", {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      return;
    }

    if (
      selectedEnrollmentSectionId &&
      !enrollmentSectionOptions.some(
        (section) => section.id === selectedEnrollmentSectionId,
      )
    ) {
      setValue("currentEnrollment.sectionId", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (
      selectedEnrollmentClass &&
      enrollmentSectionOptions.length === 1 &&
      !selectedEnrollmentSectionId
    ) {
      setValue("currentEnrollment.sectionId", enrollmentSectionOptions[0]!.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [
    classesQuery.isLoading,
    enrollmentSectionOptions,
    selectedEnrollmentClass,
    selectedEnrollmentClassId,
    selectedEnrollmentSectionId,
    setValue,
  ]);

  useEffect(() => {
    if (
      !selectedEnrollmentClassId ||
      !defaultEnrollmentAcademicYearId ||
      selectedEnrollmentAcademicYearId
    ) {
      return;
    }

    setValue(
      "currentEnrollment.academicYearId",
      defaultEnrollmentAcademicYearId,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  }, [
    defaultEnrollmentAcademicYearId,
    selectedEnrollmentAcademicYearId,
    selectedEnrollmentClassId,
    setValue,
  ]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {autoSaveKey ? (
        <DraftRecoveryBanner
          hasDraft={autoSave.hasDraft}
          onRestore={autoSave.restoreDraft}
          onDiscard={autoSave.discardDraft}
        />
      ) : null}

      {/* Personal Information */}
      <section className="rounded-lg border p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Personal Information</h3>
          <p className="text-sm text-muted-foreground">
            Basic identity details for the student record.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="firstName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="first-name" required>
                  First name
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="first-name"
                    placeholder="Student first name"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="last-name">Last name</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="last-name"
                    placeholder="Optional"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        {duplicateCheck.match ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950">
            <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-amber-800 dark:text-amber-200">
              A student named{" "}
              <span className="font-medium">{duplicateCheck.match.fullName}</span>{" "}
              already exists in{" "}
              <span className="font-medium">{duplicateCheck.match.className}</span>.
              Are you sure this isn't a duplicate?
            </p>
          </div>
        ) : null}
      </section>

      {/* Enrollment */}
      <section className="rounded-lg border p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Enrollment</h3>
          <p className="text-sm text-muted-foreground">
            Admission details, class placement, and campus assignment.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="admissionNumber"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="admission-number" required>
                  Admission number
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admission-number"
                    placeholder="School admission number"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
          {campusName ? (
            <Field>
              <FieldLabel>Campus</FieldLabel>
              <FieldContent>
                <div className="flex h-10 items-center">
                  <Badge
                    className="rounded-md px-3 py-1 font-medium"
                    variant="secondary"
                  >
                    {campusName}
                  </Badge>
                </div>
              </FieldContent>
            </Field>
          ) : null}
          <Controller
            control={control}
            name="classId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>Class</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue
                        placeholder={
                          classesQuery.isLoading
                            ? "Loading classes..."
                            : "Select class"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {classOptions.map((schoolClass) => (
                          <SelectItem
                            key={schoolClass.id}
                            value={schoolClass.id}
                          >
                            {schoolClass.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="sectionId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>Section</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue
                        placeholder={
                          selectedClassId
                            ? "Select section"
                            : "Select class first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {sectionOptions.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        {/* Current enrollment sub-section */}
        <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <p className="text-sm font-medium">Current enrollment</p>
            <p className="text-xs text-muted-foreground">
              Leave all three fields blank if the student is not assigned yet.
            </p>
          </div>

          <Controller
            control={control}
            name="currentEnrollment.academicYearId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Academic year</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {academicYears.map((academicYear) => (
                          <SelectItem
                            key={academicYear.id}
                            value={academicYear.id}
                          >
                            {formatAcademicYear(academicYear.name)}
                            {academicYear.isCurrent ? " (Current)" : ""}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="currentEnrollment.classId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Class</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue
                        placeholder={
                          classesQuery.isLoading
                            ? "Loading classes..."
                            : "Select class"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {classOptions.map((schoolClass) => (
                          <SelectItem
                            key={schoolClass.id}
                            value={schoolClass.id}
                          >
                            {schoolClass.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="currentEnrollment.sectionId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Section</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue
                        placeholder={
                          selectedEnrollmentClassId
                            ? "Select section"
                            : "Select class first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {enrollmentSectionOptions.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
          {academicYears.length === 0 ? (
            <p className="sm:col-span-3 text-xs text-muted-foreground">
              Create an academic year before assigning current enrollment.
            </p>
          ) : null}
          <div className="sm:col-span-3">
            <Button
              onClick={() => {
                setValue("currentEnrollment", EMPTY_CURRENT_ENROLLMENT, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              Clear enrollment
            </Button>
          </div>
        </div>
      </section>

      {/* Guardian Details */}
      <section className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Guardian Details</h3>
            <p className="text-sm text-muted-foreground">
              Keep one primary guardian and any additional contacts linked here.
            </p>
          </div>
          <Button
            className="gap-1.5"
            onClick={() =>
              guardiansFieldArray.append({
                ...DEFAULT_GUARDIAN,
                isPrimary: false,
              })
            }
            size="sm"
            type="button"
            variant="outline"
          >
            <IconUserPlus data-icon="inline-start" />
            Add guardian
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {guardiansFieldArray.fields.map((guardian, index) => (
            <div
              key={guardian.id}
              className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2"
            >
              <div className="flex gap-3">
                <Controller
                  control={control}
                  name={`guardians.${index}.honorific`}
                  render={({ field }) => (
                    <Field className="w-[100px] shrink-0">
                      <FieldLabel>Title</FieldLabel>
                      <FieldContent>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? "" : value)
                          }
                          value={field.value || "none"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="none">None</SelectItem>
                              {HONORIFICS.map((h) => (
                                <SelectItem key={h} value={h}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name={`guardians.${index}.name`}
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex-1"
                      data-invalid={fieldState.invalid || undefined}
                    >
                      <FieldLabel required>Name</FieldLabel>
                      <FieldContent>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          placeholder="Guardian full name"
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />
              </div>
              <Controller
                control={control}
                name={`guardians.${index}.mobile`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel required>Mobile</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        inputMode="tel"
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />
              <Controller
                control={control}
                name={`guardians.${index}.email`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Email</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        placeholder="Optional guardian email"
                        type="email"
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />
              <Controller
                control={control}
                name={`guardians.${index}.relationship`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel required>Relationship</FieldLabel>
                    <FieldContent>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {GUARDIAN_RELATIONSHIP_OPTIONS.map((value) => (
                              <SelectItem key={value} value={value}>
                                {value.charAt(0).toUpperCase() + value.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />

              <div className="flex items-center justify-between sm:col-span-2">
                <Controller
                  control={control}
                  name={`guardians.${index}.isPrimary`}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={field.value}
                        id={`primary-${index}`}
                        onCheckedChange={field.onChange}
                      />
                      <Label
                        className="text-sm font-normal"
                        htmlFor={`primary-${index}`}
                      >
                        Primary guardian
                      </Label>
                    </div>
                  )}
                />
                {guardiansFieldArray.fields.length > 1 ? (
                  <Button
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => guardiansFieldArray.remove(index)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <IconTrash data-icon="inline-start" />
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <AdmissionCustomFieldsSection
        control={control}
        fields={customFields}
        title="Student-specific details"
      />

      <FieldError>{errorMessage}</FieldError>

      {/* Sticky footer for form actions */}
      <div className="sticky bottom-0 -mx-6 -mb-6 border-t bg-background px-6 py-4 flex gap-3 justify-end">
        {onCancel ? (
          <EntityFormSecondaryAction onClick={onCancel} type="button">
            Cancel
          </EntityFormSecondaryAction>
        ) : null}
        <EntityFormPrimaryAction disabled={isPending} type="submit">
          {isPending ? "Saving..." : submitLabel}
        </EntityFormPrimaryAction>
      </div>
    </form>
  );
}
