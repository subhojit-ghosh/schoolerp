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
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import {
  stopFormSchema,
  DEFAULT_STOP_FORM_VALUES,
  type StopFormValues,
} from "@/features/transport/model/transport-form-schemas";

type StopFormProps = {
  defaultValues?: StopFormValues;
  isPending?: boolean;
  errorMessage?: string;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (values: StopFormValues) => Promise<void> | void;
};

export function StopForm({
  defaultValues = DEFAULT_STOP_FORM_VALUES,
  isPending = false,
  errorMessage,
  submitLabel = "Create stop",
  onCancel,
  onSubmit,
}: StopFormProps) {
  const { control, handleSubmit } = useForm<StopFormValues>({
    resolver: zodResolver(stopFormSchema),
    mode: "onTouched",
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
              <FieldLabel required>Stop name</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. Main Gate, School Bus Stand"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="sequenceNumber"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Sequence number</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  inputMode="numeric"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  value={field.value}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="pickupTime"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Pickup time</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. 07:30"
                  value={field.value ?? ""}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="dropTime"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Drop time</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. 14:00"
                  value={field.value ?? ""}
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
