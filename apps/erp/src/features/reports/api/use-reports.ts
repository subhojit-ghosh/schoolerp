import { REPORTS_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export type StudentStrengthQuery = {
  academicYearId?: string;
  campusId?: string;
};

export function useStudentStrengthQuery(
  enabled: boolean,
  query: StudentStrengthQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    REPORTS_API_PATHS.STUDENT_STRENGTH,
    { params: { query } },
    { enabled },
  );
}
