import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconPlus } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
  EntityRowAction,
  EntityToolbarSecondaryAction,
} from "@/components/entities/entity-actions";
import { EntitySheet } from "@/components/entities/entity-sheet";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { useClassesQuery } from "@/features/classes/api/use-classes";
import type {
  StaffRoleAssignment,
  StaffRoleOption,
} from "@/features/staff/model/staff-form-schema";

const ALL_SCOPE_VALUE = "__all__";
const UNSELECTED_ROLE_VALUE = "__unselected_role__";

const staffRoleAssignmentSchema = z.object({
  roleId: z
    .string()
    .refine((value) => value !== UNSELECTED_ROLE_VALUE, "Select a role")
    .min(1, "Select a role"),
  campusId: z.uuid().optional().or(z.literal("")),
  classId: z.uuid().optional().or(z.literal("")),
  sectionId: z.uuid().optional().or(z.literal("")),
});

type StaffRoleAssignmentFormValues = z.infer<typeof staffRoleAssignmentSchema>;

type CampusOption = {
  id: string;
  name: string;
};

type ClassOption = {
  id: string;
  name: string;
  status: "active" | "inactive" | "deleted";
  sections: Array<{
    id: string;
    name: string;
  }>;
};

type DeleteDialogState = {
  assignmentId: string;
  roleName: string;
} | null;

type StaffRoleAssignmentsCardProps = {
  campuses: CampusOption[];
  assignments: StaffRoleAssignment[];
  assignmentsErrorMessage?: string;
  canManageAssignments: boolean;
  createErrorMessage?: string;
  deleteErrorMessage?: string;
  isAssignmentsLoading?: boolean;
  isCreating?: boolean;
  isDeleting?: boolean;
  roles: StaffRoleOption[];
  onCreateAssignment: (
    values: StaffRoleAssignmentFormValues,
  ) => Promise<void> | void;
  onDeleteAssignment: (assignmentId: string) => Promise<void> | void;
};

function formatScopeLabel(scope: StaffRoleAssignment["scope"]) {
  const labels = [
    scope.campusName,
    scope.className,
    scope.sectionName,
  ].filter(Boolean);

  if (labels.length === 0) {
    return "Institution-wide access";
  }

  return labels.join(" / ");
}

