import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EXAM_TYPE_LABELS } from "@repo/contracts";
import { Button } from "@repo/ui/components/ui/button";
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  examTermFormSchema,
  type ExamTermFormValues,
} from "@/features/exams/model/exam-form-schema";
import { formatAcademicYear } from "@/lib/format";

type AcademicYearOption = {
  id: string;
  name: string;
};

type GradingScaleOption = {
  id: string;
  name: string;
  isDefault: boolean;
};

type ExamTermFormProps = {
  academicYears: AcademicYearOption[];
  gradingScales?: GradingScaleOption[];
  defaultValues: ExamTermFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onSubmit: (values: ExamTermFormValues) => Promise<void> | void;
};

const EXAM_TYPE_OPTIONS = Object.entries(EXAM_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export function ExamTermForm({
  academicYears,
  gradingScales = [],
  defaultValues,
  errorMessage,
  isPending = false,
  onSubmit,
}: ExamTermFormProps) {
  const { control, handleSubmit, reset } = useForm<ExamTermFormValues>({
    resolver: zodResolver(examTermFormSchema),
    mode: "onTouched",
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  async function handleFormSubmit(values: ExamTermFormValues) {
    await onSubmit(values);
    reset({
      ...defaultValues,
      name: "",
      startDate: "",
      endDate: "",
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FieldGroup className="gap-5">
        <Controller
          control={control}
          name="academicYearId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Academic year</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <SelectTrigger
                    aria-invalid={fieldState.invalid}
                    className="w-full"
                  >
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
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Term name</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. Mid-Term, Final"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="examType"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>Exam type</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? "final"}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {EXAM_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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
            name="defaultPassingPercent"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>Passing %</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    aria-invalid={fieldState.invalid}
                    type="number"
                    min={0}
                    max={100}
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        {gradingScales.length > 0 ? (
          <Controller
            control={control}
            name="gradingScaleId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Grading scale</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Use institution default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="">Institution default</SelectItem>
                        {gradingScales.map((scale) => (
                          <SelectItem key={scale.id} value={scale.id}>
                            {scale.name}
                            {scale.isDefault ? " (default)" : ""}
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
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="startDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>Start date</FieldLabel>
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
            control={control}
            name="endDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>End date</FieldLabel>
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
        </div>

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        <Button
          disabled={isPending || academicYears.length === 0}
          type="submit"
        >
          {isPending ? "Creating..." : "Create exam term"}
        </Button>
      </FieldGroup>
    </form>
  );
}
