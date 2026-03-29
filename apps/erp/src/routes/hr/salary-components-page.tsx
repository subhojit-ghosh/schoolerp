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
import { StatusBadge } from "@/components/data-display/status-badge";
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useSalaryComponentsQuery,
  useUpdateSalaryComponentStatusMutation,
} from "@/features/payroll/api/use-payroll";
import {
  SALARY_COMPONENT_LIST_SORT_FIELDS,
  SALARY_COMPONENTS_PAGE_COPY,
} from "@/features/payroll/model/payroll-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type SalaryComponentRow = {
  id: string;
  name: string;
  type: "earning" | "deduction";
  calculationType: "fixed" | "percentage";
  isTaxable: boolean;
  isStatutory: boolean;
  sortOrder: number;
  status: "active" | "archived";
  createdAt: string;
};

const columnHelper = createColumnHelper<SalaryComponentRow>();
const VALID_SORT_FIELDS = [
  SALARY_COMPONENT_LIST_SORT_FIELDS.NAME,
  SALARY_COMPONENT_LIST_SORT_FIELDS.TYPE,
  SALARY_COMPONENT_LIST_SORT_FIELDS.SORT_ORDER,
  SALARY_COMPONENT_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function SalaryComponentsPage() {
  useDocumentTitle("Salary Components");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canReadPayroll = hasPermission(session, PERMISSIONS.PAYROLL_READ);
  const canManagePayroll = hasPermission(session, PERMISSIONS.PAYROLL_MANAGE);

  const statusMutation = useUpdateSalaryComponentStatusMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: SALARY_COMPONENT_LIST_SORT_FIELDS.SORT_ORDER,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const componentsQuery = useSalaryComponentsQuery(canReadPayroll, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const componentsData = componentsQuery.data;
  const components = useMemo(
    () => (componentsData?.rows ?? []) as SalaryComponentRow[],
    [componentsData?.rows],
  );

  const handleToggleStatus = useCallback(
    async (id: string, currentStatus: "active" | "archived") => {
      const newStatus = currentStatus === "active" ? "archived" : "active";
      try {
        await statusMutation.mutateAsync({
          params: { path: { componentId: id } },
          body: { status: newStatus },
        });
        toast.success(
          newStatus === "active"
            ? "Salary component activated."
            : "Salary component archived.",
        );
      } catch (error) {
        toast.error(
          extractApiError(
            error,
            "Could not update salary component status. Please try again.",
          ),
        );
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
            onClick={() => setSorting(SALARY_COMPONENT_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Name
            <SortIcon
              direction={
                queryState.sortBy === SALARY_COMPONENT_LIST_SORT_FIELDS.NAME
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
      columnHelper.accessor("type", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(SALARY_COMPONENT_LIST_SORT_FIELDS.TYPE)}
            type="button"
          >
            Type
            <SortIcon
              direction={
                queryState.sortBy === SALARY_COMPONENT_LIST_SORT_FIELDS.TYPE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) =>
          row.original.type === "earning" ? (
            <Badge className="bg-green-500/10 text-green-700 border-green-200">
              Earning
            </Badge>
          ) : (
            <Badge variant="destructive">Deduction</Badge>
          ),
      }),
      columnHelper.accessor("calculationType", {
        header: "Calculation",
        cell: ({ row }) => (
          <span className="text-sm capitalize">
            {row.original.calculationType}
          </span>
        ),
      }),
      columnHelper.accessor("isTaxable", {
        header: "Taxable",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.isTaxable ? "Yes" : "No"}
          </span>
        ),
      }),
      columnHelper.accessor("isStatutory", {
        header: "Statutory",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.isStatutory ? "Yes" : "No"}
          </span>
        ),
      }),
      columnHelper.accessor("sortOrder", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(SALARY_COMPONENT_LIST_SORT_FIELDS.SORT_ORDER)
            }
            type="button"
          >
            Order
            <SortIcon
              direction={
                queryState.sortBy ===
                SALARY_COMPONENT_LIST_SORT_FIELDS.SORT_ORDER
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.sortOrder}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const component = row.original;

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
                        `/payroll/salary-components/${component.id}/edit`,
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
                      void handleToggleStatus(component.id, component.status)
                    }
                  >
                    {component.status === "active" ? (
                      <>
                        <IconToggleRight className="mr-2 size-4" />
                        Archive
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
    [
      canManagePayroll,
      handleToggleStatus,
      location.search,
      queryState.sortBy,
      queryState.sortOrder,
      setSorting,
    ],
  );

  const table = useServerDataTable({
    columns,
    data: components,
    page: queryState.page,
    pageCount: componentsData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: componentsData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (componentsQuery.error as Error | null | undefined)
    ?.message;

  return (
    <EntityListPage
      title={SALARY_COMPONENTS_PAGE_COPY.TITLE}
      description={SALARY_COMPONENTS_PAGE_COPY.DESCRIPTION}
      actions={
        canManagePayroll ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.PAYROLL_SALARY_COMPONENT_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New component
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
              placeholder={SALARY_COMPONENTS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  ERP_ROUTES.PAYROLL_SALARY_COMPONENT_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New component
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No salary components match your search."
            : SALARY_COMPONENTS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching components"
            : SALARY_COMPONENTS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load salary components"
        isLoading={componentsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={SALARY_COMPONENTS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={componentsData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
