import { useQueryClient } from "@tanstack/react-query";
import { EXPENSES_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

function invalidateExpenseLists(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      EXPENSES_API_PATHS.LIST_CATEGORIES,
      { params: { query: {} } },
    ).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", EXPENSES_API_PATHS.LIST, {
      params: { query: {} },
    }).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", EXPENSES_API_PATHS.SUMMARY, {
      params: { query: {} },
    }).queryKey,
  });
}

// ── Categories ───────────────────────────────────────────────────────────────

export function useExpenseCategoriesQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    EXPENSES_API_PATHS.LIST_CATEGORIES,
    { params: { query } },
    { enabled },
  );
}

export function useCreateExpenseCategoryMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    EXPENSES_API_PATHS.CREATE_CATEGORY,
    {
      onSuccess: () => {
        invalidateExpenseLists(queryClient);
      },
    },
  );
}

export function useUpdateExpenseCategoryMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    EXPENSES_API_PATHS.UPDATE_CATEGORY,
    {
      onSuccess: () => {
        invalidateExpenseLists(queryClient);
      },
    },
  );
}

export function useUpdateExpenseCategoryStatusMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    EXPENSES_API_PATHS.UPDATE_CATEGORY_STATUS,
    {
      onSuccess: () => {
        invalidateExpenseLists(queryClient);
      },
    },
  );
}

// ── Expenses ─────────────────────────────────────────────────────────────────

export function useExpensesQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    EXPENSES_API_PATHS.LIST,
    { params: { query } },
    { enabled },
  );
}

export function useExpenseDetailQuery(enabled: boolean, expenseId?: string) {
  return apiQueryClient.useQuery(
    "get",
    EXPENSES_API_PATHS.GET,
    { params: { path: { expenseId: expenseId! } } },
    { enabled: enabled && Boolean(expenseId) },
  );
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", EXPENSES_API_PATHS.CREATE, {
    onSuccess: () => {
      invalidateExpenseLists(queryClient);
    },
  });
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("patch", EXPENSES_API_PATHS.UPDATE, {
    onSuccess: () => {
      invalidateExpenseLists(queryClient);
    },
  });
}

export function useSubmitExpenseMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", EXPENSES_API_PATHS.SUBMIT, {
    onSuccess: () => {
      invalidateExpenseLists(queryClient);
    },
  });
}

export function useApproveExpenseMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", EXPENSES_API_PATHS.APPROVE, {
    onSuccess: () => {
      invalidateExpenseLists(queryClient);
    },
  });
}

export function useRejectExpenseMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", EXPENSES_API_PATHS.REJECT, {
    onSuccess: () => {
      invalidateExpenseLists(queryClient);
    },
  });
}

export function useMarkExpensePaidMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", EXPENSES_API_PATHS.MARK_PAID, {
    onSuccess: () => {
      invalidateExpenseLists(queryClient);
    },
  });
}

// ── Summary ──────────────────────────────────────────────────────────────────

export function useExpenseSummaryQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    EXPENSES_API_PATHS.SUMMARY,
    { params: { query } },
    { enabled },
  );
}
