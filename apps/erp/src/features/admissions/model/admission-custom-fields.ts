import {
  ADMISSION_FORM_FIELD_SCOPES,
  ADMISSION_FORM_FIELD_TYPES,
} from "@repo/contracts";
import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

const REQUIRED_TEXT_MIN_LENGTH = 1;

export type AdmissionFormFieldRecord =
  components["schemas"]["AdmissionFormFieldDto"];
export type AdmissionFormFieldMutationBody =
  components["schemas"]["UpsertAdmissionFormFieldBodyDto"];

export const ADMISSION_FORM_FIELD_SCOPE_OPTIONS = [
  ADMISSION_FORM_FIELD_SCOPES.APPLICATION,
  ADMISSION_FORM_FIELD_SCOPES.STUDENT,
  ADMISSION_FORM_FIELD_SCOPES.BOTH,
] as const;

export const ADMISSION_FORM_FIELD_TYPE_OPTIONS = [
  ADMISSION_FORM_FIELD_TYPES.TEXT,
  ADMISSION_FORM_FIELD_TYPES.TEXTAREA,
  ADMISSION_FORM_FIELD_TYPES.NUMBER,
  ADMISSION_FORM_FIELD_TYPES.DATE,
  ADMISSION_FORM_FIELD_TYPES.SELECT,
  ADMISSION_FORM_FIELD_TYPES.EMAIL,
  ADMISSION_FORM_FIELD_TYPES.PHONE,
  ADMISSION_FORM_FIELD_TYPES.URL,
  ADMISSION_FORM_FIELD_TYPES.CHECKBOX,
] as const;

export const admissionFormFieldBuilderSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(REQUIRED_TEXT_MIN_LENGTH, "Field key is required")
      .regex(
        /^[a-z][a-z0-9_]*$/,
        "Use lowercase letters, numbers, and underscores only",
      ),
    label: z
      .string()
      .trim()
      .min(REQUIRED_TEXT_MIN_LENGTH, "Field label is required"),
    scope: z.enum(ADMISSION_FORM_FIELD_SCOPE_OPTIONS),
    fieldType: z.enum(ADMISSION_FORM_FIELD_TYPE_OPTIONS),
    placeholder: z.string().trim(),
    helpText: z.string().trim(),
    required: z.boolean(),
    active: z.boolean(),
    optionsText: z.string().trim(),
    sortOrder: z.number().int(),
  })
  .superRefine((value, ctx) => {
    if (value.fieldType !== ADMISSION_FORM_FIELD_TYPES.SELECT) {
      return;
    }

    const options = parseOptionsText(value.optionsText);

    if (options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one option",
        path: ["optionsText"],
      });
      return;
    }

    const seenValues = new Set<string>();

    for (const option of options) {
      if (seenValues.has(option.value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate option "${option.label}" is not allowed`,
          path: ["optionsText"],
        });
        return;
      }

      seenValues.add(option.value);
    }
  });

export type AdmissionFormFieldBuilderValues = z.infer<
  typeof admissionFormFieldBuilderSchema
>;

export const ADMISSION_FORM_FIELD_BUILDER_DEFAULT_VALUES: AdmissionFormFieldBuilderValues =
  {
    key: "",
    label: "",
    scope: ADMISSION_FORM_FIELD_SCOPES.APPLICATION,
    fieldType: ADMISSION_FORM_FIELD_TYPES.TEXT,
    placeholder: "",
    helpText: "",
    required: false,
    active: true,
    optionsText: "",
    sortOrder: 0,
  };

export function toAdmissionFormFieldMutationBody(
  values: AdmissionFormFieldBuilderValues,
): AdmissionFormFieldMutationBody {
  return {
    key: values.key,
    label: values.label,
    scope: values.scope,
    fieldType: values.fieldType,
    placeholder: values.placeholder || undefined,
    helpText: values.helpText || undefined,
    required: values.required,
    active: values.active,
    options:
      values.fieldType === ADMISSION_FORM_FIELD_TYPES.SELECT
        ? parseOptionsText(values.optionsText)
        : undefined,
    sortOrder: values.sortOrder,
  };
}

export function getAdmissionFormFieldBuilderDefaultValues(
  field?: AdmissionFormFieldRecord,
): AdmissionFormFieldBuilderValues {
  if (!field) {
    return ADMISSION_FORM_FIELD_BUILDER_DEFAULT_VALUES;
  }

  return {
    key: field.key,
    label: field.label,
    scope: field.scope,
    fieldType: field.fieldType,
    placeholder: field.placeholder ?? "",
    helpText: field.helpText ?? "",
    required: field.required,
    active: field.active,
    optionsText: formatOptionsText(field.options),
    sortOrder: field.sortOrder,
  };
}

export function normalizeCustomFieldValues(
  fields: AdmissionFormFieldRecord[],
  values?: Record<string, unknown> | null,
) {
  const normalized = { ...(values ?? {}) } as Record<string, unknown>;

  for (const field of fields) {
    if (
      !(field.key in normalized) &&
      field.fieldType === ADMISSION_FORM_FIELD_TYPES.CHECKBOX
    ) {
      normalized[field.key] = false;
    }
  }

  return normalized;
}

export function filterAdmissionFormFieldsForScope(
  fields: AdmissionFormFieldRecord[],
  scope: "application" | "student",
) {
  return fields.filter(
    (field) =>
      field.active &&
      (field.scope === scope ||
        field.scope === ADMISSION_FORM_FIELD_SCOPES.BOTH),
  );
}

export function slugifyAdmissionFieldKey(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

function parseOptionsText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      label: line,
      value: slugifyAdmissionFieldKey(line),
    }));
}

function formatOptionsText(
  options?: Array<{ label: string; value: string }> | null,
) {
  return (options ?? []).map((option) => option.label).join("\n");
}
