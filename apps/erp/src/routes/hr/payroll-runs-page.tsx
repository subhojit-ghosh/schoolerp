import { useCallback, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import {
  IconDotsVertical,
  IconEye,
  IconPlus,
  IconSearch,
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
import { ERP_ROUTES, buildPayrollRunDetailRoute } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  usePayrollRunsQuery,
  useProcessPayrollRunMutation,
  useApprovePayrollRunMutation,
  useMarkPaidPayrollRunMutation,
} from "@/features/payroll/api/use-payroll";
import {
  PAYROLL_RUN_LIST_SORT_FIELDS,
  PAYROLL_RUNS_PAGE_COPY,
} from "@/features/payroll/model/payroll-constants";
import {
  formatMonthYear,
  formatPaiseToRupees,
} from "@/features/payroll/model/payroll-formatters";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type PayrollRunRow = {
  id: string;
  month: number;
  year: number;
  campusName: string | null;
  status: "draft" | "processed" | "approved" | "paid";
  staffCount: number;
  totalNetPayInPaise: number;
  createdAt: string;
};

const columnHelper = createColumnHelper<PayrollRunRow>();
const VALID_SORT_FIELDS = [
  PAYROLL_RUN_LIST_SORT_FIELDS.MONTH,
  PAYROLL_RUN_LIST_SORT_FIELDS.STATUS,
  PAYROLL_RUN_LIST_SORT_FIELDS.CREATED_AT,
] as const;

function RunStatusBadge({ status }: { status: PayrollRunRow["status"] }) {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-green-500/10 text-green-700 border-green-200">
          Paid
        </Badge>
      );
    case "approved":
      return (
        <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">
          Approved
        </Badge>
      );
    case "processed":
      return <Badge variant="secondary">Processed</Badge>;
    default:
      return <Badge variant="outline">Draft</Badge>;
  }
}

export function PayrollRunsPage() {
  useDocumentTitle("Payroll Runs");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canReadPayroll = hasPermission(session, PERMISSIONS.PAYROLL_READ);
  const canManagePayroll = hasPermission(session, PERMISSIONS.PAYROLL_MANAGE);

  const processMutation = useProcessPayrollRunMutation();
  const approveMutation = useApprovePayrollRunMutation();
  const markPaidMutation = useMarkPaidPayrollRunMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: PAYROLL_RUN_LIST_SORT_FIELDS.CREATED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const runsQuery = usePayrollRunsQuery(canReadPayroll, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const runsData = runsQuery.data;
  const runs = useMemo(
    () => (runsData?.rows ?? []) as PayrollRunRow[],
    [runsData?.rows],
  );

  const handleProcess = useCallback(
    async (runId: string) => {
      try {
        await processMutation.mutateAsync({
          params: { path: { runId } },
        });
        toast.success("Payroll run processed.");
      } catch (error) {
        toast.error(extractApiError(error, "Could not process payroll run. Please try again."));
      }
    },
    [processMutation],
  );

  const handleApprove = useCallback(
    async (runId: string) => {
      try {
        await approveMutation.mutateAsync({
          params: { path: { runId } },
        });
        toast.success("Payroll run approved.");
      } catch (error) {
        toast.error(extractApiError(error, "Could not approve payroll run. Please try again."));
      }
    },
    [approveMutation],
  );

  const handleMarkPaid = useCallback(
    async (runId: string) => {
      try {
        await markPaidMutation.mutateAsync({
          params: { path: { runId } },
        });
        toast.success("Payroll run marked as paid.");
      } catch (error) {
        toast.error(extractApiError(error, "Could not mark payroll run as paid. Please try again."));
      }
    },
    [markPaidMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "monthYear",
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(PAYROLL_RUN_LIST_SORT_FIELDS.MONTH)
            }
            type="button"
          >
            Month / Year
            <SortIcon
              direction={
                queryState.sortBy === PAYROLL_RUN_LIST_SORT_FIELDS.MONTH
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {formatMonthYear(row.original.month, row.original.year)}
          </span>
        ),
      }),
      columnHelper.accessor("campusName", {
        header: "Campus",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.campusName || "All campuses"}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(PAYROLL_RUN_LIST_SORT_FIELDS.STATUS)
            }
            type="button"
          >
            Status
            <SortIcon
              direction={
                queryState.sortBy === PAYROLL_RUN_LIST_SORT_FIELDS.STATUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => <RunStatusBadge status={row.original.status} />,
      }),
      columnHelper.accessor("staffCount", {
        header: "Staff",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.staffCount}</span>
        ),
      }),
      columnHelper.accessor("totalNetPayInPaise", {
        header: "Total Net Pay",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {formatPaiseToRupees(row.original.totalNetPayInPaise)}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const run = row.original;

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
                    <Link to={buildPayrollRunDetailRoute(run.id)}>
                      <IconEye className="mr-2 size-4" />
                      View detail
                    </Link>
                  </DropdownMenuItem>
                  {canManagePayroll ? (
                    <>
                      <DropdownMenuSeparator />
                      {run.status === "draft" ? (
                        <DropdownMenuItem
                          onSelect={() => void handleProcess(run.id)}
                        >
                          Process
                        </DropdownMenuItem>
                      ) : null}
                      {run.status === "processed" ? (
                        <DropdownMenuItem
                          onSelect={() => void handleApprove(run.id)}
                        >
                          Approve
                        </DropdownMenuItem>
                      ) : null}
                      {run.status === "approved" ? (
                        <DropdownMenuItem
                          onSelect={() => void handleMarkPaid(run.id)}
                        >
                          Mark paid
                        </DropdownMenuItem>
                      ) : null}
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [
      canManagePayroll,
      handleApprove,
      handleMarkPaid,
      handleProcess,
      queryState.sortBy,
      queryState.sortOrder,
      setSorting,
    ],
  );

  const table = useServerDataTable({
    columns,
    data: runs,
    page: queryState.page,
    pageCount: runsData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: runsData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (runsQuery.error as Error | null | undefined)?.message;

  return (
    <EntityListPage
      title={PAYROLL_RUNS_PAGE_COPY.TITLE}
      description={PAYROLL_RUNS_PAGE_COPY.DESCRIPTION}
      actions={
        canManagePayroll ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.PAYROLL_RUN_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New payroll run
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
              placeholder={PAYROLL_RUNS_PAGE_COPY.SEARCH_PLACEHOLDER}
              value={searchInput}
            />
          </div>
        </div>
      }
    >
      <ServerDataTable
        emptyAction={
          !queryState.search && canManagePayroll ? (
            <EntityEmptyStateAction asChild>
              <Link
                to={appendSearch(
                  ERP_ROUTES.PAYROLL_RUN_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New payroll run
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No payroll runs match your search."
            : PAYROLL_RUNS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching payroll runs"
            : PAYROLL_RUNS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load payroll runs"
        isLoading={runsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={PAYROLL_RUNS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={runsData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
