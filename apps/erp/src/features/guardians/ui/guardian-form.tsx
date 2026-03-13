import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  guardianFormSchema,
  type GuardianFormValues,
} from "@/features/guardians/model/guardian-form-schema";

type CampusOption = {
  id: string;
  name: string;
};

type GuardianFormProps = {
  campuses: CampusOption[];
  defaultValues: GuardianFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onSubmit: (values: GuardianFormValues) => Promise<void> | void;
};

export function GuardianForm({
  campuses,
  defaultValues,
  errorMessage,
  isPending = false,
  onSubmit,
}: GuardianFormProps) {
  const { control, handleSubmit, reset } = useForm<GuardianFormValues>({
    resolver: zodResolver(guardianFormSchema),
    defaultValues,
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
                <FieldLabel htmlFor="guardian-name">Name</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="guardian-name"
                    placeholder="Neha Sharma"
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
                <FieldLabel htmlFor="guardian-mobile">Mobile</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="guardian-mobile"
                    inputMode="tel"
                    placeholder="+91 98765 43210"
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
                <FieldLabel htmlFor="guardian-email">Email</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="guardian-email"
                    placeholder="guardian@example.com"
                    type="email"
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
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Primary campus</FieldLabel>
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

        <FieldError>{errorMessage}</FieldError>

        <div className="flex gap-2">
          <Button disabled={isPending} type="submit">
            {isPending ? "Saving..." : "Save guardian"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
