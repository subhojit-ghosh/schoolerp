import { useQueryClient } from "@tanstack/react-query";
import { apiQueryClient } from "@/lib/api/client";
import {
  AUTH_API_PATHS,
  CAMPUSES_API_PATHS,
} from "@/features/auth/api/auth.constants";

export function useCampusesQuery(enabled: boolean) {
  return apiQueryClient.useQuery("get", CAMPUSES_API_PATHS.LIST, undefined, {
    enabled,
  });
}

export function useCreateCampusMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", CAMPUSES_API_PATHS.CREATE, {
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions("get", CAMPUSES_API_PATHS.LIST)
            .queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions("get", AUTH_API_PATHS.ME)
            .queryKey,
        }),
      ]);

      await queryClient.refetchQueries({
        queryKey: apiQueryClient.queryOptions("get", AUTH_API_PATHS.ME).queryKey,
        type: "active",
      });
    },
  });
}
