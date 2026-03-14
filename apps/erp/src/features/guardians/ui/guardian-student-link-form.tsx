import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/ui/button";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  GUARDIAN_RELATIONSHIP_OPTIONS,
  guardianStudentLinkFormSchema,
  type GuardianStudentLinkFormValues,
} from "@/features/guardians/model/guardian-form-schema";

type StudentOption = {
  id: string;
  fullName: string;
  admissionNumber: string;
  campusName: string;
};

type GuardianStudentLinkFormProps = {
  defaultValues: GuardianStudentLinkFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onDelete?: () => Promise<void> | void;
  onSubmit: (values: GuardianStudentLinkFormValues) => Promise<void> | void;
  showStudentSelect?: boolean;
  students: StudentOption[];
  submitLabel: string;
};

export function GuardianStudentLinkForm({
  defaultValues,
  errorMessage,
  isPending = false,
  onDelete,
  onSubmit,
  showStudentSelect = true,
  students,
  submitLabel,
}: GuardianStudentLinkFormProps) {
  const { control, handleSubmit, reset } =
    useForm<GuardianStudentLinkFormValues>({
      resolver: zodResolver(guardianStudentLinkFormSchema),
      defaultValues,
    });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const selectedStudent = students.find(
    (student) => student.id === defaultValues.studentId,
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        {showStudentSelect ? (
          <Controller
            control={control}
            name="studentId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Student</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.fullName} • {student.admissionNumber}
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
        ) : selectedStudent ? (
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <p className="font-medium">{selectedStudent.fullName}</p>
            <p className="text-muted-foreground">
              {selectedStudent.admissionNumber} • {selectedStudent.campusName}
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Controller
            control={control}
            name="relationship"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Relationship</FieldLabel>
                <FieldContent>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {GUARDIAN_RELATIONSHIP_OPTIONS.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value.charAt(0).toUpperCase() + value.slice(1)}
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
            name="isPrimary"
            render={({ field }) => (
              <div className="flex items-center gap-2 pt-8">
                <Checkbox
                  checked={field.value}
                  id={`primary-${defaultValues.studentId}`}
                  onCheckedChange={field.onChange}
                />
                <Label
                  className="text-sm font-normal"
                  htmlFor={`primary-${defaultValues.studentId}`}
                >
                  Primary
                </Label>
              </div>
            )}
          />
        </div>

        <FieldError>{errorMessage}</FieldError>

        <div className="flex gap-2">
          <Button disabled={isPending} type="submit">
            {isPending ? "Saving..." : submitLabel}
          </Button>
          {onDelete ? (
            <Button
              disabled={isPending}
              onClick={() => void onDelete()}
              type="button"
              variant="outline"
            >
              Unlink
            </Button>
          ) : null}
        </div>
      </FieldGroup>
    </form>
  );
}
