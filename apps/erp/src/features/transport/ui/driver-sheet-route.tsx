import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateDriverMutation,
  useDriversQuery,
  useUpdateDriverMutation,
} from "@/features/transport/api/use-transport";
import {
  DEFAULT_DRIVER_FORM_VALUES,
  type DriverFormValues,
} from "@/features/transport/model/transport-form-schemas";
import { DriverForm } from "@/features/transport/ui/driver-form";
import { appendSearch } from "@/lib/routes";

type DriverSheetRouteProps = {
  mode: "create" | "edit";
};

export function DriverSheetRoute({ mode }: DriverSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { driverId } = useParams();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const driversQuery = useDriversQuery(mode === "edit" && isEnabled, {
    limit: 100,
  });
  const createMutation = useCreateDriverMutation();
  const updateMutation = useUpdateDriverMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.TRANSPORT_DRIVERS, location.search),
    [location.search],
  );

  const editingDriver = driversQuery.data?.rows?.find(
    (d: { id: string }) => d.id === driverId,
  );

  const defaultValues = useMemo<DriverFormValues>(() => {
    if (mode === "create" || !editingDriver) {
      return DEFAULT_DRIVER_FORM_VALUES;
    }
    return {
      name: editingDriver.name,
      mobile: editingDriver.mobile,
      licenseNumber: editingDriver.licenseNumber ?? "",
      licenseExpiry: editingDriver.licenseExpiry ?? "",
      address: editingDriver.address ?? "",
      emergencyContact: editingDriver.emergencyContact ?? "",
    };
  }, [editingDriver, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: DriverFormValues) {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          body: {
            name: values.name,
            mobile: values.mobile,
            licenseNumber: values.licenseNumber || undefined,
            licenseExpiry: values.licenseExpiry || undefined,
            address: values.address || undefined,
            emergencyContact: values.emergencyContact || undefined,
          },
        });
        toast.success("Driver added.");
        void navigate(closeTo);
      } else if (driverId) {
        await updateMutation.mutateAsync({
          params: { path: { driverId } },
          body: {
            name: values.name,
            mobile: values.mobile,
            licenseNumber: values.licenseNumber || undefined,
            licenseExpiry: values.licenseExpiry || undefined,
            address: values.address || undefined,
            emergencyContact: values.emergencyContact || undefined,
          },
        });
        toast.success("Driver updated.");
        void navigate(closeTo);
      }
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not save driver. Please try again."),
      );
    }
  }

  const title = mode === "create" ? "New driver" : "Edit driver";
  const description =
    mode === "create"
      ? "Add a transport driver."
      : (editingDriver?.name ?? "Edit this driver.");

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <DriverForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create driver" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
