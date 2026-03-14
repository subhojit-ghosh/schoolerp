import { useQueryClient } from "@tanstack/react-query";
import { SORT_ORDERS } from "@/constants/query";
import { CLASSES_API_PATHS } from "@/features/auth/api/auth.constants";
import { CLASS_LIST_SORT_FIELDS } from "@/features/classes/model/class-list.constants";
import { apiQueryClient } from "@/lib/api/client";

type ClassesListSort =
  (typeof CLASS_LIST_SORT_FIELDS)[keyof typeof CLASS_LIST_SORT_FIELDS];

type ClassesListQuery = {
  campusId?: string;
  limit?: number;
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
  page?: number;
  q?: string;
  sort?: ClassesListSort;
};

export function useClassesQuery(
  enabled: boolean,
  queryOrCampusId?: ClassesListQuery | string,
) {
  const query =
    typeof queryOrCampusId === "string"
      ? { campusId: queryOrCampusId }
      : (queryOrCampusId ?? {});

  return apiQueryClient.useQuery(
    "get",
    CLASSES_API_PATHS.LIST,
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

export function useCreateClassMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", CLASSES_API_PATHS.CREATE, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", CLASSES_API_PATHS.LIST)
          .queryKey,
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
        queryKey: apiQueryClient.queryOptions("get", CLASSES_API_PATHS.LIST)
          .queryKey,
      });
    },
  });
}

export function useDeleteClassMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("delete", CLASSES_API_PATHS.DELETE, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", CLASSES_API_PATHS.LIST)
          .queryKey,
      });
    },
  });
}

export function useUpdateClassMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", CLASSES_API_PATHS.UPDATE, {
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", CLASSES_API_PATHS.LIST)
          .queryKey,
      });

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", CLASSES_API_PATHS.DETAIL, {
          params: {
            path: {
              classId: variables.params.path.classId,
            },
          },
        }).queryKey,
      });
    },
  });
}
