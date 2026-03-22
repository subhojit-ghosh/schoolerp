import { useCallback, useMemo, useState } from "react";
import { DATA_EXCHANGE_ENTITY_TYPES, PERMISSIONS } from "@repo/contracts";
import { Link, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import {
  IconDotsVertical,
  IconPrinter,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  IconCurrencyRupee,
  IconDiscount2,
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
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import {
  EntityEmptyStateAction,
  EntityPagePrimaryAction,
  EntityRowAction,
  EntityToolbarSecondaryAction,
} from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import {
  buildFeeAssignmentCollectRoute,
  buildFeeAssignmentAdjustmentRoute,
  buildFeeAssignmentEditRoute,
  buildFeeAssignmentReceiptRoute,
  ERP_ROUTES,
} from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import {
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { DataExchangeEntityActions } from "@/features/data-exchange/ui/data-exchange-entity-actions";
import {
  useDeleteFeeAssignmentMutation,
  useFeeAssignmentsQuery,
} from "@/features/fees/api/use-fees";
import {
  FEE_ASSIGNMENT_LIST_SORT_FIELDS,
  FEE_ASSIGNMENTS_PAGE_COPY,
} from "@/features/fees/model/fee-assignment-list.constants";
import {
  formatFeeDate,
  formatFeeStatusLabel,
  formatRupees,
} from "@/features/fees/model/fee-formatters";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

type FeeAssignmentRow = {
  id: string;
  studentFullName: string;
  studentAdmissionNumber: string;
  feeStructureName: string;
  assignedAmountInPaise: number;
  paidAmountInPaise: number;
  outstandingAmountInPaise: number;
  dueDate: string;
  status: "pending" | "partial" | "paid";
  paymentCount: number;
};

const columnHelper = createColumnHelper<FeeAssignmentRow>();

const VALID_SORT_FIELDS = [
  FEE_ASSIGNMENT_LIST_SORT_FIELDS.STUDENT_NAME,
  FEE_ASSIGNMENT_LIST_SORT_FIELDS.DUE_DATE,
  FEE_ASSIGNMENT_LIST_SORT_FIELDS.STATUS,
  FEE_ASSIGNMENT_LIST_SORT_FIELDS.AMOUNT,
] as const;

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  if (status === "paid") return "default";
  return "secondary";
}

export function FeeAssignmentsPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const canManageFees =
    isStaffContext(session) && hasPermission(session, PERMISSIONS.FEES_MANAGE);
  const canQueryFees =
    isStaffContext(session) &&
    hasPermission(session, PERMISSIONS.FEES_READ) &&
    Boolean(institutionId);

  const deleteMutation = useDeleteFeeAssignmentMutation();
  const [deleteTarget, setDeleteTarget] = useState<FeeAssignmentRow | null>(
    null,
  );

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

  const assignmentsQuery = useFeeAssignmentsQuery(canQueryFees, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const assignments = useMemo(
    () => (assignmentsQuery.data?.rows ?? []) as FeeAssignmentRow[],
    [assignmentsQuery.data?.rows],
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
            <p className="text-xs text-muted-foreground font-mono">
              {row.original.studentAdmissionNumber}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("feeStructureName", {
        header: "Fee Structure",
      }),
      columnHelper.accessor("assignedAmountInPaise", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(FEE_ASSIGNMENT_LIST_SORT_FIELDS.AMOUNT)}
            type="button"
          >
            Assigned
            <SortIcon
              direction={
                queryState.sortBy === FEE_ASSIGNMENT_LIST_SORT_FIELDS.AMOUNT
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => formatRupees(getValue()),
      }),
      columnHelper.accessor("paidAmountInPaise", {
        header: "Paid",
        cell: ({ getValue }) => formatRupees(getValue()),
      }),
      columnHelper.accessor("outstandingAmountInPaise", {
        header: "Outstanding",
        cell: ({ getValue }) => {
          const amount = getValue();
          return (
            <span className={amount > 0 ? "font-medium text-destructive" : ""}>
              {formatRupees(amount)}
            </span>
          );
        },
      }),
      columnHelper.accessor("dueDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(FEE_ASSIGNMENT_LIST_SORT_FIELDS.DUE_DATE)}
            type="button"
          >
            Due Date
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
      columnHelper.accessor("status", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(FEE_ASSIGNMENT_LIST_SORT_FIELDS.STATUS)}
            type="button"
          >
            Status
            <SortIcon
              direction={
                queryState.sortBy === FEE_ASSIGNMENT_LIST_SORT_FIELDS.STATUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => (
          <Badge variant={statusVariant(getValue())}>
            {formatFeeStatusLabel(getValue())}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const assignment = row.original;
          const canDelete = assignment.paymentCount === 0;
          const canAdjust = assignment.outstandingAmountInPaise > 0;

          return (
            <div className="flex items-center justify-end gap-1">
              {assignment.status !== "paid" ? (
                <EntityRowAction asChild>
                  <Link
                    to={appendSearch(
                      buildFeeAssignmentCollectRoute(assignment.id),
                      location.search,
                    )}
                  >
                    <IconCurrencyRupee className="size-3" />
                    Collect
                  </Link>
                </EntityRowAction>
              ) : null}
              {canAdjust ? (
                <EntityRowAction asChild>
                  <Link
                    to={appendSearch(
                      buildFeeAssignmentAdjustmentRoute(assignment.id),
                      location.search,
                    )}
                  >
                    <IconDiscount2 className="size-3" />
                    Concession
                  </Link>
                </EntityRowAction>
              ) : null}
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
                  <DropdownMenuItem asChild>
                    <Link
                      to={appendSearch(
                        buildFeeAssignmentEditRoute(assignment.id),
                        location.search,
                      )}
                    >
                      <IconPencil className="mr-2 size-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  {assignment.paymentCount > 0 ? (
                    <DropdownMenuItem asChild>
                      <Link
                        target="_blank"
                        to={buildFeeAssignmentReceiptRoute(assignment.id)}
                      >
                        <IconPrinter className="mr-2 size-4" />
                        Receipt
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {canDelete ? (
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeleteTarget(assignment)}
                    >
                      <IconTrash className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [location.search, queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    data: assignments,
    columns,
    page: queryState.page,
    pageCount: assignmentsQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: assignmentsQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    await deleteMutation.mutateAsync({
      params: { path: { feeAssignmentId: deleteTarget.id } },
    });

    toast.success(
      ERP_TOAST_MESSAGES.deleted(ERP_TOAST_SUBJECTS.FEE_ASSIGNMENT),
    );
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{FEE_ASSIGNMENTS_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage fee
            assignments.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canQueryFees) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{FEE_ASSIGNMENTS_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            You don't have access to this section.
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
          <div className="flex items-center gap-3">
            {canManageFees && (
              <DataExchangeEntityActions
                entityType={DATA_EXCHANGE_ENTITY_TYPES.FEE_ASSIGNMENTS}
              />
            )}
            <EntityToolbarSecondaryAction asChild>
              <Link
                to={appendSearch(
                  ERP_ROUTES.FEE_ASSIGNMENT_BULK,
                  location.search,
                )}
              >
                Bulk assign
              </Link>
            </EntityToolbarSecondaryAction>
            <EntityPagePrimaryAction asChild>
              <Link
                to={appendSearch(
                  ERP_ROUTES.FEE_ASSIGNMENT_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New assignment
              </Link>
            </EntityPagePrimaryAction>
          </div>
        }
        description={FEE_ASSIGNMENTS_PAGE_COPY.DESCRIPTION}
        title={FEE_ASSIGNMENTS_PAGE_COPY.TITLE}
        toolbar={
          <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[280px] flex-1">
                <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-11 w-full max-w-md rounded-lg border-border/70 bg-background pl-10 shadow-none"
                  placeholder={FEE_ASSIGNMENTS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  to={appendSearch(
                    ERP_ROUTES.FEE_ASSIGNMENT_CREATE,
                    location.search,
                  )}
                >
                  <IconPlus className="size-4" />
                  New assignment
                </Link>
              </EntityEmptyStateAction>
            ) : null
          }
          emptyDescription={
            isFiltered
              ? FEE_ASSIGNMENTS_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
              : FEE_ASSIGNMENTS_PAGE_COPY.EMPTY_DESCRIPTION
          }
          emptyTitle={
            isFiltered
              ? FEE_ASSIGNMENTS_PAGE_COPY.EMPTY_FILTERED_TITLE
              : FEE_ASSIGNMENTS_PAGE_COPY.EMPTY_TITLE
          }
          errorDescription={
            (assignmentsQuery.error as Error | null | undefined)?.message
          }
          errorTitle={FEE_ASSIGNMENTS_PAGE_COPY.ERROR_TITLE}
          isError={assignmentsQuery.isError}
          isLoading={assignmentsQuery.isLoading}
          onSearchChange={setSearchInput}
          searchPlaceholder={FEE_ASSIGNMENTS_PAGE_COPY.SEARCH_PLACEHOLDER}
          searchValue={searchInput}
          showSearch={false}
          table={table}
          totalRows={assignmentsQuery.data?.total ?? 0}
        />
        <Outlet />
      </EntityListPage>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete assignment for "${deleteTarget?.studentFullName ?? "student"}"`}
        description="This permanently removes the fee assignment. It can only be deleted if no payments have been recorded."
        confirmLabel="Delete assignment"
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
