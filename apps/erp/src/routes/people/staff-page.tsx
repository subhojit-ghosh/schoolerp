import { useCallback, useMemo, useState } from "react";
import { DATA_EXCHANGE_ENTITY_TYPES, PERMISSIONS } from "@repo/contracts";
import { Link, useLocation } from "react-router";
import { parseAsString, useQueryState } from "nuqs";
import { toast } from "sonner";
import {
  IconArrowRight,
  IconDotsVertical,
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
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
import {
  EntityEmptyStateAction,
  EntityPagePrimaryAction,
  EntityRowAction,
} from "@/components/entities/entity-actions";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { SORT_ORDERS } from "@/constants/query";
import { buildStaffDetailRoute, ERP_ROUTES } from "@/constants/routes";
import {
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useDeleteStaffMutation,
  useSetStaffStatusMutation,
  useStaffQuery,
} from "@/features/staff/api/use-staff";
import { DataExchangeEntityActions } from "@/features/data-exchange/ui/data-exchange-entity-actions";
import {
  STAFF_LIST_SORT_FIELDS,
  STAFF_PAGE_COPY,
} from "@/features/staff/model/staff-list.constants";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";
import { formatPhoneCompact } from "@/lib/format";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

type StaffRow = {
  id: string;
  campusName: string;
  email: string | null;
  memberType: string;
  mobile: string;
  name: string;
  profile: {
    designation?: string | null;
    employeeId?: string | null;
  } | null;
  role: {
    id: string;
    name: string;
    slug: string;
  } | null;
  status: "active" | "inactive" | "suspended";
};

const columnHelper = createColumnHelper<StaffRow>();
const VALID_SORT_FIELDS = [
  STAFF_LIST_SORT_FIELDS.CAMPUS,
  STAFF_LIST_SORT_FIELDS.DESIGNATION,
  STAFF_LIST_SORT_FIELDS.NAME,
  STAFF_LIST_SORT_FIELDS.STATUS,
] as const;
const STAFF_CREATE_LABEL = "New staff";

export function StaffPage() {
  useDocumentTitle("Staff");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const canManageStaff =
    isStaffContext(session) && hasPermission(session, PERMISSIONS.STAFF_MANAGE);
  const managedInstitutionId =
    isStaffContext(session) && hasPermission(session, PERMISSIONS.STAFF_READ)
      ? institutionId
      : undefined;
  const setStatusMutation = useSetStaffStatusMutation(managedInstitutionId);
  const deleteMutation = useDeleteStaffMutation(managedInstitutionId);
  const [deleteTarget, setDeleteTarget] = useState<StaffRow | null>(null);
  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: STAFF_LIST_SORT_FIELDS.NAME,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );

  const staffQuery = useStaffQuery(managedInstitutionId, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
    status: statusFilter
      ? [statusFilter as "active" | "inactive" | "suspended"]
      : undefined,
  });

  const rows = useMemo(
    () => (staffQuery.data?.rows ?? []) as StaffRow[],
    [staffQuery.data?.rows],
  );
  const error = staffQuery.error as Error | null | undefined;

  const handleToggleStatus = useCallback(
    async (staffRecord: StaffRow) => {
      if (!managedInstitutionId) {
        return;
      }

      const nextStatus =
        staffRecord.status === "active" ? "inactive" : "active";

      try {
        await setStatusMutation.mutateAsync({
          params: {
            path: {
              staffId: staffRecord.id,
            },
          },
          body: {
            status: nextStatus,
          },
        });

        toast.success(
          nextStatus === "inactive"
            ? ERP_TOAST_MESSAGES.disabled(ERP_TOAST_SUBJECTS.STAFF_RECORD)
            : ERP_TOAST_MESSAGES.enabled(ERP_TOAST_SUBJECTS.STAFF_RECORD),
        );
      } catch (error) {
        toast.error(
          extractApiError(
            error,
            "Could not update staff status. Please try again.",
          ),
        );
      }
    },
    [managedInstitutionId, setStatusMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.profile?.employeeId ?? null, {
        id: "employeeId",
        header: "Employee ID",
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() || "—"}</span>
        ),
      }),
      columnHelper.accessor("name", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(STAFF_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Name
            <SortIcon
              direction={
                queryState.sortBy === STAFF_LIST_SORT_FIELDS.NAME
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <Button asChild className="h-auto px-0 text-left" variant="link">
              <Link
                to={appendSearch(
                  buildStaffDetailRoute(row.original.id),
                  location.search,
                )}
              >
                {row.original.name}
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              {formatPhoneCompact(row.original.mobile)}
              {row.original.email ? ` • ${row.original.email}` : ""}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("campusName", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(STAFF_LIST_SORT_FIELDS.CAMPUS)}
            type="button"
          >
            Campus
            <SortIcon
              direction={
                queryState.sortBy === STAFF_LIST_SORT_FIELDS.CAMPUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
      }),
      columnHelper.accessor((row) => row.profile?.designation ?? null, {
        id: "designation",
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(STAFF_LIST_SORT_FIELDS.DESIGNATION)}
            type="button"
          >
            Designation
            <SortIcon
              direction={
                queryState.sortBy === STAFF_LIST_SORT_FIELDS.DESIGNATION
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(STAFF_LIST_SORT_FIELDS.STATUS)}
            type="button"
          >
            Status
            <SortIcon
              direction={
                queryState.sortBy === STAFF_LIST_SORT_FIELDS.STATUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => (
          <Badge
            className="capitalize"
            variant={getValue() === "active" ? "secondary" : "outline"}
          >
            {getValue()}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const staffRecord = row.original;

          return (
            <div className="flex items-center justify-end gap-1">
              <EntityRowAction asChild>
                <Link
                  to={appendSearch(
                    buildStaffDetailRoute(staffRecord.id),
                    location.search,
                  )}
                >
                  Open record
                  <IconArrowRight className="size-3" />
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
                  <DropdownMenuItem
                    onSelect={() => void handleToggleStatus(staffRecord)}
                  >
                    <IconPower className="mr-2 size-4" />
                    {staffRecord.status === "active" ? "Disable" : "Enable"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setDeleteTarget(staffRecord)}
                    variant="destructive"
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
    columns,
    data: rows,
    page: queryState.page,
    pageCount: staffQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: staffQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{STAFF_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session before managing staff
            records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!managedInstitutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{STAFF_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            You don't have access to this section.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isFiltered = Boolean(queryState.search || statusFilter);

  async function handleDelete() {
    if (!managedInstitutionId || !deleteTarget) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        params: {
          path: {
            staffId: deleteTarget.id,
          },
        },
      });

      toast.success(
        ERP_TOAST_MESSAGES.deleted(ERP_TOAST_SUBJECTS.STAFF_RECORD),
      );
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not delete staff record. Please try again.",
        ),
      );
    }
  }

  return (
    <>
      <EntityListPage
        actions={
          <div className="flex items-center gap-3">
            {canManageStaff && (
              <DataExchangeEntityActions
                entityType={DATA_EXCHANGE_ENTITY_TYPES.STAFF}
              />
            )}
            <EntityPagePrimaryAction asChild>
              <Link to={appendSearch(ERP_ROUTES.STAFF_CREATE, location.search)}>
                <IconPlus className="size-4" />
                {STAFF_CREATE_LABEL}
              </Link>
            </EntityPagePrimaryAction>
          </div>
        }
        description={STAFF_PAGE_COPY.DESCRIPTION}
        title={STAFF_PAGE_COPY.TITLE}
        toolbar={
          <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[280px] flex-1">
                <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-11 w-full max-w-md rounded-lg border-border/70 bg-background pl-10 shadow-none"
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={STAFF_PAGE_COPY.SEARCH_PLACEHOLDER}
                  value={searchInput}
                />
              </div>
              <Select
                onValueChange={(value) => {
                  void setStatusFilter(value === "all" ? "" : value);
                  setPage(1);
                }}
                value={statusFilter || "all"}
              >
                <SelectTrigger className="h-11 w-[160px] rounded-lg border-border/70 bg-background shadow-none">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      >
        <ServerDataTable
          emptyAction={
            !isFiltered ? (
              <EntityEmptyStateAction asChild>
                <Link
                  to={appendSearch(ERP_ROUTES.STAFF_CREATE, location.search)}
                >
                  <IconPlus className="size-4" />
                  {STAFF_CREATE_LABEL}
                </Link>
              </EntityEmptyStateAction>
            ) : undefined
          }
          emptyDescription={
            isFiltered
              ? STAFF_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
              : STAFF_PAGE_COPY.EMPTY_DESCRIPTION
          }
          emptyTitle={
            isFiltered
              ? STAFF_PAGE_COPY.EMPTY_FILTERED_TITLE
              : STAFF_PAGE_COPY.EMPTY_TITLE
          }
          errorDescription={error?.message}
          errorTitle={STAFF_PAGE_COPY.ERROR_TITLE}
          isError={staffQuery.isError}
          isLoading={staffQuery.isLoading}
          onSearchChange={setSearchInput}
          rowCellClassName={(row) =>
            row.status === "active" ? undefined : "opacity-60"
          }
          searchPlaceholder={STAFF_PAGE_COPY.SEARCH_PLACEHOLDER}
          searchValue={searchInput}
          showSearch={false}
          table={table}
          totalRows={staffQuery.data?.total ?? 0}
        />
      </EntityListPage>

      <ConfirmDialog
        confirmLabel="Delete staff"
        description={`Delete “${deleteTarget?.name ?? "this staff record"}”? This removes the tenant staff membership but does not delete the shared user identity.`}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          void handleDelete();
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        open={Boolean(deleteTarget)}
        title="Delete staff"
      />
    </>
  );
}
