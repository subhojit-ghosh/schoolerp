import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  IconDotsVertical,
  IconList,
  IconMap,
  IconPencil,
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
import { useDocumentTitle } from "@/hooks/use-document-title";
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
import { StatusBadge } from "@/components/data-display/status-badge";
import { PERMISSIONS } from "@repo/contracts";
import {
  ERP_ROUTES,
  buildTransportRouteDetailRoute,
  buildTransportRouteEditRoute,
} from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useTransportRoutesQuery,
  useUpdateRouteMutation,
  type TransportRoutesQuery,
} from "@/features/transport/api/use-transport";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";

type RouteRow = {
  id: string;
  name: string;
  description: string | null;
  campusId: string | null;
  campusName: string | null;
  status: "active" | "inactive";
  stopCount: number;
  createdAt: string;
};

const columnHelper = createColumnHelper<RouteRow>();
const VALID_SORT_FIELDS = ["name", "createdAt"] as const;

export function TransportRoutesPage() {
  useDocumentTitle("Transport Routes");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.TRANSPORT_READ);
  const canManage = hasPermission(session, PERMISSIONS.TRANSPORT_MANAGE);

  const updateMutation = useUpdateRouteMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: "name",
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const routesQuery = useTransportRoutesQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy as TransportRoutesQuery["sort"],
  });

  const rows = useMemo(
    () => (routesQuery.data?.rows ?? []) as RouteRow[],
    [routesQuery.data],
  );

  async function handleToggleStatus(row: RouteRow) {
    const newStatus = row.status === "active" ? "inactive" : "active";
    try {
      await updateMutation.mutateAsync({
        params: { path: { routeId: row.id } },
        body: { status: newStatus },
      });
      toast.success(newStatus === "active" ? "Route activated." : "Route deactivated.");
    } catch (error) {
      toast.error(extractApiError(error, "Could not update route status. Please try again."));
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("name")}
            type="button"
          >
            Route
            <SortIcon
              direction={
                queryState.sortBy === "name" ? queryState.sortOrder : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium">{row.original.name}</p>
            {row.original.description ? (
              <p className="text-xs text-muted-foreground">{row.original.description}</p>
            ) : null}
            {row.original.campusName ? (
              <Badge variant="outline" className="text-xs">
                {row.original.campusName}
              </Badge>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor("stopCount", {
        header: "Stops",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.stopCount}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <EntityRowAction aria-label="Actions">
                  <IconDotsVertical className="size-4" />
                </EntityRowAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    to={appendSearch(
                      buildTransportRouteDetailRoute(row.original.id),
                      location.search,
                    )}
                  >
                    <IconList className="size-4 mr-2" />
                    Manage stops
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to={appendSearch(
                      buildTransportRouteEditRoute(row.original.id),
                      location.search,
                    )}
                  >
                    <IconPencil className="size-4 mr-2" />
                    Edit route
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void handleToggleStatus(row.original)}
                >
                  {row.original.status === "active" ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null,
      }),
    ],
    [canManage, location.search, queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: rows,
    page: queryState.page,
    pageCount: routesQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: routesQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (routesQuery.error as Error | null | undefined)?.message;

  return (
    <>
      <EntityListPage
        title="Transport Routes"
        description="Manage transport routes and their stops."
        actions={
          canManage ? (
            <EntityPagePrimaryAction asChild>
              <Link
                to={appendSearch(ERP_ROUTES.TRANSPORT_ROUTES_CREATE, location.search)}
              >
                <IconPlus className="size-4" />
                New route
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
                placeholder="Search routes..."
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
                  to={appendSearch(ERP_ROUTES.TRANSPORT_ROUTES_CREATE, location.search)}
                >
                  <IconMap className="size-5" />
                  New route
                </Link>
              </EntityEmptyStateAction>
            ) : undefined
          }
          emptyDescription={
            queryState.search
              ? "No routes match your search."
              : "Add routes to get started."
          }
          emptyTitle={queryState.search ? "No routes found" : "No routes yet"}
          errorTitle="Failed to load routes"
          isLoading={routesQuery.isLoading}
          isError={Boolean(errorMessage)}
          errorDescription={errorMessage}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search routes..."
          searchValue={searchInput}
          table={table}
          totalRows={routesQuery.data?.total ?? 0}
          showSearch={false}
        />
        <Outlet />
      </EntityListPage>
    </>
  );
}
