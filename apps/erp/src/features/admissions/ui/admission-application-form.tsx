import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
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
  admissionApplicationFormSchema,
  ADMISSION_APPLICATION_STATUS_OPTIONS,
  type AdmissionApplicationFormValues,
} from "@/features/admissions/model/admission-form-schema";

type CampusOption = {
  id: string;
  name: string;
};

type EnquiryOption = {
  campusId: string;
  email: string;
  guardianName: string;
  id: string;
  mobile: string;
  studentName: string;
};

type AdmissionApplicationFormProps = {
  campuses: CampusOption[];
  defaultValues: AdmissionApplicationFormValues;
  enableLinkedEnquiryAutofill?: boolean;
  enquiries: EnquiryOption[];
  errorMessage?: string;
  isPending?: boolean;
  onCancel?: () => void;
  onSubmit: (values: AdmissionApplicationFormValues) => Promise<void> | void;
  submitLabel: string;
};

const NO_LINKED_ENQUIRY_VALUE = "__none__";

function toTitleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdmissionApplicationForm({
  campuses,
  defaultValues,
  enableLinkedEnquiryAutofill = false,
  enquiries,
  errorMessage,
  isPending = false,
  onCancel,
  onSubmit,
  submitLabel,
}: AdmissionApplicationFormProps) {
  const hasSingleCampus = campuses.length === 1;
  const hasLinkedEnquiries = enquiries.length > 0;
  const { control, getValues, handleSubmit, reset, setValue } =
    useForm<AdmissionApplicationFormValues>({
      resolver: zodResolver(admissionApplicationFormSchema),
      defaultValues,
    });
  const selectedEnquiryId = useWatch({
    control,
    name: "enquiryId",
  });

  const enquiryMap = useMemo(
    () => new Map(enquiries.map((enquiry) => [enquiry.id, enquiry])),
    [enquiries],
  );

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (campuses.length !== 1) {
      return;
    }

    const defaultCampusId = campuses[0]!.id;
    if (defaultValues.campusId === defaultCampusId) {
      return;
    }

    reset({
      ...defaultValues,
      campusId: defaultCampusId,
    });
  }, [campuses, defaultValues, reset]);

  useEffect(() => {
    if (!enableLinkedEnquiryAutofill || !selectedEnquiryId) {
      return;
    }

    const selectedEnquiry = enquiryMap.get(selectedEnquiryId);

    if (!selectedEnquiry) {
      return;
    }

    const trimmedStudentName = selectedEnquiry.studentName.trim();
    const nameParts = trimmedStudentName.split(/\s+/).filter(Boolean);
    const nextFirstName = nameParts.shift() ?? "";
    const nextLastName = nameParts.join(" ");
    const currentValues = getValues();

    setValue("campusId", selectedEnquiry.campusId, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("studentFirstName", nextFirstName || currentValues.studentFirstName, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("studentLastName", nextLastName, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("guardianName", selectedEnquiry.guardianName, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("mobile", selectedEnquiry.mobile, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("email", selectedEnquiry.email, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [
    enableLinkedEnquiryAutofill,
    enquiryMap,
    getValues,
    selectedEnquiryId,
    setValue,
  ]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="enquiryId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Linked enquiry</FieldLabel>
                <FieldContent>
                  <Select
                    disabled={!hasLinkedEnquiries}
                    onValueChange={(value) =>
                      field.onChange(
                        value === NO_LINKED_ENQUIRY_VALUE ? "" : value,
                      )
                    }
                    value={field.value || NO_LINKED_ENQUIRY_VALUE}
                  >
                    <SelectTrigger
                      aria-invalid={fieldState.invalid}
                      disabled={!hasLinkedEnquiries}
                    >
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={NO_LINKED_ENQUIRY_VALUE}>
                          No linked enquiry
                        </SelectItem>
                        {enquiries.map((enquiry) => (
                          <SelectItem key={enquiry.id} value={enquiry.id}>
                            {enquiry.studentName}
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
            name="campusId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Campus</FieldLabel>
                <FieldContent>
                  <Select
                    disabled={hasSingleCampus}
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger
                      aria-invalid={fieldState.invalid}
                      disabled={hasSingleCampus}
                    >
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {campuses.map((campus) => (
                          <SelectItem key={campus.id} value={campus.id}>
                            {campus.name}
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
            name="studentFirstName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="admission-application-student-first-name">
                  Student first name
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admission-application-student-first-name"
                    placeholder="Student first name"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="studentLastName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="admission-application-student-last-name">
                  Student last name
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admission-application-student-last-name"
                    placeholder="Optional"
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
                <FieldLabel htmlFor="admission-application-guardian-name">
                  Guardian name
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admission-application-guardian-name"
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
                <FieldLabel htmlFor="admission-application-mobile">
                  Mobile
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admission-application-mobile"
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
                <FieldLabel htmlFor="admission-application-email">Email</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admission-application-email"
                    placeholder="Optional guardian email"
                    type="email"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="desiredClassName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="admission-application-class-name">
                  Desired class
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admission-application-class-name"
                    placeholder="Desired class"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="desiredSectionName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="admission-application-section-name">
                  Desired section
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admission-application-section-name"
                    placeholder="Optional section preference"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="status"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Status</FieldLabel>
                <FieldContent>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ADMISSION_APPLICATION_STATUS_OPTIONS.map((status) => (
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

        <Controller
          control={control}
          name="notes"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="admission-application-notes">Notes</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  id="admission-application-notes"
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
