import { useQueryClient } from "@tanstack/react-query";
import { HOMEWORK_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export type HomeworkListQuery = {
  q?: string;
  page?: number;
  limit?: number;
  sort?: "dueDate" | "title" | "status" | "createdAt";
  order?: "asc" | "desc";
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  status?: "draft" | "published";
  from?: string;
  to?: string;
};

function invalidateHomeworkQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", HOMEWORK_API_PATHS.LIST)
      .queryKey,
  });
}

export function useHomeworkQuery(
  enabled: boolean,
  query: HomeworkListQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    HOMEWORK_API_PATHS.LIST,
    { params: { query } },
    { enabled },
  );
}

export function useHomeworkDetailQuery(
  enabled: boolean,
  homeworkId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    HOMEWORK_API_PATHS.DETAIL,
    { params: { path: { homeworkId: homeworkId ?? "" } } },
    { enabled: enabled && Boolean(homeworkId) },
  );
}

export function useCreateHomeworkMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", HOMEWORK_API_PATHS.CREATE, {
    onSuccess: () => {
      invalidateHomeworkQueries(queryClient);
    },
  });
}

export function useUpdateHomeworkMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("put", HOMEWORK_API_PATHS.UPDATE, {
    onSuccess: (_, variables) => {
      invalidateHomeworkQueries(queryClient);
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", HOMEWORK_API_PATHS.DETAIL, {
          params: {
            path: { homeworkId: variables.params.path.homeworkId },
          },
        }).queryKey,
      });
    },
  });
}

export function usePublishHomeworkMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", HOMEWORK_API_PATHS.PUBLISH, {
    onSuccess: (_, variables) => {
      invalidateHomeworkQueries(queryClient);
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", HOMEWORK_API_PATHS.DETAIL, {
          params: {
            path: { homeworkId: variables.params.path.homeworkId },
          },
        }).queryKey,
      });
    },
  });
}

export function useDeleteHomeworkMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("delete", HOMEWORK_API_PATHS.DELETE, {
    onSuccess: () => {
      invalidateHomeworkQueries(queryClient);
    },
  });
}
