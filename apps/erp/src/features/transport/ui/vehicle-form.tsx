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
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useTransportRoutesQuery } from "@/features/transport/api/use-transport";
import {
  vehicleFormSchema,
  DEFAULT_VEHICLE_FORM_VALUES,
  type VehicleFormValues,
} from "@/features/transport/model/transport-form-schemas";

type VehicleFormProps = {
  defaultValues?: VehicleFormValues;
  isPending?: boolean;
  errorMessage?: string;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (values: VehicleFormValues) => Promise<void> | void;
};

export function VehicleForm({
  defaultValues = DEFAULT_VEHICLE_FORM_VALUES,
  isPending = false,
  errorMessage,
  submitLabel = "Create vehicle",
  onCancel,
  onSubmit,
}: VehicleFormProps) {
  const { control, handleSubmit } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    mode: "onTouched",
    defaultValues,
  });

  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);
  const routesQuery = useTransportRoutesQuery(isEnabled, { limit: 100 });
  const routes: Array<{ id: string; name: string }> =
    routesQuery.data?.rows ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        <Controller
          control={control}
          name="registrationNumber"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Registration number</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. MH12AB1234"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            control={control}
            name="type"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>Vehicle type</FieldLabel>
                <FieldContent>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="capacity"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>Capacity (seats)</FieldLabel>
                <FieldContent>
                  <Input
                    aria-invalid={fieldState.invalid}
                    type="number"
                    min={1}
                    value={field.value}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? 1 : parseInt(e.target.value, 10),
                      )
                    }
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            control={control}
            name="driverName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Driver name</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    placeholder="Driver's full name"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="driverContact"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Driver contact</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    inputMode="tel"
                    placeholder="Driver's mobile number"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        {routes.length > 0 ? (
          <Controller
            control={control}
            name="routeId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Assigned route</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={(v) => field.onChange(v === "_none" ? "" : v)}
                    value={field.value || "_none"}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">No route assigned</SelectItem>
                      {routes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        ) : null}

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
