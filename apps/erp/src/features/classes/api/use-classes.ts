import { useQueryClient } from "@tanstack/react-query";
import { CLASSES_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export function useClassesQuery(enabled: boolean, campusId?: string) {
  return apiQueryClient.useQuery(
    "get",
    CLASSES_API_PATHS.LIST,
    campusId
      ? {
          params: {
            query: {
              campusId,
            },
          },
        }
      : undefined,
    {
      enabled: enabled && Boolean(campusId),
    },
  );
}

export function useCreateClassMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", CLASSES_API_PATHS.CREATE, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", CLASSES_API_PATHS.LIST).queryKey,
      });
    },
  });
}

export function useClassQuery(enabled: boolean, classId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    CLASSES_API_PATHS.DETAIL,
    {
      params: {
        path: {
          classId: classId ?? "",
        },
      },
    },
    {
      enabled: enabled && Boolean(classId),
    },
  );
}

export function useSetClassStatusMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", CLASSES_API_PATHS.SET_STATUS, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", CLASSES_API_PATHS.LIST).queryKey,
      });
    },
  });
}

export function useDeleteClassMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("delete", CLASSES_API_PATHS.DELETE, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", CLASSES_API_PATHS.LIST).queryKey,
      });
    },
  });
}

export function useUpdateClassMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", CLASSES_API_PATHS.UPDATE, {
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", CLASSES_API_PATHS.LIST).queryKey,
      });

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          CLASSES_API_PATHS.DETAIL,
          {
            params: {
              path: {
                classId: variables.params.path.classId,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}
