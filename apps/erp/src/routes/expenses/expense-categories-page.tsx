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
import { useExpenseCategoriesQuery } from "@/features/expenses/api/use-expenses";
import {
  EXPENSE_CATEGORY_LIST_SORT_FIELDS,
  EXPENSE_CATEGORIES_PAGE_COPY,
} from "@/features/expenses/model/expense-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  createdAt: string;
};

const columnHelper = createColumnHelper<CategoryRow>();
const VALID_SORT_FIELDS = [
  EXPENSE_CATEGORY_LIST_SORT_FIELDS.NAME,
  EXPENSE_CATEGORY_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function ExpenseCategoriesPage() {
  useDocumentTitle("Expense Categories");
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
    defaultSortBy: EXPENSE_CATEGORY_LIST_SORT_FIELDS.NAME,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const categoriesQuery = useExpenseCategoriesQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const categoriesData = categoriesQuery.data;
  const categories = useMemo(
    () => (categoriesData?.rows ?? []) as CategoryRow[],
    [categoriesData?.rows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(EXPENSE_CATEGORY_LIST_SORT_FIELDS.NAME)
            }
            type="button"
          >
            Name
            <SortIcon
              direction={
                queryState.sortBy === EXPENSE_CATEGORY_LIST_SORT_FIELDS.NAME
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.name}</span>
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
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      }),
    ],
    [queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: categories,
    page: queryState.page,
    pageCount: categoriesData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: categoriesData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (categoriesQuery.error as Error | null | undefined)
    ?.message;

  return (
    <EntityListPage
      title={EXPENSE_CATEGORIES_PAGE_COPY.TITLE}
      description={EXPENSE_CATEGORIES_PAGE_COPY.DESCRIPTION}
      actions={
        canManage ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.EXPENSE_CATEGORY_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New category
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
              placeholder={EXPENSE_CATEGORIES_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  ERP_ROUTES.EXPENSE_CATEGORY_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New category
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No categories match your search."
            : EXPENSE_CATEGORIES_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching categories"
            : EXPENSE_CATEGORIES_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load expense categories"
        isLoading={categoriesQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={EXPENSE_CATEGORIES_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={categoriesData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
