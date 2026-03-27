import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateLeaveTypeMutation,
  useLeaveTypesQuery,
  useUpdateLeaveTypeMutation,
} from "@/features/leave/api/use-leave";
import {
  DEFAULT_LEAVE_TYPE_FORM_VALUES,
  type LeaveTypeFormValues,
} from "@/features/leave/model/leave-form-schemas";
import { LeaveTypeForm } from "@/features/leave/ui/leave-type-form";
import { appendSearch } from "@/lib/routes";

type LeaveTypeSheetRouteProps = {
  mode: "create" | "edit";
};

export function LeaveTypeSheetRoute({ mode }: LeaveTypeSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { leaveTypeId } = useParams();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const typesQuery = useLeaveTypesQuery(mode === "edit" && isEnabled);
  const createMutation = useCreateLeaveTypeMutation();
  const updateMutation = useUpdateLeaveTypeMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.LEAVE_TYPES, location.search),
    [location.search],
  );

  const editingType = typesQuery.data?.find((t) => t.id === leaveTypeId);

  const defaultValues = useMemo<LeaveTypeFormValues>(() => {
    if (mode === "create" || !editingType) {
      return DEFAULT_LEAVE_TYPE_FORM_VALUES;
    }
    return {
      name: editingType.name,
      maxDaysPerYear: editingType.maxDaysPerYear ?? undefined,
      isPaid: editingType.isPaid,
    };
  }, [editingType, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: LeaveTypeFormValues) {
    if (mode === "create") {
      await createMutation.mutateAsync({
        body: {
          name: values.name,
          maxDaysPerYear: values.maxDaysPerYear ?? undefined,
          isPaid: values.isPaid,
        },
      });
      toast.success("Leave type created.");
      void navigate(closeTo);
    } else if (leaveTypeId) {
      await updateMutation.mutateAsync({
        params: { path: { leaveTypeId } },
        body: {
          name: values.name,
          maxDaysPerYear: values.maxDaysPerYear ?? undefined,
          isPaid: values.isPaid,
        },
      });
      toast.success("Leave type updated.");
      void navigate(closeTo);
    }
  }

  const title = mode === "create" ? "New leave type" : "Edit leave type";
  const description =
    mode === "create"
      ? "Define a leave category for staff."
      : editingType?.name ?? "Edit this leave type.";

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <LeaveTypeForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create leave type" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
