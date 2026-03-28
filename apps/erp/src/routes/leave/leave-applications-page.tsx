import { useCallback, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import {
  IconCheck,
  IconDotsVertical,
  IconPlus,
  IconSearch,
  IconX,
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
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCancelLeaveApplicationMutation,
  useLeaveApplicationsQuery,
  useReviewLeaveApplicationMutation,
} from "@/features/leave/api/use-leave";
import {
  LEAVE_APPLICATION_SORT_FIELDS,
  LEAVE_APPLICATIONS_PAGE_COPY,
} from "@/features/leave/model/leave-list.constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";

type LeaveApplicationRow = {
  id: string;
  leaveTypeName: string;
  staffName: string;
  staffEmployeeId: string | null;
  fromDate: string;
  toDate: string;
  daysCount: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

const columnHelper = createColumnHelper<LeaveApplicationRow>();
const VALID_SORT_FIELDS = [
  LEAVE_APPLICATION_SORT_FIELDS.FROM_DATE,
  LEAVE_APPLICATION_SORT_FIELDS.CREATED_AT,
  LEAVE_APPLICATION_SORT_FIELDS.STATUS,
] as const;

function StatusBadge({ status }: { status: LeaveApplicationRow["status"] }) {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-500/10 text-green-700 border-green-200">Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "cancelled":
      return <Badge variant="outline">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}

export function LeaveApplicationsPage() {
  useDocumentTitle("Leave Applications");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canReadLeave = hasPermission(session, PERMISSIONS.LEAVE_READ);
  const canManageLeave = hasPermission(session, PERMISSIONS.LEAVE_MANAGE);
  const canApplyLeave = hasPermission(session, PERMISSIONS.LEAVE_APPLY);

  const reviewMutation = useReviewLeaveApplicationMutation();
  const cancelMutation = useCancelLeaveApplicationMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: LEAVE_APPLICATION_SORT_FIELDS.FROM_DATE,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const applicationsQuery = useLeaveApplicationsQuery(canReadLeave, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const applications = useMemo(
    () => (applicationsQuery.data?.rows ?? []) as LeaveApplicationRow[],
    [applicationsQuery.data?.rows],
  );

  const handleApprove = useCallback(
    async (applicationId: string) => {
      try {
        await reviewMutation.mutateAsync({
          params: { path: { applicationId } },
          body: { status: "approved" },
        });
        toast.success("Leave application approved.");
      } catch (error) {
        toast.error(extractApiError(error, "Could not approve leave application. Please try again."));
      }
    },
    [reviewMutation],
  );

  const handleReject = useCallback(
    async (applicationId: string) => {
      try {
        await reviewMutation.mutateAsync({
          params: { path: { applicationId } },
          body: { status: "rejected" },
        });
        toast.success("Leave application rejected.");
      } catch (error) {
        toast.error(extractApiError(error, "Could not reject leave application. Please try again."));
      }
    },
    [reviewMutation],
  );

  const handleCancel = useCallback(
    async (applicationId: string) => {
      try {
        await cancelMutation.mutateAsync({
          params: { path: { applicationId } },
        });
        toast.success("Leave application cancelled.");
      } catch (error) {
        toast.error(extractApiError(error, "Could not cancel leave application. Please try again."));
      }
    },
    [cancelMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("staffName", {
        header: "Staff",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium">{row.original.staffName}</p>
            {row.original.staffEmployeeId ? (
              <p className="text-xs text-muted-foreground">
                {row.original.staffEmployeeId}
              </p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor("leaveTypeName", {
        header: "Leave type",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.leaveTypeName}</span>
        ),
      }),
      columnHelper.accessor("fromDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(LEAVE_APPLICATION_SORT_FIELDS.FROM_DATE)}
            type="button"
          >
            Period
            <SortIcon
              direction={
                queryState.sortBy === LEAVE_APPLICATION_SORT_FIELDS.FROM_DATE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-sm">
              {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
                new Date(row.original.fromDate),
              )}{" "}
              →{" "}
              {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
                new Date(row.original.toDate),
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.daysCount}{" "}
              {row.original.daysCount === 1 ? "day" : "days"}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(LEAVE_APPLICATION_SORT_FIELDS.STATUS)}
            type="button"
          >
            Status
            <SortIcon
              direction={
                queryState.sortBy === LEAVE_APPLICATION_SORT_FIELDS.STATUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const app = row.original;
          const isPending = app.status === "pending";

          if (!canManageLeave && !canApplyLeave) return null;

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
                  {canManageLeave && isPending ? (
                    <>
                      <DropdownMenuItem
                        onSelect={() => void handleApprove(app.id)}
                      >
                        <IconCheck className="mr-2 size-4" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => void handleReject(app.id)}
                      >
                        <IconX className="mr-2 size-4" />
                        Reject
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  ) : null}
                  {isPending ? (
                    <DropdownMenuItem
                      onSelect={() => void handleCancel(app.id)}
                    >
                      Cancel application
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [
      canApplyLeave,
      canManageLeave,
      handleApprove,
      handleCancel,
      handleReject,
      queryState.sortBy,
      queryState.sortOrder,
      setSorting,
    ],
  );

  const table = useServerDataTable({
    columns,
    data: applications,
    page: queryState.page,
    pageCount: applicationsQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: applicationsQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (applicationsQuery.error as Error | null | undefined)
    ?.message;

  return (
    <EntityListPage
      title={LEAVE_APPLICATIONS_PAGE_COPY.TITLE}
      description={LEAVE_APPLICATIONS_PAGE_COPY.DESCRIPTION}
      actions={
        canApplyLeave || canManageLeave ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.LEAVE_APPLICATIONS_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New application
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
              placeholder={LEAVE_APPLICATIONS_PAGE_COPY.SEARCH_PLACEHOLDER}
              value={searchInput}
            />
          </div>
        </div>
      }
    >
      <ServerDataTable
        emptyAction={
          !queryState.search && (canApplyLeave || canManageLeave) ? (
            <EntityEmptyStateAction asChild>
              <Link
                to={appendSearch(
                  ERP_ROUTES.LEAVE_APPLICATIONS_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New application
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? LEAVE_APPLICATIONS_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
            : LEAVE_APPLICATIONS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? LEAVE_APPLICATIONS_PAGE_COPY.EMPTY_FILTERED_TITLE
            : LEAVE_APPLICATIONS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle={LEAVE_APPLICATIONS_PAGE_COPY.ERROR_TITLE}
        isLoading={applicationsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={LEAVE_APPLICATIONS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={applicationsQuery.data?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
