import { useQueryClient } from "@tanstack/react-query";
import { EMERGENCY_BROADCASTS_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

function invalidateBroadcastLists(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      EMERGENCY_BROADCASTS_API_PATHS.LIST,
      { params: { query: {} } },
    ).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      EMERGENCY_BROADCASTS_API_PATHS.TEMPLATES,
    ).queryKey,
  });
}

// ── Broadcasts ───────────────────────────────────────────────────────────────

export function useBroadcastsQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    EMERGENCY_BROADCASTS_API_PATHS.LIST,
    { params: { query } },
    { enabled },
  );
}

export function useBroadcastDetailQuery(
  enabled: boolean,
  broadcastId?: string,
) {
  return apiQueryClient.useQuery(
    "get",
    EMERGENCY_BROADCASTS_API_PATHS.GET,
    { params: { path: { broadcastId: broadcastId! } } },
    { enabled: enabled && Boolean(broadcastId) },
  );
}

export function useCreateBroadcastMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    EMERGENCY_BROADCASTS_API_PATHS.CREATE,
    {
      onSuccess: () => {
        invalidateBroadcastLists(queryClient);
      },
    },
  );
}

export function useUpdateBroadcastMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    EMERGENCY_BROADCASTS_API_PATHS.UPDATE,
    {
      onSuccess: () => {
        invalidateBroadcastLists(queryClient);
      },
    },
  );
}

export function useSendBroadcastMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    EMERGENCY_BROADCASTS_API_PATHS.SEND,
    {
      onSuccess: () => {
        invalidateBroadcastLists(queryClient);
      },
    },
  );
}

// ── Delivery Logs ────────────────────────────────────────────────────────────

export function useBroadcastDeliveryLogsQuery(
  enabled: boolean,
  broadcastId: string,
) {
  return apiQueryClient.useQuery(
    "get",
    EMERGENCY_BROADCASTS_API_PATHS.DELIVERY_LOGS,
    { params: { path: { broadcastId } } },
    { enabled: enabled && Boolean(broadcastId) },
  );
}

// ── Templates ────────────────────────────────────────────────────────────────

export function useBroadcastTemplatesQuery(enabled: boolean) {
  return apiQueryClient.useQuery(
    "get",
    EMERGENCY_BROADCASTS_API_PATHS.TEMPLATES,
    {},
    { enabled },
  );
}
