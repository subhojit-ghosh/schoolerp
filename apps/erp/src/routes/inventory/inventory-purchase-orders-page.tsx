import { useMemo } from "react";
import { Link, useLocation } from "react-router";
import { IconEye, IconPlus, IconSearch } from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
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
import {
  ERP_ROUTES,
  buildInventoryPurchaseOrderDetailRoute,
} from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { usePurchaseOrdersQuery } from "@/features/inventory/api/use-inventory";
import {
  PURCHASE_ORDER_LIST_SORT_FIELDS,
  PURCHASE_ORDERS_PAGE_COPY,
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/features/inventory/model/inventory-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type PurchaseOrderRow = {
  id: string;
  orderNumber: string;
  vendorName: string;
  orderDate: string;
  totalAmountInPaise: number;
  status: "draft" | "ordered" | "partially_received" | "received" | "cancelled";
  createdByName: string;
  createdAt: string;
};

const columnHelper = createColumnHelper<PurchaseOrderRow>();
const VALID_SORT_FIELDS = [
  PURCHASE_ORDER_LIST_SORT_FIELDS.ORDER_DATE,
  PURCHASE_ORDER_LIST_SORT_FIELDS.ORDER_NUMBER,
  PURCHASE_ORDER_LIST_SORT_FIELDS.CREATED_AT,
] as const;

const PO_STATUS_BADGE_CLASSES: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-700 border-gray-200",
  ordered: "bg-blue-500/10 text-blue-700 border-blue-200",
  partially_received: "bg-orange-500/10 text-orange-700 border-orange-200",
  received: "bg-green-500/10 text-green-700 border-green-200",
  cancelled: "bg-red-500/10 text-red-700 border-red-200",
};

function formatAmountFromPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

export function InventoryPurchaseOrdersPage() {
  useDocumentTitle("Purchase Orders");
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
    defaultSortBy: PURCHASE_ORDER_LIST_SORT_FIELDS.CREATED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const ordersQuery = usePurchaseOrdersQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const ordersData = ordersQuery.data;
  const orders = useMemo(
    () => (ordersData?.rows ?? []) as PurchaseOrderRow[],
    [ordersData?.rows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("orderNumber", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(PURCHASE_ORDER_LIST_SORT_FIELDS.ORDER_NUMBER)
            }
            type="button"
          >
            Order #
            <SortIcon
              direction={
                queryState.sortBy ===
                PURCHASE_ORDER_LIST_SORT_FIELDS.ORDER_NUMBER
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <Link
            className="text-sm font-medium hover:underline"
            to={buildInventoryPurchaseOrderDetailRoute(row.original.id)}
          >
            {row.original.orderNumber}
          </Link>
        ),
      }),
      columnHelper.accessor("vendorName", {
        header: "Vendor",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.vendorName}</span>
        ),
      }),
      columnHelper.accessor("orderDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(PURCHASE_ORDER_LIST_SORT_FIELDS.ORDER_DATE)
            }
            type="button"
          >
            Date
            <SortIcon
              direction={
                queryState.sortBy === PURCHASE_ORDER_LIST_SORT_FIELDS.ORDER_DATE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {new Date(row.original.orderDate).toLocaleDateString()}
          </span>
        ),
      }),
      columnHelper.accessor("totalAmountInPaise", {
        header: "Total",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {formatAmountFromPaise(row.original.totalAmountInPaise)}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => (
          <Badge className={PO_STATUS_BADGE_CLASSES[row.original.status] ?? ""}>
            {PURCHASE_ORDER_STATUS_LABELS[row.original.status] ??
              row.original.status}
          </Badge>
        ),
      }),
      columnHelper.accessor("createdByName", {
        header: "Created By",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.createdByName}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Link
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              to={buildInventoryPurchaseOrderDetailRoute(row.original.id)}
            >
              <IconEye className="size-4" />
              View
            </Link>
          </div>
        ),
      }),
    ],
    [queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: orders,
    page: queryState.page,
    pageCount: ordersData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: ordersData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (ordersQuery.error as Error | null | undefined)?.message;

  return (
    <EntityListPage
      title={PURCHASE_ORDERS_PAGE_COPY.TITLE}
      description={PURCHASE_ORDERS_PAGE_COPY.DESCRIPTION}
      actions={
        canManage ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.INVENTORY_PURCHASE_ORDER_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New purchase order
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
              placeholder={PURCHASE_ORDERS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  ERP_ROUTES.INVENTORY_PURCHASE_ORDER_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New purchase order
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No purchase orders match your search."
            : PURCHASE_ORDERS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching purchase orders"
            : PURCHASE_ORDERS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load purchase orders"
        isLoading={ordersQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={PURCHASE_ORDERS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={ordersData?.total ?? 0}
        showSearch={false}
      />
    </EntityListPage>
  );
}
