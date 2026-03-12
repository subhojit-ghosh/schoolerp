import { useQueryClient } from "@tanstack/react-query";
import { apiQueryClient } from "@/lib/api/client";
import { STUDENTS_API_PATHS } from "@/features/auth/api/auth.constants";

export function useStudentsQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    STUDENTS_API_PATHS.LIST,
    {
      params: {
        path: {
          institutionId: institutionId ?? "",
        },
      },
    },
    {
      enabled: Boolean(institutionId),
    },
  );
}

export function useCreateStudentMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", STUDENTS_API_PATHS.CREATE, {
    onSuccess: () => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          STUDENTS_API_PATHS.LIST,
          {
            params: {
              path: {
                institutionId,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}
