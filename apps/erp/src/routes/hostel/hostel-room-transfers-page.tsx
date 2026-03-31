import { useMemo } from "react";
import { IconSearch } from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Input } from "@repo/ui/components/ui/input";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { PERMISSIONS } from "@repo/contracts";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useRoomTransfersQuery } from "@/features/hostel/api/use-hostel";
import {
  ROOM_TRANSFER_LIST_SORT_FIELDS,
  ROOM_TRANSFERS_PAGE_COPY,
} from "@/features/hostel/model/hostel-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";

type RoomTransferRow = {
  id: string;
  studentId: string;
  studentName: string;
  fromRoomId: string;
  fromRoomNumber: string;
  toRoomId: string;
  toRoomNumber: string;
  fromBedNumber: string;
  toBedNumber: string;
  transferDate: string;
  reason: string | null;
  transferredByMemberId: string;
  createdAt: string;
};

const columnHelper = createColumnHelper<RoomTransferRow>();
const VALID_SORT_FIELDS = [
  ROOM_TRANSFER_LIST_SORT_FIELDS.TRANSFER_DATE,
  ROOM_TRANSFER_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function HostelRoomTransfersPage() {
  useDocumentTitle("Room Transfers");
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.HOSTEL_READ);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: ROOM_TRANSFER_LIST_SORT_FIELDS.TRANSFER_DATE,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const transfersQuery = useRoomTransfersQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const transfersData = transfersQuery.data;
  const transfers = useMemo(
    () => (transfersData?.rows ?? []) as RoomTransferRow[],
    [transfersData?.rows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("studentName", {
        header: "Student",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.studentName}
          </span>
        ),
      }),
      columnHelper.accessor("fromRoomNumber", {
        header: "From Room / Bed",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.fromRoomNumber} / {row.original.fromBedNumber}
          </span>
        ),
      }),
      columnHelper.accessor("toRoomNumber", {
        header: "To Room / Bed",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.toRoomNumber} / {row.original.toBedNumber}
          </span>
        ),
      }),
      columnHelper.accessor("transferDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(ROOM_TRANSFER_LIST_SORT_FIELDS.TRANSFER_DATE)
            }
            type="button"
          >
            Date
            <SortIcon
              direction={
                queryState.sortBy ===
                ROOM_TRANSFER_LIST_SORT_FIELDS.TRANSFER_DATE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {new Date(row.original.transferDate).toLocaleDateString()}
          </span>
        ),
      }),
      columnHelper.accessor("reason", {
        header: "Reason",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground truncate max-w-xs">
            {row.original.reason || "-"}
          </span>
        ),
      }),
    ],
    [queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: transfers,
    page: queryState.page,
    pageCount: transfersData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: transfersData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (transfersQuery.error as Error | null | undefined)
    ?.message;

  return (
    <EntityListPage
      title={ROOM_TRANSFERS_PAGE_COPY.TITLE}
      description={ROOM_TRANSFERS_PAGE_COPY.DESCRIPTION}
      toolbar={
        <div className="border rounded-lg bg-card p-4">
          <div className="relative max-w-sm">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={ROOM_TRANSFERS_PAGE_COPY.SEARCH_PLACEHOLDER}
              value={searchInput}
            />
          </div>
        </div>
      }
    >
      <ServerDataTable
        emptyDescription={
          queryState.search
            ? "No room transfers match your search."
            : ROOM_TRANSFERS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching room transfers"
            : ROOM_TRANSFERS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load room transfers"
        isLoading={transfersQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={ROOM_TRANSFERS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={transfersData?.total ?? 0}
        showSearch={false}
      />
    </EntityListPage>
  );
}
