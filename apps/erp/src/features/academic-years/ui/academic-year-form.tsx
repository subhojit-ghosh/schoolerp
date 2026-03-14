import { useEffect, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
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
  academicYearFormSchema,
  type AcademicYearFormValues,
} from "@/features/academic-years/model/academic-year-form-schema";

type AcademicYearFormProps = {
  defaultValues: AcademicYearFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onCancel?: () => void;
  onSubmit: (values: AcademicYearFormValues) => Promise<void> | void;
  submitLabel: string;
};

function buildAcademicYearName(startDate: string, endDate: string) {
  const startYear = startDate.slice(0, 4);
  const endYear = endDate.slice(0, 4);

  if (!startYear || !endYear) {
    return "";
  }

  return `${startYear}-${endYear}`;
}

export function AcademicYearForm({
  defaultValues,
  errorMessage,
  isPending = false,
  onCancel,
  onSubmit,
  submitLabel,
}: AcademicYearFormProps) {
  const manualNameOverrideRef = useRef(false);
  const { control, handleSubmit, reset, setValue } =
    useForm<AcademicYearFormValues>({
      resolver: zodResolver(academicYearFormSchema),
      defaultValues,
    });
  const startDate = useWatch({
    control,
    name: "startDate",
  });
  const endDate = useWatch({
    control,
    name: "endDate",
  });

  useEffect(() => {
    manualNameOverrideRef.current = false;
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    const generatedName = buildAcademicYearName(startDate, endDate);

    if (!generatedName || manualNameOverrideRef.current) {
      return;
    }

    setValue("name", generatedName, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [endDate, setValue, startDate]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="startDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="academic-year-start-date">
                  Start date
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="academic-year-start-date"
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
                <FieldLabel htmlFor="academic-year-end-date">
                  End date
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="academic-year-end-date"
                    type="date"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="academic-year-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  aria-invalid={fieldState.invalid}
                  id="academic-year-name"
                  {...field}
                  onChange={(event) => {
                    manualNameOverrideRef.current = true;
                    field.onChange(event);
                  }}
                  placeholder="2026-2027"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="isCurrent"
          render={({ field }) => (
            <Field>
              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <Checkbox
                  checked={field.value}
                  id="academic-year-current"
                  onCheckedChange={field.onChange}
                />
                <Label
                  className="text-sm font-normal"
                  htmlFor="academic-year-current"
                >
                  Set as current academic year
                </Label>
              </div>
            </Field>
          )}
        />

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
