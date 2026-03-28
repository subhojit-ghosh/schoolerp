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
  SALARY_ASSIGNMENT_DEFAULT_VALUES,
  salaryAssignmentFormSchema,
  type SalaryAssignmentFormValues,
} from "@/features/payroll/model/salary-assignment-form-schema";

type StaffOption = {
  id: string;
  name: string;
  employeeId: string | null;
};

type TemplateOption = {
  id: string;
  name: string;
};

type SalaryAssignmentFormProps = {
  mode: "create" | "edit";
  defaultValues?: SalaryAssignmentFormValues;
  staffOptions?: StaffOption[];
  templateOptions?: TemplateOption[];
  isPending?: boolean;
  errorMessage?: string;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (values: SalaryAssignmentFormValues) => Promise<void> | void;
};

export function SalaryAssignmentForm({
  mode,
  defaultValues = SALARY_ASSIGNMENT_DEFAULT_VALUES,
  staffOptions = [],
  templateOptions = [],
  isPending = false,
  errorMessage,
  submitLabel = "Create assignment",
  onCancel,
  onSubmit,
}: SalaryAssignmentFormProps) {
  const { control, handleSubmit } = useForm<SalaryAssignmentFormValues>({
    resolver: zodResolver(salaryAssignmentFormSchema),
    mode: "onTouched",
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        {mode === "create" ? (
          <>
            <Controller
              control={control}
              name="staffProfileId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel required>Staff Member</FieldLabel>
                  <FieldContent>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffOptions.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name}
                            {staff.employeeId ? ` (${staff.employeeId})` : ""}
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
              name="salaryTemplateId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel required>Salary Template</FieldLabel>
                  <FieldContent>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templateOptions.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
          </>
        ) : null}

        <Controller
          control={control}
          name="effectiveFrom"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Effective From</FieldLabel>
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
