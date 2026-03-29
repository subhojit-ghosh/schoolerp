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
