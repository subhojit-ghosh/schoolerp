import { GUARDIAN_RELATIONSHIPS } from "@repo/contracts";
import { useEffect, useMemo } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconTrash, IconUserPlus } from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
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
} from "@/components/entity-actions";

const DEFAULT_GUARDIAN: StudentFormValues["guardians"][number] = {
  name: "",
  mobile: "",
  email: "",
  relationship: GUARDIAN_RELATIONSHIPS.GUARDIAN,
  isPrimary: true,
};

type CampusOption = {
  id: string;
  name: string;
};

type AcademicYearOption = {
  id: string;
  name: string;
  isCurrent: boolean;
};

type ClassOption = {
  id: string;
  name: string;
  isActive?: boolean;
  sections: Array<{
    id: string;
    name: string;
  }>;
};

type StudentFormProps = {
  academicYears: AcademicYearOption[];
  campuses: CampusOption[];
  defaultValues: StudentFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onCancel?: () => void;
  onSubmit: (values: StudentFormValues) => Promise<void> | void;
  submitLabel: string;
};

export function StudentForm({
  academicYears,
  campuses,
  defaultValues,
  errorMessage,
  isPending = false,
  onCancel,
  onSubmit,
  submitLabel,
}: StudentFormProps) {
  const { control, handleSubmit, reset, setValue } = useForm<StudentFormValues>(
    {
      resolver: zodResolver(studentFormSchema),
      defaultValues,
    },
  );

  const selectedCampusId = useWatch({
    control,
    name: "campusId",
  });
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
  const selectedEnrollmentSectionId = useWatch({
    control,
    name: "currentEnrollment.sectionId",
  });

  const guardiansFieldArray = useFieldArray({
    control,
    name: "guardians",
  });

  const classesQuery = useClassesQuery(
    Boolean(selectedCampusId),
    selectedCampusId,
  );
  const classOptions = useMemo(
    () =>
      ((classesQuery.data?.rows ?? []) as ClassOption[]).filter(
        (item) => item.isActive !== false,
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
  }, [
    classesQuery.isLoading,
    sectionOptions,
    selectedClass,
    selectedClassId,
    selectedSectionId,
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
  }, [
    classesQuery.isLoading,
    enrollmentSectionOptions,
    selectedEnrollmentClass,
    selectedEnrollmentClassId,
    selectedEnrollmentSectionId,
    setValue,
  ]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="admissionNumber"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="admission-number">
                  Admission number
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admission-number"
                    placeholder="ADM-2026-001"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="campusId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Campus</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {campuses.map((campus) => (
                          <SelectItem key={campus.id} value={campus.id}>
                            {campus.name}
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
            name="firstName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="first-name">First name</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="first-name"
                    placeholder="Aarav"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="classId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Class</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
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
                <FieldLabel>Section</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
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
                    placeholder="Sharma"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        </div>

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
                    value={field.value || undefined}
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
                            {academicYear.name}
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
                    value={field.value || undefined}
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
                    value={field.value || undefined}
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

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Guardians</p>
              <p className="text-xs text-muted-foreground">
                Keep one primary guardian and any additional contacts linked
                here.
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

          {guardiansFieldArray.fields.map((guardian, index) => (
            <div
              key={guardian.id}
              className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2"
            >
              <Controller
                control={control}
                name={`guardians.${index}.name`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Name</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        placeholder="Neha Sharma"
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />
              <Controller
                control={control}
                name={`guardians.${index}.mobile`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Mobile</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        inputMode="tel"
                        placeholder="+91 98765 43210"
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
                        placeholder="guardian@example.com"
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
                    <FieldLabel>Relationship</FieldLabel>
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

        <FieldError>{errorMessage}</FieldError>

        <div className="flex gap-2">
          <EntityFormPrimaryAction disabled={isPending} type="submit">
            {isPending ? "Saving..." : submitLabel}
          </EntityFormPrimaryAction>
          {onCancel ? (
            <EntityFormSecondaryAction onClick={onCancel} type="button">
              Cancel
            </EntityFormSecondaryAction>
          ) : null}
        </div>
      </FieldGroup>
    </form>
  );
}
