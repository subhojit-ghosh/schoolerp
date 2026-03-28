import { useEffect } from "react";
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
  admissionEnquiryFormSchema,
  ADMISSION_ENQUIRY_STATUS_OPTIONS,
  type AdmissionEnquiryFormValues,
} from "@/features/admissions/model/admission-form-schema";

type AdmissionEnquiryFormProps = {
  campusName?: string;
  defaultValues: AdmissionEnquiryFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onCancel?: () => void;
  onSubmit: (values: AdmissionEnquiryFormValues) => Promise<void> | void;
  submitLabel: string;
};

function toTitleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdmissionEnquiryForm({
  campusName,
  defaultValues,
  errorMessage,
  isPending = false,
  onCancel,
  onSubmit,
  submitLabel,
}: AdmissionEnquiryFormProps) {
  const { control, handleSubmit, reset } = useForm<AdmissionEnquiryFormValues>({
    resolver: zodResolver(admissionEnquiryFormSchema),
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
          <Controller
            control={control}
            name="studentName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="admission-enquiry-student-name" required>
                  Student name
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admission-enquiry-student-name"
                    placeholder="Student full name"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="guardianName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="admission-enquiry-guardian-name" required>
                  Guardian name
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admission-enquiry-guardian-name"
                    placeholder="Guardian full name"
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
                <FieldLabel htmlFor="admission-enquiry-mobile" required>
                  Mobile
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admission-enquiry-mobile"
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
                <FieldLabel htmlFor="admission-enquiry-email">Email</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admission-enquiry-email"
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
              <FieldLabel>Campus</FieldLabel>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ADMISSION_ENQUIRY_STATUS_OPTIONS.map((status) => (
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
          <Controller
            control={control}
            name="source"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="admission-enquiry-source">
                  Source
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admission-enquiry-source"
                    placeholder="How the family reached your school"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        <Controller
          control={control}
          name="notes"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="admission-enquiry-notes">Notes</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  id="admission-enquiry-notes"
                  placeholder="Optional internal note"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

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
