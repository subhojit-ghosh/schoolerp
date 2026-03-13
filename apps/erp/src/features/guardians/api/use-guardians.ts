import { useQueryClient } from "@tanstack/react-query";
import { GUARDIANS_API_PATHS, STUDENTS_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

function invalidateGuardianList(queryClient: ReturnType<typeof useQueryClient>, institutionId: string) {
  return queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", GUARDIANS_API_PATHS.LIST, {
      params: {
        path: {
          institutionId,
        },
      },
    }).queryKey,
  });
}

function invalidateGuardianDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  institutionId: string,
  guardianId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", GUARDIANS_API_PATHS.DETAIL, {
      params: {
        path: {
          institutionId,
          guardianId,
        },
      },
    }).queryKey,
  });
}

function invalidateStudentsList(queryClient: ReturnType<typeof useQueryClient>, institutionId: string) {
  return queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", STUDENTS_API_PATHS.LIST, {
      params: {
        path: {
          institutionId,
        },
      },
    }).queryKey,
  });
}

function invalidateStudentDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  institutionId: string,
  studentId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", STUDENTS_API_PATHS.DETAIL, {
      params: {
        path: {
          institutionId,
          studentId,
        },
      },
    }).queryKey,
  });
}

export function useGuardiansQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    GUARDIANS_API_PATHS.LIST,
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
          institutionId: institutionId ?? "",
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
