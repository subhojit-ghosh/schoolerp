import { useCallback, useEffect, useRef } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FEE_STRUCTURE_SCOPES } from "@repo/contracts";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconGripVertical } from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
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
  FEE_STRUCTURE_SCOPE_OPTIONS,
  feeStructureFormSchema,
  type FeeStructureFormValues,
} from "@/features/fees/model/fee-form-schema";
import { DraftRecoveryBanner } from "@/components/feedback/draft-recovery-banner";
import { useFormAutoSave } from "@/hooks/use-form-auto-save";
import {
  checkFeeAmountReasonable,
  checkFeeDueDateNotPast,
} from "@/lib/date-sanity";
import { formatAcademicYear } from "@/lib/format";

type Option = {
  id: string;
  name: string;
};

type FeeStructureFormProps = {
  academicYears: Option[];
  autoSaveKey?: string;
  campusLabel?: string;
  canUseCampusScope?: boolean;
  defaultValues: FeeStructureFormValues;
  errorMessage?: string;
  isPending?: boolean;
  isReadOnly?: boolean;
  lockScope?: boolean;
  lockReason?: string;
  onAutoSaveReady?: (clearDraft: () => void) => void;
  onCancel?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSubmit: (values: FeeStructureFormValues) => Promise<void> | void;
  submitLabel: string;
};

function toScopeLabel(value: (typeof FEE_STRUCTURE_SCOPE_OPTIONS)[number]) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
      {children}
    </p>
  );
}

type SortableRowProps = {
  id: string;
  index: number;
  control: ReturnType<typeof useForm<FeeStructureFormValues>>["control"];
  canRemove: boolean;
  isReadOnly: boolean;
  onRemove: () => void;
};

