import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconCircleMinus, IconPlus, IconRestore } from "@tabler/icons-react";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
  EntityRowAction,
  EntityToolbarSecondaryAction,
} from "@/components/entities/entity-actions";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import {
  classFormSchema,
  type ClassFormValues,
} from "@/features/classes/model/class-form-schema";

const EMPTY_SECTION: ClassFormValues["sections"][number] = {
  name: "",
};

type ClassFormProps = {
  inactiveSections?: Array<{
    id: string;
    name: string;
  }>;
  defaultValues: ClassFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onCancel?: () => void;
  onSubmit: (values: ClassFormValues) => Promise<void> | void;
  submitLabel: string;
};

export function ClassForm({
  inactiveSections = [],
  defaultValues,
  errorMessage,
  isPending = false,
  onCancel,
  onSubmit,
  submitLabel,
}: ClassFormProps) {
  const { control, handleSubmit, reset, formState } = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues,
  });
  const [localInactiveSections, setLocalInactiveSections] =
    useState(inactiveSections);

  const sectionsFieldArray = useFieldArray({
    control,
    name: "sections",
    keyName: "fieldKey",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    setLocalInactiveSections(inactiveSections);
  }, [inactiveSections]);

  const visibleInactiveSections = localInactiveSections.filter(
    (archivedSection) =>
      !sectionsFieldArray.fields.some(
        (section) => section.id === archivedSection.id,
      ),
  );

  function buildSuggestedSectionName() {
    const usedNames = new Set(
      [
        ...sectionsFieldArray.fields.map((section) => section.name),
        ...localInactiveSections.map((section) => section.name),
      ]
        .map((name) => name.trim().toUpperCase())
        .filter(Boolean),
    );

    for (let index = 0; index < 26; index += 1) {
      const nextName = String.fromCharCode(65 + index);
      if (!usedNames.has(nextName)) {
        return nextName;
      }
    }

    return "";
  }

  function handleDisableSection(index: number) {
    const section = sectionsFieldArray.fields[index];
    const sectionId = section?.id;

    if (sectionId) {
      setLocalInactiveSections((currentSections) => {
        if (
          currentSections.some(
            (currentSection) => currentSection.id === sectionId,
          )
        ) {
          return currentSections;
        }

        return [...currentSections, { id: sectionId, name: section.name }];
      });
    }

    sectionsFieldArray.remove(index);
  }

  function handleRestoreSection(section: { id: string; name: string }) {
    sectionsFieldArray.append({
      id: section.id,
      name: section.name,
    });
    setLocalInactiveSections((currentSections) =>
      currentSections.filter(
        (currentSection) => currentSection.id !== section.id,
      ),
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-6">
        <div className="grid gap-4">
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="class-name" required>Class name</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="class-name"
                    placeholder="Class display name"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Sections</p>
              <p className="text-xs text-muted-foreground">
                Keep only the sections that should stay active for admissions
                and roster flows. Removing an existing section from this list
                deactivates it when you save.
              </p>
            </div>
            <EntityToolbarSecondaryAction
              className="gap-1.5"
              onClick={() =>
                sectionsFieldArray.append({
                  ...EMPTY_SECTION,
                  name: buildSuggestedSectionName(),
                })
              }
              type="button"
            >
              <IconPlus data-icon="inline-start" />
              Add section
            </EntityToolbarSecondaryAction>
          </div>

          <div className="rounded-lg border divide-y">
            {sectionsFieldArray.fields.map((section, index) => (
              <div
                key={section.fieldKey}
                className="flex items-center gap-2 px-3 py-2.5"
              >
                <Controller
                  control={control}
                  name={`sections.${index}.name`}
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex-1"
                      data-invalid={fieldState.invalid || undefined}
                    >
                      <FieldContent>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id={`section-name-${index}`}
                          placeholder="Section name"
                          className="h-8"
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />
                <EntityRowAction
                  className="shrink-0"
                  disabled={sectionsFieldArray.fields.length === 1}
                  onClick={() => handleDisableSection(index)}
                  type="button"
                >
                  <IconCircleMinus
                    data-icon="inline-start"
                    className="size-3.5"
                  />
                  {section.id ? "Disable" : "Remove"}
                </EntityRowAction>
              </div>
            ))}
          </div>
          {formState.errors.sections?.message ? (
            <p className="text-sm text-destructive">
              {formState.errors.sections.message}
            </p>
          ) : formState.errors.sections?.root?.message ? (
            <p className="text-sm text-destructive">
              {formState.errors.sections.root.message}
            </p>
          ) : null}

          {visibleInactiveSections.length > 0 ? (
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Inactive sections</p>
                <p className="text-xs text-muted-foreground">
                  Inactive sections stay out of active flows until you restore
                  them.
                </p>
              </div>
              <div className="rounded-lg border divide-y bg-muted/20">
                {visibleInactiveSections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{section.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Inactive section
                      </p>
                    </div>
                    <EntityRowAction
                      onClick={() => handleRestoreSection(section)}
                      type="button"
                    >
                      <IconRestore
                        data-icon="inline-start"
                        className="size-3.5"
                      />
                      Restore
                    </EntityRowAction>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
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
      </FieldGroup>
    </form>
  );
}
