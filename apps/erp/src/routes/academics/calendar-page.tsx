import { useCallback, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import {
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconPower,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
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
import {
  buildCalendarEventEditRoute,
  ERP_ROUTES,
} from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCalendarEventsQuery,
  useDeleteCalendarEventMutation,
  useSetCalendarEventStatusMutation,
} from "@/features/calendar/api/use-calendar";
import {
  CALENDAR_EVENT_TYPE_OPTIONS,
  CALENDAR_LIST_SORT_FIELDS,
  CALENDAR_PAGE_COPY,
} from "@/features/calendar/model/calendar-list.constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

type CalendarEventRow = {
  id: string;
  title: string;
  eventType: "event" | "holiday" | "exam" | "deadline";
  eventDate: string;
  isAllDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  status: "active" | "inactive" | "deleted";
};

const columnHelper = createColumnHelper<CalendarEventRow>();
const VALID_CALENDAR_SORT_FIELDS = [
  CALENDAR_LIST_SORT_FIELDS.DATE,
  CALENDAR_LIST_SORT_FIELDS.TITLE,
  CALENDAR_LIST_SORT_FIELDS.STATUS,
  CALENDAR_LIST_SORT_FIELDS.TYPE,
] as const;

export function CalendarPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageCalendar = isStaffContext(session);
  const canQueryCalendar = canManageCalendar && Boolean(institutionId);
  const setStatusMutation = useSetCalendarEventStatusMutation();
  const deleteMutation = useDeleteCalendarEventMutation();
  const [deleteTarget, setDeleteTarget] = useState<CalendarEventRow | null>(null);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: CALENDAR_LIST_SORT_FIELDS.DATE,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_CALENDAR_SORT_FIELDS,
  });

  const eventsQuery = useCalendarEventsQuery(canQueryCalendar, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const events = useMemo(
    () => (eventsQuery.data?.rows ?? []) as CalendarEventRow[],
    [eventsQuery.data?.rows],
  );

  const eventsError = eventsQuery.error as Error | null | undefined;
  const eventsErrorMessage = eventsError?.message;

  const handleToggleStatus = useCallback(
    async (event: CalendarEventRow) => {
      if (!institutionId) {
        return;
      }

      const nextStatus = event.status === "active" ? "inactive" : "active";

      await setStatusMutation.mutateAsync({
        params: {
          path: {
            eventId: event.id,
          },
        },
        body: {
          status: nextStatus,
        },
      });

      toast.success(
        nextStatus === "inactive"
          ? ERP_TOAST_MESSAGES.disabled(ERP_TOAST_SUBJECTS.CALENDAR_EVENT)
          : ERP_TOAST_MESSAGES.enabled(ERP_TOAST_SUBJECTS.CALENDAR_EVENT),
      );
    },
    [institutionId, setStatusMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(CALENDAR_LIST_SORT_FIELDS.TITLE)}
            type="button"
          >
            Event
            <SortIcon
              direction={
                queryState.sortBy === CALENDAR_LIST_SORT_FIELDS.TITLE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <Button asChild className="h-auto px-0 text-left" variant="link">
            <Link
              to={appendSearch(
                buildCalendarEventEditRoute(row.original.id),
                location.search,
              )}
            >
              {row.original.title}
            </Link>
          </Button>
        ),
      }),
      columnHelper.accessor("eventType", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(CALENDAR_LIST_SORT_FIELDS.TYPE)}
            type="button"
          >
            Type
            <SortIcon
              direction={
                queryState.sortBy === CALENDAR_LIST_SORT_FIELDS.TYPE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => (
          <Badge variant="outline" className="capitalize">
            {CALENDAR_EVENT_TYPE_OPTIONS.find((option) => option.value === getValue())
              ?.label ?? getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("eventDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(CALENDAR_LIST_SORT_FIELDS.DATE)}
            type="button"
          >
            Date
            <SortIcon
              direction={
                queryState.sortBy === CALENDAR_LIST_SORT_FIELDS.DATE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => {
          const event = row.original;

          if (event.isAllDay) {
            return (
              <span className="text-sm text-muted-foreground">
                {event.eventDate} (All day)
              </span>
            );
          }

          return (
            <span className="text-sm text-muted-foreground">
              {event.eventDate} • {event.startTime} - {event.endTime}
            </span>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(CALENDAR_LIST_SORT_FIELDS.STATUS)}
            type="button"
          >
            Status
            <SortIcon
              direction={
                queryState.sortBy === CALENDAR_LIST_SORT_FIELDS.STATUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) =>
          getValue() === "active" ? (
            <Badge variant="secondary" className="text-green-700 dark:text-green-400">
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Inactive
            </Badge>
          ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const event = row.original;

          return (
            <div className="flex items-center justify-end gap-1">
              <EntityRowAction asChild>
                <Link
                  to={appendSearch(
                    buildCalendarEventEditRoute(event.id),
                    location.search,
                  )}
                >
                  <IconPencil className="size-3" />
                  Edit
                </Link>
              </EntityRowAction>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="size-8 text-muted-foreground data-[state=open]:bg-muted"
                    size="icon"
                    variant="ghost"
                  >
                    <IconDotsVertical className="size-4" />
                    <span className="sr-only">Row actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onSelect={() => void handleToggleStatus(event)}>
                    <IconPower className="mr-2 size-4" />
                    {event.status === "active" ? "Disable" : "Enable"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteTarget(event)}
                  >
                    <IconTrash className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [
      handleToggleStatus,
      location.search,
      queryState.sortBy,
      queryState.sortOrder,
      setSorting,
    ],
  );

  const table = useServerDataTable({
    data: events,
    columns,
    page: queryState.page,
    pageCount: eventsQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: eventsQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  async function handleDelete() {
    if (!institutionId || !deleteTarget) {
      return;
    }

    await deleteMutation.mutateAsync({
      params: {
        path: {
          eventId: deleteTarget.id,
        },
      },
    });

    toast.success(ERP_TOAST_MESSAGES.archived(ERP_TOAST_SUBJECTS.CALENDAR_EVENT));
    setDeleteTarget(null);
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{CALENDAR_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage calendar events.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageCalendar) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{CALENDAR_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Calendar administration is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isFiltered = Boolean(queryState.search);

  return (
    <>
      <EntityListPage
        actions={
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(ERP_ROUTES.CALENDAR_EVENT_CREATE, location.search)}
            >
              <IconPlus className="size-4" />
              New calendar event
            </Link>
          </EntityPagePrimaryAction>
        }
        description={CALENDAR_PAGE_COPY.DESCRIPTION}
        title={CALENDAR_PAGE_COPY.TITLE}
        toolbar={
          <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[280px] flex-1">
                <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-11 w-full max-w-md rounded-lg border-border/70 bg-background pl-10 shadow-none"
                  placeholder={CALENDAR_PAGE_COPY.SEARCH_PLACEHOLDER}
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
            </div>
          </div>
        }
      >
        <ServerDataTable
          emptyAction={
            !isFiltered ? (
              <EntityEmptyStateAction asChild>
                <Link
                  to={appendSearch(ERP_ROUTES.CALENDAR_EVENT_CREATE, location.search)}
                >
                  <IconPlus className="size-4" />
                  New calendar event
                </Link>
              </EntityEmptyStateAction>
            ) : null
          }
          emptyDescription={
            isFiltered
              ? CALENDAR_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
              : CALENDAR_PAGE_COPY.EMPTY_DESCRIPTION
          }
          emptyTitle={
            isFiltered
              ? CALENDAR_PAGE_COPY.EMPTY_FILTERED_TITLE
              : CALENDAR_PAGE_COPY.EMPTY_TITLE
          }
          errorDescription={eventsErrorMessage}
          errorTitle={CALENDAR_PAGE_COPY.ERROR_TITLE}
          isError={eventsQuery.isError}
          isLoading={eventsQuery.isLoading}
          onSearchChange={setSearchInput}
          rowCellClassName={(row) =>
            row.status === "active" ? undefined : "opacity-60"
          }
          searchPlaceholder={CALENDAR_PAGE_COPY.SEARCH_PLACEHOLDER}
          searchValue={searchInput}
          showSearch={false}
          table={table}
          totalRows={eventsQuery.data?.total ?? 0}
        />
        <Outlet />
      </EntityListPage>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={`Delete "${deleteTarget?.title ?? "event"}"`}
        description="This permanently removes the calendar event from active schedules."
        confirmLabel="Delete event"
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
