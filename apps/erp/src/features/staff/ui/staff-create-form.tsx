import type { ReactNode } from "react";
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
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import {
  StaffEmploymentFields,
  StaffPersonalFields,
} from "./staff-profile-fields";

type StaffCreateFormProps = {
  afterFields?: ReactNode;
  campusName?: string;
  defaultValues: StaffCreateFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onCancel?: () => void;
  onSubmit: (values: StaffCreateFormValues) => Promise<void> | void;
  submitLabel: string;
};

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function StaffCreateForm({
  afterFields,
  campusName,
  defaultValues,
  errorMessage,
  isPending = false,
  onCancel,
  onSubmit,
  submitLabel,
}: StaffCreateFormProps) {
  const { control, handleSubmit } = useForm<StaffCreateFormValues>({
    resolver: zodResolver(staffCreateFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-6">
        <Tabs defaultValue="identity">
          <TabsList variant="line" className="w-full justify-start border-b">
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
          </TabsList>

          <TabsContent value="identity">
            <div className="grid gap-4 pt-6 sm:grid-cols-2">
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
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
