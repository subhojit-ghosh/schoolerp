import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Input } from "@repo/ui/components/ui/input";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  EntityEmptyStateAction,
  EntityPagePrimaryAction,
} from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useExpensesQuery } from "@/features/expenses/api/use-expenses";
import {
  EXPENSE_LIST_SORT_FIELDS,
  EXPENSES_PAGE_COPY,
  EXPENSE_STATUS_LABELS,
} from "@/features/expenses/model/expense-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type ExpenseRow = {
  id: string;
  title: string;
  categoryName: string;
  amountInPaise: number;
  expenseDate: string;
  status: string;
  createdAt: string;
};

const columnHelper = createColumnHelper<ExpenseRow>();
const VALID_SORT_FIELDS = [
  EXPENSE_LIST_SORT_FIELDS.DATE,
  EXPENSE_LIST_SORT_FIELDS.AMOUNT,
  EXPENSE_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function ExpensesPage() {
  useDocumentTitle("Expenses");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.EXPENSES_READ);
  const canManage = hasPermission(session, PERMISSIONS.EXPENSES_MANAGE);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: EXPENSE_LIST_SORT_FIELDS.DATE,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const expensesQuery = useExpensesQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const expensesData = expensesQuery.data;
  const expenses = useMemo(
    () => (expensesData?.rows ?? []) as ExpenseRow[],
    [expensesData?.rows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Title",
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.title}</span>
        ),
      }),
      columnHelper.accessor("categoryName", {
        header: "Category",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.categoryName}</span>
        ),
      }),
      columnHelper.accessor("amountInPaise", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(EXPENSE_LIST_SORT_FIELDS.AMOUNT)}
            type="button"
          >
            Amount
            <SortIcon
              direction={
                queryState.sortBy === EXPENSE_LIST_SORT_FIELDS.AMOUNT
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(row.original.amountInPaise / 100)}
          </span>
        ),
      }),
      columnHelper.accessor("expenseDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(EXPENSE_LIST_SORT_FIELDS.DATE)}
            type="button"
          >
            Date
            <SortIcon
              direction={
                queryState.sortBy === EXPENSE_LIST_SORT_FIELDS.DATE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.expenseDate).toLocaleDateString("en-IN")}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            label={
              EXPENSE_STATUS_LABELS[row.original.status] ?? row.original.status
            }
          />
        ),
      }),
    ],
    [queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: expenses,
    page: queryState.page,
    pageCount: expensesData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: expensesData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (expensesQuery.error as Error | null | undefined)
    ?.message;

  return (
    <EntityListPage
      title={EXPENSES_PAGE_COPY.TITLE}
      description={EXPENSES_PAGE_COPY.DESCRIPTION}
      actions={
        canManage ? (
          <EntityPagePrimaryAction asChild>
            <Link to={appendSearch(ERP_ROUTES.EXPENSE_CREATE, location.search)}>
              <IconPlus className="size-4" />
              New expense
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
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={EXPENSES_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                to={appendSearch(ERP_ROUTES.EXPENSE_CREATE, location.search)}
              >
                <IconPlus className="size-4" />
                New expense
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No expenses match your search."
            : EXPENSES_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching expenses"
            : EXPENSES_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load expenses"
        isLoading={expensesQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={EXPENSES_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={expensesData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
