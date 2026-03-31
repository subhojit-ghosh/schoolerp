import { useQueryClient } from "@tanstack/react-query";
import { INCOME_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

function invalidateIncomeLists(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", INCOME_API_PATHS.LIST, {
      params: { query: {} },
    }).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", INCOME_API_PATHS.SUMMARY, {
      params: { query: {} },
    }).queryKey,
  });
}

// ── Income Records ───────────────────────────────────────────────────────────

export function useIncomeRecordsQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    INCOME_API_PATHS.LIST,
    { params: { query } },
    { enabled },
  );
}

export function useIncomeRecordDetailQuery(
  enabled: boolean,
  recordId?: string,
) {
  return apiQueryClient.useQuery(
    "get",
    INCOME_API_PATHS.GET,
    { params: { path: { recordId: recordId! } } },
    { enabled: enabled && Boolean(recordId) },
  );
}

export function useCreateIncomeRecordMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", INCOME_API_PATHS.CREATE, {
    onSuccess: () => {
      invalidateIncomeLists(queryClient);
    },
  });
}

export function useUpdateIncomeRecordMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("patch", INCOME_API_PATHS.UPDATE, {
    onSuccess: () => {
      invalidateIncomeLists(queryClient);
    },
  });
}

export function useDeleteIncomeRecordMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("delete", INCOME_API_PATHS.DELETE, {
    onSuccess: () => {
      invalidateIncomeLists(queryClient);
    },
  });
}

// ── Summary ──────────────────────────────────────────────────────────────────

export function useIncomeSummaryQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    INCOME_API_PATHS.SUMMARY,
    { params: { query } },
    { enabled },
  );
}
