import { useCallback, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import {
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconPlus,
  IconSearch,
  IconToggleLeft,
  IconToggleRight,
} from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
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
import { ERP_ROUTES, buildInventoryItemDetailRoute } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useItemsQuery,
  useUpdateItemStatusMutation,
} from "@/features/inventory/api/use-inventory";
import {
  ITEM_LIST_SORT_FIELDS,
  ITEMS_PAGE_COPY,
  INVENTORY_UNIT_LABELS,
} from "@/features/inventory/model/inventory-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type ItemRow = {
  id: string;
  name: string;
  categoryName: string;
  sku: string | null;
  unit: string;
  currentStock: number;
  minimumStock: number;
  location: string | null;
  status: "active" | "inactive";
  createdAt: string;
};

const columnHelper = createColumnHelper<ItemRow>();
const VALID_SORT_FIELDS = [
  ITEM_LIST_SORT_FIELDS.NAME,
  ITEM_LIST_SORT_FIELDS.CURRENT_STOCK,
  ITEM_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function InventoryItemsPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.INVENTORY_READ);
  const canManage = hasPermission(session, PERMISSIONS.INVENTORY_MANAGE);

  const statusMutation = useUpdateItemStatusMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: ITEM_LIST_SORT_FIELDS.NAME,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const itemsQuery = useItemsQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const itemsData = itemsQuery.data as any;
  const items = useMemo(
    () => (itemsData?.rows ?? []) as ItemRow[],
    [itemsData?.rows],
  );

  const handleToggleStatus = useCallback(
    async (id: string, currentStatus: "active" | "inactive") => {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await statusMutation.mutateAsync({
        params: { path: { itemId: id } },
        body: { status: newStatus },
      } as any);
      toast.success(
        newStatus === "active" ? "Item activated." : "Item deactivated.",
      );
    },
    [statusMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(ITEM_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Name
            <SortIcon
              direction={
                queryState.sortBy === ITEM_LIST_SORT_FIELDS.NAME
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
            onClick={() => setSorting(ITEM_LIST_SORT_FIELDS.CURRENT_STOCK)}
            type="button"
          >
            Stock
            <SortIcon
              direction={
                queryState.sortBy === ITEM_LIST_SORT_FIELDS.CURRENT_STOCK
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => {
          const isLow = row.original.currentStock <= row.original.minimumStock;
          return (
            <span className={`text-sm ${isLow ? "text-destructive font-medium" : ""}`}>
              {row.original.currentStock}
              {isLow ? " (Low)" : ""}
            </span>
          );
        },
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
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) =>
          row.original.status === "active" ? (
            <Badge variant="outline">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="size-8 text-muted-foreground data-[state=open]:bg-muted"
                    size="icon"
                    variant="ghost"
                  >
                    <IconDotsVertical className="size-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={buildInventoryItemDetailRoute(item.id)}>
                      <IconEye className="mr-2 size-4" />
                      View detail
                    </Link>
                  </DropdownMenuItem>
                  {canManage ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link
                          to={appendSearch(
                            `/inventory/items/${item.id}/edit`,
                            location.search,
                          )}
                        >
                          <IconPencil className="mr-2 size-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() =>
                          void handleToggleStatus(item.id, item.status)
                        }
                      >
                        {item.status === "active" ? (
                          <>
                            <IconToggleRight className="mr-2 size-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <IconToggleLeft className="mr-2 size-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [canManage, handleToggleStatus, location.search, queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: items,
    page: queryState.page,
    pageCount: itemsData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: itemsData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (itemsQuery.error as Error | null | undefined)?.message;

  return (
    <EntityListPage
      title={ITEMS_PAGE_COPY.TITLE}
      description={ITEMS_PAGE_COPY.DESCRIPTION}
      actions={
        canManage ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.INVENTORY_ITEM_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New item
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
              placeholder={ITEMS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  ERP_ROUTES.INVENTORY_ITEM_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New item
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No items match your search."
            : ITEMS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching items"
            : ITEMS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load items"
        isLoading={itemsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={ITEMS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={itemsData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
