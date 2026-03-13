import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconPlus, IconTrash } from "@tabler/icons-react";
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
  classFormSchema,
  type ClassFormValues,
} from "@/features/classes/model/class-form-schema";

const EMPTY_SECTION: ClassFormValues["sections"][number] = {
  name: "",
};

type CampusOption = {
  id: string;
  name: string;
};

type ClassFormProps = {
  campuses: CampusOption[];
  defaultValues: ClassFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onCancel?: () => void;
  onSubmit: (values: ClassFormValues) => Promise<void> | void;
  submitLabel: string;
};

export function ClassForm({
  campuses,
  defaultValues,
  errorMessage,
  isPending = false,
  onCancel,
  onSubmit,
  submitLabel,
}: ClassFormProps) {
  const { control, handleSubmit, reset } = useForm<ClassFormValues>({
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
        <div className="grid gap-4 sm:grid-cols-2">
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
          <Controller
            control={control}
            name="code"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="class-code">Class code</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="class-code"
                    placeholder="G8"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="campusId"
            render={({ field, fieldState }) => (
              <Field
                className="sm:col-span-2"
                data-invalid={fieldState.invalid || undefined}
              >
                <FieldLabel>Campus</FieldLabel>
                <FieldContent>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <SelectTrigger aria-invalid={fieldState.invalid}>
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
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Sections</p>
              <p className="text-xs text-muted-foreground">
                Keep section setup light for now. Add only the groups needed for admission and roster flows.
              </p>
            </div>
            <Button
              className="gap-1.5"
              onClick={() => sectionsFieldArray.append({ ...EMPTY_SECTION })}
              size="sm"
              type="button"
              variant="outline"
            >
              <IconPlus data-icon="inline-start" />
              Add section
            </Button>
          </div>

          <div className="grid gap-3">
            {sectionsFieldArray.fields.map((section, index) => (
              <div
                key={section.id}
                className="flex items-start gap-3 rounded-xl border bg-muted/20 p-3"
              >
                <Controller
                  control={control}
                  name={`sections.${index}.name`}
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex-1"
                      data-invalid={fieldState.invalid || undefined}
                    >
                      <FieldLabel htmlFor={`section-name-${index}`}>
                        Section name
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id={`section-name-${index}`}
                          placeholder={`Section ${String.fromCharCode(65 + index)}`}
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />
                <Button
                  className="mt-6 shrink-0"
                  disabled={sectionsFieldArray.fields.length === 1}
                  onClick={() => sectionsFieldArray.remove(index)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <IconTrash />
                  <span className="sr-only">Remove section</span>
                </Button>
              </div>
            ))}
          </div>
        </div>

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={isPending} type="submit">
            {isPending ? "Saving..." : submitLabel}
          </Button>
          {onCancel ? (
            <Button disabled={isPending} onClick={onCancel} type="button" variant="outline">
              Cancel
            </Button>
          ) : null}
        </div>
      </FieldGroup>
    </form>
  );
}
