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

export function useGradingScalesQuery(enabled: boolean) {
  return apiQueryClient.useQuery(
    "get",
    EXAMS_API_PATHS.LIST_GRADING_SCALES,
    undefined,
    { enabled },
  );
}

export function useCreateGradingScaleMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    EXAMS_API_PATHS.CREATE_GRADING_SCALE,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            EXAMS_API_PATHS.LIST_GRADING_SCALES,
          ).queryKey,
        });
      },
    },
  );
}

export function useUpdateGradingScaleMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    EXAMS_API_PATHS.UPDATE_GRADING_SCALE,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            EXAMS_API_PATHS.LIST_GRADING_SCALES,
          ).queryKey,
        });
      },
    },
  );
}

export function useSetDefaultGradingScaleMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    EXAMS_API_PATHS.SET_DEFAULT_GRADING_SCALE,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            EXAMS_API_PATHS.LIST_GRADING_SCALES,
          ).queryKey,
        });
      },
    },
  );
}

export function useClassAnalysisQuery(
  examTermId: string | undefined,
  classId: string | undefined,
  sectionId?: string,
) {
  return apiQueryClient.useQuery(
    "get",
    EXAMS_API_PATHS.CLASS_ANALYSIS,
    {
      params: {
        path: { examTermId: examTermId ?? "" },
        query: {
          classId: classId ?? "",
          ...(sectionId ? { sectionId } : {}),
        },
      },
    },
    { enabled: Boolean(examTermId && classId) },
  );
}

export function useRanksQuery(
  examTermId: string | undefined,
  classId: string | undefined,
  sectionId?: string,
) {
  return apiQueryClient.useQuery(
    "get",
    EXAMS_API_PATHS.RANKS,
    {
      params: {
        path: { examTermId: examTermId ?? "" },
        query: {
          classId: classId ?? "",
          ...(sectionId ? { sectionId } : {}),
        },
      },
    },
    { enabled: Boolean(examTermId && classId) },
  );
}

export function useBatchReportCardsQuery(
  examTermId: string | undefined,
  classId: string | undefined,
  sectionId?: string,
  enabled = false,
) {
  return apiQueryClient.useQuery(
    "get",
    EXAMS_API_PATHS.BATCH_REPORT_CARDS,
    {
      params: {
        path: { examTermId: examTermId ?? "" },
        query: {
          classId: classId ?? "",
          ...(sectionId ? { sectionId } : {}),
        },
      },
    },
    { enabled: enabled && Boolean(examTermId && classId) },
  );
}
