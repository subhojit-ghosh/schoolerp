import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateAssignmentMutation,
  useTransportAssignmentsQuery,
  useUpdateAssignmentMutation,
} from "@/features/transport/api/use-transport";
import {
  DEFAULT_ASSIGNMENT_FORM_VALUES,
  type AssignmentFormValues,
} from "@/features/transport/model/transport-form-schemas";
import { AssignmentForm } from "@/features/transport/ui/assignment-form";
import { appendSearch } from "@/lib/routes";

type AssignmentSheetRouteProps = {
  mode: "create" | "edit";
};

export function AssignmentSheetRoute({ mode }: AssignmentSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const assignmentsQuery = useTransportAssignmentsQuery(
    mode === "edit" && isEnabled,
    { limit: 100 },
  );
  const createMutation = useCreateAssignmentMutation();
  const updateMutation = useUpdateAssignmentMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.TRANSPORT_ASSIGNMENTS, location.search),
    [location.search],
  );

  const editingAssignment = assignmentsQuery.data?.rows?.find(
    (a: { id: string }) => a.id === assignmentId,
  );

  const defaultValues = useMemo<AssignmentFormValues>(() => {
    if (mode === "create" || !editingAssignment) {
      return DEFAULT_ASSIGNMENT_FORM_VALUES;
    }
    return {
      studentId: editingAssignment.studentId,
      routeId: editingAssignment.routeId,
      stopId: editingAssignment.stopId,
      assignmentType: editingAssignment.assignmentType as
        | "pickup"
        | "dropoff"
        | "both",
      startDate: editingAssignment.startDate,
      endDate: editingAssignment.endDate ?? "",
    };
  }, [editingAssignment, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: AssignmentFormValues) {
    if (mode === "create") {
      await createMutation.mutateAsync({
        body: {
          studentId: values.studentId,
          routeId: values.routeId,
          stopId: values.stopId,
          assignmentType: values.assignmentType,
          startDate: values.startDate,
          endDate: values.endDate || undefined,
        },
      });
      toast.success("Student assigned to transport route.");
      void navigate(closeTo);
    } else if (assignmentId) {
      await updateMutation.mutateAsync({
        params: { path: { assignmentId } },
        body: {
          routeId: values.routeId,
          stopId: values.stopId,
          assignmentType: values.assignmentType,
          startDate: values.startDate,
          endDate: values.endDate || undefined,
        },
      });
      toast.success("Assignment updated.");
      void navigate(closeTo);
    }
  }

  const title = mode === "create" ? "New assignment" : "Edit assignment";
  const description =
    mode === "create"
      ? "Assign a student to a transport route."
      : editingAssignment?.studentName ?? "Edit this assignment.";

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <AssignmentForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create assignment" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
