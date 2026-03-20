import { FAMILY_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";
import type { FamilyOverview } from "@/features/family/model/family.types";

export function useFamilyOverviewQuery(enabled: boolean, studentId?: string) {
  return apiQueryClient.useQuery(
    "get",
    FAMILY_API_PATHS.OVERVIEW,
    {
      params: {
        query: studentId ? { studentId } : {},
      },
    },
    {
      enabled,
    },
  );
}

export function getFamilyOverviewQueryKey(studentId?: string) {
  return apiQueryClient.queryOptions("get", FAMILY_API_PATHS.OVERVIEW, {
    params: {
      query: studentId ? { studentId } : {},
    },
  }).queryKey;
}

export type FamilyOverviewQueryResult = FamilyOverview;
