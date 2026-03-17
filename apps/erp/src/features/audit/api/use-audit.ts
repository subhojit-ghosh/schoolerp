import { AUDIT_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export type AuditLogsListQuery = {
  q?: string;
  page?: number;
  limit?: number;
  sort?: "createdAt" | "action" | "entityType" | "actor";
  order?: "asc" | "desc";
  action?:
    | "create"
    | "update"
    | "delete"
    | "mark"
    | "replace"
    | "reverse"
    | "execute";
  entityType?:
    | "role"
    | "attendance_day"
    | "exam_marks"
    | "fee_payment"
    | "student_rollover";
};

export function useAuditLogsQuery(
  enabled: boolean,
  query: AuditLogsListQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    AUDIT_API_PATHS.LIST,
    { params: { query } },
    { enabled },
  );
}
