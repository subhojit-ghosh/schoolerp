import { useQueryClient } from "@tanstack/react-query";
import { SORT_ORDERS } from "@/constants/query";
import { apiQueryClient } from "@/lib/api/client";
import {
  AUTH_API_PATHS,
  CAMPUSES_API_PATHS,
} from "@/features/auth/api/auth.constants";
import { CAMPUS_LIST_SORT_FIELDS } from "@/features/campuses/model/campus-list.constants";

type CampusesListSort =
  (typeof CAMPUS_LIST_SORT_FIELDS)[keyof typeof CAMPUS_LIST_SORT_FIELDS];

type CampusesListQuery = {
  limit?: number;
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
  page?: number;
  q?: string;
  sort?: CampusesListSort;
};

export function useCampusesQuery(
  institutionId: string | undefined,
  query?: CampusesListQuery,
) {
  return apiQueryClient.useQuery(
    "get",
    CAMPUSES_API_PATHS.LIST,
    query
      ? {
          params: {
            query,
          },
        }
      : undefined,
    {
      enabled: Boolean(institutionId),
    },
  );
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
