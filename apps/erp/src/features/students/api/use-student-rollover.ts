import { useQueryClient } from "@tanstack/react-query";
import { STUDENTS_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export function usePreviewStudentRolloverMutation() {
  return apiQueryClient.useMutation(
    "post",
    STUDENTS_API_PATHS.ROLLOVER_PREVIEW,
  );
}

export function useExecuteStudentRolloverMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "post",
    STUDENTS_API_PATHS.ROLLOVER_EXECUTE,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions("get", STUDENTS_API_PATHS.LIST)
            .queryKey,
        });

        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            STUDENTS_API_PATHS.OPTIONS,
          ).queryKey,
        });
      },
    },
  );
}
