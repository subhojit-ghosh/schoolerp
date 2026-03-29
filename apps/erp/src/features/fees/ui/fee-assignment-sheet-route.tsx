import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useFeeStructuresQuery,
  useFeeStructureQuery,
  useCreateFeeAssignmentMutation,
  useFeeAssignmentQuery,
  useUpdateFeeAssignmentMutation,
} from "@/features/fees/api/use-fees";
import type {
  FeeAssignmentFormValues,
  FeeAssignmentUpdateFormValues,
} from "@/features/fees/model/fee-form-schema";
import { FeeAssignmentForm } from "@/features/fees/ui/fee-assignment-form";
import { useStudentOptionsQuery } from "@/features/students/api/use-students";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const DEFAULT_UPDATE_FORM_VALUES: FeeAssignmentUpdateFormValues = {
  dueDate: "",
  notes: "",
};

type FeeAssignmentSheetRouteProps = {
  mode: "create" | "edit";
};

export function FeeAssignmentSheetRoute({
  mode,
}: FeeAssignmentSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { feeAssignmentId } = useParams();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;

  const [selectedStructureId, setSelectedStructureId] = useState<string>("");

  const structuresQuery = useFeeStructuresQuery(Boolean(institutionId), {
    limit: 100,
    status: "active",
  });
  const studentOptionsQuery = useStudentOptionsQuery(institutionId);
  const feeAssignmentQuery = useFeeAssignmentQuery(
    mode === "edit" && Boolean(institutionId),
    feeAssignmentId,
  );

  // Load installments preview for selected structure
  const selectedStructureQuery = useFeeStructureQuery(
    Boolean(selectedStructureId),
    selectedStructureId || undefined,
  );

  const createMutation = useCreateFeeAssignmentMutation();
  const updateMutation = useUpdateFeeAssignmentMutation();

  const structureOptions = useMemo(
    () =>
      (structuresQuery.data?.rows ?? []).map((s) => ({
        id: s.id,
        label:
          s.installmentCount > 1
            ? `${s.name} (${s.installmentCount} installments)`
            : s.name,
      })),
    [structuresQuery.data?.rows],
  );

  const studentOptions = useMemo(
    () =>
      (studentOptionsQuery.data ?? []).map((s) => ({
        id: s.id,
        label: s.fullName,
      })),
    [studentOptionsQuery.data],
  );

  const installmentPreview = useMemo(
    () => selectedStructureQuery.data?.installments ?? [],
    [selectedStructureQuery.data?.installments],
  );

  const defaultValues = useMemo<
    FeeAssignmentFormValues | FeeAssignmentUpdateFormValues
  >(() => {
    if (mode === "create") {
      return {
        feeStructureId:
          structureOptions.length === 1 ? structureOptions[0]!.id : "",
        studentId: studentOptions.length === 1 ? studentOptions[0]!.id : "",
        notes: "",
      };
    }

    if (!feeAssignmentQuery.data) {
      return DEFAULT_UPDATE_FORM_VALUES;
    }

    const assignment = feeAssignmentQuery.data;

    return {
      dueDate: assignment.dueDate,
      notes: assignment.notes ?? "",
    };
  }, [feeAssignmentQuery.data, mode, structureOptions, studentOptions]);

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    if (structureOptions.length === 1) {
      setSelectedStructureId(structureOptions[0]!.id);
    }
  }, [mode, structureOptions]);

  async function handleSubmit(
    values: FeeAssignmentFormValues | FeeAssignmentUpdateFormValues,
  ) {
    if (!institutionId) return;

    try {
      if (mode === "create") {
        const formValues = values as FeeAssignmentFormValues;
        await createMutation.mutateAsync({
          body: {
            feeStructureId: formValues.feeStructureId,
            studentId: formValues.studentId,
            notes: formValues.notes || null,
          },
        });
        toast.success(
          ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.FEE_ASSIGNMENT),
        );
      } else if (feeAssignmentId) {
        const formValues = values as FeeAssignmentUpdateFormValues;
        await updateMutation.mutateAsync({
          params: { path: { feeAssignmentId } },
          body: {
            dueDate: formValues.dueDate,
            notes: formValues.notes || null,
          },
        });
        toast.success(
          ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.FEE_ASSIGNMENT),
        );
      }

      void navigate(appendSearch(ERP_ROUTES.FEE_ASSIGNMENTS, location.search));
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not save fee assignment. Please try again.",
        ),
      );
    }
  }

  if (mode === "edit" && feeAssignmentQuery.isLoading) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.FEE_ASSIGNMENTS}
        description="Loading assignment details..."
        title="Edit assignment"
      >
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  if (mode === "edit" && !feeAssignmentQuery.data) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.FEE_ASSIGNMENTS}
        description="The requested assignment could not be loaded."
        title="Assignment not found"
      >
        <Card>
          <CardHeader>
            <CardTitle>Not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Return to fee assignments and try again.
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  const errorMessage =
    mode === "create"
      ? ((createMutation.error as Error | null | undefined)?.message ??
        undefined)
      : ((updateMutation.error as Error | null | undefined)?.message ??
        undefined);

  const isPending =
    mode === "create" ? createMutation.isPending : updateMutation.isPending;

  return (
    <RouteEntitySheet
      closeTo={ERP_ROUTES.FEE_ASSIGNMENTS}
      description={
        mode === "create"
          ? "Assign a fee structure to a student. Installments are created automatically."
          : "Update the assignment notes."
      }
      title={mode === "create" ? "New assignment" : "Edit assignment"}
    >
      <FeeAssignmentForm
        mode={mode}
        structures={structureOptions}
        students={studentOptions}
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        installmentPreview={mode === "create" ? installmentPreview : undefined}
        isPending={isPending}
        lockStructure={mode === "edit"}
        lockStudent={mode === "edit"}
        onCancel={() => {
          void navigate(
            appendSearch(ERP_ROUTES.FEE_ASSIGNMENTS, location.search),
          );
        }}
        onStructureChange={setSelectedStructureId}
        onSubmit={handleSubmit}
        submitLabel={mode === "create" ? "Create assignment" : "Save changes"}
      />
    </RouteEntitySheet>
  );
}
