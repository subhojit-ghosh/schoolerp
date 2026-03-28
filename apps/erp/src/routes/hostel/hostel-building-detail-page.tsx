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
  useBuildingDetailQuery,
  useRoomsQuery,
} from "@/features/hostel/api/use-hostel";
import {
  HOSTEL_BUILDING_TYPE_LABELS,
  HOSTEL_ROOM_TYPE_LABELS,
} from "@/features/hostel/model/hostel-constants";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";

type RoomRow = {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  capacity: number;
  occupancy: number;
  status: "active" | "inactive";
  createdAt: string;
};

const columnHelper = createColumnHelper<RoomRow>();

const VALID_SORT_FIELDS = ["roomNumber", "floor", "createdAt"] as const;

export function HostelBuildingDetailPage() {
  const { buildingId } = useParams();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.HOSTEL_READ);

  const buildingQuery = useBuildingDetailQuery(canRead, buildingId);
  const buildingData = buildingQuery.data;

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: "roomNumber",
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const roomsQuery = useRoomsQuery(
    canRead && Boolean(buildingId),
    {
      buildingId,
      limit: queryState.pageSize,
      order: queryState.sortOrder,
      page: queryState.page,
      q: queryState.search || undefined,
      sort: queryState.sortBy,
    },
  );

  const roomsData = roomsQuery.data;
  const rooms = useMemo(
    () => (roomsData?.rows ?? []) as RoomRow[],
    [roomsData?.rows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("roomNumber", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("roomNumber")}
            type="button"
          >
            Room
            <SortIcon
              direction={
                queryState.sortBy === "roomNumber"
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.roomNumber}</span>
        ),
      }),
      columnHelper.accessor("floor", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("floor")}
            type="button"
          >
            Floor
            <SortIcon
              direction={
                queryState.sortBy === "floor"
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.floor}</span>
        ),
      }),
      columnHelper.accessor("roomType", {
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline">
            {HOSTEL_ROOM_TYPE_LABELS[row.original.roomType] ?? row.original.roomType}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "occupancyInfo",
        header: "Occupancy",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.occupancy} / {row.original.capacity}
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
    ],
    [queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: rooms,
    page: queryState.page,
    pageCount: roomsData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: roomsData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (roomsQuery.error as Error | null | undefined)?.message;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link to={ERP_ROUTES.HOSTEL_BUILDINGS}>
            <IconArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {buildingData?.name ?? "Building Detail"}
          </h1>
          {buildingData ? (
            <p className="text-sm text-muted-foreground">
              {HOSTEL_BUILDING_TYPE_LABELS[buildingData.buildingType] ?? buildingData.buildingType} | Capacity: {buildingData.capacity}
              {buildingData.description ? ` | ${buildingData.description}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      <EntityListPage
        title="Rooms"
        description="All rooms in this building."
        actions={
          hasPermission(session, PERMISSIONS.HOSTEL_MANAGE) ? (
            <Button asChild size="sm">
              <Link to={ERP_ROUTES.HOSTEL_ROOM_CREATE}>
                <IconPlus className="size-4 mr-1" />
                New room
              </Link>
            </Button>
          ) : undefined
        }
      >
        <ServerDataTable
          emptyDescription="No rooms in this building yet."
          emptyTitle="No rooms"
          errorTitle="Failed to load rooms"
          isLoading={roomsQuery.isLoading}
          isError={Boolean(errorMessage)}
          errorDescription={errorMessage}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search rooms..."
          searchValue={searchInput}
          table={table}
          totalRows={roomsData?.total ?? 0}
          showSearch={false}
        />
      </EntityListPage>
    </div>
  );
}
