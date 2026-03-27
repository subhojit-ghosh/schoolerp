import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTruck,
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
import { PERMISSIONS } from "@repo/contracts";
import {
  ERP_ROUTES,
  buildTransportVehicleEditRoute,
} from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useTransportVehiclesQuery,
  useUpdateVehicleMutation,
  type TransportVehiclesQuery,
} from "@/features/transport/api/use-transport";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";
import { toast } from "sonner";

type VehicleRow = {
  id: string;
  registrationNumber: string;
  type: "bus" | "van" | "auto";
  capacity: number;
  driverName: string | null;
  driverContact: string | null;
  routeId: string | null;
  routeName: string | null;
  status: "active" | "inactive";
  createdAt: string;
};

const columnHelper = createColumnHelper<VehicleRow>();
const VALID_SORT_FIELDS = ["registrationNumber", "type", "createdAt"] as const;

const VEHICLE_TYPE_LABELS: Record<"bus" | "van" | "auto", string> = {
  bus: "Bus",
  van: "Van",
  auto: "Auto",
};

export function TransportVehiclesPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.TRANSPORT_READ);
  const canManage = hasPermission(session, PERMISSIONS.TRANSPORT_MANAGE);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateMutation = useUpdateVehicleMutation() as any;

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: "registrationNumber",
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vehiclesQuery = useTransportVehiclesQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy as TransportVehiclesQuery["sort"],
  });

  const rows = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => ((vehiclesQuery.data as any)?.rows ?? []) as VehicleRow[],
    [vehiclesQuery.data],
  );

  async function handleToggleStatus(row: VehicleRow) {
    const newStatus = row.status === "active" ? "inactive" : "active";
    await updateMutation.mutateAsync({
      params: { path: { vehicleId: row.id } },
      body: { status: newStatus },
    });
    toast.success(
      newStatus === "active" ? "Vehicle activated." : "Vehicle deactivated.",
    );
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("registrationNumber", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("registrationNumber")}
            type="button"
          >
            Vehicle
            <SortIcon
              direction={
                queryState.sortBy === "registrationNumber"
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium">{row.original.registrationNumber}</p>
            {row.original.driverName ? (
              <p className="text-xs text-muted-foreground">
                Driver: {row.original.driverName}
                {row.original.driverContact
                  ? ` · ${row.original.driverContact}`
                  : ""}
              </p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor("type", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("type")}
            type="button"
          >
            Type
            <SortIcon
              direction={
                queryState.sortBy === "type" ? queryState.sortOrder : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-sm">{VEHICLE_TYPE_LABELS[row.original.type]}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.capacity} seats
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("routeName", {
        header: "Assigned Route",
        cell: ({ row }) =>
          row.original.routeName ? (
            <Badge variant="outline">{row.original.routeName}</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) =>
          row.original.status === "active" ? (
            <Badge className="bg-green-500/10 text-green-700 border-green-200">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          ),
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
                      buildTransportVehicleEditRoute(row.original.id),
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
    [canManage, location.search, queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: rows,
    page: queryState.page,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pageCount: (vehiclesQuery.data as any)?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rowCount: (vehiclesQuery.data as any)?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (vehiclesQuery.error as Error | null | undefined)?.message;

  return (
    <>
      <EntityListPage
        title="Transport Vehicles"
        description="Manage vehicles and their route assignments."
        actions={
          canManage ? (
            <EntityPagePrimaryAction asChild>
              <Link
                to={appendSearch(
                  ERP_ROUTES.TRANSPORT_VEHICLES_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New vehicle
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
                placeholder="Search by registration, driver..."
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
                    ERP_ROUTES.TRANSPORT_VEHICLES_CREATE,
                    location.search,
                  )}
                >
                  <IconTruck className="size-5" />
                  New vehicle
                </Link>
              </EntityEmptyStateAction>
            ) : undefined
          }
          emptyDescription={
            queryState.search
              ? "No vehicles match your search."
              : "Add vehicles to manage your transport fleet."
          }
          emptyTitle={queryState.search ? "No vehicles found" : "No vehicles yet"}
          errorTitle="Failed to load vehicles"
          isLoading={vehiclesQuery.isLoading}
          isError={Boolean(errorMessage)}
          errorDescription={errorMessage}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search vehicles..."
          searchValue={searchInput}
          table={table}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          totalRows={(vehiclesQuery.data as any)?.total ?? 0}
          showSearch={false}
        />
        <Outlet />
      </EntityListPage>
    </>
  );
}
