import { useQueryClient } from "@tanstack/react-query";
import { CLASSES_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export function useClassesQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    CLASSES_API_PATHS.LIST,
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

export function useCreateClassMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", CLASSES_API_PATHS.CREATE, {
    onSuccess: () => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          CLASSES_API_PATHS.LIST,
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

export function useClassQuery(
  institutionId: string | undefined,
  classId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    CLASSES_API_PATHS.DETAIL,
    {
      params: {
        path: {
          institutionId: institutionId ?? "",
          classId: classId ?? "",
        },
      },
    },
    {
      enabled: Boolean(institutionId && classId),
    },
  );
}

export function useUpdateClassMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", CLASSES_API_PATHS.UPDATE, {
    onSuccess: (_, variables) => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          CLASSES_API_PATHS.LIST,
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
          CLASSES_API_PATHS.DETAIL,
          {
            params: {
              path: {
                institutionId,
                classId: variables.params.path.classId,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}
