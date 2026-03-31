import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useCreateMaintenanceLogMutation } from "@/features/transport/api/use-transport";
import {
  DEFAULT_MAINTENANCE_LOG_FORM_VALUES,
  type MaintenanceLogFormValues,
} from "@/features/transport/model/transport-form-schemas";
import { MaintenanceLogForm } from "@/features/transport/ui/maintenance-log-form";
import { appendSearch } from "@/lib/routes";

export function MaintenanceLogSheetRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  const createMutation = useCreateMaintenanceLogMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.TRANSPORT_MAINTENANCE, location.search),
    [location.search],
  );

  const isPending = createMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ?? undefined;

  async function handleSubmit(values: MaintenanceLogFormValues) {
    try {
      await createMutation.mutateAsync({
        body: {
          vehicleId: values.vehicleId,
          maintenanceType: values.maintenanceType,
          description: values.description,
          maintenanceDate: values.maintenanceDate,
          costInPaise: values.costInPaise ?? undefined,
          nextDueDate: values.nextDueDate || undefined,
          vendorName: values.vendorName || undefined,
        },
      });
      toast.success("Maintenance log added.");
      void navigate(closeTo);
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not save maintenance log. Please try again.",
        ),
      );
    }
  }

  return (
    <RouteEntitySheet
      closeTo={closeTo}
      description="Record a vehicle maintenance event."
      title="New maintenance log"
    >
      <MaintenanceLogForm
        defaultValues={DEFAULT_MAINTENANCE_LOG_FORM_VALUES}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel="Log maintenance"
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
