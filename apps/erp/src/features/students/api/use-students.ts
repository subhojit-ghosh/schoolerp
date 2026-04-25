import { useQueryClient } from "@tanstack/react-query";
import { SORT_ORDERS } from "@/constants/query";
import { apiQueryClient } from "@/lib/api/client";
import { STUDENTS_API_PATHS } from "@/features/auth/api/auth.constants";
import { STUDENT_LIST_SORT_FIELDS } from "@/features/students/model/student-list.constants";

type StudentsListSort =
  (typeof STUDENT_LIST_SORT_FIELDS)[keyof typeof STUDENT_LIST_SORT_FIELDS];

type StudentsListQuery = {
  limit?: number;
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
  page?: number;
  q?: string;
  sort?: StudentsListSort;
};

function getStudentsListQueryKey(
  _institutionId: string,
  query?: StudentsListQuery,
) {
  return apiQueryClient.queryOptions(
    "get",
    STUDENTS_API_PATHS.LIST,
    query
      ? {
          params: {
            query,
          },
        }
      : undefined,
  ).queryKey;
}

function getStudentOptionsQueryKey() {
  return apiQueryClient.queryOptions("get", STUDENTS_API_PATHS.OPTIONS)
    .queryKey;
}

export function useStudentsQuery(
  institutionId: string | undefined,
  query?: StudentsListQuery,
) {
  return apiQueryClient.useQuery(
    "get",
    STUDENTS_API_PATHS.LIST,
    query
      ? {
          params: {
            query,
          },
        }
      : undefined,
    {
      enabled: Boolean(institutionId),
    },
  );
}

export function useStudentOptionsQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery("get", STUDENTS_API_PATHS.OPTIONS, undefined, {
    enabled: Boolean(institutionId),
  });
}

export function useCreateStudentMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", STUDENTS_API_PATHS.CREATE, {
    onSuccess: () => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: getStudentsListQueryKey(institutionId),
      });

      void queryClient.invalidateQueries({
        queryKey: getStudentOptionsQueryKey(),
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

export function useStudentSummaryQuery(
  institutionId: string | undefined,
  studentId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    STUDENTS_API_PATHS.SUMMARY,
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
        queryKey: getStudentsListQueryKey(institutionId),
      });

      void queryClient.invalidateQueries({
        queryKey: getStudentOptionsQueryKey(),
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

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          STUDENTS_API_PATHS.SUMMARY,
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

export function useDeleteStudentMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("delete", STUDENTS_API_PATHS.DELETE, {
    onSuccess: () => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: getStudentsListQueryKey(institutionId),
      });

      void queryClient.invalidateQueries({
        queryKey: getStudentOptionsQueryKey(),
      });
    },
  });
}

// --- Phase 2: Siblings ---

export function useSiblingsQuery(
  institutionId: string | undefined,
  studentId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    STUDENTS_API_PATHS.LIST_SIBLINGS,
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

export function useCreateSiblingLinkMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "post",
    STUDENTS_API_PATHS.CREATE_SIBLING_LINK,
    {
      onSuccess: (_, variables) => {
        if (!institutionId) {
          return;
        }

        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            STUDENTS_API_PATHS.LIST_SIBLINGS,
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
    },
  );
}

export function useDeleteSiblingLinkMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "delete",
    STUDENTS_API_PATHS.DELETE_SIBLING_LINK,
    {
      onSuccess: (_, variables) => {
        if (!institutionId) {
          return;
        }

        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            STUDENTS_API_PATHS.LIST_SIBLINGS,
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
    },
  );
}

// --- Phase 2: Medical Record ---

export function useStudentMedicalRecordQuery(
  institutionId: string | undefined,
  studentId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    STUDENTS_API_PATHS.GET_MEDICAL_RECORD,
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

export function useUpsertMedicalRecordMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "put",
    STUDENTS_API_PATHS.UPSERT_MEDICAL_RECORD,
    {
      onSuccess: (_, variables) => {
        if (!institutionId) {
          return;
        }

        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            STUDENTS_API_PATHS.GET_MEDICAL_RECORD,
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
    },
  );
}

// --- Phase 2: Disciplinary Records ---

export function useDisciplinaryRecordsQuery(
  institutionId: string | undefined,
  studentId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    STUDENTS_API_PATHS.LIST_DISCIPLINARY,
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

export function useCreateDisciplinaryRecordMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "post",
    STUDENTS_API_PATHS.CREATE_DISCIPLINARY,
    {
      onSuccess: (_, variables) => {
        if (!institutionId) {
          return;
        }

        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            STUDENTS_API_PATHS.LIST_DISCIPLINARY,
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
    },
  );
}

// --- Phase 2: Transfer Certificates ---

export function useTransferCertificatesQuery(
  institutionId: string | undefined,
  studentId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    STUDENTS_API_PATHS.LIST_TRANSFER_CERTIFICATES,
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

export function useIssueTransferCertificateMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "post",
    STUDENTS_API_PATHS.ISSUE_TRANSFER_CERTIFICATE,
    {
      onSuccess: (_, variables) => {
        if (!institutionId) {
          return;
        }

        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            STUDENTS_API_PATHS.LIST_TRANSFER_CERTIFICATES,
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
    },
  );
}
