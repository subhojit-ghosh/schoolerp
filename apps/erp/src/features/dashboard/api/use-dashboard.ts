import { useQueryClient } from "@tanstack/react-query";
import { DASHBOARD_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export function useNeedsAttentionQuery(enabled: boolean) {
  return apiQueryClient.useQuery(
    "get",
    DASHBOARD_API_PATHS.NEEDS_ATTENTION,
    {},
    { enabled },
  );
}

export function useTrendsQuery(enabled: boolean) {
  return apiQueryClient.useQuery(
    "get",
    DASHBOARD_API_PATHS.TRENDS,
    {},
    { enabled },
  );
}

export function useDismissItemMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    DASHBOARD_API_PATHS.DISMISS_ITEM,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            DASHBOARD_API_PATHS.NEEDS_ATTENTION,
            {},
          ).queryKey,
        });
      },
    },
  );
}
