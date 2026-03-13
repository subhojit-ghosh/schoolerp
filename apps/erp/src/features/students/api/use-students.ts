import { useQueryClient } from "@tanstack/react-query";
import { apiQueryClient } from "@/lib/api/client";
import { STUDENTS_API_PATHS } from "@/features/auth/api/auth.constants";

export function useStudentsQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    STUDENTS_API_PATHS.LIST,
    undefined,
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
        queryKey: apiQueryClient.queryOptions("get", STUDENTS_API_PATHS.LIST).queryKey,
      });
    },
  });
}

export function useStudentQuery(
  institutionId: string | undefined,
  studentId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    STUDENTS_API_PATHS.DETAIL,
    {
      params: {
        path: {
          studentId: studentId ?? "",
        },
      },
    },
    {
      enabled: Boolean(institutionId && studentId),
    },
  );
}

export function useUpdateStudentMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", STUDENTS_API_PATHS.UPDATE, {
    onSuccess: (_, variables) => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", STUDENTS_API_PATHS.LIST).queryKey,
      });

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          STUDENTS_API_PATHS.DETAIL,
          {
            params: {
              path: {
                studentId: variables.params.path.studentId,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}
