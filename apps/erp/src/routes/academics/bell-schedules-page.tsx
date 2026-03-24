import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { IconPencil, IconPlus, IconSearch } from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
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
import { SORT_ORDERS } from "@/constants/query";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { isStaffContext } from "@/features/auth/model/auth-context";
import {
  BELL_SCHEDULE_LIST_SORT_FIELDS,
  useBellSchedulesQuery,
} from "@/features/bell-schedules/api/use-bell-schedules";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type BellScheduleRow = {
  id: string;
  isDefault: boolean;
  name: string;
  periodCount: number;
  status: "draft" | "active" | "archived" | "deleted";
  updatedAt: string;
};

const columnHelper = createColumnHelper<BellScheduleRow>();
const VALID_SORT_FIELDS = [
  BELL_SCHEDULE_LIST_SORT_FIELDS.NAME,
  BELL_SCHEDULE_LIST_SORT_FIELDS.STATUS,
  BELL_SCHEDULE_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function BellSchedulesPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const canQuery = isStaffContext(session) && Boolean(institutionId);
  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: BELL_SCHEDULE_LIST_SORT_FIELDS.NAME,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });
  const bellSchedulesQuery = useBellSchedulesQuery(canQuery, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const rows = useMemo(
    () => (bellSchedulesQuery.data?.rows ?? []) as BellScheduleRow[],
    [bellSchedulesQuery.data?.rows],
  );
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <button
            type="button"
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(BELL_SCHEDULE_LIST_SORT_FIELDS.NAME)}
          >
            Bell schedule
            <SortIcon
              direction={
                queryState.sortBy === BELL_SCHEDULE_LIST_SORT_FIELDS.NAME
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Button asChild className="h-auto px-0 text-left" variant="link">
                <Link
                  to={appendSearch(
                    ERP_ROUTES.BELL_SCHEDULE_EDIT.replace(
                      ":scheduleId",
                      row.original.id,
                    ),
                    location.search,
                  )}
                >
                  {row.original.name}
                </Link>
              </Button>
              {row.original.isDefault ? <Badge>Default</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {row.original.periodCount} periods
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("periodCount", {
        header: "Periods",
      }),
      columnHelper.accessor("status", {
        header: () => (
          <button
            type="button"
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(BELL_SCHEDULE_LIST_SORT_FIELDS.STATUS)}
          >
            Status
            <SortIcon
              direction={
                queryState.sortBy === BELL_SCHEDULE_LIST_SORT_FIELDS.STATUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => (
          <Badge variant="outline" className="capitalize text-muted-foreground">
            {getValue()}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <EntityRowAction asChild>
              <Link
                to={appendSearch(
                  ERP_ROUTES.BELL_SCHEDULE_EDIT.replace(
                    ":scheduleId",
                    row.original.id,
                  ),
                  location.search,
                )}
              >
                <IconPencil className="size-3" />
                Edit
              </Link>
            </EntityRowAction>
          </div>
        ),
      }),
    ],
    [location.search, queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: rows,
    page: queryState.page,
    pageCount: bellSchedulesQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: bellSchedulesQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bell Schedules</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage bell schedules.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canQuery) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bell Schedules</CardTitle>
          <CardDescription>
            You don't have access to this section.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <EntityListPage
      actions={
        <EntityPagePrimaryAction asChild>
          <Link
            to={appendSearch(ERP_ROUTES.BELL_SCHEDULE_CREATE, location.search)}
          >
            <IconPlus className="size-4" />
            New bell schedule
          </Link>
        </EntityPagePrimaryAction>
      }
      description="Define campus period templates once and reuse them in timetable editing."
      title="Bell Schedules"
      toolbar={
        <div className="rounded-lg border bg-card p-4">
          <div className="relative max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search bell schedules"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </div>
      }
    >
      <ServerDataTable
        table={table}
        emptyAction={
          <EntityEmptyStateAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.BELL_SCHEDULE_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New bell schedule
            </Link>
          </EntityEmptyStateAction>
        }
        emptyDescription="Create the first campus bell schedule to unlock the timetable grid."
        emptyTitle="No bell schedules yet"
        errorDescription={(bellSchedulesQuery.error as Error | null)?.message}
        errorTitle="Couldn't load bell schedules"
        isError={bellSchedulesQuery.isError}
        isLoading={bellSchedulesQuery.isLoading}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search bell schedules"
        searchValue={searchInput}
        totalRows={bellSchedulesQuery.data?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
