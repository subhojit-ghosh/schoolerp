import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useApplyLeaveMutation } from "@/features/leave/api/use-leave";
import {
  DEFAULT_LEAVE_APPLICATION_FORM_VALUES,
  type LeaveApplicationFormValues,
} from "@/features/leave/model/leave-form-schemas";
import { LeaveApplicationForm } from "@/features/leave/ui/leave-application-form";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";

export function LeaveApplicationSheetRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const applyMutation = useApplyLeaveMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.LEAVE_APPLICATIONS, location.search),
    [location.search],
  );

  const isPending = applyMutation.isPending;
  const errorMessage =
    (applyMutation.error as Error | null | undefined)?.message ?? undefined;

  async function handleSubmit(values: LeaveApplicationFormValues) {
    try {
      await applyMutation.mutateAsync({
        body: {
          leaveTypeId: values.leaveTypeId,
          fromDate: values.fromDate,
          toDate: values.toDate,
          reason: values.reason || undefined,
        },
      });
      toast.success("Leave application submitted.");
      void navigate(closeTo);
    } catch (error) {
      toast.error(extractApiError(error, "Could not submit leave application. Please try again."));
    }
  }

  return (
    <RouteEntitySheet
      closeTo={closeTo}
      description="Submit a new leave request."
      title="New leave application"
    >
      <LeaveApplicationForm
        defaultValues={DEFAULT_LEAVE_APPLICATION_FORM_VALUES}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel="Submit application"
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
