"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createAcademicYear } from "@/server/academic-years/actions";
import {
  createAcademicYearSchema,
  type CreateAcademicYearInput,
} from "@/server/academic-years/schemas";

export function CreateAcademicYearForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAcademicYearInput>({
    resolver: zodResolver(createAcademicYearSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      makeCurrent: false,
    },
  });

  function onSubmit(values: CreateAcademicYearInput) {
    startTransition(async () => {
      const result = await createAcademicYear(values);
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }

      setServerError(null);
      reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 lg:grid-cols-2">
      {serverError ? (
        <p className="text-destructive rounded-md bg-destructive/10 px-3 py-2 text-sm lg:col-span-2">
          {serverError}
        </p>
      ) : null}

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Field>
            <FieldLabel>Academic year name</FieldLabel>
            <Input {...field} placeholder="2026 - 2027" />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="startDate"
        render={({ field }) => (
          <Field>
            <FieldLabel>Start date</FieldLabel>
            <Input {...field} type="date" />
            <FieldError>{errors.startDate?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="endDate"
        render={({ field }) => (
          <Field>
            <FieldLabel>End date</FieldLabel>
            <Input {...field} type="date" />
            <FieldError>{errors.endDate?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="makeCurrent"
        render={({ field }) => (
          <Field orientation="horizontal" className="items-center justify-between rounded-lg border px-4 py-3">
            <FieldLabel>Make this the current academic year</FieldLabel>
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          </Field>
        )}
      />

      <div className="flex items-center justify-end lg:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create academic year"}
        </Button>
      </div>
    </form>
  );
}

