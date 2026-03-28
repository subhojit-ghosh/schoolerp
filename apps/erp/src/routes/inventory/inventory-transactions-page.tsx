import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
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
import { useTransactionsQuery } from "@/features/inventory/api/use-inventory";
import {
  TRANSACTION_LIST_SORT_FIELDS,
  TRANSACTIONS_PAGE_COPY,
  TRANSACTION_TYPE_LABELS,
} from "@/features/inventory/model/inventory-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type TransactionRow = {
  id: string;
  itemId: string;
  itemName: string;
  transactionType: string;
  quantity: number;
  referenceNumber: string | null;
  issuedToName: string | null;
  createdByName: string;
  notes: string | null;
  createdAt: string;
};

const columnHelper = createColumnHelper<TransactionRow>();
const VALID_SORT_FIELDS = [
  TRANSACTION_LIST_SORT_FIELDS.CREATED_AT,
  TRANSACTION_LIST_SORT_FIELDS.QUANTITY,
] as const;

const TRANSACTION_TYPE_BADGE_CLASSES: Record<string, string> = {
  purchase: "bg-green-500/10 text-green-700 border-green-200",
  issue: "bg-orange-500/10 text-orange-700 border-orange-200",
  return: "bg-blue-500/10 text-blue-700 border-blue-200",
  adjustment: "bg-purple-500/10 text-purple-700 border-purple-200",
};

export function InventoryTransactionsPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.INVENTORY_READ);
  const canManage = hasPermission(session, PERMISSIONS.INVENTORY_MANAGE);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: TRANSACTION_LIST_SORT_FIELDS.CREATED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const transactionsQuery = useTransactionsQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const transactionsData = transactionsQuery.data;
  const transactions = useMemo(
    () => (transactionsData?.rows ?? []) as TransactionRow[],
    [transactionsData?.rows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("itemName", {
        header: "Item",
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.itemName}</span>
        ),
      }),
      columnHelper.accessor("transactionType", {
        header: "Type",
        cell: ({ row }) => (
          <Badge className={TRANSACTION_TYPE_BADGE_CLASSES[row.original.transactionType] ?? ""}>
            {TRANSACTION_TYPE_LABELS[row.original.transactionType] ?? row.original.transactionType}
          </Badge>
        ),
      }),
      columnHelper.accessor("quantity", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(TRANSACTION_LIST_SORT_FIELDS.QUANTITY)}
            type="button"
          >
            Quantity
            <SortIcon
              direction={
                queryState.sortBy === TRANSACTION_LIST_SORT_FIELDS.QUANTITY
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.quantity}</span>
        ),
      }),
      columnHelper.accessor("referenceNumber", {
        header: "Reference",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.referenceNumber || "-"}
          </span>
        ),
      }),
      columnHelper.accessor("createdByName", {
        header: "Created By",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.createdByName}</span>
        ),
      }),
      columnHelper.accessor("issuedToName", {
        header: "Issued To",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.issuedToName || "-"}
          </span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(TRANSACTION_LIST_SORT_FIELDS.CREATED_AT)}
            type="button"
          >
            Date
            <SortIcon
              direction={
                queryState.sortBy === TRANSACTION_LIST_SORT_FIELDS.CREATED_AT
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      }),
    ],
    [queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: transactions,
    page: queryState.page,
    pageCount: transactionsData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: transactionsData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (transactionsQuery.error as Error | null | undefined)?.message;

  return (
    <EntityListPage
      title={TRANSACTIONS_PAGE_COPY.TITLE}
      description={TRANSACTIONS_PAGE_COPY.DESCRIPTION}
      actions={
        canManage ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.INVENTORY_TRANSACTION_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New transaction
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
              placeholder={TRANSACTIONS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  ERP_ROUTES.INVENTORY_TRANSACTION_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New transaction
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No transactions match your search."
            : TRANSACTIONS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching transactions"
            : TRANSACTIONS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load transactions"
        isLoading={transactionsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={TRANSACTIONS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={transactionsData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
