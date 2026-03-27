import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateVehicleMutation,
  useTransportVehiclesQuery,
  useUpdateVehicleMutation,
} from "@/features/transport/api/use-transport";
import {
  DEFAULT_VEHICLE_FORM_VALUES,
  type VehicleFormValues,
} from "@/features/transport/model/transport-form-schemas";
import { VehicleForm } from "@/features/transport/ui/vehicle-form";
import { appendSearch } from "@/lib/routes";

type VehicleSheetRouteProps = {
  mode: "create" | "edit";
};

export function VehicleSheetRoute({ mode }: VehicleSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vehiclesQuery = useTransportVehiclesQuery(mode === "edit" && isEnabled, {
    limit: 100,
  }) as any;
  const createMutation = useCreateVehicleMutation();
  const updateMutation = useUpdateVehicleMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.TRANSPORT_VEHICLES, location.search),
    [location.search],
  );

  const editingVehicle = vehiclesQuery.data?.rows?.find((v: { id: string }) => v.id === vehicleId);

  const defaultValues = useMemo<VehicleFormValues>(() => {
    if (mode === "create" || !editingVehicle) {
      return DEFAULT_VEHICLE_FORM_VALUES;
    }
    return {
      registrationNumber: editingVehicle.registrationNumber,
      type: editingVehicle.type as "bus" | "van" | "auto",
      capacity: editingVehicle.capacity,
      driverName: editingVehicle.driverName ?? "",
      driverContact: editingVehicle.driverContact ?? "",
      routeId: editingVehicle.routeId ?? "",
    };
  }, [editingVehicle, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: VehicleFormValues) {
    if (mode === "create") {
      await createMutation.mutateAsync({
        body: {
          registrationNumber: values.registrationNumber,
          type: values.type,
          capacity: values.capacity,
          driverName: values.driverName || undefined,
          driverContact: values.driverContact || undefined,
          routeId: values.routeId || undefined,
        },
      });
      toast.success("Vehicle added.");
      void navigate(closeTo);
    } else if (vehicleId) {
      await updateMutation.mutateAsync({
        params: { path: { vehicleId } },
        body: {
          registrationNumber: values.registrationNumber,
          type: values.type,
          capacity: values.capacity,
          driverName: values.driverName || undefined,
          driverContact: values.driverContact || undefined,
          routeId: values.routeId || undefined,
        },
      });
      toast.success("Vehicle updated.");
      void navigate(closeTo);
    }
  }

  const title = mode === "create" ? "New vehicle" : "Edit vehicle";
  const description =
    mode === "create"
      ? "Add a transport vehicle."
      : editingVehicle?.registrationNumber ?? "Edit this vehicle.";

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <VehicleForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create vehicle" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
