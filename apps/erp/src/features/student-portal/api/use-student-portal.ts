import { STUDENT_PORTAL_API_PATHS } from "@/features/auth/api/auth.constants";
import type { StudentPortalOverview } from "@/features/student-portal/model/student-portal.types";
import { apiQueryClient } from "@/lib/api/client";

export function useStudentPortalOverviewQuery(
  enabled: boolean,
  examTermId?: string,
) {
  return apiQueryClient.useQuery(
    "get",
    STUDENT_PORTAL_API_PATHS.OVERVIEW,
    {
      params: {
        query: examTermId ? { examTermId } : {},
      },
    },
    {
      enabled,
    },
  );
}

export function getStudentPortalOverviewQueryKey(examTermId?: string) {
  return apiQueryClient.queryOptions("get", STUDENT_PORTAL_API_PATHS.OVERVIEW, {
    params: {
      query: examTermId ? { examTermId } : {},
    },
  }).queryKey;
}

export type StudentPortalOverviewQueryResult = StudentPortalOverview;
