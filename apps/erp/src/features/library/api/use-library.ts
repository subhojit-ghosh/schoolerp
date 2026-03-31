import { useQueryClient } from "@tanstack/react-query";
import { LIBRARY_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export type LibraryBooksQuery = {
  q?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
  sort?: "title" | "author" | "createdAt" | "availableCopies";
  order?: "asc" | "desc";
};

export type LibraryTransactionsQuery = {
  q?: string;
  status?: "issued" | "returned" | "overdue";
  memberId?: string;
  bookId?: string;
  page?: number;
  limit?: number;
  sort?: "issuedAt" | "dueDate" | "status";
  order?: "asc" | "desc";
};

function invalidateBookQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", LIBRARY_API_PATHS.LIST_BOOKS, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: { query: {} as any },
    }).queryKey,
  });
}

function invalidateTransactionQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      LIBRARY_API_PATHS.LIST_TRANSACTIONS,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { params: { query: {} as any } },
    ).queryKey,
  });
}

export function useLibraryBooksQuery(
  enabled: boolean,
  query: LibraryBooksQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    LIBRARY_API_PATHS.LIST_BOOKS,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { params: { query: query as any } },
    { enabled },
  );
}

export function useCreateBookMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", LIBRARY_API_PATHS.CREATE_BOOK, {
    onSuccess: () => {
      invalidateBookQueries(queryClient);
    },
  });
}

export function useUpdateBookMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("put", LIBRARY_API_PATHS.UPDATE_BOOK, {
    onSuccess: () => {
      invalidateBookQueries(queryClient);
    },
  });
}

export function useLibraryTransactionsQuery(
  enabled: boolean,
  query: LibraryTransactionsQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    LIBRARY_API_PATHS.LIST_TRANSACTIONS,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { params: { query: query as any } },
    { enabled },
  );
}

export function useIssueBookMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", LIBRARY_API_PATHS.ISSUE, {
    onSuccess: () => {
      invalidateBookQueries(queryClient);
      invalidateTransactionQueries(queryClient);
    },
  });
}

export function useReturnBookMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", LIBRARY_API_PATHS.RETURN, {
    onSuccess: () => {
      invalidateBookQueries(queryClient);
      invalidateTransactionQueries(queryClient);
    },
  });
}

// ── Phase 2 depth hooks ──────────────────────────────────────────────────────

export type LibraryReservationsQuery = {
  q?: string;
  status?: "pending" | "fulfilled" | "cancelled";
  page?: number;
  limit?: number;
  sort?: "createdAt" | "queuePosition" | "status";
  order?: "asc" | "desc";
};

export type LibraryOverdueQuery = {
  q?: string;
  page?: number;
  limit?: number;
  sort?: "dueDate" | "daysOverdue";
  order?: "asc" | "desc";
};

function invalidateReservationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      LIBRARY_API_PATHS.LIST_RESERVATIONS,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { params: { query: {} as any } },
    ).queryKey,
  });
}

function invalidateOverdueQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      LIBRARY_API_PATHS.LIST_OVERDUE,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { params: { query: {} as any } },
    ).queryKey,
  });
}

function invalidateDashboardQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      LIBRARY_API_PATHS.DASHBOARD,
    ).queryKey,
  });
}

export function useLibraryReservationsQuery(
  enabled: boolean,
  query: LibraryReservationsQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    LIBRARY_API_PATHS.LIST_RESERVATIONS,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { params: { query: query as any } },
    { enabled },
  );
}

export function useCreateReservationMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    LIBRARY_API_PATHS.CREATE_RESERVATION,
    {
      onSuccess: () => {
        invalidateReservationQueries(queryClient);
        invalidateBookQueries(queryClient);
        invalidateDashboardQueries(queryClient);
      },
    },
  );
}

export function useFulfillReservationMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    LIBRARY_API_PATHS.FULFILL_RESERVATION,
    {
      onSuccess: () => {
        invalidateReservationQueries(queryClient);
        invalidateBookQueries(queryClient);
        invalidateTransactionQueries(queryClient);
        invalidateDashboardQueries(queryClient);
      },
    },
  );
}

export function useCancelReservationMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    LIBRARY_API_PATHS.CANCEL_RESERVATION,
    {
      onSuccess: () => {
        invalidateReservationQueries(queryClient);
        invalidateDashboardQueries(queryClient);
      },
    },
  );
}

export function useCollectFineMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", LIBRARY_API_PATHS.COLLECT_FINE, {
    onSuccess: () => {
      invalidateTransactionQueries(queryClient);
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useBorrowingHistoryQuery(
  enabled: boolean,
  memberId: string,
) {
  return apiQueryClient.useQuery(
    "get",
    LIBRARY_API_PATHS.BORROWING_HISTORY,
    { params: { path: { memberId } } },
    { enabled: enabled && Boolean(memberId) },
  );
}

export function useLibraryOverdueQuery(
  enabled: boolean,
  query: LibraryOverdueQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    LIBRARY_API_PATHS.LIST_OVERDUE,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { params: { query: query as any } },
    { enabled },
  );
}

export function useMarkOverdueMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", LIBRARY_API_PATHS.MARK_OVERDUE, {
    onSuccess: () => {
      invalidateTransactionQueries(queryClient);
      invalidateOverdueQueries(queryClient);
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useLibraryDashboardQuery(enabled: boolean) {
  return apiQueryClient.useQuery(
    "get",
    LIBRARY_API_PATHS.DASHBOARD,
    {},
    { enabled },
  );
}
