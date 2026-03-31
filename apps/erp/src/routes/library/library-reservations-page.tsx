import { useCallback, useMemo } from "react";
import {
  IconBookmark,
  IconCheck,
  IconDotsVertical,
  IconSearch,
  IconX,
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
  EntityRowAction,
} from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { PERMISSIONS } from "@repo/contracts";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useLibraryReservationsQuery,
  useFulfillReservationMutation,
  useCancelReservationMutation,
} from "@/features/library/api/use-library";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";

type ReservationRow = {
  id: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  queuePosition: number;
  status: "pending" | "fulfilled" | "cancelled";
  reservedAt: string;
  fulfilledAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

const columnHelper = createColumnHelper<ReservationRow>();
const VALID_SORT_FIELDS = ["createdAt", "queuePosition", "status"] as const;

function ReservationStatusBadge({
  status,
}: {
  status: ReservationRow["status"];
}) {
  switch (status) {
    case "fulfilled":
      return (
        <Badge className="bg-green-500/10 text-green-700 border-green-200">
          Fulfilled
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}

type LibraryReservationsQuery = {
  sort?: "createdAt" | "queuePosition" | "status";
};

export function LibraryReservationsPage() {
  useDocumentTitle("Library Reservations");
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.LIBRARY_READ);
  const canManage = hasPermission(session, PERMISSIONS.LIBRARY_MANAGE);

  const fulfillMutation = useFulfillReservationMutation();
  const cancelMutation = useCancelReservationMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: "createdAt",
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const reservationsQuery = useLibraryReservationsQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy as LibraryReservationsQuery["sort"],
  });

  const reservations = useMemo(
    () => (reservationsQuery.data?.rows ?? []) as ReservationRow[],
    [reservationsQuery.data?.rows],
  );

  const handleFulfill = useCallback(
    async (reservationId: string) => {
      try {
        await fulfillMutation.mutateAsync({
          params: { path: { reservationId } },
        });
        toast.success("Reservation fulfilled.");
      } catch (error) {
        toast.error(
          extractApiError(
            error,
            "Could not fulfill reservation. Please try again.",
          ),
        );
      }
    },
    [fulfillMutation],
  );

  const handleCancel = useCallback(
    async (reservationId: string) => {
      try {
        await cancelMutation.mutateAsync({
          params: { path: { reservationId } },
        });
        toast.success("Reservation cancelled.");
      } catch (error) {
        toast.error(
          extractApiError(
            error,
            "Could not cancel reservation. Please try again.",
          ),
        );
      }
    },
    [cancelMutation],
  );

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }),
    [],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("bookTitle", {
        header: "Book",
        cell: ({ row }) => (
          <p className="text-sm font-medium">{row.original.bookTitle}</p>
        ),
      }),
      columnHelper.accessor("memberName", {
        header: "Member",
        cell: ({ row }) => (
          <p className="text-sm font-medium">{row.original.memberName}</p>
        ),
      }),
      columnHelper.accessor("queuePosition", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("queuePosition")}
            type="button"
          >
            Queue
            <SortIcon
              direction={
                queryState.sortBy === "queuePosition"
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            #{row.original.queuePosition}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => (
          <ReservationStatusBadge status={row.original.status} />
        ),
      }),
      columnHelper.accessor("reservedAt", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("createdAt")}
            type="button"
          >
            Reserved
            <SortIcon
              direction={
                queryState.sortBy === "createdAt" ? queryState.sortOrder : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {dateFormatter.format(new Date(row.original.reservedAt))}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          canManage && row.original.status === "pending" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <EntityRowAction aria-label="Actions">
                  <IconDotsVertical className="size-4" />
                </EntityRowAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => void handleFulfill(row.original.id)}
                >
                  <IconCheck className="size-4 mr-2" />
                  Fulfill
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void handleCancel(row.original.id)}
                >
                  <IconX className="size-4 mr-2" />
                  Cancel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null,
      }),
    ],
    [
      canManage,
      dateFormatter,
      handleCancel,
      handleFulfill,
      queryState.sortBy,
      queryState.sortOrder,
      setSorting,
    ],
  );

  const table = useServerDataTable({
    columns,
    data: reservations,
    page: queryState.page,
    pageCount: reservationsQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: reservationsQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (reservationsQuery.error as Error | null | undefined)
    ?.message;

  return (
    <EntityListPage
      title="Library Reservations"
      description="Manage book reservation queue."
      toolbar={
        <div className="border rounded-lg bg-card p-4">
          <div className="relative max-w-sm">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by book, member..."
              value={searchInput}
            />
          </div>
        </div>
      }
    >
      <ServerDataTable
        emptyAction={
          !queryState.search ? (
            <EntityEmptyStateAction disabled>
              <IconBookmark className="size-5" />
              No reservations yet
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No reservations match your search."
            : "When members reserve books, they will appear here."
        }
        emptyTitle={
          queryState.search ? "No reservations found" : "No reservations"
        }
        errorTitle="Failed to load reservations"
        isLoading={reservationsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by book, member..."
        searchValue={searchInput}
        table={table}
        totalRows={reservationsQuery.data?.total ?? 0}
        showSearch={false}
      />
    </EntityListPage>
  );
}
