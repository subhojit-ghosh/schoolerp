import { useQueryClient } from "@tanstack/react-query";
import { HOSTEL_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

function invalidateHostelLists(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      HOSTEL_API_PATHS.LIST_BUILDINGS,
      { params: { query: {} } },
    ).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", HOSTEL_API_PATHS.LIST_ROOMS, {
      params: { query: {} },
    }).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      HOSTEL_API_PATHS.LIST_ALLOCATIONS,
      { params: { query: {} } },
    ).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      HOSTEL_API_PATHS.LIST_MESS_PLANS,
      { params: { query: {} } },
    ).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      HOSTEL_API_PATHS.LIST_MESS_ASSIGNMENTS,
      { params: { query: {} } },
    ).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      HOSTEL_API_PATHS.LIST_ROOM_TRANSFERS,
      { params: { query: {} } },
    ).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      HOSTEL_API_PATHS.OCCUPANCY_DASHBOARD,
      {},
    ).queryKey,
  });
}

// ── Buildings ────────────────────────────────────────────────────────────────

export function useBuildingsQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    HOSTEL_API_PATHS.LIST_BUILDINGS,
    { params: { query } },
    { enabled },
  );
}

export function useBuildingDetailQuery(enabled: boolean, buildingId?: string) {
  return apiQueryClient.useQuery(
    "get",
    HOSTEL_API_PATHS.GET_BUILDING,
    { params: { path: { buildingId: buildingId! } } },
    { enabled: enabled && Boolean(buildingId) },
  );
}

export function useCreateBuildingMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", HOSTEL_API_PATHS.CREATE_BUILDING, {
    onSuccess: () => {
      invalidateHostelLists(queryClient);
    },
  });
}

export function useUpdateBuildingMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("patch", HOSTEL_API_PATHS.UPDATE_BUILDING, {
    onSuccess: () => {
      invalidateHostelLists(queryClient);
    },
  });
}

export function useUpdateBuildingStatusMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    HOSTEL_API_PATHS.UPDATE_BUILDING_STATUS,
    {
      onSuccess: () => {
        invalidateHostelLists(queryClient);
      },
    },
  );
}

// ── Rooms ────────────────────────────────────────────────────────────────────

export function useRoomsQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    HOSTEL_API_PATHS.LIST_ROOMS,
    { params: { query } },
    { enabled },
  );
}

export function useCreateRoomMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", HOSTEL_API_PATHS.CREATE_ROOM, {
    onSuccess: () => {
      invalidateHostelLists(queryClient);
    },
  });
}

export function useUpdateRoomMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("patch", HOSTEL_API_PATHS.UPDATE_ROOM, {
    onSuccess: () => {
      invalidateHostelLists(queryClient);
    },
  });
}

export function useUpdateRoomStatusMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    HOSTEL_API_PATHS.UPDATE_ROOM_STATUS,
    {
      onSuccess: () => {
        invalidateHostelLists(queryClient);
      },
    },
  );
}

// ── Allocations ──────────────────────────────────────────────────────────────

export function useAllocationsQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    HOSTEL_API_PATHS.LIST_ALLOCATIONS,
    { params: { query } },
    { enabled },
  );
}

export function useCreateAllocationMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    HOSTEL_API_PATHS.CREATE_ALLOCATION,
    {
      onSuccess: () => {
        invalidateHostelLists(queryClient);
      },
    },
  );
}

export function useVacateAllocationMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    HOSTEL_API_PATHS.VACATE_ALLOCATION,
    {
      onSuccess: () => {
        invalidateHostelLists(queryClient);
      },
    },
  );
}

// ── Mess Plans ───────────────────────────────────────────────────────────────

export function useMessPlansQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    HOSTEL_API_PATHS.LIST_MESS_PLANS,
    { params: { query } },
    { enabled },
  );
}

export function useCreateMessPlanMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", HOSTEL_API_PATHS.CREATE_MESS_PLAN, {
    onSuccess: () => {
      invalidateHostelLists(queryClient);
    },
  });
}

export function useUpdateMessPlanMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    HOSTEL_API_PATHS.UPDATE_MESS_PLAN,
    {
      onSuccess: () => {
        invalidateHostelLists(queryClient);
      },
    },
  );
}

export function useUpdateMessPlanStatusMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    HOSTEL_API_PATHS.UPDATE_MESS_PLAN_STATUS,
    {
      onSuccess: () => {
        invalidateHostelLists(queryClient);
      },
    },
  );
}

// ── Mess Assignments ────────────────────────────────────────────────────────

export function useMessAssignmentsQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    HOSTEL_API_PATHS.LIST_MESS_ASSIGNMENTS,
    { params: { query } },
    { enabled },
  );
}

export function useCreateMessAssignmentMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    HOSTEL_API_PATHS.CREATE_MESS_ASSIGNMENT,
    {
      onSuccess: () => {
        invalidateHostelLists(queryClient);
      },
    },
  );
}

export function useDeactivateMessAssignmentMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    HOSTEL_API_PATHS.DEACTIVATE_MESS_ASSIGNMENT,
    {
      onSuccess: () => {
        invalidateHostelLists(queryClient);
      },
    },
  );
}

// ── Room Transfers ──────────────────────────────────────────────────────────

export function useRoomTransfersQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    HOSTEL_API_PATHS.LIST_ROOM_TRANSFERS,
    { params: { query } },
    { enabled },
  );
}

export function useCreateRoomTransferMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    HOSTEL_API_PATHS.CREATE_ROOM_TRANSFER,
    {
      onSuccess: () => {
        invalidateHostelLists(queryClient);
      },
    },
  );
}

// ── Occupancy Dashboard ─────────────────────────────────────────────────────

export function useOccupancyDashboardQuery(enabled: boolean) {
  return apiQueryClient.useQuery(
    "get",
    HOSTEL_API_PATHS.OCCUPANCY_DASHBOARD,
    {},
    { enabled },
  );
}

// ── Batch Allocate ──────────────────────────────────────────────────────────

export function useBatchAllocateMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    HOSTEL_API_PATHS.BATCH_ALLOCATE,
    {
      onSuccess: () => {
        invalidateHostelLists(queryClient);
      },
    },
  );
}
