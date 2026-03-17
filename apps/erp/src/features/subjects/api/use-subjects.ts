import { useQueryClient } from "@tanstack/react-query";
import { SORT_ORDERS } from "@/constants/query";
import { SUBJECTS_API_PATHS } from "@/features/auth/api/auth.constants";
import { SUBJECT_LIST_SORT_FIELDS } from "@/features/subjects/model/subject-list.constants";
import { apiQueryClient } from "@/lib/api/client";

type SubjectListSort =
  (typeof SUBJECT_LIST_SORT_FIELDS)[keyof typeof SUBJECT_LIST_SORT_FIELDS];

type SubjectsListQuery = {
  campusId?: string;
  limit?: number;
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
  page?: number;
  q?: string;
  sort?: SubjectListSort;
};

export function useSubjectsQuery(
  enabled: boolean,
  queryOrCampusId?: SubjectsListQuery | string,
) {
  const query =
    typeof queryOrCampusId === "string"
      ? { campusId: queryOrCampusId }
      : (queryOrCampusId ?? {});

  return apiQueryClient.useQuery(
    "get",
    SUBJECTS_API_PATHS.LIST,
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

export function useSubjectQuery(enabled: boolean, subjectId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    SUBJECTS_API_PATHS.DETAIL,
    {
      params: {
        path: {
          subjectId: subjectId ?? "",
        },
      },
    },
    {
      enabled: enabled && Boolean(subjectId),
    },
  );
}

export function useCreateSubjectMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", SUBJECTS_API_PATHS.CREATE, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", SUBJECTS_API_PATHS.LIST)
          .queryKey,
      });
    },
  });
}

export function useUpdateSubjectMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", SUBJECTS_API_PATHS.UPDATE, {
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", SUBJECTS_API_PATHS.LIST)
          .queryKey,
      });

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", SUBJECTS_API_PATHS.DETAIL, {
          params: {
            path: {
              subjectId: variables.params.path.subjectId,
            },
          },
        }).queryKey,
      });
    },
  });
}

export function useSetSubjectStatusMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", SUBJECTS_API_PATHS.SET_STATUS, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", SUBJECTS_API_PATHS.LIST)
          .queryKey,
      });
    },
  });
}

export function useDeleteSubjectMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("delete", SUBJECTS_API_PATHS.DELETE, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", SUBJECTS_API_PATHS.LIST)
          .queryKey,
      });
    },
  });
}
