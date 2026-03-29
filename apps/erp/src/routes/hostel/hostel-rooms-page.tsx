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
  useRoomsQuery,
  useUpdateRoomStatusMutation,
} from "@/features/hostel/api/use-hostel";
import {
  ROOM_LIST_SORT_FIELDS,
  ROOMS_PAGE_COPY,
  HOSTEL_ROOM_TYPE_LABELS,
} from "@/features/hostel/model/hostel-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type RoomRow = {
  id: string;
  buildingId: string;
  buildingName: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  capacity: number;
  occupancy: number;
  status: "active" | "inactive";
  createdAt: string;
};

const columnHelper = createColumnHelper<RoomRow>();
const VALID_SORT_FIELDS = [
  ROOM_LIST_SORT_FIELDS.ROOM_NUMBER,
  ROOM_LIST_SORT_FIELDS.FLOOR,
  ROOM_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function HostelRoomsPage() {
  useDocumentTitle("Hostel Rooms");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.HOSTEL_READ);
  const canManage = hasPermission(session, PERMISSIONS.HOSTEL_MANAGE);

  const statusMutation = useUpdateRoomStatusMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: ROOM_LIST_SORT_FIELDS.ROOM_NUMBER,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const roomsQuery = useRoomsQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const roomsData = roomsQuery.data;
  const rooms = useMemo(
    () => (roomsData?.rows ?? []) as RoomRow[],
    [roomsData?.rows],
  );

  const handleToggleStatus = useCallback(
    async (id: string, currentStatus: "active" | "inactive") => {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      try {
        await statusMutation.mutateAsync({
          params: { path: { roomId: id } },
          body: { status: newStatus },
        });
        toast.success(
          newStatus === "active" ? "Room activated." : "Room deactivated.",
        );
      } catch (error) {
        toast.error(
          extractApiError(
            error,
            "Could not update room status. Please try again.",
          ),
        );
      }
    },
    [statusMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("roomNumber", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(ROOM_LIST_SORT_FIELDS.ROOM_NUMBER)}
            type="button"
          >
            Room
            <SortIcon
              direction={
                queryState.sortBy === ROOM_LIST_SORT_FIELDS.ROOM_NUMBER
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
      columnHelper.accessor("buildingName", {
        header: "Building",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.buildingName}</span>
        ),
      }),
      columnHelper.accessor("floor", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(ROOM_LIST_SORT_FIELDS.FLOOR)}
            type="button"
          >
            Floor
            <SortIcon
              direction={
                queryState.sortBy === ROOM_LIST_SORT_FIELDS.FLOOR
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
            {HOSTEL_ROOM_TYPE_LABELS[row.original.roomType] ??
              row.original.roomType}
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
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const room = row.original;
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
                        `/hostel/rooms/${room.id}/edit`,
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
                      void handleToggleStatus(room.id, room.status)
                    }
                  >
                    {room.status === "active" ? (
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
    <EntityListPage
      title={ROOMS_PAGE_COPY.TITLE}
      description={ROOMS_PAGE_COPY.DESCRIPTION}
      actions={
        canManage ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(ERP_ROUTES.HOSTEL_ROOM_CREATE, location.search)}
            >
              <IconPlus className="size-4" />
              New room
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
              placeholder={ROOMS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  ERP_ROUTES.HOSTEL_ROOM_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New room
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No rooms match your search."
            : ROOMS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search ? "No matching rooms" : ROOMS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load rooms"
        isLoading={roomsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={ROOMS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={roomsData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
