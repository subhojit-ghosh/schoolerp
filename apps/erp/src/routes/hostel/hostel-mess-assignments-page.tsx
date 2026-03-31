import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import {
  IconDotsVertical,
  IconPlayerStop,
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
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PERMISSIONS } from "@repo/contracts";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useMessAssignmentsQuery,
  useDeactivateMessAssignmentMutation,
} from "@/features/hostel/api/use-hostel";
import {
  MESS_ASSIGNMENT_LIST_SORT_FIELDS,
  MESS_ASSIGNMENTS_PAGE_COPY,
  MESS_ASSIGNMENT_STATUS_LABELS,
} from "@/features/hostel/model/hostel-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";

type MessAssignmentRow = {
  id: string;
  studentId: string;
  studentName: string;
  messPlanId: string;
  messPlanName: string;
  bedAllocationId: string | null;
  startDate: string;
  endDate: string | null;
  status: "active" | "inactive";
  createdAt: string;
};

const columnHelper = createColumnHelper<MessAssignmentRow>();
const VALID_SORT_FIELDS = [
  MESS_ASSIGNMENT_LIST_SORT_FIELDS.START_DATE,
  MESS_ASSIGNMENT_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function HostelMessAssignmentsPage() {
  useDocumentTitle("Mess Assignments");
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.HOSTEL_READ);
  const canManage = hasPermission(session, PERMISSIONS.HOSTEL_MANAGE);

  const deactivateMutation = useDeactivateMessAssignmentMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: MESS_ASSIGNMENT_LIST_SORT_FIELDS.CREATED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const assignmentsQuery = useMessAssignmentsQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const assignmentsData = assignmentsQuery.data;
  const assignments = useMemo(
    () => (assignmentsData?.rows ?? []) as MessAssignmentRow[],
    [assignmentsData?.rows],
  );

  const handleDeactivate = useCallback(
    async (assignmentId: string) => {
      try {
        await deactivateMutation.mutateAsync({
          params: { path: { assignmentId } },
        });
        toast.success("Mess assignment deactivated.");
      } catch (error) {
        toast.error(
          extractApiError(
            error,
            "Could not deactivate mess assignment. Please try again.",
          ),
        );
      }
    },
    [deactivateMutation],
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
      columnHelper.accessor("messPlanName", {
        header: "Mess Plan",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.messPlanName}</span>
        ),
      }),
      columnHelper.accessor("startDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(MESS_ASSIGNMENT_LIST_SORT_FIELDS.START_DATE)
            }
            type="button"
          >
            Start Date
            <SortIcon
              direction={
                queryState.sortBy ===
                MESS_ASSIGNMENT_LIST_SORT_FIELDS.START_DATE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {new Date(row.original.startDate).toLocaleDateString()}
          </span>
        ),
      }),
      columnHelper.accessor("endDate", {
        header: "End Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.endDate
              ? new Date(row.original.endDate).toLocaleDateString()
              : "-"}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            label={MESS_ASSIGNMENT_STATUS_LABELS[row.original.status]}
          />
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const assignment = row.original;
          if (!canManage || assignment.status !== "active") return null;

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
                  <DropdownMenuItem
                    onSelect={() => void handleDeactivate(assignment.id)}
                  >
                    <IconPlayerStop className="mr-2 size-4" />
                    Deactivate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [
      canManage,
      handleDeactivate,
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
      title={MESS_ASSIGNMENTS_PAGE_COPY.TITLE}
      description={MESS_ASSIGNMENTS_PAGE_COPY.DESCRIPTION}
      toolbar={
        <div className="border rounded-lg bg-card p-4">
          <div className="relative max-w-sm">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={MESS_ASSIGNMENTS_PAGE_COPY.SEARCH_PLACEHOLDER}
              value={searchInput}
            />
          </div>
        </div>
      }
    >
      <ServerDataTable
        emptyDescription={
          queryState.search
            ? "No mess assignments match your search."
            : MESS_ASSIGNMENTS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching mess assignments"
            : MESS_ASSIGNMENTS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load mess assignments"
        isLoading={assignmentsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={MESS_ASSIGNMENTS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={assignmentsData?.total ?? 0}
        showSearch={false}
      />
    </EntityListPage>
  );
}
