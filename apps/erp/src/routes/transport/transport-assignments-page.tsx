import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconSearch,
  IconUsers,
} from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
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
  EntityRowAction,
} from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PERMISSIONS } from "@repo/contracts";
import {
  ERP_ROUTES,
  buildTransportAssignmentEditRoute,
} from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useTransportAssignmentsQuery,
  useUpdateAssignmentMutation,
  type TransportAssignmentsQuery,
} from "@/features/transport/api/use-transport";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";

type AssignmentRow = {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string | null;
  routeId: string;
  routeName: string;
  stopId: string;
  stopName: string;
  assignmentType: "pickup" | "dropoff" | "both";
  startDate: string;
  endDate: string | null;
  status: "active" | "inactive";
  createdAt: string;
};

const columnHelper = createColumnHelper<AssignmentRow>();
const VALID_SORT_FIELDS = ["startDate", "createdAt"] as const;

const ASSIGNMENT_TYPE_LABELS: Record<"pickup" | "dropoff" | "both", string> = {
  both: "Both",
  pickup: "Pickup",
  dropoff: "Drop-off",
};

export function TransportAssignmentsPage() {
  useDocumentTitle("Transport Assignments");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.TRANSPORT_READ);
  const canManage = hasPermission(session, PERMISSIONS.TRANSPORT_MANAGE);

  const updateMutation = useUpdateAssignmentMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: "createdAt",
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const assignmentsQuery = useTransportAssignmentsQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy as TransportAssignmentsQuery["sort"],
  });

  const rows = useMemo(
    () => (assignmentsQuery.data?.rows ?? []) as AssignmentRow[],
    [assignmentsQuery.data],
  );

  async function handleToggleStatus(row: AssignmentRow) {
    const newStatus = row.status === "active" ? "inactive" : "active";
    try {
      await updateMutation.mutateAsync({
        params: { path: { assignmentId: row.id } },
        body: { status: newStatus },
      });
      toast.success(
        newStatus === "active" ? "Assignment activated." : "Assignment deactivated.",
      );
    } catch (error) {
      toast.error(extractApiError(error, "Could not update assignment status. Please try again."));
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("studentName", {
        header: "Student",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium">{row.original.studentName}</p>
            {row.original.admissionNumber ? (
              <p className="text-xs text-muted-foreground">
                {row.original.admissionNumber}
              </p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor("routeName", {
        header: "Route & Stop",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm">{row.original.routeName}</p>
            <p className="text-xs text-muted-foreground">{row.original.stopName}</p>
          </div>
        ),
      }),
      columnHelper.accessor("assignmentType", {
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline">
            {ASSIGNMENT_TYPE_LABELS[row.original.assignmentType]}
          </Badge>
        ),
      }),
      columnHelper.accessor("startDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("startDate")}
            type="button"
          >
            Start Date
            <SortIcon
              direction={
                queryState.sortBy === "startDate" ? queryState.sortOrder : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-sm">{row.original.startDate}</p>
            {row.original.endDate ? (
              <p className="text-xs text-muted-foreground">
                Until {row.original.endDate}
              </p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <EntityRowAction aria-label="Actions">
                  <IconDotsVertical className="size-4" />
                </EntityRowAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    to={appendSearch(
                      buildTransportAssignmentEditRoute(row.original.id),
                      location.search,
                    )}
                  >
                    <IconPencil className="size-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void handleToggleStatus(row.original)}
                >
                  {row.original.status === "active" ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null,
      }),
    ],
    [canManage, location.search, queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: rows,
    page: queryState.page,
    pageCount: assignmentsQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: assignmentsQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (assignmentsQuery.error as Error | null | undefined)?.message;

  return (
    <>
      <EntityListPage
        title="Transport Assignments"
        description="Manage student transport route assignments."
        actions={
          canManage ? (
            <EntityPagePrimaryAction asChild>
              <Link
                to={appendSearch(
                  ERP_ROUTES.TRANSPORT_ASSIGNMENTS_CREATE,
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
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by student name or admission number..."
                value={searchInput}
              />
            </div>
          </div>
        }
      >
        <ServerDataTable
          emptyAction={
            !queryState.search && canManage ? (
              <EntityEmptyStateAction asChild>
                <Link
                  to={appendSearch(
                    ERP_ROUTES.TRANSPORT_ASSIGNMENTS_CREATE,
                    location.search,
                  )}
                >
                  <IconUsers className="size-5" />
                  New assignment
                </Link>
              </EntityEmptyStateAction>
            ) : undefined
          }
          emptyDescription={
            queryState.search
              ? "No assignments match your search."
              : "Assign students to transport routes."
          }
          emptyTitle={
            queryState.search ? "No assignments found" : "No assignments yet"
          }
          errorTitle="Failed to load assignments"
          isLoading={assignmentsQuery.isLoading}
          isError={Boolean(errorMessage)}
          errorDescription={errorMessage}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search assignments..."
          searchValue={searchInput}
          table={table}
          totalRows={assignmentsQuery.data?.total ?? 0}
          showSearch={false}
        />
        <Outlet />
      </EntityListPage>
    </>
  );
}
