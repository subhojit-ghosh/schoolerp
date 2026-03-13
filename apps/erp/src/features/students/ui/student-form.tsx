import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
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
  GUARDIAN_RELATIONSHIP_OPTIONS,
  studentFormSchema,
  type StudentFormValues,
} from "@/features/students/model/student-form-schema";

const DEFAULT_GUARDIAN: StudentFormValues["guardians"][number] = {
  name: "",
  mobile: "",
  email: "",
  relationship: "guardian",
  isPrimary: true,
};

type CampusOption = {
  id: string;
  name: string;
};

type StudentFormProps = {
  campuses: CampusOption[];
  defaultValues: StudentFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onCancel?: () => void;
  onSubmit: (values: StudentFormValues) => Promise<void> | void;
  submitLabel: string;
};

export function StudentForm({
  campuses,
  defaultValues,
  errorMessage,
  isPending = false,
  onCancel,
  onSubmit,
  submitLabel,
}: StudentFormProps) {
  const { control, handleSubmit, reset } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues,
  });

  const guardiansFieldArray = useFieldArray({
    control,
    name: "guardians",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="admissionNumber"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="admission-number">Admission number</FieldLabel>
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
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
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
            name="className"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="class-name">Class</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="class-name"
                    placeholder="Grade 7"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="sectionName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="section-name">Section</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="section-name"
                    placeholder="A"
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
                    placeholder="Sharma"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Guardians</p>
              <p className="text-xs text-muted-foreground">
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
                      <Input {...field} aria-invalid={fieldState.invalid} placeholder="Neha Sharma" />
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <Label className="text-sm font-normal" htmlFor={`primary-${index}`}>
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
          <Button disabled={isPending} type="submit">
            {isPending ? "Saving..." : submitLabel}
          </Button>
          {onCancel ? (
            <Button onClick={onCancel} type="button" variant="ghost">
              Cancel
            </Button>
          ) : null}
        </div>
      </FieldGroup>
    </form>
  );
}
