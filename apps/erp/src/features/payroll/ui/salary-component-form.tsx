import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import {
  SALARY_COMPONENT_DEFAULT_VALUES,
  salaryComponentFormSchema,
  type SalaryComponentFormValues,
} from "@/features/payroll/model/salary-component-form-schema";

type SalaryComponentFormProps = {
  defaultValues?: SalaryComponentFormValues;
  isPending?: boolean;
  errorMessage?: string;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (values: SalaryComponentFormValues) => Promise<void> | void;
};

export function SalaryComponentForm({
  defaultValues = SALARY_COMPONENT_DEFAULT_VALUES,
  isPending = false,
  errorMessage,
  submitLabel = "Create component",
  onCancel,
  onSubmit,
}: SalaryComponentFormProps) {
  const { control, handleSubmit } = useForm<SalaryComponentFormValues>({
    resolver: zodResolver(salaryComponentFormSchema) as any,
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Name</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. Basic Pay, HRA, PF Deduction"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="type"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Type</FieldLabel>
              <FieldContent>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earning">Earning</SelectItem>
                    <SelectItem value="deduction">Deduction</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="calculationType"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Calculation Type</FieldLabel>
              <FieldContent>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select calculation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="sortOrder"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Sort Order</FieldLabel>
              <FieldContent>
                <Input
                  aria-invalid={fieldState.invalid}
                  type="number"
                  min={0}
                  value={field.value}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? 0
                        : parseInt(e.target.value, 10),
                    )
                  }
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="isTaxable"
          render={({ field }) => (
            <Field>
              <FieldContent>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <span className="text-sm">Taxable</span>
                </label>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="isStatutory"
          render={({ field }) => (
            <Field>
              <FieldContent>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <span className="text-sm">Statutory component</span>
                </label>
              </FieldContent>
            </Field>
          )}
        />

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <EntityFormPrimaryAction disabled={isPending} type="submit">
            {isPending ? "Saving..." : submitLabel}
          </EntityFormPrimaryAction>
          <EntityFormSecondaryAction
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </EntityFormSecondaryAction>
        </div>
      </FieldGroup>
    </form>
  );
}
