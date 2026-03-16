import { useQueryClient } from "@tanstack/react-query";
import { EXAMS_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export function useExamTermsQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery("get", EXAMS_API_PATHS.LIST_TERMS, undefined, {
    enabled: Boolean(institutionId),
  });
}

export function useCreateExamTermMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", EXAMS_API_PATHS.CREATE_TERM, {
    onSuccess: () => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", EXAMS_API_PATHS.LIST_TERMS)
          .queryKey,
      });
    },
  });
}

export function useExamMarksQuery(
  institutionId: string | undefined,
  examTermId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    EXAMS_API_PATHS.LIST_MARKS,
    {
      params: {
        path: {
          examTermId: examTermId ?? "",
        },
      },
    },
    {
      enabled: Boolean(institutionId && examTermId),
    },
  );
}

export function useReplaceExamMarksMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("put", EXAMS_API_PATHS.REPLACE_MARKS, {
    onSuccess: (_, variables) => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          EXAMS_API_PATHS.LIST_MARKS,
          {
            params: {
              path: {
                examTermId: variables.params.path.examTermId,
              },
            },
          },
        ).queryKey,
      });

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", EXAMS_API_PATHS.LIST_TERMS)
          .queryKey,
      });
    },
  });
}

export function useExamReportCardQuery(
  institutionId: string | undefined,
  examTermId: string | undefined,
  studentId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    EXAMS_API_PATHS.REPORT_CARD,
    {
      params: {
        path: {
          examTermId: examTermId ?? "",
        },
        query: {
          studentId: studentId ?? "",
        },
      },
    },
    {
      enabled: Boolean(institutionId && examTermId && studentId),
    },
  );
}
