import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

type AcademicYearOption = {
  id: string;
  name: string;
};

type ExamTermFormProps = {
  academicYears: AcademicYearOption[];
  defaultValues: ExamTermFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onSubmit: (values: ExamTermFormValues) => Promise<void> | void;
};

export function ExamTermForm({
  academicYears,
  defaultValues,
  errorMessage,
  isPending = false,
  onSubmit,
}: ExamTermFormProps) {
  const { control, handleSubmit, reset } = useForm<ExamTermFormValues>({
    resolver: zodResolver(examTermFormSchema),
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
              <FieldLabel>Academic year</FieldLabel>
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
                          {academicYear.name}
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
              <FieldLabel>Term name</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  placeholder="Exam term name"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="startDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Start date</FieldLabel>
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
                <FieldLabel>End date</FieldLabel>
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
          Create exam term
        </Button>
      </FieldGroup>
    </form>
  );
}
