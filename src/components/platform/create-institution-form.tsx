"use client";

import { useActionState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTES } from "@/constants";
import { createInstitution } from "@/server/institutions/actions";
import {
  createInstitutionSchema,
  INSTITUTION_TYPES,
  type CreateInstitutionInput,
} from "@/server/institutions/schemas";

export function CreateInstitutionForm() {
  const [state, action, isPending] = useActionState(createInstitution, {});

  const {
    control,
    formState: { errors },
  } = useForm<CreateInstitutionInput>({
    resolver: zodResolver(createInstitutionSchema),
    defaultValues: { name: "", slug: "", institutionType: "" },
  });

  const serverError =
    state?.serverError ?? state?.validationErrors?.slug?._errors?.[0];

  return (
    <form action={action} className="flex flex-col gap-5">
      {serverError && (
        <p className="text-destructive rounded-md bg-destructive/10 px-3 py-2 text-sm">
          {serverError}
        </p>
      )}

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input {...field} name="name" placeholder="Springfield Elementary" />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="slug"
        render={({ field }) => (
          <Field>
            <FieldLabel>Subdomain slug</FieldLabel>
            <Input {...field} name="slug" placeholder="springfield-elementary" />
            <FieldError>{errors.slug?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="institutionType"
        render={({ field }) => (
          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              name="institutionType"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{errors.institutionType?.message}</FieldError>
          </Field>
        )}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create institution"}
        </Button>
        <Link href={ROUTES.ADMIN.INSTITUTIONS}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
