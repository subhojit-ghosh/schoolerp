import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconSearch,
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
import { useSalaryAssignmentsQuery } from "@/features/payroll/api/use-payroll";
import {
  SALARY_ASSIGNMENT_LIST_SORT_FIELDS,
  SALARY_ASSIGNMENTS_PAGE_COPY,
} from "@/features/payroll/model/payroll-constants";
import { formatPaiseToRupees } from "@/features/payroll/model/payroll-formatters";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type SalaryAssignmentRow = {
  id: string;
  staffName: string;
  staffEmployeeId: string | null;
  staffDesignation: string | null;
  salaryTemplateName: string;
  effectiveFrom: string;
  ctcInPaise: number | null;
  status: "active" | "inactive";
};

const columnHelper = createColumnHelper<SalaryAssignmentRow>();
const VALID_SORT_FIELDS = [
  SALARY_ASSIGNMENT_LIST_SORT_FIELDS.STAFF_NAME,
  SALARY_ASSIGNMENT_LIST_SORT_FIELDS.EFFECTIVE_FROM,
  SALARY_ASSIGNMENT_LIST_SORT_FIELDS.CTC,
  SALARY_ASSIGNMENT_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function SalaryAssignmentsPage() {
  useDocumentTitle("Salary Assignments");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canReadPayroll = hasPermission(session, PERMISSIONS.PAYROLL_READ);
  const canManagePayroll = hasPermission(session, PERMISSIONS.PAYROLL_MANAGE);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: SALARY_ASSIGNMENT_LIST_SORT_FIELDS.STAFF_NAME,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const assignmentsQuery = useSalaryAssignmentsQuery(canReadPayroll, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const assignmentsData = assignmentsQuery.data;
  const assignments = useMemo(
    () => (assignmentsData?.rows ?? []) as SalaryAssignmentRow[],
    [assignmentsData?.rows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("staffName", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(SALARY_ASSIGNMENT_LIST_SORT_FIELDS.STAFF_NAME)
            }
            type="button"
          >
            Staff
            <SortIcon
              direction={
                queryState.sortBy ===
                SALARY_ASSIGNMENT_LIST_SORT_FIELDS.STAFF_NAME
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
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
      columnHelper.accessor("staffDesignation", {
        header: "Designation",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.staffDesignation || "-"}
          </span>
        ),
      }),
      columnHelper.accessor("salaryTemplateName", {
        header: "Template",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.salaryTemplateName}</span>
        ),
      }),
      columnHelper.accessor("effectiveFrom", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(SALARY_ASSIGNMENT_LIST_SORT_FIELDS.EFFECTIVE_FROM)
            }
            type="button"
          >
            Effective From
            <SortIcon
              direction={
                queryState.sortBy ===
                SALARY_ASSIGNMENT_LIST_SORT_FIELDS.EFFECTIVE_FROM
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
              new Date(row.original.effectiveFrom),
            )}
          </span>
        ),
      }),
      columnHelper.accessor("ctcInPaise", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(SALARY_ASSIGNMENT_LIST_SORT_FIELDS.CTC)}
            type="button"
          >
            CTC
            <SortIcon
              direction={
                queryState.sortBy === SALARY_ASSIGNMENT_LIST_SORT_FIELDS.CTC
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.ctcInPaise != null
              ? formatPaiseToRupees(row.original.ctcInPaise)
              : "-"}
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
          const assignment = row.original;

          if (!canManagePayroll) return null;

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
                        `/payroll/salary-assignments/${assignment.id}/edit`,
                        location.search,
                      )}
                    >
                      <IconPencil className="mr-2 size-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [
      canManagePayroll,
      location.search,
      queryState.sortBy,
      queryState.sortOrder,
      setSorting,
    ],
  );

  const table = useServerDataTable({
    columns,
    data: assignments,
    page: queryState.page,
    pageCount: assignmentsData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: assignmentsData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (assignmentsQuery.error as Error | null | undefined)
    ?.message;

  return (
    <EntityListPage
      title={SALARY_ASSIGNMENTS_PAGE_COPY.TITLE}
      description={SALARY_ASSIGNMENTS_PAGE_COPY.DESCRIPTION}
      actions={
        canManagePayroll ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.PAYROLL_SALARY_ASSIGNMENT_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New assignment
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
              placeholder={SALARY_ASSIGNMENTS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  ERP_ROUTES.PAYROLL_SALARY_ASSIGNMENT_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New assignment
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No salary assignments match your search."
            : SALARY_ASSIGNMENTS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching assignments"
            : SALARY_ASSIGNMENTS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load salary assignments"
        isLoading={assignmentsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={SALARY_ASSIGNMENTS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={assignmentsData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
