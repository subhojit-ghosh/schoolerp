"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createRole } from "@/server/roles/actions";
import type { PermissionOption } from "@/server/roles/shared";
import { createRoleSchema, type CreateRoleInput } from "@/server/roles/schemas";

type CreateRoleFormProps = {
  permissionOptions: PermissionOption[];
};

export function CreateRoleForm({ permissionOptions }: CreateRoleFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "",
      permissionIds: [],
    },
  });

  function onSubmit(values: CreateRoleInput) {
    startTransition(async () => {
      const result = await createRole(values);
      const nextError =
        result?.serverError ??
        result?.validationErrors?.name?._errors?.[0] ??
        null;
      if (nextError) {
        setServerError(nextError);
        return;
      }

      setServerError(null);
      reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError ? (
        <p className="text-destructive rounded-md bg-destructive/10 px-3 py-2 text-sm">
          {serverError}
        </p>
      ) : null}

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Field>
            <FieldLabel>Role name</FieldLabel>
            <Input {...field} placeholder="Transport Coordinator" />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="permissionIds"
        render={({ field }) => (
          <Field>
            <FieldLabel>Permissions</FieldLabel>
            <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
              {permissionOptions.map((permission) => {
                const checked = field.value.includes(permission.id);
                return (
                  <label
                    key={permission.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(nextChecked) => {
                        field.onChange(
                          nextChecked === true
                            ? [...field.value, permission.id]
                            : field.value.filter((value) => value !== permission.id),
                        );
                      }}
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{permission.slug}</p>
                      {permission.description ? (
                        <p className="text-muted-foreground text-xs">
                          {permission.description}
                        </p>
                      ) : null}
                    </div>
                  </label>
                );
              })}
            </div>
            <FieldError>{errors.permissionIds?.message}</FieldError>
          </Field>
        )}
      />

      <div className="flex items-center justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create custom role"}
        </Button>
      </div>
    </form>
  );
}
