import { useMemo } from "react";
import { Link } from "react-router";
import { IconSearch } from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { PERMISSIONS } from "@repo/contracts";
import { SORT_ORDERS } from "@/constants/query";
import { buildInventoryItemDetailRoute } from "@/constants/routes";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useLowStockQuery } from "@/features/inventory/api/use-inventory";
import {
  LOW_STOCK_LIST_SORT_FIELDS,
  LOW_STOCK_PAGE_COPY,
  INVENTORY_UNIT_LABELS,
} from "@/features/inventory/model/inventory-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";

type LowStockRow = {
  id: string;
  name: string;
  categoryName: string;
  sku: string | null;
  unit: string;
  currentStock: number;
  minimumStock: number;
  location: string | null;
};

const columnHelper = createColumnHelper<LowStockRow>();
const VALID_SORT_FIELDS = [
  LOW_STOCK_LIST_SORT_FIELDS.NAME,
  LOW_STOCK_LIST_SORT_FIELDS.CURRENT_STOCK,
  LOW_STOCK_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function InventoryLowStockPage() {
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.INVENTORY_READ);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: LOW_STOCK_LIST_SORT_FIELDS.CURRENT_STOCK,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const lowStockQuery = useLowStockQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const lowStockData = lowStockQuery.data;
  const items = useMemo(
    () => (lowStockData?.rows ?? []) as LowStockRow[],
    [lowStockData?.rows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(LOW_STOCK_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Name
            <SortIcon
              direction={
                queryState.sortBy === LOW_STOCK_LIST_SORT_FIELDS.NAME
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <Link
            className="text-sm font-medium hover:underline"
            to={buildInventoryItemDetailRoute(row.original.id)}
          >
            {row.original.name}
          </Link>
        ),
      }),
      columnHelper.accessor("categoryName", {
        header: "Category",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.categoryName}</span>
        ),
      }),
      columnHelper.accessor("currentStock", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(LOW_STOCK_LIST_SORT_FIELDS.CURRENT_STOCK)}
            type="button"
          >
            Current Stock
            <SortIcon
              direction={
                queryState.sortBy === LOW_STOCK_LIST_SORT_FIELDS.CURRENT_STOCK
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-destructive font-medium">
            {row.original.currentStock}
          </span>
        ),
      }),
      columnHelper.accessor("minimumStock", {
        header: "Minimum",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.minimumStock}</span>
        ),
      }),
      columnHelper.accessor("unit", {
        header: "Unit",
        cell: ({ row }) => (
          <span className="text-sm">
            {INVENTORY_UNIT_LABELS[row.original.unit] ?? row.original.unit}
          </span>
        ),
      }),
      columnHelper.accessor("location", {
        header: "Location",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.location || "-"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "deficit",
        header: "Deficit",
        cell: ({ row }) => {
          const deficit = row.original.minimumStock - row.original.currentStock;
          return (
            <Badge variant="destructive">
              {deficit > 0 ? `-${deficit}` : "At limit"}
            </Badge>
          );
        },
      }),
    ],
    [queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: items,
    page: queryState.page,
    pageCount: lowStockData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: lowStockData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (lowStockQuery.error as Error | null | undefined)?.message;

  return (
    <EntityListPage
      title={LOW_STOCK_PAGE_COPY.TITLE}
      description={LOW_STOCK_PAGE_COPY.DESCRIPTION}
      toolbar={
        <div className="border rounded-lg bg-card p-4">
          <div className="relative max-w-sm">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={LOW_STOCK_PAGE_COPY.SEARCH_PLACEHOLDER}
              value={searchInput}
            />
          </div>
        </div>
      }
    >
      <ServerDataTable
        emptyDescription={
          queryState.search
            ? "No items match your search."
            : LOW_STOCK_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching items"
            : LOW_STOCK_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load low stock items"
        isLoading={lowStockQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={LOW_STOCK_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={lowStockData?.total ?? 0}
        showSearch={false}
      />
    </EntityListPage>
  );
}
