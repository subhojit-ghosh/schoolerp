import { useEffect } from "react";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import {
  STAFF_STATUS_OPTIONS,
  staffFormSchema,
  type StaffFormValues,
} from "@/features/staff/model/staff-form-schema";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";

type StaffFormProps = {
  afterFields?: ReactNode;
  campusName?: string;
  defaultValues: StaffFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onCancel?: () => void;
  onSubmit: (values: StaffFormValues) => Promise<void> | void;
  submitLabel: string;
};

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function StaffForm({
  afterFields,
  campusName,
  defaultValues,
  errorMessage,
  isPending = false,
  onCancel,
  onSubmit,
  submitLabel,
}: StaffFormProps) {
  const { control, handleSubmit, reset } = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues,
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
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="staff-name">Full name</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="staff-name"
                    placeholder="Staff full name"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="mobile"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="staff-mobile">Mobile</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="staff-mobile"
                    inputMode="tel"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="staff-email">Email</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="staff-email"
                    placeholder="Optional staff email"
                    type="email"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
          {campusName ? (
            <Field>
              <FieldLabel>Primary campus</FieldLabel>
              <FieldContent>
                <div className="flex h-10 items-center">
                  <Badge className="rounded-md px-3 py-1 font-medium" variant="secondary">
                    {campusName}
                  </Badge>
                </div>
              </FieldContent>
            </Field>
          ) : null}
          <Controller
            control={control}
            name="status"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Status</FieldLabel>
                <FieldContent>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {STAFF_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {toTitleCase(status)}
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

        {afterFields}

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
