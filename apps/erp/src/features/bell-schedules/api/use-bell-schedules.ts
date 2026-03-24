import { useQueryClient } from "@tanstack/react-query";
import { SORT_ORDERS } from "@/constants/query";
import { BELL_SCHEDULES_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export const BELL_SCHEDULE_LIST_SORT_FIELDS = {
  CREATED_AT: "createdAt",
  NAME: "name",
  STATUS: "status",
} as const;

type BellScheduleListSort =
  (typeof BELL_SCHEDULE_LIST_SORT_FIELDS)[keyof typeof BELL_SCHEDULE_LIST_SORT_FIELDS];

type BellSchedulesListQuery = {
  limit?: number;
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
  page?: number;
  q?: string;
  sort?: BellScheduleListSort;
};

export function useBellSchedulesQuery(
  enabled: boolean,
  query: BellSchedulesListQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    BELL_SCHEDULES_API_PATHS.LIST,
    { params: { query } },
    { enabled },
  );
}

export function useBellScheduleQuery(
  enabled: boolean,
  scheduleId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    BELL_SCHEDULES_API_PATHS.DETAIL,
    {
      params: {
        path: {
          scheduleId: scheduleId ?? "",
        },
      },
    },
    {
      enabled: enabled && Boolean(scheduleId),
    },
  );
}

function invalidateBellScheduleQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  scheduleId?: string,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", BELL_SCHEDULES_API_PATHS.LIST)
      .queryKey,
  });

  if (!scheduleId) {
    return;
  }

  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      BELL_SCHEDULES_API_PATHS.DETAIL,
      {
        params: {
          path: {
            scheduleId,
          },
        },
      },
    ).queryKey,
  });
}

export function useCreateBellScheduleMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", BELL_SCHEDULES_API_PATHS.CREATE, {
    onSuccess: (data) => {
      invalidateBellScheduleQueries(queryClient, data.id);
    },
  });
}

export function useUpdateBellScheduleMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("put", BELL_SCHEDULES_API_PATHS.UPDATE, {
    onSuccess: (_, variables) => {
      invalidateBellScheduleQueries(
        queryClient,
        variables.params.path.scheduleId,
      );
    },
  });
}

export function useSetBellScheduleStatusMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "patch",
    BELL_SCHEDULES_API_PATHS.SET_STATUS,
    {
      onSuccess: (_, variables) => {
        invalidateBellScheduleQueries(
          queryClient,
          variables.params.path.scheduleId,
        );
      },
    },
  );
}

export function useReplaceBellSchedulePeriodsMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "put",
    BELL_SCHEDULES_API_PATHS.REPLACE_PERIODS,
    {
      onSuccess: (_, variables) => {
        invalidateBellScheduleQueries(
          queryClient,
          variables.params.path.scheduleId,
        );
      },
    },
  );
}
