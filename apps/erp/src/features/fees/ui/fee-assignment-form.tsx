import { useEffect } from "react";
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import {
  feeAssignmentFormSchema,
  feeAssignmentUpdateFormSchema,
  type FeeAssignmentFormValues,
  type FeeAssignmentUpdateFormValues,
} from "@/features/fees/model/fee-form-schema";
import {
  formatFeeDate,
  formatRupees,
} from "@/features/fees/model/fee-formatters";

type Option = {
  id: string;
  label: string;
};

type InstallmentPreview = {
  label: string;
  amountInPaise: number;
  dueDate: string;
};

type FeeAssignmentFormProps = {
  mode: "create" | "edit";
  structures: Option[];
  students: Option[];
  defaultValues: FeeAssignmentFormValues | FeeAssignmentUpdateFormValues;
  errorMessage?: string;
  installmentPreview?: InstallmentPreview[];
  isPending?: boolean;
  lockStudent?: boolean;
  lockStructure?: boolean;
  onCancel?: () => void;
  onStructureChange?: (feeStructureId: string) => void;
  onSubmit: (
    values: FeeAssignmentFormValues | FeeAssignmentUpdateFormValues,
  ) => Promise<void> | void;
  submitLabel: string;
};

export function FeeAssignmentForm({
  mode,
  structures,
  students,
  defaultValues,
  errorMessage,
  installmentPreview,
  isPending = false,
  lockStudent = false,
  lockStructure = false,
  onCancel,
  onStructureChange,
  onSubmit,
  submitLabel,
}: FeeAssignmentFormProps) {
  const { control, handleSubmit, reset } = useForm<
    FeeAssignmentFormValues | FeeAssignmentUpdateFormValues
  >({
    resolver: zodResolver(
      mode === "create" ? feeAssignmentFormSchema : feeAssignmentUpdateFormSchema,
    ),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        {mode === "create" ? (
          <Controller
            control={control}
            name="feeStructureId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Fee structure</FieldLabel>
                <FieldContent>
                  <Select
                    disabled={lockStructure}
                    onValueChange={(value) => {
                      field.onChange(value);
                      onStructureChange?.(value);
                    }}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="Select fee structure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {structures.map((structure) => (
                          <SelectItem key={structure.id} value={structure.id}>
                            {structure.label}
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

        {installmentPreview && installmentPreview.length > 0 ? (
          <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Payment schedule ({installmentPreview.length} installment
              {installmentPreview.length !== 1 ? "s" : ""})
            </p>
            {installmentPreview.map((inst, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{inst.label}</span>
                <span className="text-muted-foreground">
                  {formatRupees(inst.amountInPaise)} · due{" "}
                  {formatFeeDate(inst.dueDate)}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {mode === "create" ? (
          <Controller
            control={control}
            name="studentId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Student</FieldLabel>
                <FieldContent>
                  <Select
                    disabled={lockStudent}
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.label}
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

        {mode === "edit" ? (
          <Controller
            control={control}
            name="dueDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Due date</FieldLabel>
                <FieldContent>
                  <Input {...field} aria-invalid={fieldState.invalid} type="date" />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        ) : null}

        <Controller
          control={control}
          name="notes"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Notes</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  placeholder="Optional note for the assignment"
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
          {onCancel ? (
            <EntityFormSecondaryAction
              disabled={isPending}
              onClick={onCancel}
              type="button"
            >
              Cancel
            </EntityFormSecondaryAction>
          ) : null}
        </div>
      </FieldGroup>
    </form>
  );
}
