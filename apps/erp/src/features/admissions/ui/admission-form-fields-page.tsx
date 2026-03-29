import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ADMISSION_FORM_FIELD_SCOPES,
  ADMISSION_FORM_FIELD_TYPES,
  PERMISSIONS,
} from "@repo/contracts";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { IconPencil, IconPlus, IconRestore } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/ui/button";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
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
  EntityPagePrimaryAction,
} from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  useAdmissionFormFieldsQuery,
  useCreateAdmissionFormFieldMutation,
  useUpdateAdmissionFormFieldMutation,
} from "@/features/admissions/api/use-admissions";
import {
  ADMISSION_FORM_FIELD_BUILDER_DEFAULT_VALUES,
  ADMISSION_FORM_FIELD_SCOPE_OPTIONS,
  ADMISSION_FORM_FIELD_TYPE_OPTIONS,
  admissionFormFieldBuilderSchema,
  getAdmissionFormFieldBuilderDefaultValues,
  slugifyAdmissionFieldKey,
  toAdmissionFormFieldMutationBody,
  type AdmissionFormFieldBuilderValues,
  type AdmissionFormFieldRecord,
} from "@/features/admissions/model/admission-custom-fields";
import {
  getActiveContext,
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { extractApiError } from "@/lib/api-error";
import { ERP_TOAST_MESSAGES } from "@/lib/toast-messages";

function toTitleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdmissionFormFieldsPage() {
  useDocumentTitle("Admission Fields");
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const activeContext = getActiveContext(session);
  const canManageFields =
    isStaffContext(session) &&
    hasPermission(session, PERMISSIONS.ADMISSIONS_MANAGE);
  const fieldsQuery = useAdmissionFormFieldsQuery(institutionId);
  const createFieldMutation =
    useCreateAdmissionFormFieldMutation(institutionId);
  const updateFieldMutation =
    useUpdateAdmissionFormFieldMutation(institutionId);
  const [editingField, setEditingField] =
    useState<AdmissionFormFieldRecord | null>(null);
  const groupedFields = useMemo(() => {
    const fields = fieldsQuery.data?.rows ?? [];

    return {
      application: fields.filter(
        (field) =>
          field.scope === ADMISSION_FORM_FIELD_SCOPES.APPLICATION ||
          field.scope === ADMISSION_FORM_FIELD_SCOPES.BOTH,
      ),
      student: fields.filter(
        (field) =>
          field.scope === ADMISSION_FORM_FIELD_SCOPES.STUDENT ||
          field.scope === ADMISSION_FORM_FIELD_SCOPES.BOTH,
      ),
    };
  }, [fieldsQuery.data?.rows]);
  const { control, formState, handleSubmit, reset, setValue } =
    useForm<AdmissionFormFieldBuilderValues>({
      resolver: zodResolver(admissionFormFieldBuilderSchema),
      mode: "onTouched",
      defaultValues: ADMISSION_FORM_FIELD_BUILDER_DEFAULT_VALUES,
    });
  const labelValue = useWatch({ control, name: "label" });
  const fieldType = useWatch({ control, name: "fieldType" });

  useEffect(() => {
    if (editingField || formState.dirtyFields.key) {
      return;
    }

    setValue("key", slugifyAdmissionFieldKey(labelValue), {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [editingField, formState.dirtyFields.key, labelValue, setValue]);

  useEffect(() => {
    if (fieldType !== ADMISSION_FORM_FIELD_TYPES.SELECT) {
      setValue("optionsText", "", {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [fieldType, setValue]);

  async function onSubmit(values: AdmissionFormFieldBuilderValues) {
    const body = toAdmissionFormFieldMutationBody(values);

    try {
      if (editingField) {
        await updateFieldMutation.mutateAsync({
          params: {
            path: {
              fieldId: editingField.id,
            },
          },
          body,
        });
        toast.success(ERP_TOAST_MESSAGES.updated("Admission field"));
      } else {
        await createFieldMutation.mutateAsync({
          body,
        });
        toast.success(ERP_TOAST_MESSAGES.created("Admission field"));
      }

      setEditingField(null);
      reset(ADMISSION_FORM_FIELD_BUILDER_DEFAULT_VALUES);
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not save admission field. Please try again.",
        ),
      );
    }
  }

  if (!institutionId) {
    return (
      <EntityListPage
        description="Configure extra fields for admission applications and student records."
        title="Admission Fields"
      >
        <div className="p-5 text-sm text-muted-foreground">
          Sign in with an institution-backed session to manage configurable
          admission fields.
        </div>
      </EntityListPage>
    );
  }

  if (!canManageFields) {
    return (
      <EntityListPage
        description="Configure extra fields for admission applications and student records."
        title="Admission Fields"
      >
        <div className="p-5 text-sm text-muted-foreground">
          {isStaffContext(session)
            ? "You do not have permission to manage admission field definitions."
            : `Admission field settings are available in Staff view. You are currently in ${activeContext?.label ?? "another"} view.`}
        </div>
      </EntityListPage>
    );
  }

  const isPending =
    createFieldMutation.isPending || updateFieldMutation.isPending;
  const errorMessage =
    (fieldsQuery.error as Error | null | undefined)?.message ??
    (createFieldMutation.error as Error | null | undefined)?.message ??
    (updateFieldMutation.error as Error | null | undefined)?.message ??
    undefined;

  return (
    <EntityListPage
      actions={
        editingField ? (
          <Button
            onClick={() => {
              setEditingField(null);
              reset(ADMISSION_FORM_FIELD_BUILDER_DEFAULT_VALUES);
            }}
            type="button"
            variant="outline"
          >
            <IconRestore className="size-4" />
            Reset form
          </Button>
        ) : (
          <EntityPagePrimaryAction
            onClick={() => {
              reset(ADMISSION_FORM_FIELD_BUILDER_DEFAULT_VALUES);
              setEditingField(null);
            }}
            type="button"
          >
            <IconPlus className="size-4" />
            New field
          </EntityPagePrimaryAction>
        )
      }
      description="Configure tenant-specific fields for admission applications and student profiles."
      title="Admission Fields"
      toolbar={
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Keep operational fields in the core schema. Use custom fields for
            school-specific details only.
          </p>
        </div>
      }
    >
      <div className="grid gap-6 p-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>
              {editingField ? "Edit custom field" : "New custom field"}
            </CardTitle>
            <CardDescription>
              Define additional fields for applications, student profiles, or
              both.
              {editingField
                ? " Field key and type stay locked after creation so saved records remain readable."
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldGroup className="gap-4">
                <Controller
                  control={control}
                  name="label"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel required>Field label</FieldLabel>
                      <FieldContent>
                        <Input {...field} aria-invalid={fieldState.invalid} />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name="key"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel required>Field key</FieldLabel>
                      <FieldContent>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          disabled={Boolean(editingField)}
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="scope"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel required>Scope</FieldLabel>
                        <FieldContent>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger aria-invalid={fieldState.invalid}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {ADMISSION_FORM_FIELD_SCOPE_OPTIONS.map(
                                  (scope) => (
                                    <SelectItem key={scope} value={scope}>
                                      {toTitleCase(scope)}
                                    </SelectItem>
                                  ),
                                )}
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
                    name="fieldType"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel required>Field type</FieldLabel>
                        <FieldContent>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger
                              aria-invalid={fieldState.invalid}
                              disabled={Boolean(editingField)}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {ADMISSION_FORM_FIELD_TYPE_OPTIONS.map(
                                  (type) => (
                                    <SelectItem key={type} value={type}>
                                      {toTitleCase(type)}
                                    </SelectItem>
                                  ),
                                )}
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
                  name="placeholder"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel>Placeholder</FieldLabel>
                      <FieldContent>
                        <Input {...field} aria-invalid={fieldState.invalid} />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name="helpText"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel>Help text</FieldLabel>
                      <FieldContent>
                        <Input {...field} aria-invalid={fieldState.invalid} />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />

                {fieldType === ADMISSION_FORM_FIELD_TYPES.SELECT ? (
                  <Controller
                    control={control}
                    name="optionsText"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel required>Options</FieldLabel>
                        <FieldContent>
                          <textarea
                            className="min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            onBlur={field.onBlur}
                            onChange={field.onChange}
                            placeholder="One option label per line"
                            ref={field.ref}
                            value={field.value}
                          />
                          <FieldError>{fieldState.error?.message}</FieldError>
                        </FieldContent>
                      </Field>
                    )}
                  />
                ) : null}

                {fieldType === ADMISSION_FORM_FIELD_TYPES.CHECKBOX ? (
                  <p className="text-xs text-muted-foreground">
                    Required checkbox fields must be checked before a form can
                    be submitted.
                  </p>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-3">
                  <Controller
                    control={control}
                    name="sortOrder"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel required>Order</FieldLabel>
                        <FieldContent>
                          <Input
                            aria-invalid={fieldState.invalid}
                            inputMode="numeric"
                            onChange={(event) =>
                              field.onChange(Number(event.target.value || 0))
                            }
                            value={field.value}
                          />
                          <FieldError>{fieldState.error?.message}</FieldError>
                        </FieldContent>
                      </Field>
                    )}
                  />

                  <Controller
                    control={control}
                    name="required"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Required</FieldLabel>
                        <FieldContent>
                          <label className="flex h-10 items-center gap-3 rounded-lg border border-border/70 px-3">
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(Boolean(checked))
                              }
                            />
                            <span className="text-sm">Must be filled</span>
                          </label>
                        </FieldContent>
                      </Field>
                    )}
                  />

                  <Controller
                    control={control}
                    name="active"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Active</FieldLabel>
                        <FieldContent>
                          <label className="flex h-10 items-center gap-3 rounded-lg border border-border/70 px-3">
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(Boolean(checked))
                              }
                            />
                            <span className="text-sm">Visible in forms</span>
                          </label>
                        </FieldContent>
                      </Field>
                    )}
                  />
                </div>

                <FieldError>{errorMessage}</FieldError>

                <div className="flex gap-2">
                  <EntityFormPrimaryAction disabled={isPending} type="submit">
                    {isPending
                      ? "Saving..."
                      : editingField
                        ? "Save changes"
                        : "Create field"}
                  </EntityFormPrimaryAction>
                  <EntityFormSecondaryAction
                    onClick={() => {
                      setEditingField(null);
                      reset(ADMISSION_FORM_FIELD_BUILDER_DEFAULT_VALUES);
                    }}
                    type="button"
                  >
                    Cancel
                  </EntityFormSecondaryAction>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <FieldListCard
            description="Shown on admission application forms and available for application-specific workflows."
            fields={groupedFields.application}
            isLoading={fieldsQuery.isLoading}
            title="Application Fields"
            onEdit={(field) => {
              setEditingField(field);
              reset(getAdmissionFormFieldBuilderDefaultValues(field));
            }}
          />

          <FieldListCard
            description="Shown on student create and edit forms for school-specific profile data."
            fields={groupedFields.student}
            isLoading={fieldsQuery.isLoading}
            title="Student Fields"
            onEdit={(field) => {
              setEditingField(field);
              reset(getAdmissionFormFieldBuilderDefaultValues(field));
            }}
          />
        </div>
      </div>
    </EntityListPage>
  );
}

function FieldListCard({
  description,
  fields,
  isLoading,
  onEdit,
  title,
}: {
  description: string;
  fields: AdmissionFormFieldRecord[];
  isLoading: boolean;
  onEdit: (field: AdmissionFormFieldRecord) => void;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading fields...</p>
        ) : fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No fields configured for this scope yet.
          </p>
        ) : (
          fields.map((field) => (
            <div
              key={field.id}
              className="rounded-xl border border-border/70 bg-card px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{field.label}</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {toTitleCase(field.fieldType)}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {toTitleCase(field.scope)}
                    </span>
                    {!field.active ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Inactive
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Key: {field.key}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Order: {field.sortOrder}{" "}
                    {field.required ? "• Required" : "• Optional"}
                  </p>
                  {field.helpText ? (
                    <p className="text-sm text-muted-foreground">
                      {field.helpText}
                    </p>
                  ) : null}
                </div>

                <Button
                  onClick={() => onEdit(field)}
                  size="sm"
                  variant="outline"
                >
                  <IconPencil className="size-4" />
                  Edit
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
