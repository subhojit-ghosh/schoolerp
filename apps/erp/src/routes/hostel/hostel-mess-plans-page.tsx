import { useCallback, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import {
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconSearch,
  IconToggleLeft,
  IconToggleRight,
} from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
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
import { StatusBadge } from "@/components/data-display/status-badge";
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useMessPlansQuery,
  useUpdateMessPlanStatusMutation,
} from "@/features/hostel/api/use-hostel";
import {
  MESS_PLAN_LIST_SORT_FIELDS,
  MESS_PLANS_PAGE_COPY,
} from "@/features/hostel/model/hostel-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type MessPlanRow = {
  id: string;
  name: string;
  monthlyFeeInPaise: number;
  description: string | null;
  status: "active" | "inactive";
  createdAt: string;
};

const columnHelper = createColumnHelper<MessPlanRow>();
const VALID_SORT_FIELDS = [
  MESS_PLAN_LIST_SORT_FIELDS.NAME,
  MESS_PLAN_LIST_SORT_FIELDS.CREATED_AT,
] as const;

function formatPaise(paise: number): string {
  return `Rs. ${(paise / 100).toFixed(2)}`;
}

export function HostelMessPlansPage() {
  useDocumentTitle("Mess Plans");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.HOSTEL_READ);
  const canManage = hasPermission(session, PERMISSIONS.HOSTEL_MANAGE);

  const statusMutation = useUpdateMessPlanStatusMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: MESS_PLAN_LIST_SORT_FIELDS.NAME,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const messPlansQuery = useMessPlansQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const messPlansData = messPlansQuery.data;
  const messPlans = useMemo(
    () => (messPlansData?.rows ?? []) as MessPlanRow[],
    [messPlansData?.rows],
  );

  const handleToggleStatus = useCallback(
    async (id: string, currentStatus: "active" | "inactive") => {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      try {
        await statusMutation.mutateAsync({
          params: { path: { planId: id } },
          body: { status: newStatus },
        });
        toast.success(
          newStatus === "active"
            ? "Mess plan activated."
            : "Mess plan deactivated.",
        );
      } catch (error) {
        toast.error(extractApiError(error, "Could not update mess plan status. Please try again."));
      }
    },
    [statusMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(MESS_PLAN_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Name
            <SortIcon
              direction={
                queryState.sortBy === MESS_PLAN_LIST_SORT_FIELDS.NAME
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.name}</span>
        ),
      }),
      columnHelper.accessor("monthlyFeeInPaise", {
        header: "Monthly Fee",
        cell: ({ row }) => (
          <span className="text-sm">{formatPaise(row.original.monthlyFeeInPaise)}</span>
        ),
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground truncate max-w-xs">
            {row.original.description || "-"}
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
          const plan = row.original;
          if (!canManage) return null;

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
                        `/hostel/mess-plans/${plan.id}/edit`,
                        location.search,
                      )}
                    >
                      <IconPencil className="mr-2 size-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() =>
                      void handleToggleStatus(plan.id, plan.status)
                    }
                  >
                    {plan.status === "active" ? (
                      <>
                        <IconToggleRight className="mr-2 size-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <IconToggleLeft className="mr-2 size-4" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [canManage, handleToggleStatus, location.search, queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: messPlans,
    page: queryState.page,
    pageCount: messPlansData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: messPlansData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (messPlansQuery.error as Error | null | undefined)?.message;

  return (
    <EntityListPage
      title={MESS_PLANS_PAGE_COPY.TITLE}
      description={MESS_PLANS_PAGE_COPY.DESCRIPTION}
      actions={
        canManage ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.HOSTEL_MESS_PLAN_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New mess plan
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
              placeholder={MESS_PLANS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  ERP_ROUTES.HOSTEL_MESS_PLAN_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New mess plan
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No mess plans match your search."
            : MESS_PLANS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching mess plans"
            : MESS_PLANS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load mess plans"
        isLoading={messPlansQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={MESS_PLANS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={messPlansData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
