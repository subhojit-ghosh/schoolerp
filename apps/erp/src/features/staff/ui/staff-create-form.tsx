import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { type Control, Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { PasswordInput } from "@repo/ui/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  STAFF_STATUS_OPTIONS,
  staffCreateFormSchema,
  type StaffCreateFormValues,
  type StaffFormValues,
} from "@/features/staff/model/staff-form-schema";
import { HONORIFICS } from "@/lib/format";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import {
  StaffEmploymentFields,
  StaffPersonalFields,
} from "./staff-profile-fields";
import { DraftRecoveryBanner } from "@/components/feedback/draft-recovery-banner";
import { useFormAutoSave } from "@/hooks/use-form-auto-save";

type StaffCreateFormProps = {
  afterFields?: ReactNode;
  autoSaveKey?: string;
  campusName?: string;
  defaultValues: StaffCreateFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onAutoSaveReady?: (clearDraft: () => void) => void;
  onCancel?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSubmit: (values: StaffCreateFormValues) => Promise<void> | void;
  submitLabel: string;
};

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function StaffCreateForm({
  afterFields,
  autoSaveKey,
  campusName,
  defaultValues,
  errorMessage,
  isPending = false,
  onAutoSaveReady,
  onCancel,
  onDirtyChange,
  onSubmit,
  submitLabel,
}: StaffCreateFormProps) {
  const { control, handleSubmit, reset, watch, formState } =
    useForm<StaffCreateFormValues>({
      resolver: zodResolver(staffCreateFormSchema),
      mode: "onTouched",
      defaultValues,
    });

  const autoSave = useFormAutoSave({
    key: autoSaveKey ?? "staff-form",
    watch,
    reset,
    isDirty: formState.isDirty,
  });

  const onAutoSaveReadyRef = useRef(onAutoSaveReady);
  onAutoSaveReadyRef.current = onAutoSaveReady;
  useEffect(() => {
    onAutoSaveReadyRef.current?.(autoSave.clearDraft);
  }, [autoSave.clearDraft]);

  const stableOnDirtyChange = useCallback(
    (dirty: boolean) => onDirtyChange?.(dirty),
    [onDirtyChange],
  );

  useEffect(() => {
    stableOnDirtyChange(formState.isDirty);
  }, [formState.isDirty, stableOnDirtyChange]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {autoSaveKey ? (
        <DraftRecoveryBanner
          hasDraft={autoSave.hasDraft}
          onRestore={autoSave.restoreDraft}
          onDiscard={autoSave.discardDraft}
        />
      ) : null}

      <FieldGroup className="gap-6">
        <Tabs defaultValue="identity">
          <TabsList variant="line" className="w-full justify-start border-b">
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
          </TabsList>

          <TabsContent value="identity">
            <div className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="flex gap-3">
                <Controller
                  control={control}
                  name="honorific"
                  render={({ field }) => (
                    <Field className="w-[100px] shrink-0">
                      <FieldLabel>Title</FieldLabel>
                      <FieldContent>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? "" : value)
                          }
                          value={field.value || "none"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="none">None</SelectItem>
                              {HONORIFICS.map((h) => (
                                <SelectItem key={h} value={h}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex-1"
                      data-invalid={fieldState.invalid || undefined}
                    >
                      <FieldLabel htmlFor="staff-name" required>
                        Full name
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="staff-name"
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />
              </div>
              <Controller
                control={control}
                name="mobile"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="staff-mobile" required>
                      Mobile
                    </FieldLabel>
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
              <Controller
                control={control}
                name="temporaryPassword"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="staff-temporary-password" required>
                      Temporary password
                    </FieldLabel>
                    <FieldContent>
                      <PasswordInput
                        {...field}
                        aria-invalid={fieldState.invalid}
                        autoComplete="new-password"
                        id="staff-temporary-password"
                      />
                      <FieldDescription>
                        Staff will be asked to change this on first login.
                      </FieldDescription>
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
                      <Badge
                        className="rounded-md px-3 py-1 font-medium"
                        variant="secondary"
                      >
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
                    <FieldLabel required>Status</FieldLabel>
                    <FieldContent>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
          </TabsContent>

          <TabsContent value="employment">
            <div className="pt-6">
              <StaffEmploymentFields control={control as unknown as Control<StaffFormValues>} />
            </div>
          </TabsContent>

          <TabsContent value="personal">
            <div className="pt-6">
              <StaffPersonalFields control={control as unknown as Control<StaffFormValues>} />
            </div>
          </TabsContent>
        </Tabs>

        {afterFields}

        <FieldError>{errorMessage}</FieldError>
      </FieldGroup>

      <div className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-6 border-t bg-background px-6 py-4 flex items-center gap-3">
        <EntityFormPrimaryAction disabled={isPending} type="submit">
          {isPending ? "Saving..." : submitLabel}
        </EntityFormPrimaryAction>
        {onCancel ? (
          <EntityFormSecondaryAction onClick={onCancel} type="button">
            Cancel
          </EntityFormSecondaryAction>
        ) : null}
      </div>
    </form>
  );
}
