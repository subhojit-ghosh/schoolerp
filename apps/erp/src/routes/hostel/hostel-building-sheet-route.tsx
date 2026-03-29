import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateBuildingMutation,
  useBuildingsQuery,
  useUpdateBuildingMutation,
} from "@/features/hostel/api/use-hostel";
import {
  BUILDING_DEFAULT_VALUES,
  type BuildingFormValues,
} from "@/features/hostel/model/building-form-schema";
import { BuildingForm } from "@/features/hostel/ui/building-form";
import { appendSearch } from "@/lib/routes";

type HostelBuildingSheetRouteProps = {
  mode: "create" | "edit";
};

export function HostelBuildingSheetRoute({
  mode,
}: HostelBuildingSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { buildingId } = useParams();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const buildingsQuery = useBuildingsQuery(mode === "edit" && isEnabled);
  const createMutation = useCreateBuildingMutation();
  const updateMutation = useUpdateBuildingMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.HOSTEL_BUILDINGS, location.search),
    [location.search],
  );

  const rows =
    (buildingsQuery.data as { rows?: unknown[] } | undefined)?.rows ??
    buildingsQuery.data;
  const editingBuilding = Array.isArray(rows)
    ? (rows as Array<Record<string, unknown>>).find((c) => c.id === buildingId)
    : undefined;

  const defaultValues = useMemo<BuildingFormValues>(() => {
    if (mode === "create" || !editingBuilding) {
      return BUILDING_DEFAULT_VALUES;
    }
    return {
      name: editingBuilding.name as string,
      buildingType:
        editingBuilding.buildingType as BuildingFormValues["buildingType"],
      campusId: (editingBuilding.campusId as string) ?? "",
      wardenMembershipId: (editingBuilding.wardenMembershipId as string) ?? "",
      capacity: (editingBuilding.capacity as number) ?? 0,
      description: (editingBuilding.description as string) ?? "",
    };
  }, [editingBuilding, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: BuildingFormValues) {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          body: {
            name: values.name,
            buildingType: values.buildingType,
            campusId: values.campusId || undefined,
            wardenMembershipId: values.wardenMembershipId || undefined,
            capacity: values.capacity,
            description: values.description || undefined,
          },
        });
        toast.success("Building created.");
        void navigate(closeTo);
      } else if (buildingId) {
        await updateMutation.mutateAsync({
          params: { path: { buildingId } },
          body: {
            name: values.name,
            buildingType: values.buildingType,
            campusId: values.campusId || null,
            wardenMembershipId: values.wardenMembershipId || null,
            capacity: values.capacity,
            description: values.description || null,
          },
        });
        toast.success("Building updated.");
        void navigate(closeTo);
      }
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not save building. Please try again."),
      );
    }
  }

  const title = mode === "create" ? "New building" : "Edit building";
  const description =
    mode === "create"
      ? "Add a new hostel building."
      : ((editingBuilding?.name as string) ?? "Edit this building.");

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <BuildingForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create building" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
