import { useCallback, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import {
  IconBookOff,
  IconDotsVertical,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  EntityEmptyStateAction,
  EntityPagePrimaryAction,
  EntityRowAction,
} from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useLibraryTransactionsQuery,
  useReturnBookMutation,
} from "@/features/library/api/use-library";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type TransactionRow = {
  id: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string | null;
  memberId: string;
  memberName: string;
  memberEmployeeId: string | null;
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  fineAmount: number;
  finePaid: boolean;
  status: "issued" | "returned" | "overdue";
  createdAt: string;
};

const columnHelper = createColumnHelper<TransactionRow>();
const VALID_SORT_FIELDS = ["issuedAt", "dueDate", "status"] as const;

function StatusBadge({ status }: { status: TransactionRow["status"] }) {
  switch (status) {
    case "returned":
      return (
        <Badge className="bg-green-500/10 text-green-700 border-green-200">
          Returned
        </Badge>
      );
    case "overdue":
      return <Badge variant="destructive">Overdue</Badge>;
    default:
      return <Badge variant="secondary">Issued</Badge>;
  }
}

export function LibraryTransactionsPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.LIBRARY_READ);
  const canManage = hasPermission(session, PERMISSIONS.LIBRARY_MANAGE);

  const returnMutation = useReturnBookMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: "issuedAt",
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const transactionsQuery = useLibraryTransactionsQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy as "issuedAt" | "dueDate" | "status",
  });

  const transactions = useMemo(
    () => (transactionsQuery.data?.rows ?? []) as TransactionRow[],
    [transactionsQuery.data?.rows],
  );

  const handleReturn = useCallback(
    async (transactionId: string) => {
      await returnMutation.mutateAsync({
        params: { path: { transactionId } },
        body: {},
      });
      toast.success("Book returned successfully.");
    },
    [returnMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("bookTitle", {
        header: "Book",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium">{row.original.bookTitle}</p>
            {row.original.bookIsbn ? (
              <p className="text-xs text-muted-foreground">
                ISBN: {row.original.bookIsbn}
              </p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor("memberName", {
        header: "Member",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium">{row.original.memberName}</p>
            {row.original.memberEmployeeId ? (
              <p className="text-xs text-muted-foreground">
                {row.original.memberEmployeeId}
              </p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor("issuedAt", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("issuedAt")}
            type="button"
          >
            Issued
            <SortIcon
              direction={
                queryState.sortBy === "issuedAt" ? queryState.sortOrder : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
              new Date(row.original.issuedAt),
            )}
          </span>
        ),
      }),
      columnHelper.accessor("dueDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("dueDate")}
            type="button"
          >
            Due date
            <SortIcon
              direction={
                queryState.sortBy === "dueDate" ? queryState.sortOrder : false
              }
            />
          </button>
        ),
        cell: ({ row }) => {
          const isOverdue =
            row.original.status !== "returned" &&
            new Date(row.original.dueDate) < new Date();
          return (
            <span
              className={`text-sm ${isOverdue ? "text-destructive font-medium" : ""}`}
            >
              {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
                new Date(row.original.dueDate),
              )}
            </span>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          canManage && row.original.status !== "returned" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <EntityRowAction aria-label="Actions">
                  <IconDotsVertical className="size-4" />
                </EntityRowAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => void handleReturn(row.original.id)}
                >
                  <IconBookOff className="size-4 mr-2" />
                  Mark returned
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null,
      }),
    ],
    [canManage, queryState.sortBy, queryState.sortOrder, setSorting, handleReturn],
  );

  const table = useServerDataTable({
    columns,
    data: transactions,
    page: queryState.page,
    pageCount: transactionsQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: transactionsQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (transactionsQuery.error as Error | null | undefined)
    ?.message;

  return (
    <>
      <EntityListPage
        title="Library Transactions"
        description="Track book issues and returns."
        actions={
          canManage ? (
            <EntityPagePrimaryAction asChild>
              <Link
                to={appendSearch(
                  ERP_ROUTES.LIBRARY_TRANSACTIONS_ISSUE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                Issue book
              </Link>
            </EntityPagePrimaryAction>
          ) : undefined
        }
        toolbar={
          <div className="border rounded-lg bg-card p-4">
            <div className="relative max-w-sm">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by book, member..."
                value={searchInput}
              />
            </div>
          </div>
        }
      >
        <ServerDataTable
          emptyAction={
            !queryState.search && canManage ? (
              <EntityEmptyStateAction asChild>
                <Link
                  to={appendSearch(
                    ERP_ROUTES.LIBRARY_TRANSACTIONS_ISSUE,
                    location.search,
                  )}
                >
                  Issue book
                </Link>
              </EntityEmptyStateAction>
            ) : undefined
          }
          emptyDescription={
            queryState.search
              ? "No transactions match your search."
              : "Issue a book to record the first library transaction."
          }
          emptyTitle={
            queryState.search ? "No transactions found" : "No library transactions"
          }
          errorTitle="Failed to load transactions"
          isLoading={transactionsQuery.isLoading}
          isError={Boolean(errorMessage)}
          errorDescription={errorMessage}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search by book, member..."
          searchValue={searchInput}
          table={table}
          totalRows={transactionsQuery.data?.total ?? 0}
          showSearch={false}
        />
        <Outlet />
      </EntityListPage>
    </>
  );
}
