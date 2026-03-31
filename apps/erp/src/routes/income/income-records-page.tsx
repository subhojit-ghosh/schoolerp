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
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useIncomeRecordsQuery } from "@/features/income/api/use-income";
import {
  INCOME_LIST_SORT_FIELDS,
  INCOME_RECORDS_PAGE_COPY,
} from "@/features/income/model/income-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type IncomeRow = {
  id: string;
  title: string;
  category: string;
  amountInPaise: number;
  incomeDate: string;
  description: string | null;
  createdAt: string;
};

const columnHelper = createColumnHelper<IncomeRow>();
const VALID_SORT_FIELDS = [
  INCOME_LIST_SORT_FIELDS.DATE,
  INCOME_LIST_SORT_FIELDS.AMOUNT,
  INCOME_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function IncomeRecordsPage() {
  useDocumentTitle("Income");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.INCOME_READ);
  const canManage = hasPermission(session, PERMISSIONS.INCOME_MANAGE);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: INCOME_LIST_SORT_FIELDS.DATE,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const incomeQuery = useIncomeRecordsQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const incomeData = incomeQuery.data;
  const records = useMemo(
    () => (incomeData?.rows ?? []) as IncomeRow[],
    [incomeData?.rows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Title",
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.title}</span>
        ),
      }),
      columnHelper.accessor("category", {
        header: "Category",
        cell: ({ row }) => (
          <span className="text-sm capitalize">
            {row.original.category.replace(/_/g, " ")}
          </span>
        ),
      }),
      columnHelper.accessor("amountInPaise", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(INCOME_LIST_SORT_FIELDS.AMOUNT)}
            type="button"
          >
            Amount
            <SortIcon
              direction={
                queryState.sortBy === INCOME_LIST_SORT_FIELDS.AMOUNT
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
      columnHelper.accessor("incomeDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(INCOME_LIST_SORT_FIELDS.DATE)}
            type="button"
          >
            Date
            <SortIcon
              direction={
                queryState.sortBy === INCOME_LIST_SORT_FIELDS.DATE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.incomeDate).toLocaleDateString("en-IN")}
          </span>
        ),
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.description || "-"}
          </span>
        ),
      }),
    ],
    [queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: records,
    page: queryState.page,
    pageCount: incomeData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: incomeData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (incomeQuery.error as Error | null | undefined)?.message;

  return (
    <EntityListPage
      title={INCOME_RECORDS_PAGE_COPY.TITLE}
      description={INCOME_RECORDS_PAGE_COPY.DESCRIPTION}
      actions={
        canManage ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.INCOME_RECORD_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New income record
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
              placeholder={INCOME_RECORDS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  ERP_ROUTES.INCOME_RECORD_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New income record
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No income records match your search."
            : INCOME_RECORDS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching records"
            : INCOME_RECORDS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load income records"
        isLoading={incomeQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={INCOME_RECORDS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={incomeData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
