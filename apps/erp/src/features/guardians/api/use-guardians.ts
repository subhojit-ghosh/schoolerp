import { useQueryClient } from "@tanstack/react-query";
import { SORT_ORDERS } from "@/constants/query";
import {
  GUARDIANS_API_PATHS,
  STUDENTS_API_PATHS,
} from "@/features/auth/api/auth.constants";
import { GUARDIAN_LIST_SORT_FIELDS } from "@/features/guardians/model/guardian-list.constants";
import { apiQueryClient } from "@/lib/api/client";

type GuardiansListSort =
  (typeof GUARDIAN_LIST_SORT_FIELDS)[keyof typeof GUARDIAN_LIST_SORT_FIELDS];

type GuardiansListQuery = {
  limit?: number;
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
  page?: number;
  q?: string;
  sort?: GuardiansListSort;
};

function invalidateGuardianList(
  queryClient: ReturnType<typeof useQueryClient>,
  _institutionId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", GUARDIANS_API_PATHS.LIST)
      .queryKey,
  });
}

function invalidateGuardianDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  _institutionId: string,
  guardianId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", GUARDIANS_API_PATHS.DETAIL, {
      params: {
        path: {
          guardianId,
        },
      },
    }).queryKey,
  });
}

function invalidateStudentsList(
  queryClient: ReturnType<typeof useQueryClient>,
  _institutionId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", STUDENTS_API_PATHS.LIST)
      .queryKey,
  });
}

function invalidateStudentDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  _institutionId: string,
  studentId: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: apiQueryClient.queryOptions("get", STUDENTS_API_PATHS.DETAIL, {
        params: {
          path: {
            studentId,
          },
        },
      }).queryKey,
    }),
    queryClient.invalidateQueries({
      queryKey: apiQueryClient.queryOptions("get", STUDENTS_API_PATHS.SUMMARY, {
        params: {
          path: {
            studentId,
          },
        },
      }).queryKey,
    }),
  ]);
}

export function useGuardiansQuery(
  institutionId: string | undefined,
  query?: GuardiansListQuery,
) {
  return apiQueryClient.useQuery(
    "get",
    GUARDIANS_API_PATHS.LIST,
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

export function useGuardianQuery(
  institutionId: string | undefined,
  guardianId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    GUARDIANS_API_PATHS.DETAIL,
    {
      params: {
        path: {
          guardianId: guardianId ?? "",
        },
      },
    },
    {
      enabled: Boolean(institutionId && guardianId),
    },
  );
}

export function useUpdateGuardianMutation(
  institutionId: string | undefined,
  guardianId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", GUARDIANS_API_PATHS.UPDATE, {
    onSuccess: async () => {
      if (!institutionId || !guardianId) {
        return;
      }

      await Promise.all([
        invalidateGuardianList(queryClient, institutionId),
        invalidateGuardianDetail(queryClient, institutionId, guardianId),
      ]);
    },
  });
}

export function useLinkGuardianStudentMutation(
  institutionId: string | undefined,
  guardianId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", GUARDIANS_API_PATHS.LINK_STUDENT, {
    onSuccess: async (_, variables) => {
      if (!institutionId || !guardianId) {
        return;
      }

      const studentId = variables.body.studentId;

      await Promise.all([
        invalidateGuardianList(queryClient, institutionId),
        invalidateGuardianDetail(queryClient, institutionId, guardianId),
        invalidateStudentsList(queryClient, institutionId),
        invalidateStudentDetail(queryClient, institutionId, studentId),
      ]);
    },
  });
}

export function useUpdateGuardianStudentLinkMutation(
  institutionId: string | undefined,
  guardianId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "patch",
    GUARDIANS_API_PATHS.UPDATE_STUDENT_LINK,
    {
      onSuccess: async (_, variables) => {
        if (!institutionId || !guardianId) {
          return;
        }

        const studentId = variables.params.path.studentId;

        await Promise.all([
          invalidateGuardianList(queryClient, institutionId),
          invalidateGuardianDetail(queryClient, institutionId, guardianId),
          invalidateStudentsList(queryClient, institutionId),
          invalidateStudentDetail(queryClient, institutionId, studentId),
        ]);
      },
    },
  );
}

export function useUnlinkGuardianStudentMutation(
  institutionId: string | undefined,
  guardianId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "delete",
    GUARDIANS_API_PATHS.UNLINK_STUDENT,
    {
      onSuccess: async (_, variables) => {
        if (!institutionId || !guardianId) {
          return;
        }

        const studentId = variables.params.path.studentId;

        await Promise.all([
          invalidateGuardianList(queryClient, institutionId),
          invalidateGuardianDetail(queryClient, institutionId, guardianId),
          invalidateStudentsList(queryClient, institutionId),
          invalidateStudentDetail(queryClient, institutionId, studentId),
        ]);
      },
    },
  );
}

// --- Phase 2: Cross-Student Fees ---

export function useCrossStudentFeesQuery(
  institutionId: string | undefined,
  guardianId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    GUARDIANS_API_PATHS.CROSS_STUDENT_FEES,
    {
      params: {
        path: {
          guardianId: guardianId ?? "",
        },
      },
    },
    {
      enabled: Boolean(institutionId && guardianId),
    },
  );
}