export function StaffRoleAssignmentsCard({
  campuses,
  assignments,
  assignmentsErrorMessage,
  canManageAssignments,
  createErrorMessage,
  deleteErrorMessage,
  isAssignmentsLoading = false,
  isCreating = false,
  isDeleting = false,
  roles,
  onCreateAssignment,
  onDeleteAssignment,
}: StaffRoleAssignmentsCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null);

  const { control, handleSubmit, reset, setValue } =
    useForm<StaffRoleAssignmentFormValues>({
      resolver: zodResolver(staffRoleAssignmentSchema),
      defaultValues: {
        roleId: UNSELECTED_ROLE_VALUE,
        campusId: "",
        classId: "",
        sectionId: "",
      },
    });

  const selectedCampusId = useWatch({
    control,
    name: "campusId",
  });
  const selectedClassId = useWatch({
    control,
    name: "classId",
  });
  const selectedSectionId = useWatch({
    control,
    name: "sectionId",
  });

  const classesQuery = useClassesQuery(
    Boolean(selectedCampusId),
    selectedCampusId || undefined,
  );

  const classOptions = useMemo(
    () =>
      ((classesQuery.data?.rows ?? []) as ClassOption[]).filter(
        (item) => item.status === "active",
      ),
    [classesQuery.data?.rows],
  );
  const selectedClass = useMemo(
    () => classOptions.find((item) => item.id === selectedClassId) ?? null,
    [classOptions, selectedClassId],
  );
  const sectionOptions = useMemo(
    () => selectedClass?.sections ?? [],
    [selectedClass],
  );

  useEffect(() => {
    if (!selectedCampusId) {
      setValue("classId", "", { shouldDirty: true, shouldValidate: true });
      setValue("sectionId", "", { shouldDirty: true, shouldValidate: true });
      return;
    }

    if (
      selectedClassId &&
      !classOptions.some((classOption) => classOption.id === selectedClassId)
    ) {
      setValue("classId", "", { shouldDirty: true, shouldValidate: true });
      setValue("sectionId", "", { shouldDirty: true, shouldValidate: true });
    }
  }, [classOptions, selectedCampusId, selectedClassId, setValue]);

  useEffect(() => {
    if (!selectedClassId) {
      setValue("sectionId", "", { shouldDirty: true, shouldValidate: true });
      return;
    }

    if (
      selectedSectionId &&
      !sectionOptions.some((section) => section.id === selectedSectionId)
    ) {
      setValue("sectionId", "", { shouldDirty: true, shouldValidate: true });
    }
  }, [sectionOptions, selectedClassId, selectedSectionId, setValue]);

  async function handleCreate(values: StaffRoleAssignmentFormValues) {
    await onCreateAssignment(values);
    reset();
    setIsSheetOpen(false);
  }

  async function handleDelete() {
    if (!deleteDialog) {
      return;
    }

    await onDeleteAssignment(deleteDialog.assignmentId);
    setDeleteDialog(null);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Roles</CardTitle>
            <CardDescription>
              Current role assignments and their campus, class, or section
              scope.
            </CardDescription>
          </div>
          {canManageAssignments ? (
            <EntityToolbarSecondaryAction
              onClick={() => {
                reset();
                setIsSheetOpen(true);
              }}
              type="button"
            >
              <IconPlus className="size-4" />
              Assign role
            </EntityToolbarSecondaryAction>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {isAssignmentsLoading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border/70 px-4 py-4"
              >
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-3 w-48 animate-pulse rounded bg-muted" />
              </div>
            ))
          ) : assignments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
              No role assignments yet.
            </div>
          ) : (
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/70 px-4 py-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{assignment.role.name}</p>
                    <Badge variant="outline">
                      {formatScopeLabel(assignment.scope)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active from {assignment.validFrom}
                  </p>
                </div>
                {canManageAssignments ? (
                  <EntityRowAction
                    className="text-destructive hover:text-destructive"
                    onClick={() =>
                      setDeleteDialog({
                        assignmentId: assignment.id,
                        roleName: assignment.role.name,
                      })
                    }
                    type="button"
                    variant="ghost"
                  >
                    Remove
                  </EntityRowAction>
                ) : null}
              </div>
            ))
          )}

          {assignmentsErrorMessage ? (
            <p className="text-sm text-destructive">{assignmentsErrorMessage}</p>
          ) : null}
          {deleteErrorMessage ? (
            <p className="text-sm text-destructive">{deleteErrorMessage}</p>
          ) : null}
        </CardContent>
      </Card>

      <EntitySheet
        description="Assign a tenant role and optionally narrow it to a campus, class, or section."
        onOpenChange={setIsSheetOpen}
        open={isSheetOpen}
        title="Assign role"
      >
        <form onSubmit={handleSubmit(handleCreate)}>
          <FieldGroup className="gap-6">
            <Controller
              control={control}
              name="roleId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>Role</FieldLabel>
                  <FieldContent>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={UNSELECTED_ROLE_VALUE}>
                            Select role
                          </SelectItem>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
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
              name="campusId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>Campus scope</FieldLabel>
                  <FieldContent>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === ALL_SCOPE_VALUE ? "" : value)
                      }
                      value={field.value || ALL_SCOPE_VALUE}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Institution-wide" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={ALL_SCOPE_VALUE}>
                            Institution-wide
                          </SelectItem>
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

            <Controller
              control={control}
              name="classId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>Class scope</FieldLabel>
                  <FieldContent>
                    <Select
                      disabled={!selectedCampusId}
                      onValueChange={(value) =>
                        field.onChange(value === ALL_SCOPE_VALUE ? "" : value)
                      }
                      value={field.value || ALL_SCOPE_VALUE}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue
                          placeholder={
                            selectedCampusId
                              ? "All classes in selected campus"
                              : "Select campus first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={ALL_SCOPE_VALUE}>
                            All classes in selected campus
                          </SelectItem>
                          {classOptions.map((classOption) => (
                            <SelectItem key={classOption.id} value={classOption.id}>
                              {classOption.name}
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
              name="sectionId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>Section scope</FieldLabel>
                  <FieldContent>
                    <Select
                      disabled={!selectedClassId}
                      onValueChange={(value) =>
                        field.onChange(value === ALL_SCOPE_VALUE ? "" : value)
                      }
                      value={field.value || ALL_SCOPE_VALUE}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue
                          placeholder={
                            selectedClassId
                              ? "All sections in selected class"
                              : "Select class first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={ALL_SCOPE_VALUE}>
                            All sections in selected class
                          </SelectItem>
                          {sectionOptions.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
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

            {createErrorMessage ? (
              <FieldError>{createErrorMessage}</FieldError>
            ) : null}

            <div className="flex gap-2">
              <EntityFormPrimaryAction disabled={isCreating} type="submit">
                {isCreating ? "Assigning..." : "Assign role"}
              </EntityFormPrimaryAction>
              <EntityFormSecondaryAction
                onClick={() => setIsSheetOpen(false)}
                type="button"
              >
                Cancel
              </EntityFormSecondaryAction>
            </div>
          </FieldGroup>
        </form>
      </EntitySheet>

      <ConfirmDialog
        confirmLabel="Remove assignment"
        description={`Remove “${deleteDialog?.roleName ?? "this role"}” from this staff record?`}
        isPending={isDeleting}
        onConfirm={() => {
          void handleDelete();
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog(null);
          }
        }}
        open={Boolean(deleteDialog)}
        title="Remove role assignment"
      />
    </>
  );
}
