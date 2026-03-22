import { useMemo } from "react";
import { PERMISSIONS } from "@repo/contracts";
import { Link } from "react-router";
import { IconCurrencyRupee, IconSearch } from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import {
  EntityRowAction,
  EntityToolbarSecondaryAction,
} from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { buildFeeAssignmentCollectRoute, ERP_ROUTES } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission, isStaffContext } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useFeeDuesQuery } from "@/features/fees/api/use-fees";
import {
  formatFeeDate,
  formatFeeStatusLabel,
  formatRupees,
} from "@/features/fees/model/fee-formatters";
import { FEE_ASSIGNMENT_LIST_SORT_FIELDS } from "@/features/fees/model/fee-assignment-list.constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";

type FeeDueRow = {
  id: string;
  studentFullName: string;
  studentAdmissionNumber: string;
  feeStructureName: string;
  dueDate: string;
  outstandingAmountInPaise: number;
  status: "pending" | "partial" | "paid";
};

const columnHelper = createColumnHelper<FeeDueRow>();
const VALID_SORT_FIELDS = [
  FEE_ASSIGNMENT_LIST_SORT_FIELDS.STUDENT_NAME,
  FEE_ASSIGNMENT_LIST_SORT_FIELDS.DUE_DATE,
  FEE_ASSIGNMENT_LIST_SORT_FIELDS.AMOUNT,
] as const;

export function FeeDuesPage() {
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const canQueryFees = isStaffContext(session) && hasPermission(session, PERMISSIONS.FEES_READ) && Boolean(institutionId);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: FEE_ASSIGNMENT_LIST_SORT_FIELDS.DUE_DATE,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const duesQuery = useFeeDuesQuery(canQueryFees, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    overdue: true,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const rows = useMemo(
    () => (duesQuery.data?.rows ?? []) as FeeDueRow[],
    [duesQuery.data?.rows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("studentFullName", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(FEE_ASSIGNMENT_LIST_SORT_FIELDS.STUDENT_NAME)
            }
            type="button"
          >
            Student
            <SortIcon
              direction={
                queryState.sortBy ===
                FEE_ASSIGNMENT_LIST_SORT_FIELDS.STUDENT_NAME
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.studentFullName}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.studentAdmissionNumber}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("feeStructureName", {
        header: "Fee structure",
      }),
      columnHelper.accessor("dueDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(FEE_ASSIGNMENT_LIST_SORT_FIELDS.DUE_DATE)}
            type="button"
          >
            Due date
            <SortIcon
              direction={
                queryState.sortBy === FEE_ASSIGNMENT_LIST_SORT_FIELDS.DUE_DATE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => formatFeeDate(getValue()),
      }),
      columnHelper.accessor("outstandingAmountInPaise", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(FEE_ASSIGNMENT_LIST_SORT_FIELDS.AMOUNT)}
            type="button"
          >
            Outstanding
            <SortIcon
              direction={
                queryState.sortBy === FEE_ASSIGNMENT_LIST_SORT_FIELDS.AMOUNT
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="font-medium text-destructive">
            {formatRupees(getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => (
          <Badge variant="secondary">{formatFeeStatusLabel(getValue())}</Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <EntityRowAction asChild>
            <Link to={buildFeeAssignmentCollectRoute(row.original.id)}>
              <IconCurrencyRupee className="size-3" />
              Collect
            </Link>
          </EntityRowAction>
        ),
      }),
    ],
    [queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    data: rows,
    columns,
    page: queryState.page,
    pageCount: duesQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: duesQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fee Dues</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to view outstanding dues.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canQueryFees) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fee Dues</CardTitle>
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
        <EntityToolbarSecondaryAction asChild>
          <Link to={ERP_ROUTES.FEE_ASSIGNMENTS}>View all assignments</Link>
        </EntityToolbarSecondaryAction>
      }
      description="Students with overdue balances that still need follow-up."
      title="Fee Dues"
      toolbar={
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] flex-1">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 w-full max-w-md rounded-lg border-border/70 bg-background pl-10 shadow-none"
                placeholder="Search by student or structure..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
          </div>
        </div>
      }
    >
      <ServerDataTable
        emptyDescription="No overdue dues match the current filters."
        emptyTitle="No overdue dues"
        errorDescription={
          (duesQuery.error as Error | null | undefined)?.message
        }
        errorTitle="Could not load fee dues"
        isError={duesQuery.isError}
        isLoading={duesQuery.isLoading}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search overdue dues..."
        searchValue={searchInput}
        showSearch={false}
        table={table}
        totalRows={duesQuery.data?.total ?? 0}
      />
    </EntityListPage>
  );
}
