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
import { updateInstitution } from "@/server/institutions/actions";
import {
  updateInstitutionSchema,
  INSTITUTION_TYPES,
  type UpdateInstitutionInput,
} from "@/server/institutions/schemas";
import type { InstitutionRow } from "@/server/institutions/queries";

type EditInstitutionFormProps = {
  institution: InstitutionRow;
};

export function EditInstitutionForm({ institution }: EditInstitutionFormProps) {
  const boundAction = updateInstitution.bind(null, institution.id);
  const [state, action, isPending] = useActionState(boundAction, null);

  const {
    control,
    formState: { errors },
  } = useForm<UpdateInstitutionInput>({
    resolver: zodResolver(updateInstitutionSchema),
    defaultValues: {
      name: institution.name,
      slug: institution.slug,
      institutionType: institution.institutionType ?? "",
    },
  });

  return (
    <form action={action} className="flex flex-col gap-5">
      {state && "error" in state && (
        <p className="text-destructive rounded-md bg-destructive/10 px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input {...field} name="name" />
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
            <Input {...field} name="slug" />
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
              value={field.value ?? ""}
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
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Link href="/admin/institutions">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
