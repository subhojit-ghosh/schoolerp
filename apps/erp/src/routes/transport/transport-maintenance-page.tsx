import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  IconPlus,
  IconSearch,
  IconTool,
} from "@tabler/icons-react";
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
import { ERP_ROUTES } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useMaintenanceLogsQuery,
  type TransportMaintenanceQuery,
} from "@/features/transport/api/use-transport";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type MaintenanceRow = {
  id: string;
  vehicleId: string;
  vehicleRegistrationNumber: string;
  maintenanceType: "regular" | "repair" | "inspection";
  description: string;
  costInPaise: number | null;
  maintenanceDate: string;
  nextDueDate: string | null;
  vendorName: string | null;
  createdAt: string;
};

const columnHelper = createColumnHelper<MaintenanceRow>();
const VALID_SORT_FIELDS = ["maintenanceDate", "createdAt"] as const;

const PAISE_PER_RUPEE = 100;

const MAINTENANCE_TYPE_LABELS: Record<string, string> = {
  regular: "Regular",
  repair: "Repair",
  inspection: "Inspection",
};

const MAINTENANCE_TYPE_BADGE_CLASSES: Record<string, string> = {
  regular: "bg-blue-500/10 text-blue-700 border-blue-200",
  repair: "bg-orange-500/10 text-orange-700 border-orange-200",
  inspection: "bg-green-500/10 text-green-700 border-green-200",
};

export function TransportMaintenancePage() {
  useDocumentTitle("Vehicle Maintenance");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.TRANSPORT_READ);
  const canManage = hasPermission(session, PERMISSIONS.TRANSPORT_MANAGE);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: "maintenanceDate",
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const maintenanceQuery = useMaintenanceLogsQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    sort: queryState.sortBy as TransportMaintenanceQuery["sort"],
  });

  const rows = useMemo(
    () => (maintenanceQuery.data?.rows ?? []) as MaintenanceRow[],
    [maintenanceQuery.data],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("vehicleRegistrationNumber", {
        header: "Vehicle",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.vehicleRegistrationNumber}
          </span>
        ),
      }),
      columnHelper.accessor("maintenanceType", {
        header: "Type",
        cell: ({ row }) => (
          <Badge
            className={
              MAINTENANCE_TYPE_BADGE_CLASSES[row.original.maintenanceType] ?? ""
            }
          >
            {MAINTENANCE_TYPE_LABELS[row.original.maintenanceType] ??
              row.original.maintenanceType}
          </Badge>
        ),
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground line-clamp-1">
            {row.original.description}
          </span>
        ),
      }),
      columnHelper.accessor("maintenanceDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("maintenanceDate")}
            type="button"
          >
            Date
            <SortIcon
              direction={
                queryState.sortBy === "maintenanceDate"
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.maintenanceDate}</span>
        ),
      }),
      columnHelper.accessor("costInPaise", {
        header: "Cost",
        cell: ({ row }) =>
          row.original.costInPaise != null ? (
            <span className="text-sm font-medium">
              {"\u20B9"}
              {(row.original.costInPaise / PAISE_PER_RUPEE).toLocaleString(
                "en-IN",
                { minimumFractionDigits: 2 },
              )}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">--</span>
          ),
      }),
      columnHelper.accessor("vendorName", {
        header: "Vendor",
        cell: ({ row }) =>
          row.original.vendorName ? (
            <span className="text-sm">{row.original.vendorName}</span>
          ) : (
            <span className="text-muted-foreground text-sm">--</span>
          ),
      }),
    ],
    [queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: rows,
    page: queryState.page,
    pageCount: maintenanceQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: maintenanceQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (maintenanceQuery.error as Error | null | undefined)
    ?.message;

  return (
    <>
      <EntityListPage
        title="Vehicle Maintenance"
        description="Track maintenance history for transport vehicles."
        actions={
          canManage ? (
            <EntityPagePrimaryAction asChild>
              <Link
                to={appendSearch(
                  ERP_ROUTES.TRANSPORT_MAINTENANCE_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New maintenance log
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
                placeholder="Search by vehicle..."
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
                    ERP_ROUTES.TRANSPORT_MAINTENANCE_CREATE,
                    location.search,
                  )}
                >
                  <IconTool className="size-5" />
                  New maintenance log
                </Link>
              </EntityEmptyStateAction>
            ) : undefined
          }
          emptyDescription={
            queryState.search
              ? "No maintenance logs match your search."
              : "Log vehicle maintenance to track service history."
          }
          emptyTitle={
            queryState.search ? "No logs found" : "No maintenance logs yet"
          }
          errorTitle="Failed to load maintenance logs"
          isLoading={maintenanceQuery.isLoading}
          isError={Boolean(errorMessage)}
          errorDescription={errorMessage}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search maintenance..."
          searchValue={searchInput}
          table={table}
          totalRows={maintenanceQuery.data?.total ?? 0}
          showSearch={false}
        />
        <Outlet />
      </EntityListPage>
    </>
  );
}
