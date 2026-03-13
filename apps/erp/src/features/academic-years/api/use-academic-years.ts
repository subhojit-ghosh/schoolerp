import { useQueryClient } from "@tanstack/react-query";
import { apiQueryClient } from "@/lib/api/client";
import { ACADEMIC_YEARS_API_PATHS } from "@/features/auth/api/auth.constants";

function getAcademicYearsListQueryKey(_institutionId: string) {
  return apiQueryClient.queryOptions(
    "get",
    ACADEMIC_YEARS_API_PATHS.LIST,
    undefined,
  ).queryKey;
}

export function useAcademicYearsQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    ACADEMIC_YEARS_API_PATHS.LIST,
    undefined,
    {
      enabled: Boolean(institutionId),
    },
  );
}

export function useAcademicYearQuery(
  institutionId: string | undefined,
  academicYearId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    ACADEMIC_YEARS_API_PATHS.DETAIL,
    {
      params: {
        path: {
          academicYearId: academicYearId ?? "",
        },
      },
    },
    {
      enabled: Boolean(institutionId && academicYearId),
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
        queryKey: getAcademicYearsListQueryKey(institutionId),
      });
    },
  });
}

export function useUpdateAcademicYearMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", ACADEMIC_YEARS_API_PATHS.UPDATE, {
    onSuccess: (_, variables) => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: getAcademicYearsListQueryKey(institutionId),
      });

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          ACADEMIC_YEARS_API_PATHS.DETAIL,
          {
            params: {
              path: {
                academicYearId: variables.params.path.academicYearId,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}
