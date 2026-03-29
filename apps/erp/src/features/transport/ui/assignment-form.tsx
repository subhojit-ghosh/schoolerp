import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
  assignmentFormSchema,
  DEFAULT_ASSIGNMENT_FORM_VALUES,
  type AssignmentFormValues,
} from "@/features/transport/model/transport-form-schemas";
import {
  useTransportRoutesQuery,
  useTransportRouteQuery,
} from "@/features/transport/api/use-transport";
import { useStudentOptionsQuery } from "@/features/students/api/use-students";
import { useAuthStore } from "@/features/auth/model/auth-store";

type AssignmentFormProps = {
  defaultValues?: AssignmentFormValues;
  isPending?: boolean;
  errorMessage?: string;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (values: AssignmentFormValues) => Promise<void> | void;
};

export function AssignmentForm({
  defaultValues = DEFAULT_ASSIGNMENT_FORM_VALUES,
  isPending = false,
  errorMessage,
  submitLabel = "Create assignment",
  onCancel,
  onSubmit,
}: AssignmentFormProps) {
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const isEnabled = Boolean(institutionId);

  const { control, handleSubmit, setValue } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    mode: "onTouched",
    defaultValues,
  });

  const selectedRouteId = useWatch({ control, name: "routeId" });

  // Reset stop when route changes
  useEffect(() => {
    setValue("stopId", "");
  }, [selectedRouteId, setValue]);

  const studentOptionsQuery = useStudentOptionsQuery(institutionId);
  const routesQuery = useTransportRoutesQuery(isEnabled, {
    limit: 100,
    status: "active",
  });
  const routeDetailQuery = useTransportRouteQuery(
    selectedRouteId,
    Boolean(selectedRouteId),
  );

  const students = studentOptionsQuery.data ?? [];
  const routes: Array<{ id: string; name: string }> =
    routesQuery.data?.rows ?? [];
  const stops: Array<{
    id: string;
    name: string;
    sequenceNumber: number;
    pickupTime?: string | null;
    status: string;
  }> = (routeDetailQuery.data?.stops ?? []).filter(
    (s: { status: string }) => s.status === "active",
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        <Controller
          control={control}
          name="studentId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Student</FieldLabel>
              <FieldContent>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(
                      (s: {
                        id: string;
                        fullName: string;
                        admissionNumber: string | null;
                      }) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.fullName}
                          {s.admissionNumber ? ` (${s.admissionNumber})` : ""}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="routeId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Route</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                  }}
                  value={field.value}
                >
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
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

        <Controller
          control={control}
          name="stopId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Stop</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedRouteId || stops.length === 0}
                >
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue
                      placeholder={
                        !selectedRouteId
                          ? "Select a route first"
                          : stops.length === 0
                            ? "No stops available"
                            : "Select stop"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {stops.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.sequenceNumber}. {s.name}
                        {s.pickupTime ? ` (${s.pickupTime})` : ""}
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
          name="assignmentType"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Assignment type</FieldLabel>
              <FieldContent>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both (Pickup & Drop)</SelectItem>
                    <SelectItem value="pickup">Pickup only</SelectItem>
                    <SelectItem value="dropoff">Drop-off only</SelectItem>
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
            name="startDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>Start date</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    type="date"
                    aria-invalid={fieldState.invalid}
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
                    type="date"
                    aria-invalid={fieldState.invalid}
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
