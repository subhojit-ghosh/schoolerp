import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@repo/ui/components/ui/badge";
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
  guardianFormSchema,
  type GuardianFormValues,
} from "@/features/guardians/model/guardian-form-schema";
import { HONORIFICS } from "@/lib/format";

type GuardianFormProps = {
  campusName?: string;
  defaultValues: GuardianFormValues;
  errorMessage?: string;
  isReadOnly?: boolean;
  isPending?: boolean;
  onCancelEditing?: () => void;
  onStartEditing?: () => void;
  onSubmit: (values: GuardianFormValues) => Promise<void> | void;
  submitLabel?: string;
};

export function GuardianForm({
  campusName,
  defaultValues,
  errorMessage,
  isReadOnly = false,
  isPending = false,
  onCancelEditing,
  onStartEditing,
  onSubmit,
  submitLabel = "Save changes",
}: GuardianFormProps) {
  const { control, handleSubmit, reset } = useForm<GuardianFormValues>({
    resolver: zodResolver(guardianFormSchema),
    mode: "onTouched",
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex gap-3">
            <Controller
              control={control}
              name="honorific"
              render={({ field }) => (
                <Field className="w-[100px] shrink-0">
                  <FieldLabel>Title</FieldLabel>
                  <FieldContent>
                    <Select
                      disabled={isReadOnly || isPending}
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
                  <FieldLabel htmlFor="guardian-name" required>
                    Name
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      disabled={isReadOnly || isPending}
                      id="guardian-name"
                      placeholder="Guardian full name"
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
                <FieldLabel htmlFor="guardian-mobile" required>
                  Mobile
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    disabled={isReadOnly || isPending}
                    id="guardian-mobile"
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
                <FieldLabel htmlFor="guardian-email">Email</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    disabled={isReadOnly || isPending}
                    id="guardian-email"
                    placeholder="Optional guardian email"
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
        </div>

        <FieldError>{errorMessage}</FieldError>

        <div className="flex gap-2">
          {isReadOnly ? (
            <Button onClick={onStartEditing} type="button">
              Edit
            </Button>
          ) : (
            <>
              <Button disabled={isPending} type="submit">
                {isPending ? "Saving..." : submitLabel}
              </Button>
              {onCancelEditing ? (
                <Button
                  disabled={isPending}
                  onClick={() => {
                    reset(defaultValues);
                    onCancelEditing();
                  }}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              ) : null}
            </>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}