function SortableInstallmentRow({
  id,
  index,
  control,
  canRemove,
  isReadOnly,
  onRemove,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: isReadOnly,
  });

  const watchedDueDate = useWatch({
    control,
    name: `installments.${index}.dueDate`,
  });
  const watchedAmount = useWatch({
    control,
    name: `installments.${index}.amount`,
  });
  const dueDateWarning = checkFeeDueDateNotPast(watchedDueDate ?? "");
  const amountInPaise = Number(watchedAmount) * 100;
  const amountWarning =
    amountInPaise > 0 ? checkFeeAmountReasonable(amountInPaise) : null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`grid grid-cols-[1.5rem_2rem_1fr_9rem_10rem_2rem] gap-x-3 items-start px-3 py-2 border-b last:border-b-0 bg-background ${isDragging ? "opacity-50 z-10" : ""}`}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="pt-2 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isReadOnly}
        {...(isReadOnly ? {} : attributes)}
        {...(isReadOnly ? {} : listeners)}
      >
        <IconGripVertical className="size-4" />
      </button>

      {/* Row number */}
      <span className="text-xs text-muted-foreground pt-2.5 tabular-nums">
        {index + 1}
      </span>

      <Controller
        control={control}
        name={`installments.${index}.label`}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                disabled={isReadOnly}
                placeholder="Installment label"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        control={control}
        name={`installments.${index}.amount`}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                disabled={isReadOnly}
                inputMode="decimal"
                min="0"
                step="0.01"
                type="number"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
              {!fieldState.error && amountWarning ? (
                <p className="text-xs text-amber-600 mt-1">{amountWarning}</p>
              ) : null}
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        control={control}
        name={`installments.${index}.dueDate`}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                disabled={isReadOnly}
                type="date"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
              {!fieldState.error && dueDateWarning ? (
                <p className="text-xs text-amber-600 mt-1">{dueDateWarning}</p>
              ) : null}
            </FieldContent>
          </Field>
        )}
      />

      <div className="pt-1.5">
        {canRemove ? (
          <Button
            onClick={onRemove}
            size="sm"
            type="button"
            variant="ghost"
            disabled={isReadOnly}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          >
            ×
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function FeeStructureForm({
  academicYears,
  autoSaveKey,
  campusLabel,
  canUseCampusScope = true,
  defaultValues,
  errorMessage,
  isPending = false,
  isReadOnly = false,
  lockScope = false,
  lockReason,
  onAutoSaveReady,
  onCancel,
  onDirtyChange,
  onSubmit,
  submitLabel,
}: FeeStructureFormProps) {
  const { control, handleSubmit, reset, watch, formState } =
    useForm<FeeStructureFormValues>({
      resolver: zodResolver(feeStructureFormSchema),
      mode: "onTouched",
      defaultValues,
    });
  const selectedScope = useWatch({ control, name: "scope" });

  const autoSave = useFormAutoSave({
    key: autoSaveKey ?? "fee-structure-form",
    watch,
    reset,
    isDirty: formState.isDirty,
  });

  const onAutoSaveReadyRef = useRef(onAutoSaveReady);
  onAutoSaveReadyRef.current = onAutoSaveReady;
  useEffect(() => {
    onAutoSaveReadyRef.current?.(autoSave.clearDraft);
  }, [autoSave.clearDraft]);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "installments",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const stableOnDirtyChange = useCallback(
    (dirty: boolean) => onDirtyChange?.(dirty),
    [onDirtyChange],
  );

  useEffect(() => {
    stableOnDirtyChange(formState.isDirty);
  }, [formState.isDirty, stableOnDirtyChange]);

  useEffect(() => {
    if (!canUseCampusScope && selectedScope === FEE_STRUCTURE_SCOPES.CAMPUS) {
      reset(
        {
          ...defaultValues,
          scope: FEE_STRUCTURE_SCOPES.INSTITUTION,
        },
        {
          keepErrors: true,
          keepTouched: true,
        },
      );
    }
  }, [canUseCampusScope, defaultValues, reset, selectedScope]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      move(oldIndex, newIndex);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {autoSaveKey ? (
        <DraftRecoveryBanner
          hasDraft={autoSave.hasDraft}
          onRestore={autoSave.restoreDraft}
          onDiscard={autoSave.discardDraft}
        />
      ) : null}

      <div className="space-y-8">
        {/* Structure metadata */}
        <div className="space-y-4">
          <SectionLabel>Structure details</SectionLabel>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_11rem]">
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
                        disabled={isReadOnly}
                        placeholder="Fee structure name"
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="academicYearId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel required>Academic year</FieldLabel>
                    <FieldContent>
                      <Select
                        disabled={lockScope || isReadOnly}
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <SelectTrigger
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                        >
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {academicYears.map((ay) => (
                              <SelectItem key={ay.id} value={ay.id}>
                                {formatAcademicYear(ay.name)}
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
                name="scope"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel required>Scope</FieldLabel>
                    <FieldContent>
                      <Select
                        disabled={lockScope || isReadOnly}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                        >
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {FEE_STRUCTURE_SCOPE_OPTIONS.map((scope) => (
                              <SelectItem
                                key={scope}
                                value={scope}
                                disabled={
                                  scope === FEE_STRUCTURE_SCOPES.CAMPUS &&
                                  !canUseCampusScope
                                }
                              >
                                {toScopeLabel(scope)}
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

            {!canUseCampusScope ? (
              <p className="text-sm text-muted-foreground">
                Select an active campus in the header to create a campus-scoped
                fee structure.
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {selectedScope === FEE_STRUCTURE_SCOPES.CAMPUS ? (
                <Field>
                  <FieldLabel>Campus</FieldLabel>
                  <FieldContent>
                    <Input
                      disabled
                      readOnly
                      value={campusLabel ?? "Active campus"}
                    />
                  </FieldContent>
                </Field>
              ) : null}

              <Controller
                control={control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Description</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        disabled={isReadOnly}
                        placeholder="Optional internal note"
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="category"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Category</FieldLabel>
                    <FieldContent>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="No category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="">No category</SelectItem>
                            <SelectItem value="tuition">Tuition</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="hostel">Hostel</SelectItem>
                            <SelectItem value="lab">Lab</SelectItem>
                            <SelectItem value="misc">Miscellaneous</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </div>

        {/* Payment schedule — full width sortable table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>
              Payment schedule
              <span className="ml-1.5 normal-case font-normal text-muted-foreground">
                ({fields.length} installment{fields.length !== 1 ? "s" : ""})
              </span>
            </SectionLabel>
            <Button
              onClick={() =>
                append({
                  label: `Installment ${fields.length + 1}`,
                  amount: "",
                  dueDate: "",
                })
              }
              size="sm"
              type="button"
              variant="outline"
              disabled={isReadOnly}
            >
              + Add installment
            </Button>
          </div>
          {lockReason ? (
            <p className="text-sm text-amber-700">{lockReason}</p>
          ) : null}

          <div className="rounded-md border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1.5rem_2rem_1fr_9rem_10rem_2rem] gap-x-3 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
              <span />
              <span>#</span>
              <span>Label</span>
              <span>Amount (₹)</span>
              <span>Due date</span>
              <span />
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((fieldItem, index) => (
                  <SortableInstallmentRow
                    key={fieldItem.id}
                    id={fieldItem.id}
                    index={index}
                    control={control}
                    canRemove={fields.length > 1}
                    isReadOnly={isReadOnly}
                    onRemove={() => remove(index)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}
      </div>

      <div className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-6 border-t bg-background px-6 py-4 flex flex-wrap items-center gap-3">
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
    </form>
  );
}
