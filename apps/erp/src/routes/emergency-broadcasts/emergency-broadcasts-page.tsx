import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
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
import { StatusBadge } from "@/components/data-display/status-badge";
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useBroadcastsQuery } from "@/features/emergency-broadcasts/api/use-emergency-broadcasts";
import {
  BROADCAST_LIST_SORT_FIELDS,
  BROADCASTS_PAGE_COPY,
  BROADCAST_STATUS_LABELS,
} from "@/features/emergency-broadcasts/model/broadcast-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type BroadcastRow = {
  id: string;
  title: string;
  priority: string;
  channels: string[];
  status: string;
  sentAt: string | null;
  createdAt: string;
};

const columnHelper = createColumnHelper<BroadcastRow>();
const VALID_SORT_FIELDS = [BROADCAST_LIST_SORT_FIELDS.CREATED_AT] as const;

export function EmergencyBroadcastsPage() {
  useDocumentTitle("Emergency Broadcasts");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canSend = hasPermission(session, PERMISSIONS.EMERGENCY_BROADCAST_SEND);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: BROADCAST_LIST_SORT_FIELDS.CREATED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const broadcastsQuery = useBroadcastsQuery(canSend, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const broadcastsData = broadcastsQuery.data;
  const broadcasts = useMemo(
    () => (broadcastsData?.rows ?? []) as BroadcastRow[],
    [broadcastsData?.rows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Title",
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.title}</span>
        ),
      }),
      columnHelper.accessor("priority", {
        header: "Priority",
        cell: ({ row }) => (
          <span className="text-sm capitalize">{row.original.priority}</span>
        ),
      }),
      columnHelper.accessor("channels", {
        header: "Channels",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {(row.original.channels ?? []).join(", ") || "-"}
          </span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(BROADCAST_LIST_SORT_FIELDS.CREATED_AT)}
            type="button"
          >
            Created
            <SortIcon
              direction={
                queryState.sortBy === BROADCAST_LIST_SORT_FIELDS.CREATED_AT
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString("en-IN")}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            label={
              BROADCAST_STATUS_LABELS[row.original.status] ??
              row.original.status
            }
          />
        ),
      }),
    ],
    [queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: broadcasts,
    page: queryState.page,
    pageCount: broadcastsData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: broadcastsData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (broadcastsQuery.error as Error | null | undefined)
    ?.message;

  return (
    <EntityListPage
      title={BROADCASTS_PAGE_COPY.TITLE}
      description={BROADCASTS_PAGE_COPY.DESCRIPTION}
      actions={
        canSend ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.EMERGENCY_BROADCAST_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New broadcast
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
              placeholder={BROADCASTS_PAGE_COPY.SEARCH_PLACEHOLDER}
              value={searchInput}
            />
          </div>
        </div>
      }
    >
      <ServerDataTable
        emptyAction={
          !queryState.search && canSend ? (
            <EntityEmptyStateAction asChild>
              <Link
                to={appendSearch(
                  ERP_ROUTES.EMERGENCY_BROADCAST_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New broadcast
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No broadcasts match your search."
            : BROADCASTS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching broadcasts"
            : BROADCASTS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load broadcasts"
        isLoading={broadcastsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={BROADCASTS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={broadcastsData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
