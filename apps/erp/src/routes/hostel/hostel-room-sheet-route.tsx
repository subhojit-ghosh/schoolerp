import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateRoomMutation,
  useRoomsQuery,
  useUpdateRoomMutation,
  useBuildingsQuery,
} from "@/features/hostel/api/use-hostel";
import {
  ROOM_DEFAULT_VALUES,
  type RoomFormValues,
} from "@/features/hostel/model/room-form-schema";
import { RoomForm } from "@/features/hostel/ui/room-form";
import { appendSearch } from "@/lib/routes";

type HostelRoomSheetRouteProps = {
  mode: "create" | "edit";
};

export function HostelRoomSheetRoute({ mode }: HostelRoomSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const roomsQuery = useRoomsQuery(mode === "edit" && isEnabled);
  const buildingsQuery = useBuildingsQuery(isEnabled, { limit: 100, status: "active" });
  const createMutation = useCreateRoomMutation();
  const updateMutation = useUpdateRoomMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.HOSTEL_ROOMS, location.search),
    [location.search],
  );

  const buildingsData = buildingsQuery.data;
  const buildingOptions = useMemo(
    () =>
      ((buildingsData?.rows ?? []) as Array<{ id: string; name: string }>),
    [buildingsData?.rows],
  );

  const rows = (roomsQuery.data as { rows?: unknown[] } | undefined)?.rows ?? roomsQuery.data;
  const editingRoom = Array.isArray(rows)
    ? (rows as Array<Record<string, unknown>>).find((c) => c.id === roomId)
    : undefined;

  const defaultValues = useMemo<RoomFormValues>(() => {
    if (mode === "create" || !editingRoom) {
      return ROOM_DEFAULT_VALUES;
    }
    return {
      buildingId: editingRoom.buildingId as string,
      roomNumber: editingRoom.roomNumber as string,
      floor: (editingRoom.floor as number) ?? 0,
      roomType: (editingRoom.roomType as RoomFormValues["roomType"]) ?? "double",
      capacity: (editingRoom.capacity as number) ?? 1,
    };
  }, [editingRoom, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: RoomFormValues) {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          body: {
            buildingId: values.buildingId,
            roomNumber: values.roomNumber,
            floor: values.floor,
            roomType: values.roomType,
            capacity: values.capacity,
          },
        });
        toast.success("Room created.");
        void navigate(closeTo);
      } else if (roomId) {
        await updateMutation.mutateAsync({
          params: { path: { roomId } },
          body: {
            roomNumber: values.roomNumber,
            floor: values.floor,
            roomType: values.roomType,
            capacity: values.capacity,
          },
        });
        toast.success("Room updated.");
        void navigate(closeTo);
      }
    } catch (error) {
      toast.error(extractApiError(error, "Could not save room. Please try again."));
    }
  }

  const title = mode === "create" ? "New room" : "Edit room";
  const description =
    mode === "create"
      ? "Add a new hostel room."
      : (editingRoom?.roomNumber as string) ?? "Edit this room.";

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <RoomForm
        buildings={buildingOptions}
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create room" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
