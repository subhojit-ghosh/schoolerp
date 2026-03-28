import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { IconArrowLeft, IconPlus } from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useItemDetailQuery,
  useItemTransactionsQuery,
} from "@/features/inventory/api/use-inventory";
import {
  INVENTORY_UNIT_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "@/features/inventory/model/inventory-constants";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";

type TransactionRow = {
  id: string;
  transactionType: string;
  quantity: number;
  referenceNumber: string | null;
  notes: string | null;
  createdByName: string;
  issuedToName: string | null;
  createdAt: string;
};

const columnHelper = createColumnHelper<TransactionRow>();

const TRANSACTION_TYPE_BADGE_CLASSES: Record<string, string> = {
  purchase: "bg-green-500/10 text-green-700 border-green-200",
  issue: "bg-orange-500/10 text-orange-700 border-orange-200",
  return: "bg-blue-500/10 text-blue-700 border-blue-200",
  adjustment: "bg-purple-500/10 text-purple-700 border-purple-200",
};

const VALID_SORT_FIELDS = ["createdAt", "quantity"] as const;

export function InventoryItemDetailPage() {
  const { itemId } = useParams();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.INVENTORY_READ);

  const itemQuery = useItemDetailQuery(canRead, itemId);
  const itemData = itemQuery.data;

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: "createdAt",
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const transactionsQuery = useItemTransactionsQuery(
    canRead && Boolean(itemId),
    itemId!,
    {
      limit: queryState.pageSize,
      order: queryState.sortOrder,
      page: queryState.page,
      q: queryState.search || undefined,
      sort: queryState.sortBy,
    },
  );

  const transactionsData = transactionsQuery.data;
  const transactions = useMemo(
    () => (transactionsData?.rows ?? []) as TransactionRow[],
    [transactionsData?.rows],
  );

  const columns = useMemo(
    () => [
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
            onClick={() => setSorting("quantity")}
            type="button"
          >
            Quantity
            <SortIcon
              direction={
                queryState.sortBy === "quantity"
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
      columnHelper.accessor("notes", {
        header: "Notes",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground truncate max-w-xs">
            {row.original.notes || "-"}
          </span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("createdAt")}
            type="button"
          >
            Date
            <SortIcon
              direction={
                queryState.sortBy === "createdAt"
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link to={ERP_ROUTES.INVENTORY_ITEMS}>
            <IconArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {itemData?.name ?? "Item Detail"}
          </h1>
          {itemData ? (
            <p className="text-sm text-muted-foreground">
              {itemData.categoryName} | {INVENTORY_UNIT_LABELS[itemData.unit] ?? itemData.unit} | Stock: {itemData.currentStock} (min: {itemData.minimumStock})
              {itemData.location ? ` | ${itemData.location}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      {itemData && itemData.currentStock <= itemData.minimumStock ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-sm text-destructive font-medium">
            Stock is at or below minimum level. Current: {itemData.currentStock}, Minimum: {itemData.minimumStock}
          </p>
        </div>
      ) : null}

      <EntityListPage
        title="Stock Transactions"
        description="All stock movements for this item."
        actions={
          hasPermission(session, PERMISSIONS.INVENTORY_MANAGE) ? (
            <Button asChild size="sm">
              <Link to={ERP_ROUTES.INVENTORY_TRANSACTIONS + "/new"}>
                <IconPlus className="size-4 mr-1" />
                New transaction
              </Link>
            </Button>
          ) : undefined
        }
      >
        <ServerDataTable
          emptyDescription="No stock transactions for this item yet."
          emptyTitle="No transactions"
          errorTitle="Failed to load transactions"
          isLoading={transactionsQuery.isLoading}
          isError={Boolean(errorMessage)}
          errorDescription={errorMessage}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search transactions..."
          searchValue={searchInput}
          table={table}
          totalRows={transactionsData?.total ?? 0}
          showSearch={false}
        />
      </EntityListPage>
    </div>
  );
}
