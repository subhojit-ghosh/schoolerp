import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateRouteMutation,
  useTransportRoutesQuery,
  useUpdateRouteMutation,
} from "@/features/transport/api/use-transport";
import {
  DEFAULT_ROUTE_FORM_VALUES,
  type RouteFormValues,
} from "@/features/transport/model/transport-form-schemas";
import { RouteForm } from "@/features/transport/ui/route-form";
import { appendSearch } from "@/lib/routes";

type RouteSheetRouteProps = {
  mode: "create" | "edit";
};

export function RouteSheetRoute({ mode }: RouteSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { routeId } = useParams();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const routesQuery = useTransportRoutesQuery(mode === "edit" && isEnabled, {
    limit: 100,
  });
  const createMutation = useCreateRouteMutation();
  const updateMutation = useUpdateRouteMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.TRANSPORT_ROUTES, location.search),
    [location.search],
  );

  const editingRoute = routesQuery.data?.rows?.find(
    (r: { id: string }) => r.id === routeId,
  );

  const defaultValues = useMemo<RouteFormValues>(() => {
    if (mode === "create" || !editingRoute) {
      return DEFAULT_ROUTE_FORM_VALUES;
    }
    return {
      name: editingRoute.name,
      description: editingRoute.description ?? "",
      campusId: editingRoute.campusId ?? "",
    };
  }, [editingRoute, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: RouteFormValues) {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          body: {
            name: values.name,
            description: values.description || undefined,
            campusId: values.campusId || undefined,
          },
        });
        toast.success("Transport route created.");
        void navigate(closeTo);
      } else if (routeId) {
        await updateMutation.mutateAsync({
          params: { path: { routeId } },
          body: {
            name: values.name,
            description: values.description || undefined,
            campusId: values.campusId || undefined,
          },
        });
        toast.success("Route updated.");
        void navigate(closeTo);
      }
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not save transport route. Please try again.",
        ),
      );
    }
  }

  const title = mode === "create" ? "New route" : "Edit route";
  const description =
    mode === "create"
      ? "Add a transport route."
      : (editingRoute?.name ?? "Edit this route.");

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <RouteForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create route" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
