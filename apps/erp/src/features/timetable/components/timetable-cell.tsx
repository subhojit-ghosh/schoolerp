import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
  EntityToolbarSecondaryAction,
} from "@/components/entities/entity-actions";
import { useTimetableStaffOptionsQuery } from "@/features/timetable/api/use-timetable";
import {
  timetableCellFormSchema,
  type TimetableCellFormValues,
  type TimetableCellValue,
} from "@/features/timetable/model/timetable-editor-schema";

type StaffOption = {
  id: string;
  name: string;
};

type TimetableCellProps = {
  classId?: string;
  conflicted?: boolean;
  dayLabel: string;
  displayMode?: "section" | "teacher";
  isBreak?: boolean;
  periodLabel: string;
  readOnly?: boolean;
  subjects: Array<{ id: string; name: string }>;
  value?: TimetableCellValue;
  onAssign?: (value: TimetableCellFormValues) => void;
  onClear?: () => void;
};

const DEFAULT_VALUES: TimetableCellFormValues = {
  bellSchedulePeriodId: null,
  room: "",
  staffId: null,
  subjectId: "",
};

export function TimetableCell({
  classId,
  conflicted = false,
  dayLabel,
  displayMode = "section",
  isBreak = false,
  periodLabel,
  readOnly = false,
  subjects,
  value,
  onAssign,
  onClear,
}: TimetableCellProps) {
  const [open, setOpen] = useState(false);
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<TimetableCellFormValues>({
      resolver: zodResolver(timetableCellFormSchema),
      defaultValues: DEFAULT_VALUES,
    });

  useEffect(() => {
    reset({
      bellSchedulePeriodId: value?.bellSchedulePeriodId ?? null,
      room: value?.room ?? "",
      staffId: value?.staffId ?? null,
      subjectId: value?.subjectId ?? "",
    });
  }, [reset, value]);

  const subjectId = watch("subjectId");
  const staffOptionsQuery = useTimetableStaffOptionsQuery(
    open && !readOnly && Boolean(subjectId),
    {
      classId,
      subjectId: subjectId || "",
    },
  );
  const staffOptions = (staffOptionsQuery.data ?? {
    others: [],
    preferred: [],
  }) as {
    others: StaffOption[];
    preferred: StaffOption[];
  };

  const availableStaffIds = useMemo(
    () =>
      new Set([...staffOptions.preferred, ...staffOptions.others].map((staff) => staff.id)),
    [staffOptions.others, staffOptions.preferred],
  );

  useEffect(() => {
    const selectedStaffId = watch("staffId");

    if (!selectedStaffId) {
      return;
    }

    if (!availableStaffIds.has(selectedStaffId)) {
      setValue("staffId", null);
    }
  }, [availableStaffIds, setValue, staffOptionsQuery.data, watch]);

  if (isBreak) {
    return (
      <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed bg-muted/35 px-3 py-5 text-sm font-medium text-muted-foreground">
        Break
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="flex min-h-28 flex-col justify-between rounded-lg border bg-card px-3 py-3 text-left">
        {value ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{value.subjectName}</p>
            {displayMode === "teacher" ? (
              <p className="text-xs text-muted-foreground">
                {value.className} • {value.sectionName}
              </p>
            ) : value.staffName ? (
              <p className="text-xs text-muted-foreground">{value.staffName}</p>
            ) : null}
            {value.room ? (
              <p className="text-xs text-muted-foreground">{value.room}</p>
            ) : null}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            —
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`flex min-h-28 w-full flex-col justify-between rounded-lg border px-3 py-3 text-left transition ${
          conflicted
            ? "border-yellow-500 bg-yellow-50/70 dark:bg-yellow-950/20"
            : value
              ? "bg-card hover:border-primary/30"
              : "border-dashed text-muted-foreground hover:border-primary/40 hover:text-foreground"
        }`}
        onClick={() => setOpen(true)}
      >
        {value ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{value.subjectName}</p>
            {value.staffName ? (
              <p className="text-xs text-muted-foreground">{value.staffName}</p>
            ) : null}
            {value.room ? (
              <p className="text-xs text-muted-foreground">{value.room}</p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <IconPlus className="size-3.5" />
            Assign
          </div>
        )}
        {conflicted ? (
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            Teacher overlap
          </p>
        ) : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{periodLabel}</DialogTitle>
            <DialogDescription>{dayLabel}</DialogDescription>
          </DialogHeader>

          <form
            id={`timetable-cell-${dayLabel}-${periodLabel}`}
            onSubmit={handleSubmit(async (nextValue) => {
              onAssign?.(nextValue);
              setOpen(false);
            })}
            className="flex flex-col gap-5"
          >
            <FieldGroup>
              <Controller
                control={control}
                name="subjectId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel required>Subject</FieldLabel>
                    <FieldContent>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger aria-invalid={fieldState.invalid || undefined}>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
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

              <Controller
                control={control}
                name="staffId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Teacher</FieldLabel>
                    <FieldContent>
                      <Select
                        onValueChange={(nextValue) =>
                          field.onChange(nextValue === "unassigned" ? null : nextValue)
                        }
                        value={field.value ?? "unassigned"}
                      >
                        <SelectTrigger aria-invalid={fieldState.invalid || undefined}>
                          <SelectValue placeholder="Optional teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="unassigned">Not assigned</SelectItem>
                          </SelectGroup>
                          {staffOptions.preferred.length > 0 ? (
                            <SelectGroup>
                              <SelectLabel>Assigned to subject</SelectLabel>
                              {staffOptions.preferred.map((staff: StaffOption) => (
                                <SelectItem key={staff.id} value={staff.id}>
                                  {staff.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ) : null}
                          {staffOptions.others.length > 0 ? (
                            <SelectGroup>
                              <SelectLabel>Other staff</SelectLabel>
                              {staffOptions.others.map((staff: StaffOption) => (
                                <SelectItem key={staff.id} value={staff.id}>
                                  {staff.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ) : null}
                        </SelectContent>
                      </Select>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="room"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Room</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid || undefined}
                        placeholder="Optional room"
                        value={field.value ?? ""}
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />
            </FieldGroup>
          </form>

          <DialogFooter className="justify-between sm:justify-between">
            <div>
              {value ? (
                <EntityToolbarSecondaryAction
                  type="button"
                  onClick={() => {
                    onClear?.();
                    setOpen(false);
                  }}
                >
                  <IconTrash data-icon="inline-start" />
                  Clear
                </EntityToolbarSecondaryAction>
              ) : null}
            </div>
            <div className="flex gap-3">
              <EntityFormSecondaryAction type="button" onClick={() => setOpen(false)}>
                Cancel
              </EntityFormSecondaryAction>
              <EntityFormPrimaryAction
                type="submit"
                form={`timetable-cell-${dayLabel}-${periodLabel}`}
              >
                Save
              </EntityFormPrimaryAction>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
