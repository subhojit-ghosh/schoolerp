import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
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
  defaultValues: ClassFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onCancel?: () => void;
  onSubmit: (values: ClassFormValues) => Promise<void> | void;
  submitLabel: string;
};

export function ClassForm({
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

  const sectionsFieldArray = useFieldArray({
    control,
    name: "sections",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-6">
        <div className="grid gap-4">
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="class-name">Class name</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="class-name"
                    placeholder="Grade 8"
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
                Keep section setup light for now. Add only the groups needed for
                admission and roster flows.
              </p>
            </div>
            <EntityToolbarSecondaryAction
              className="gap-1.5"
              onClick={() => sectionsFieldArray.append({ ...EMPTY_SECTION })}
              type="button"
            >
              <IconPlus data-icon="inline-start" />
              Add section
            </EntityToolbarSecondaryAction>
          </div>

          <div className="rounded-lg border divide-y">
            {sectionsFieldArray.fields.map((section, index) => (
              <div
                key={section.id}
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
                          placeholder={`Section ${String.fromCharCode(65 + index)}`}
                          className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />
                <Button
                  className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={sectionsFieldArray.fields.length === 1}
                  onClick={() => sectionsFieldArray.remove(index)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <IconTrash className="size-3.5" />
                  <span className="sr-only">Remove section</span>
                </Button>
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
