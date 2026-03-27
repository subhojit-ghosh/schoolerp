import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import {
  buildTransportRouteDetailRoute,
} from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateStopMutation,
  useTransportRouteQuery,
  useUpdateStopMutation,
} from "@/features/transport/api/use-transport";
import {
  DEFAULT_STOP_FORM_VALUES,
  type StopFormValues,
} from "@/features/transport/model/transport-form-schemas";
import { StopForm } from "@/features/transport/ui/stop-form";
import { appendSearch } from "@/lib/routes";

type StopSheetRouteProps = {
  mode: "create" | "edit";
};

export function StopSheetRoute({ mode }: StopSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { routeId, stopId } = useParams();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(routeId && session?.activeOrganization?.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeQuery = useTransportRouteQuery(routeId ?? "", isEnabled) as any;
  const createMutation = useCreateStopMutation(routeId ?? "");
  const updateMutation = useUpdateStopMutation(routeId ?? "");

  const closeTo = useMemo(
    () =>
      appendSearch(
        buildTransportRouteDetailRoute(routeId ?? ""),
        location.search,
      ),
    [location.search, routeId],
  );

  const editingStop = routeQuery.data?.stops?.find(
    (s: { id: string }) => s.id === stopId,
  );

  const defaultValues = useMemo<StopFormValues>(() => {
    if (mode === "create" || !editingStop) {
      return DEFAULT_STOP_FORM_VALUES;
    }
    return {
      name: editingStop.name,
      sequenceNumber: editingStop.sequenceNumber,
      pickupTime: editingStop.pickupTime ?? "",
      dropTime: editingStop.dropTime ?? "",
    };
  }, [editingStop, mode]);

  const isPending =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createMutation as any).isPending || (updateMutation as any).isPending;
  const errorMessage =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((createMutation as any).error as Error | null | undefined)?.message ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((updateMutation as any).error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: StopFormValues) {
    if (mode === "create" && routeId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (createMutation as any).mutateAsync({
        params: { path: { routeId } },
        body: {
          name: values.name,
          sequenceNumber: values.sequenceNumber,
          pickupTime: values.pickupTime || undefined,
          dropTime: values.dropTime || undefined,
        },
      });
      toast.success("Stop added to route.");
      void navigate(closeTo);
    } else if (routeId && stopId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (updateMutation as any).mutateAsync({
        params: { path: { routeId, stopId } },
        body: {
          name: values.name,
          sequenceNumber: values.sequenceNumber,
          pickupTime: values.pickupTime || undefined,
          dropTime: values.dropTime || undefined,
        },
      });
      toast.success("Stop updated.");
      void navigate(closeTo);
    }
  }

  const title = mode === "create" ? "New stop" : "Edit stop";
  const description =
    mode === "create"
      ? "Add a stop to this route."
      : editingStop?.name ?? "Edit this stop.";

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <StopForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create stop" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
