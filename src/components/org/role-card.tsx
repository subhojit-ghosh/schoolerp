"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { archiveRole, updateRolePermissions } from "@/server/roles/actions";
import {
  isEditableInstitutionRole,
  type PermissionOption,
  type RoleRow,
} from "@/server/roles/shared";
import {
  updateRolePermissionsSchema,
  type UpdateRolePermissionsInput,
} from "@/server/roles/schemas";

type RoleCardProps = {
  role: RoleRow;
  permissionOptions: PermissionOption[];
};

export function RoleCard({ role, permissionOptions }: RoleCardProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const editable = isEditableInstitutionRole(role);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateRolePermissionsInput>({
    resolver: zodResolver(updateRolePermissionsSchema),
    defaultValues: {
      roleId: role.id,
      permissionIds: role.permissionIds,
    },
  });

  function onSubmit(values: UpdateRolePermissionsInput) {
    startTransition(async () => {
      const result = await updateRolePermissions(values);
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }

      setServerError(null);
      router.refresh();
    });
  }

  function handleArchive() {
    startTransition(async () => {
      const result = await archiveRole({ roleId: role.id });
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{role.name}</CardTitle>
              <Badge variant="outline">{role.roleType}</Badge>
              <Badge variant={editable ? "default" : "secondary"}>
                {editable ? "Custom" : "Built-in"}
              </Badge>
            </div>
            <CardDescription>
              {role.slug} • {role.activeMemberCount} active members
            </CardDescription>
          </div>
          {editable ? (
            <Button variant="outline" size="sm" disabled={isPending} onClick={handleArchive}>
              Archive role
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editable ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError ? (
              <p className="text-destructive rounded-md bg-destructive/10 px-3 py-2 text-sm">
                {serverError}
              </p>
            ) : null}

            <Controller
              control={control}
              name="permissionIds"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Permissions</FieldLabel>
                  <div className="grid gap-3 md:grid-cols-2">
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

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save permissions"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap gap-2">
            {role.permissionSlugs.map((permissionSlug) => (
              <Badge key={permissionSlug} variant="outline">
                {permissionSlug}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
