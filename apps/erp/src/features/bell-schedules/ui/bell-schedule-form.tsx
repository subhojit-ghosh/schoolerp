import { useMemo } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
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
  EntityRowAction,
  EntityToolbarSecondaryAction,
} from "@/components/entities/entity-actions";
import {
  bellScheduleFormSchema,
  type BellScheduleFormValues,
} from "@/features/bell-schedules/model/bell-schedule-schema";

type BellScheduleFormProps = {
  defaultValues: BellScheduleFormValues;
  errorMessage?: string;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (values: BellScheduleFormValues) => Promise<void>;
  submitLabel: string;
};

const EMPTY_PERIOD = {
  endTime: "09:45",
  isBreak: false,
  label: "",
  periodIndex: 1,
  startTime: "09:00",
} satisfies BellScheduleFormValues["periods"][number];

function formatDuration(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return "--";
  }

  const totalMinutes =
    endHour * 60 + endMinute - (startHour * 60 + startMinute);

  if (totalMinutes <= 0) {
    return "--";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

export function BellScheduleForm({
  defaultValues,
  errorMessage,
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
}: BellScheduleFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BellScheduleFormValues>({
    resolver: zodResolver(bellScheduleFormSchema),
    mode: "onTouched",
    defaultValues,
  });

  const { append, fields, remove } = useFieldArray({
    control,
    keyName: "fieldKey",
    name: "periods",
  });

  const periods = watch("periods");
  const nextPeriodIndex = useMemo(() => periods.length + 1, [periods.length]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Schedule name</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid || undefined}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="isDefault"
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <FieldContent>
                <FieldLabel>Default schedule</FieldLabel>
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>

      <div className="rounded-lg border">
        <div className="flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Periods</p>
            <p className="text-sm text-muted-foreground">
              Define the row structure used by the timetable grid.
            </p>
          </div>
          <EntityToolbarSecondaryAction
            type="button"
            onClick={() =>
              append({
                ...EMPTY_PERIOD,
                periodIndex: nextPeriodIndex,
              })
            }
          >
            <IconPlus data-icon="inline-start" />
            Add period
          </EntityToolbarSecondaryAction>
        </div>

        <div className="space-y-3 p-4">
          {fields.map((period, index) => (
            <div
              key={period.fieldKey}
              className="rounded-xl border bg-background shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Slot {index + 1}</Badge>
                </div>
                <EntityRowAction
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <IconTrash data-icon="inline-start" className="size-3.5" />
                  Remove
                </EntityRowAction>
              </div>

              <div className="grid gap-3 px-4 py-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_170px_170px_120px_140px] xl:items-end">
                <Controller
                  control={control}
                  name={`periods.${index}.label`}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel>Label</FieldLabel>
                      <FieldContent>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid || undefined}
                          placeholder="e.g. Period 1, Break"
                          value={field.value ?? ""}
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name={`periods.${index}.startTime`}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel required>Start</FieldLabel>
                      <FieldContent>
                        <Input
                          {...field}
                          type="time"
                          aria-invalid={fieldState.invalid || undefined}
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name={`periods.${index}.endTime`}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel required>End</FieldLabel>
                      <FieldContent>
                        <Input
                          {...field}
                          type="time"
                          aria-invalid={fieldState.invalid || undefined}
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name={`periods.${index}.isBreak`}
                  render={({ field }) => (
                    <Field
                      orientation="horizontal"
                      className="rounded-lg border border-dashed px-3 py-2.5 xl:mb-0.5"
                    >
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                      <FieldContent>
                        <FieldLabel>Break row</FieldLabel>
                      </FieldContent>
                    </Field>
                  )}
                />

                <Field>
                  <FieldLabel>Duration</FieldLabel>
                  <FieldContent>
                    <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm font-medium text-foreground">
                      {formatDuration(
                        periods[index]?.startTime ?? "",
                        periods[index]?.endTime ?? "",
                      )}
                    </div>
                  </FieldContent>
                </Field>
              </div>
            </div>
          ))}
        </div>
      </div>

      {errors.periods?.message ? (
        <p className="text-sm text-destructive">{errors.periods.message}</p>
      ) : null}
      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <EntityFormSecondaryAction type="button" onClick={onCancel}>
          Cancel
        </EntityFormSecondaryAction>
        <EntityFormPrimaryAction type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </EntityFormPrimaryAction>
      </div>
    </form>
  );
}
