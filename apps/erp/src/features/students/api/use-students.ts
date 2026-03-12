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
          institutionId: institutionId ?? "",
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

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          STUDENTS_API_PATHS.DETAIL,
          {
            params: {
              path: {
                institutionId,
                studentId: variables.params.path.studentId,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}
