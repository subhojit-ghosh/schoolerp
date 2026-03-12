import { useQueryClient } from "@tanstack/react-query";
import { apiQueryClient } from "@/lib/api/client";
import { ACADEMIC_YEARS_API_PATHS } from "@/features/auth/api/auth.constants";

export function useAcademicYearsQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    ACADEMIC_YEARS_API_PATHS.LIST,
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

export function useCreateAcademicYearMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", ACADEMIC_YEARS_API_PATHS.CREATE, {
    onSuccess: () => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          ACADEMIC_YEARS_API_PATHS.LIST,
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

function createAcademicYearActionMutation(
  method: "patch",
  path:
    | typeof ACADEMIC_YEARS_API_PATHS.SET_CURRENT
    | typeof ACADEMIC_YEARS_API_PATHS.ARCHIVE
    | typeof ACADEMIC_YEARS_API_PATHS.RESTORE,
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(method, path, {
    onSuccess: () => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          ACADEMIC_YEARS_API_PATHS.LIST,
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

export function useSetCurrentAcademicYearMutation(
  institutionId: string | undefined,
) {
  return createAcademicYearActionMutation(
    "patch",
    ACADEMIC_YEARS_API_PATHS.SET_CURRENT,
    institutionId,
  );
}

export function useArchiveAcademicYearMutation(
  institutionId: string | undefined,
) {
  return createAcademicYearActionMutation(
    "patch",
    ACADEMIC_YEARS_API_PATHS.ARCHIVE,
    institutionId,
  );
}

export function useRestoreAcademicYearMutation(
  institutionId: string | undefined,
) {
  return createAcademicYearActionMutation(
    "patch",
    ACADEMIC_YEARS_API_PATHS.RESTORE,
    institutionId,
  );
}
