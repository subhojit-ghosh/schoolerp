import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
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
  examMarksFormSchema,
  type ExamMarksFormValues,
} from "@/features/exams/model/exam-form-schema";

type StudentOption = {
  id: string;
  fullName: string;
  admissionNumber: string;
};

type ExamMarksFormProps = {
  defaultValues: ExamMarksFormValues;
  errorMessage?: string;
  isPending?: boolean;
  students: StudentOption[];
  onSubmit: (values: ExamMarksFormValues) => Promise<void> | void;
};

const DEFAULT_ENTRY: ExamMarksFormValues["entries"][number] = {
  studentId: "",
  subjectName: "",
  maxMarks: 100,
  obtainedMarks: 0,
  remarks: "",
};

function toNumber(value: number) {
  return Number.isNaN(value) ? 0 : value;
}

export function ExamMarksForm({
  defaultValues,
  errorMessage,
  isPending = false,
  students,
  onSubmit,
}: ExamMarksFormProps) {
  const { control, handleSubmit, reset, setValue } =
    useForm<ExamMarksFormValues>({
      resolver: zodResolver(examMarksFormSchema),
      defaultValues,
    });

  const fieldArray = useFieldArray({
    control,
    name: "entries",
  });
  const entries = useWatch({
    control,
    name: "entries",
  });
  const defaultStudentId = students.length === 1 ? students[0]!.id : "";

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (!defaultStudentId) {
      return;
    }

    entries.forEach((entry, index) => {
      if (!entry?.studentId) {
        setValue(`entries.${index}.studentId`, defaultStudentId, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    });
  }, [defaultStudentId, entries, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Marks rows</p>
            <p className="text-xs text-muted-foreground">
              One subject row per student. Save replaces the full list for this
              term.
            </p>
          </div>
          <Button
            disabled={students.length === 0}
            onClick={() =>
              fieldArray.append({
                ...DEFAULT_ENTRY,
                studentId: defaultStudentId,
              })
            }
            size="sm"
            type="button"
            variant="outline"
          >
            <IconPlus data-icon="inline-start" />
            Add row
          </Button>
        </div>

        {fieldArray.fields.map((entry, index) => (
          <div
            key={entry.id}
            className="grid grid-cols-12 gap-4 rounded-xl border bg-muted/20 p-4"
          >
            <Controller
              control={control}
              name={`entries.${index}.studentId`}
              render={({ field, fieldState }) => (
                <Field
                  className="col-span-12 min-w-0 md:col-span-6"
                  data-invalid={fieldState.invalid || undefined}
                >
                  <FieldLabel>Student</FieldLabel>
                  <FieldContent>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <SelectTrigger
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                      >
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.fullName} ({student.admissionNumber})
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
              name={`entries.${index}.subjectName`}
              render={({ field, fieldState }) => (
                <Field
                  className="col-span-12 min-w-0 md:col-span-6"
                  data-invalid={fieldState.invalid || undefined}
                >
                  <FieldLabel>Subject</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      placeholder="Subject name"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              control={control}
              name={`entries.${index}.maxMarks`}
              render={({ field, fieldState }) => (
                <Field
                  className="col-span-6 md:col-span-3"
                  data-invalid={fieldState.invalid || undefined}
                >
                  <FieldLabel>Max</FieldLabel>
                  <FieldContent>
                    <Input
                      aria-invalid={fieldState.invalid}
                      inputMode="numeric"
                      type="number"
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(
                          toNumber(event.currentTarget.valueAsNumber),
                        )
                      }
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              control={control}
              name={`entries.${index}.obtainedMarks`}
              render={({ field, fieldState }) => (
                <Field
                  className="col-span-6 md:col-span-3"
                  data-invalid={fieldState.invalid || undefined}
                >
                  <FieldLabel>Score</FieldLabel>
                  <FieldContent>
                    <Input
                      aria-invalid={fieldState.invalid}
                      inputMode="numeric"
                      type="number"
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(
                          toNumber(event.currentTarget.valueAsNumber),
                        )
                      }
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              control={control}
              name={`entries.${index}.remarks`}
              render={({ field, fieldState }) => (
                <Field
                  className="col-span-12 min-w-0 md:col-span-6"
                  data-invalid={fieldState.invalid || undefined}
                >
                  <FieldLabel>Remarks</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      placeholder="Optional remark"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />

            <div className="col-span-12 flex items-end justify-end">
              <Button
                disabled={fieldArray.fields.length === 1}
                onClick={() => fieldArray.remove(index)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <IconTrash className="size-4" />
              </Button>
            </div>
          </div>
        ))}

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        <Button disabled={isPending || students.length === 0} type="submit">
          Save marks
        </Button>
      </FieldGroup>
    </form>
  );
}
