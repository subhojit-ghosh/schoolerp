import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import { ERP_ROUTES } from "@/constants/routes";
import { useClassesQuery } from "@/features/classes/api/use-classes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useBulkFeeAssignmentMutation,
  useFeeStructureQuery,
  useFeeStructuresQuery,
} from "@/features/fees/api/use-fees";
import {
  feeBulkAssignmentFormSchema,
  type FeeBulkAssignmentFormValues,
} from "@/features/fees/model/fee-form-schema";
import {
  formatFeeDate,
  formatRupees,
} from "@/features/fees/model/fee-formatters";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";

const DEFAULT_VALUES: FeeBulkAssignmentFormValues = {
  feeStructureId: "",
  classId: "",
  notes: "",
};

export function BulkFeeAssignmentSheetRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const [selectedStructureId, setSelectedStructureId] = useState("");

  const structuresQuery = useFeeStructuresQuery(Boolean(institutionId), {
    limit: 100,
    status: "active",
  });
  const classesQuery = useClassesQuery(Boolean(institutionId), { limit: 100 });
  const selectedStructureQuery = useFeeStructureQuery(
    Boolean(selectedStructureId),
    selectedStructureId || undefined,
  );
  const bulkAssignMutation = useBulkFeeAssignmentMutation();

  const { control, handleSubmit, reset } = useForm<FeeBulkAssignmentFormValues>(
    {
      resolver: zodResolver(feeBulkAssignmentFormSchema),
      mode: "onTouched",
      defaultValues: DEFAULT_VALUES,
    },
  );

  const structureOptions = useMemo(
    () =>
      (structuresQuery.data?.rows ?? []).map((structure) => ({
        id: structure.id,
        label: structure.name,
      })),
    [structuresQuery.data?.rows],
  );

  const classOptions = useMemo(
    () =>
      (classesQuery.data?.rows ?? []).map((schoolClass) => ({
        id: schoolClass.id,
        label: `${schoolClass.name} · ${schoolClass.campusName}`,
      })),
    [classesQuery.data?.rows],
  );

  useEffect(() => {
    const defaultFeeStructureId =
      structureOptions.length === 1 ? structureOptions[0]!.id : "";
    const defaultClassId = classOptions.length === 1 ? classOptions[0]!.id : "";

    reset({
      feeStructureId: defaultFeeStructureId,
      classId: defaultClassId,
      notes: "",
    });
    setSelectedStructureId(defaultFeeStructureId);
  }, [classOptions, reset, structureOptions]);

  async function onSubmit(values: FeeBulkAssignmentFormValues) {
    try {
      const result = await bulkAssignMutation.mutateAsync({
        body: {
          feeStructureId: values.feeStructureId,
          classId: values.classId,
          notes: values.notes || null,
        },
      });

      toast.success(
        `Created ${result.created} assignments, skipped ${result.skipped}`,
      );
      void navigate(appendSearch(ERP_ROUTES.FEE_ASSIGNMENTS, location.search));
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not assign fees in bulk. Please try again.",
        ),
      );
    }
  }

  return (
    <RouteEntitySheet
      closeTo={ERP_ROUTES.FEE_ASSIGNMENTS}
      description="Assign an active fee structure to every student in a class."
      title="Bulk assign"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup className="gap-4">
          <Controller
            control={control}
            name="feeStructureId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>Fee structure</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedStructureId(value);
                    }}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger
                      aria-invalid={fieldState.invalid}
                      className="w-full"
                    >
                      <SelectValue placeholder="Select fee structure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {structureOptions.map((structure) => (
                          <SelectItem key={structure.id} value={structure.id}>
                            {structure.label}
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
                <FieldLabel required>Class</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <SelectTrigger
                      aria-invalid={fieldState.invalid}
                      className="w-full"
                    >
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {classOptions.map((schoolClass) => (
                          <SelectItem
                            key={schoolClass.id}
                            value={schoolClass.id}
                          >
                            {schoolClass.label}
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

          {selectedStructureQuery.data ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Installment preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {selectedStructureQuery.data.installments.map((installment) => (
                  <div
                    key={installment.id}
                    className="flex items-center justify-between"
                  >
                    <span>{installment.label}</span>
                    <span className="text-muted-foreground">
                      {formatRupees(installment.amountInPaise)} · due{" "}
                      {formatFeeDate(installment.dueDate)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Controller
            control={control}
            name="notes"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Notes</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    placeholder="Optional note for all assignments"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />

          <div className="flex items-center gap-3">
            <EntityFormPrimaryAction
              disabled={bulkAssignMutation.isPending}
              type="submit"
            >
              {bulkAssignMutation.isPending ? "Assigning..." : "Assign fees"}
            </EntityFormPrimaryAction>
            <EntityFormSecondaryAction
              disabled={bulkAssignMutation.isPending}
              onClick={() =>
                void navigate(
                  appendSearch(ERP_ROUTES.FEE_ASSIGNMENTS, location.search),
                )
              }
              type="button"
            >
              Cancel
            </EntityFormSecondaryAction>
          </div>
        </FieldGroup>
      </form>
    </RouteEntitySheet>
  );
}
