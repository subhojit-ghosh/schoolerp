import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import {
  roleFormSchema,
  type RoleFormValues,
} from "@/features/roles/model/role-form-schema";

type Permission = { id: string; slug: string };

type RoleFormProps = {
  defaultValues: RoleFormValues;
  errorMessage?: string;
  isPending?: boolean;
  isReadOnly?: boolean;
  onCancel?: () => void;
  onSubmit: (values: RoleFormValues) => Promise<void> | void;
  permissions: Permission[] | undefined;
  permissionsLoading?: boolean;
  submitLabel: string;
};

function groupPermissions(permissions: Permission[]) {
  const groups = new Map<string, Permission[]>();
  for (const p of permissions) {
    const group = p.slug.split(":")[0] ?? "other";
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(p);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function formatGroupLabel(group: string) {
  return group.charAt(0).toUpperCase() + group.slice(1).replace(/-/g, " ");
}

function formatPermissionLabel(slug: string) {
  const parts = slug.split(":");
  const action = parts.slice(1).join(":");
  return action.charAt(0).toUpperCase() + action.slice(1).replace(/-/g, " ");
}

export function RoleForm({
  defaultValues,
  errorMessage,
  isPending = false,
  isReadOnly = false,
  onCancel,
  onSubmit,
  permissions,
  permissionsLoading = false,
  submitLabel,
}: RoleFormProps) {
  const { control, handleSubmit } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues,
  });

  const grouped = useMemo(
    () => (permissions ? groupPermissions(permissions) : []),
    [permissions],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-6">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="role-name" required>
                Role name
              </FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  disabled={isReadOnly}
                  id="role-name"
                  placeholder="Custom role name"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="permissionIds"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Permissions</FieldLabel>
              <FieldContent>
                {permissionsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5 rounded-lg border border-border/70 bg-muted/20 p-4">
                    {grouped.map(([group, perms]) => (
                      <div key={group}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {formatGroupLabel(group)}
                        </p>
                        <div className="space-y-2">
                          {perms.map((perm) => {
                            const checked = field.value.includes(perm.id);
                            return (
                              <div
                                key={perm.id}
                                className="flex items-center gap-2"
                              >
                                <Checkbox
                                  checked={checked}
                                  disabled={isReadOnly}
                                  id={`perm-${perm.id}`}
                                  onCheckedChange={(next) => {
                                    const newIds = next
                                      ? [...field.value, perm.id]
                                      : field.value.filter(
                                          (id) => id !== perm.id,
                                        );
                                    field.onChange(newIds);
                                  }}
                                />
                                <Label
                                  className="text-sm font-normal"
                                  htmlFor={`perm-${perm.id}`}
                                >
                                  {formatPermissionLabel(perm.slug)}
                                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                                    {perm.slug}
                                  </span>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <FieldError>{errorMessage}</FieldError>

        {!isReadOnly ? (
          <div className="flex gap-2">
            <EntityFormPrimaryAction disabled={isPending} type="submit">
              {isPending ? "Saving..." : submitLabel}
            </EntityFormPrimaryAction>
            {onCancel ? (
              <EntityFormSecondaryAction onClick={onCancel} type="button">
                Cancel
              </EntityFormSecondaryAction>
            ) : null}
          </div>
        ) : null}
      </FieldGroup>
    </form>
  );
}
