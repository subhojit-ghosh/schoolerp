import { useCallback, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import {
  IconDotsVertical,
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
import {
  useBuildingsQuery,
  useUpdateBuildingStatusMutation,
} from "@/features/hostel/api/use-hostel";
import {
  BUILDING_LIST_SORT_FIELDS,
  BUILDINGS_PAGE_COPY,
  HOSTEL_BUILDING_TYPE_LABELS,
} from "@/features/hostel/model/hostel-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type BuildingRow = {
  id: string;
  name: string;
  buildingType: string;
  capacity: number;
  description: string | null;
  status: "active" | "inactive";
  createdAt: string;
};

const columnHelper = createColumnHelper<BuildingRow>();
const VALID_SORT_FIELDS = [
  BUILDING_LIST_SORT_FIELDS.NAME,
  BUILDING_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function HostelBuildingsPage() {
  useDocumentTitle("Hostel Buildings");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.HOSTEL_READ);
  const canManage = hasPermission(session, PERMISSIONS.HOSTEL_MANAGE);

  const statusMutation = useUpdateBuildingStatusMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: BUILDING_LIST_SORT_FIELDS.NAME,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const buildingsQuery = useBuildingsQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const buildingsData = buildingsQuery.data;
  const buildings = useMemo(
    () => (buildingsData?.rows ?? []) as BuildingRow[],
    [buildingsData?.rows],
  );

  const handleToggleStatus = useCallback(
    async (id: string, currentStatus: "active" | "inactive") => {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      try {
        await statusMutation.mutateAsync({
          params: { path: { buildingId: id } },
          body: { status: newStatus },
        });
        toast.success(
          newStatus === "active"
            ? "Building activated."
            : "Building deactivated.",
        );
      } catch (error) {
        toast.error(extractApiError(error, "Could not update building status. Please try again."));
      }
    },
    [statusMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(BUILDING_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Name
            <SortIcon
              direction={
                queryState.sortBy === BUILDING_LIST_SORT_FIELDS.NAME
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
      columnHelper.accessor("buildingType", {
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline">
            {HOSTEL_BUILDING_TYPE_LABELS[row.original.buildingType] ?? row.original.buildingType}
          </Badge>
        ),
      }),
      columnHelper.accessor("capacity", {
        header: "Capacity",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.capacity}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const building = row.original;
          if (!canManage) return null;

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
                    <Link
                      to={appendSearch(
                        `/hostel/buildings/${building.id}/edit`,
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
                      void handleToggleStatus(building.id, building.status)
                    }
                  >
                    {building.status === "active" ? (
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
    data: buildings,
    page: queryState.page,
    pageCount: buildingsData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: buildingsData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (buildingsQuery.error as Error | null | undefined)?.message;

  return (
    <EntityListPage
      title={BUILDINGS_PAGE_COPY.TITLE}
      description={BUILDINGS_PAGE_COPY.DESCRIPTION}
      actions={
        canManage ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.HOSTEL_BUILDING_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New building
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
              placeholder={BUILDINGS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  ERP_ROUTES.HOSTEL_BUILDING_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New building
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No buildings match your search."
            : BUILDINGS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching buildings"
            : BUILDINGS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load buildings"
        isLoading={buildingsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={BUILDINGS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={buildingsData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
