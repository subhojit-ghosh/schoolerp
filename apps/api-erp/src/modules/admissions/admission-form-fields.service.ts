import { DATABASE } from "@repo/backend-core";
import {
  ADMISSION_FORM_FIELD_SCOPES,
  ADMISSION_FORM_FIELD_TYPES,
  type AdmissionFormFieldOption,
  type AdmissionFormFieldScope,
  type AdmissionFormFieldType,
} from "@repo/contracts";
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  admissionFormFields,
  and,
  asc,
  eq,
  inArray,
} from "@repo/database";
import { randomUUID } from "node:crypto";

const FIELD_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_MIN_LENGTH = 10;

type AdmissionFormFieldRecord = {
  id: string;
  institutionId: string;
  key: string;
  label: string;
  scope: AdmissionFormFieldScope;
  fieldType: AdmissionFormFieldType;
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
  active: boolean;
  options: AdmissionFormFieldOption[] | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type UpsertAdmissionFormFieldInput = {
  key: string;
  label: string;
  scope: AdmissionFormFieldScope;
  fieldType: AdmissionFormFieldType;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  active: boolean;
  options?: AdmissionFormFieldOption[];
  sortOrder?: number;
};

@Injectable()
export class AdmissionFormFieldsService {
  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  async listFields(
    institutionId: string,
    scope?: AdmissionFormFieldScope,
  ): Promise<AdmissionFormFieldRecord[]> {
    return this.getFieldsForInstitution(institutionId, scope);
  }

  async createField(
    institutionId: string,
    input: UpsertAdmissionFormFieldInput,
  ): Promise<AdmissionFormFieldRecord> {
    const normalized = this.normalizeDefinition(input);
    const id = randomUUID();

    try {
      await this.db.insert(admissionFormFields).values({
        id,
        institutionId,
        key: normalized.key,
        label: normalized.label,
        scope: normalized.scope,
        fieldType: normalized.fieldType,
        placeholder: normalized.placeholder,
        helpText: normalized.helpText,
        required: normalized.required,
        active: normalized.active,
        options: normalized.options,
        sortOrder: normalized.sortOrder,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `A custom field with key "${normalized.key}" already exists.`,
        );
      }

      throw error;
    }

    return this.getFieldById(institutionId, id);
  }

  async updateField(
    institutionId: string,
    fieldId: string,
    input: UpsertAdmissionFormFieldInput,
  ): Promise<AdmissionFormFieldRecord> {
    const existingField = await this.getFieldById(institutionId, fieldId);

    if (input.key.trim().toLowerCase() !== existingField.key) {
      throw new BadRequestException(
        "Field key cannot be changed after creation because existing records depend on it.",
      );
    }

    if (input.fieldType !== existingField.fieldType) {
      throw new BadRequestException(
        "Field type cannot be changed after creation because existing records depend on it.",
      );
    }

    const normalized = this.normalizeDefinition(input);

    try {
      await this.db
        .update(admissionFormFields)
        .set({
          key: normalized.key,
          label: normalized.label,
          scope: normalized.scope,
          fieldType: normalized.fieldType,
          placeholder: normalized.placeholder,
          helpText: normalized.helpText,
          required: normalized.required,
          active: normalized.active,
          options: normalized.options,
          sortOrder: normalized.sortOrder,
        })
        .where(
          and(
            eq(admissionFormFields.id, fieldId),
            eq(admissionFormFields.institutionId, institutionId),
          ),
        );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `A custom field with key "${normalized.key}" already exists.`,
        );
      }

      throw error;
    }

    return this.getFieldById(institutionId, fieldId);
  }

  async validateValues(
    institutionId: string,
    scope: Exclude<AdmissionFormFieldScope, "both">,
    inputValues?: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    const values = inputValues ?? {};
    const fieldDefinitions = (
      await this.getFieldsForInstitution(institutionId, scope)
    ).filter((field) => field.active);
    const allowedKeys = new Set(fieldDefinitions.map((field) => field.key));

    for (const key of Object.keys(values)) {
      if (!allowedKeys.has(key)) {
        throw new BadRequestException(`Unknown custom field "${key}".`);
      }
    }

    const normalizedEntries = fieldDefinitions.flatMap((field) => {
      const normalized = this.normalizeValue(field, values[field.key]);
      return normalized === undefined ? [] : [[field.key, normalized] as const];
    });

    return normalizedEntries.length === 0
      ? null
      : Object.fromEntries(normalizedEntries);
  }

  private async getFieldsForInstitution(
    institutionId: string,
    scope?: AdmissionFormFieldScope,
  ) {
    const scopes = scope
      ? scope === ADMISSION_FORM_FIELD_SCOPES.BOTH
        ? [ADMISSION_FORM_FIELD_SCOPES.BOTH]
        : [scope, ADMISSION_FORM_FIELD_SCOPES.BOTH]
      : undefined;

    return this.db
      .select({
        id: admissionFormFields.id,
        institutionId: admissionFormFields.institutionId,
        key: admissionFormFields.key,
        label: admissionFormFields.label,
        scope: admissionFormFields.scope,
        fieldType: admissionFormFields.fieldType,
        placeholder: admissionFormFields.placeholder,
        helpText: admissionFormFields.helpText,
        required: admissionFormFields.required,
        active: admissionFormFields.active,
        options: admissionFormFields.options,
        sortOrder: admissionFormFields.sortOrder,
        createdAt: admissionFormFields.createdAt,
        updatedAt: admissionFormFields.updatedAt,
      })
      .from(admissionFormFields)
      .where(
        and(
          eq(admissionFormFields.institutionId, institutionId),
          scopes ? inArray(admissionFormFields.scope, scopes) : undefined,
        ),
      )
      .orderBy(asc(admissionFormFields.sortOrder), asc(admissionFormFields.label));
  }

  private async getFieldById(institutionId: string, fieldId: string) {
    const [row] = await this.db
      .select({
        id: admissionFormFields.id,
        institutionId: admissionFormFields.institutionId,
        key: admissionFormFields.key,
        label: admissionFormFields.label,
        scope: admissionFormFields.scope,
        fieldType: admissionFormFields.fieldType,
        placeholder: admissionFormFields.placeholder,
        helpText: admissionFormFields.helpText,
        required: admissionFormFields.required,
        active: admissionFormFields.active,
        options: admissionFormFields.options,
        sortOrder: admissionFormFields.sortOrder,
        createdAt: admissionFormFields.createdAt,
        updatedAt: admissionFormFields.updatedAt,
      })
      .from(admissionFormFields)
      .where(
        and(
          eq(admissionFormFields.id, fieldId),
          eq(admissionFormFields.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException("Admission form field not found.");
    }

    return row;
  }

  private normalizeDefinition(input: UpsertAdmissionFormFieldInput) {
    const key = input.key.trim().toLowerCase();
    const label = input.label.trim();
    const placeholder = this.normalizeOptionalString(input.placeholder);
    const helpText = this.normalizeOptionalString(input.helpText);
    const sortOrder = input.sortOrder ?? 0;

    if (!FIELD_KEY_PATTERN.test(key)) {
      throw new BadRequestException(
        "Field key must start with a letter and use lowercase letters, numbers, or underscores only.",
      );
    }

    if (!label) {
      throw new BadRequestException("Field label is required.");
    }

    const options = this.normalizeOptions(input.fieldType, input.options);

    return {
      key,
      label,
      scope: input.scope,
      fieldType: input.fieldType,
      placeholder,
      helpText,
      required: input.required,
      active: input.active,
      options,
      sortOrder,
    };
  }

  private normalizeOptions(
    fieldType: AdmissionFormFieldType,
    options?: AdmissionFormFieldOption[],
  ) {
    if (fieldType !== ADMISSION_FORM_FIELD_TYPES.SELECT) {
      return null;
    }

    const normalizedOptions = (options ?? []).map((option) => ({
      label: option.label.trim(),
      value: option.value.trim(),
    }));

    if (normalizedOptions.length === 0) {
      throw new BadRequestException("Select fields require at least one option.");
    }

    const seenValues = new Set<string>();
    for (const option of normalizedOptions) {
      if (!option.label || !option.value) {
        throw new BadRequestException("Select field options must include label and value.");
      }

      if (seenValues.has(option.value)) {
        throw new BadRequestException(
          `Duplicate option value "${option.value}" is not allowed.`,
        );
      }

      seenValues.add(option.value);
    }

    return normalizedOptions;
  }

  private normalizeValue(
    field: Pick<
      AdmissionFormFieldRecord,
      "fieldType" | "key" | "label" | "options" | "required"
    >,
    value: unknown,
  ): boolean | number | string | undefined {
    if (field.fieldType === ADMISSION_FORM_FIELD_TYPES.CHECKBOX) {
      if (value === undefined || value === null || value === "") {
        if (field.required) {
          throw new BadRequestException(`"${field.label}" must be checked.`);
        }

        return undefined;
      }

      if (typeof value !== "boolean") {
        throw new BadRequestException(`"${field.label}" must be true or false.`);
      }

      if (field.required && value !== true) {
        throw new BadRequestException(`"${field.label}" must be checked.`);
      }

      return value;
    }

    const stringValue =
      typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();

    if (!stringValue) {
      if (field.required) {
        throw new BadRequestException(`"${field.label}" is required.`);
      }

      return undefined;
    }

    if (field.fieldType === ADMISSION_FORM_FIELD_TYPES.NUMBER) {
      const parsed = Number(stringValue);

      if (!Number.isFinite(parsed)) {
        throw new BadRequestException(`"${field.label}" must be a valid number.`);
      }

      return parsed;
    }

    if (field.fieldType === ADMISSION_FORM_FIELD_TYPES.EMAIL) {
      if (!EMAIL_PATTERN.test(stringValue)) {
        throw new BadRequestException(`"${field.label}" must be a valid email.`);
      }
    }

    if (field.fieldType === ADMISSION_FORM_FIELD_TYPES.URL) {
      try {
        new URL(stringValue);
      } catch {
        throw new BadRequestException(`"${field.label}" must be a valid URL.`);
      }
    }

    if (field.fieldType === ADMISSION_FORM_FIELD_TYPES.PHONE) {
      const digits = stringValue.replace(/\D/g, "");
      if (digits.length < PHONE_MIN_LENGTH) {
        throw new BadRequestException(`"${field.label}" must be a valid phone number.`);
      }
    }

    if (field.fieldType === ADMISSION_FORM_FIELD_TYPES.DATE) {
      if (Number.isNaN(Date.parse(stringValue))) {
        throw new BadRequestException(`"${field.label}" must be a valid date.`);
      }
    }

    if (field.fieldType === ADMISSION_FORM_FIELD_TYPES.SELECT) {
      const allowedValues = new Set((field.options ?? []).map((option) => option.value));
      if (!allowedValues.has(stringValue)) {
        throw new BadRequestException(`"${field.label}" has an invalid option.`);
      }
    }

    return stringValue;
  }

  private normalizeOptionalString(value?: string) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
