import { useCallback, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconSearch,
  IconSteeringWheel,
} from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
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
import { ERP_ROUTES, buildTransportDriverEditRoute } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useDriversQuery,
  useUpdateDriverMutation,
  type TransportDriversQuery,
} from "@/features/transport/api/use-transport";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";

type DriverRow = {
  id: string;
  name: string;
  mobile: string;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  address: string | null;
  emergencyContact: string | null;
  status: "active" | "inactive";
  vehicleCount: number;
  createdAt: string;
};

const columnHelper = createColumnHelper<DriverRow>();
const VALID_SORT_FIELDS = ["name", "createdAt"] as const;

export function TransportDriversPage() {
  useDocumentTitle("Drivers");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.TRANSPORT_READ);
  const canManage = hasPermission(session, PERMISSIONS.TRANSPORT_MANAGE);

  const updateMutation = useUpdateDriverMutation();

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

  const driversQuery = useDriversQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy as TransportDriversQuery["sort"],
  });

  const rows = useMemo(
    () => (driversQuery.data?.rows ?? []) as DriverRow[],
    [driversQuery.data],
  );

  const handleToggleStatus = useCallback(
    async (row: DriverRow) => {
      const newStatus = row.status === "active" ? "inactive" : "active";
      try {
        await updateMutation.mutateAsync({
          params: { path: { driverId: row.id } },
          body: { status: newStatus },
        });
        toast.success(
          newStatus === "active" ? "Driver activated." : "Driver deactivated.",
        );
      } catch (error) {
        toast.error(
          extractApiError(
            error,
            "Could not update driver status. Please try again.",
          ),
        );
      }
    },
    [updateMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("name")}
            type="button"
          >
            Driver
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
            <p className="text-xs text-muted-foreground">
              {row.original.mobile}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("licenseNumber", {
        header: "License",
        cell: ({ row }) =>
          row.original.licenseNumber ? (
            <div className="space-y-0.5">
              <p className="text-sm">{row.original.licenseNumber}</p>
              {row.original.licenseExpiry ? (
                <p className="text-xs text-muted-foreground">
                  Exp: {row.original.licenseExpiry}
                </p>
              ) : null}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">--</span>
          ),
      }),
      columnHelper.accessor("vehicleCount", {
        header: "Vehicles",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.vehicleCount}</span>
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
                      buildTransportDriverEditRoute(row.original.id),
                      location.search,
                    )}
                  >
                    <IconPencil className="size-4 mr-2" />
                    Edit
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
    [
      canManage,
      handleToggleStatus,
      location.search,
      queryState.sortBy,
      queryState.sortOrder,
      setSorting,
    ],
  );

  const table = useServerDataTable({
    columns,
    data: rows,
    page: queryState.page,
    pageCount: driversQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: driversQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (driversQuery.error as Error | null | undefined)
    ?.message;

  return (
    <>
      <EntityListPage
        title="Transport Drivers"
        description="Manage drivers for your transport fleet."
        actions={
          canManage ? (
            <EntityPagePrimaryAction asChild>
              <Link
                to={appendSearch(
                  ERP_ROUTES.TRANSPORT_DRIVER_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New driver
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
                placeholder="Search by name, mobile..."
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
                    ERP_ROUTES.TRANSPORT_DRIVER_CREATE,
                    location.search,
                  )}
                >
                  <IconSteeringWheel className="size-5" />
                  New driver
                </Link>
              </EntityEmptyStateAction>
            ) : undefined
          }
          emptyDescription={
            queryState.search
              ? "No drivers match your search."
              : "Add drivers to manage your transport team."
          }
          emptyTitle={queryState.search ? "No drivers found" : "No drivers yet"}
          errorTitle="Failed to load drivers"
          isLoading={driversQuery.isLoading}
          isError={Boolean(errorMessage)}
          errorDescription={errorMessage}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search drivers..."
          searchValue={searchInput}
          table={table}
          totalRows={driversQuery.data?.total ?? 0}
          showSearch={false}
        />
        <Outlet />
      </EntityListPage>
    </>
  );
}
