import { useCallback, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import {
  IconDotsVertical,
  IconPlus,
  IconSearch,
  IconLogout,
} from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Button } from "@repo/ui/components/ui/button";
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
  useAllocationsQuery,
  useVacateAllocationMutation,
} from "@/features/hostel/api/use-hostel";
import {
  ALLOCATION_LIST_SORT_FIELDS,
  ALLOCATIONS_PAGE_COPY,
  BED_ALLOCATION_STATUS_LABELS,
} from "@/features/hostel/model/hostel-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type AllocationRow = {
  id: string;
  roomNumber: string;
  buildingName: string;
  studentName: string;
  bedNumber: string;
  startDate: string;
  endDate: string | null;
  status: "active" | "vacated";
  createdAt: string;
};

const columnHelper = createColumnHelper<AllocationRow>();
const VALID_SORT_FIELDS = [
  ALLOCATION_LIST_SORT_FIELDS.BED_NUMBER,
  ALLOCATION_LIST_SORT_FIELDS.START_DATE,
  ALLOCATION_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function HostelAllocationsPage() {
  useDocumentTitle("Bed Allocations");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.HOSTEL_READ);
  const canManage = hasPermission(session, PERMISSIONS.HOSTEL_MANAGE);

  const vacateMutation = useVacateAllocationMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: ALLOCATION_LIST_SORT_FIELDS.CREATED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const allocationsQuery = useAllocationsQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const allocationsData = allocationsQuery.data;
  const allocations = useMemo(
    () => (allocationsData?.rows ?? []) as AllocationRow[],
    [allocationsData?.rows],
  );

  const handleVacate = useCallback(
    async (allocationId: string) => {
      try {
        await vacateMutation.mutateAsync({
          params: { path: { allocationId } },
        });
        toast.success("Bed allocation vacated.");
      } catch (error) {
        toast.error(
          extractApiError(
            error,
            "Could not vacate bed allocation. Please try again.",
          ),
        );
      }
    },
    [vacateMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("bedNumber", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(ALLOCATION_LIST_SORT_FIELDS.BED_NUMBER)}
            type="button"
          >
            Bed
            <SortIcon
              direction={
                queryState.sortBy === ALLOCATION_LIST_SORT_FIELDS.BED_NUMBER
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.bedNumber}</span>
        ),
      }),
      columnHelper.accessor("studentName", {
        header: "Student",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.studentName}</span>
        ),
      }),
      columnHelper.accessor("roomNumber", {
        header: "Room",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.buildingName} - {row.original.roomNumber}
          </span>
        ),
      }),
      columnHelper.accessor("startDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(ALLOCATION_LIST_SORT_FIELDS.START_DATE)}
            type="button"
          >
            Start
            <SortIcon
              direction={
                queryState.sortBy === ALLOCATION_LIST_SORT_FIELDS.START_DATE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {new Date(row.original.startDate).toLocaleDateString()}
          </span>
        ),
      }),
      columnHelper.accessor("endDate", {
        header: "End",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.endDate
              ? new Date(row.original.endDate).toLocaleDateString()
              : "-"}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            label={BED_ALLOCATION_STATUS_LABELS[row.original.status]}
          />
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const allocation = row.original;
          if (!canManage || allocation.status !== "active") return null;

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
                  <DropdownMenuItem
                    onSelect={() => void handleVacate(allocation.id)}
                  >
                    <IconLogout className="mr-2 size-4" />
                    Vacate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [
      canManage,
      handleVacate,
      queryState.sortBy,
      queryState.sortOrder,
      setSorting,
    ],
  );

  const table = useServerDataTable({
    columns,
    data: allocations,
    page: queryState.page,
    pageCount: allocationsData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: allocationsData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (allocationsQuery.error as Error | null | undefined)
    ?.message;

  return (
    <EntityListPage
      title={ALLOCATIONS_PAGE_COPY.TITLE}
      description={ALLOCATIONS_PAGE_COPY.DESCRIPTION}
      actions={
        canManage ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.HOSTEL_ALLOCATION_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New allocation
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
              placeholder={ALLOCATIONS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  ERP_ROUTES.HOSTEL_ALLOCATION_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New allocation
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No allocations match your search."
            : ALLOCATIONS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching allocations"
            : ALLOCATIONS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load allocations"
        isLoading={allocationsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={ALLOCATIONS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={allocationsData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
