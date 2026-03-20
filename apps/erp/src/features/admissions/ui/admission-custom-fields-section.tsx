import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { ADMISSION_FORM_FIELD_TYPES } from "@repo/contracts";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import type {
  AdmissionApplicationFormValues,
  AdmissionEnquiryFormValues,
} from "@/features/admissions/model/admission-form-schema";
import type { AdmissionFormFieldRecord } from "@/features/admissions/model/admission-custom-fields";
import type { StudentFormValues } from "@/features/students/model/student-form-schema";

type CustomFieldFormValues =
  | AdmissionApplicationFormValues
  | AdmissionEnquiryFormValues
  | StudentFormValues;

type AdmissionCustomFieldsSectionProps<TFormValues extends FieldValues> = {
  control: Control<TFormValues>;
  fields: AdmissionFormFieldRecord[];
  title?: string;
};

const EMPTY_SELECT_VALUE = "__empty__";

export function AdmissionCustomFieldsSection<
  TFormValues extends CustomFieldFormValues,
>({
  control,
  fields,
  title = "Additional information",
}: AdmissionCustomFieldsSectionProps<TFormValues>) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <FieldGroup className="gap-6">
      <div className="space-y-1">
        <h3 className="text-base font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">
          Capture school-specific information without changing the core record
          structure.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <Controller
            key={field.id}
            control={control}
            name={`customFieldValues.${field.key}` as Path<TFormValues>}
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>
                  {field.label}
                  {field.required ? " *" : ""}
                </FieldLabel>
                <FieldContent>
                  {field.fieldType === ADMISSION_FORM_FIELD_TYPES.SELECT ? (
                    <Select
                      onValueChange={(value) =>
                        controllerField.onChange(
                          value === EMPTY_SELECT_VALUE ? "" : value,
                        )
                      }
                      value={
                        typeof controllerField.value === "string" &&
                        controllerField.value.length > 0
                          ? controllerField.value
                          : undefined
                      }
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue
                          placeholder={field.placeholder ?? "Select"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {field.required ? null : (
                            <SelectItem value={EMPTY_SELECT_VALUE}>
                              None
                            </SelectItem>
                          )}
                          {(field.options ?? []).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : field.fieldType ===
                    ADMISSION_FORM_FIELD_TYPES.CHECKBOX ? (
                    <label className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-3">
                      <Checkbox
                        checked={Boolean(controllerField.value)}
                        onCheckedChange={(checked) =>
                          controllerField.onChange(Boolean(checked))
                        }
                      />
                      <span className="text-sm text-foreground">
                        {field.helpText ?? "Mark as applicable"}
                      </span>
                    </label>
                  ) : field.fieldType ===
                    ADMISSION_FORM_FIELD_TYPES.TEXTAREA ? (
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      name={controllerField.name}
                      onBlur={controllerField.onBlur}
                      onChange={controllerField.onChange}
                      placeholder={field.placeholder ?? undefined}
                      ref={controllerField.ref}
                      value={String(controllerField.value ?? "")}
                    />
                  ) : (
                    <Input
                      aria-invalid={fieldState.invalid}
                      inputMode={resolveInputMode(field.fieldType)}
                      name={controllerField.name}
                      onBlur={controllerField.onBlur}
                      onChange={(event) => {
                        const nextValue =
                          field.fieldType === ADMISSION_FORM_FIELD_TYPES.NUMBER
                            ? event.target.value === ""
                              ? ""
                              : Number(event.target.value)
                            : event.target.value;

                        controllerField.onChange(nextValue);
                      }}
                      placeholder={field.placeholder ?? undefined}
                      ref={controllerField.ref}
                      type={resolveInputType(field.fieldType)}
                      value={
                        typeof controllerField.value === "number"
                          ? String(controllerField.value)
                          : String(controllerField.value ?? "")
                      }
                    />
                  )}
                  {field.helpText &&
                  field.fieldType !== ADMISSION_FORM_FIELD_TYPES.CHECKBOX ? (
                    <p className="text-xs text-muted-foreground">
                      {field.helpText}
                    </p>
                  ) : null}
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        ))}
      </div>
    </FieldGroup>
  );
}

function resolveInputType(fieldType: AdmissionFormFieldRecord["fieldType"]) {
  if (fieldType === ADMISSION_FORM_FIELD_TYPES.NUMBER) {
    return "number";
  }

  if (fieldType === ADMISSION_FORM_FIELD_TYPES.DATE) {
    return "date";
  }

  if (fieldType === ADMISSION_FORM_FIELD_TYPES.EMAIL) {
    return "email";
  }

  if (fieldType === ADMISSION_FORM_FIELD_TYPES.URL) {
    return "url";
  }

  return "text";
}

function resolveInputMode(fieldType: AdmissionFormFieldRecord["fieldType"]) {
  if (fieldType === ADMISSION_FORM_FIELD_TYPES.NUMBER) {
    return "numeric";
  }

  if (fieldType === ADMISSION_FORM_FIELD_TYPES.PHONE) {
    return "tel";
  }

  return undefined;
}
