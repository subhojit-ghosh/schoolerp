import { useQueryClient } from "@tanstack/react-query";
import { TIMETABLE_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

type TimetableScopeQuery = {
  classId: string;
  sectionId: string;
};

export function useTimetableQuery(
  enabled: boolean,
  query: TimetableScopeQuery,
) {
  return apiQueryClient.useQuery(
    "get",
    TIMETABLE_API_PATHS.VIEW,
    {
      params: {
        query,
      },
    },
    {
      enabled,
    },
  );
}

export function useReplaceTimetableMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "put",
    TIMETABLE_API_PATHS.REPLACE_SECTION,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries();
      },
    },
  );
}

export function useDeleteTimetableEntryMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "delete",
    TIMETABLE_API_PATHS.DELETE_ENTRY,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries();
      },
    },
  );
}
