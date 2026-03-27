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
import { useLeaveTypesQuery } from "@/features/leave/api/use-leave";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  DEFAULT_LEAVE_APPLICATION_FORM_VALUES,
  leaveApplicationFormSchema,
  type LeaveApplicationFormValues,
} from "@/features/leave/model/leave-form-schemas";

type LeaveApplicationFormProps = {
  defaultValues?: LeaveApplicationFormValues;
  isPending?: boolean;
  errorMessage?: string;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (values: LeaveApplicationFormValues) => Promise<void> | void;
};

export function LeaveApplicationForm({
  defaultValues = DEFAULT_LEAVE_APPLICATION_FORM_VALUES,
  isPending = false,
  errorMessage,
  submitLabel = "Submit application",
  onCancel,
  onSubmit,
}: LeaveApplicationFormProps) {
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const leaveTypesQuery = useLeaveTypesQuery(isEnabled, "active");
  const leaveTypeOptions = leaveTypesQuery.data ?? [];

  const { control, handleSubmit } = useForm<LeaveApplicationFormValues>({
    resolver: zodResolver(leaveApplicationFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        <Controller
          control={control}
          name="leaveTypeId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Leave type</FieldLabel>
              <FieldContent>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {leaveTypeOptions.map((lt) => (
                        <SelectItem key={lt.id} value={lt.id}>
                          {lt.name}
                          {lt.maxDaysPerYear
                            ? ` (max ${lt.maxDaysPerYear} days/yr)`
                            : ""}
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

        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            control={control}
            name="fromDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>From date</FieldLabel>
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
            name="toDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>To date</FieldLabel>
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

        <Controller
          control={control}
          name="reason"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Reason</FieldLabel>
              <FieldContent>
                <textarea
                  {...field}
                  aria-invalid={fieldState.invalid}
                  className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder="Optional reason for leave"
                  rows={3}
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
