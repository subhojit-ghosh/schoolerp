import { useCallback, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import {
  IconDotsVertical,
  IconEye,
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
  useSalaryTemplatesQuery,
  useUpdateSalaryTemplateStatusMutation,
} from "@/features/payroll/api/use-payroll";
import {
  SALARY_TEMPLATE_LIST_SORT_FIELDS,
  SALARY_TEMPLATES_PAGE_COPY,
} from "@/features/payroll/model/payroll-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";
import { buildSalaryTemplateDetailRoute } from "@/constants/routes";

type SalaryTemplateRow = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  createdAt: string;
};

const columnHelper = createColumnHelper<SalaryTemplateRow>();
const VALID_SORT_FIELDS = [
  SALARY_TEMPLATE_LIST_SORT_FIELDS.NAME,
  SALARY_TEMPLATE_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function SalaryTemplatesPage() {
  useDocumentTitle("Salary Templates");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canReadPayroll = hasPermission(session, PERMISSIONS.PAYROLL_READ);
  const canManagePayroll = hasPermission(session, PERMISSIONS.PAYROLL_MANAGE);

  const statusMutation = useUpdateSalaryTemplateStatusMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: SALARY_TEMPLATE_LIST_SORT_FIELDS.NAME,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const templatesQuery = useSalaryTemplatesQuery(canReadPayroll, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const templatesData = templatesQuery.data;
  const templates = useMemo(
    () => (templatesData?.rows ?? []) as SalaryTemplateRow[],
    [templatesData?.rows],
  );

  const handleToggleStatus = useCallback(
    async (id: string, currentStatus: "active" | "archived") => {
      const newStatus = currentStatus === "active" ? "archived" : "active";
      try {
        await statusMutation.mutateAsync({
          params: { path: { templateId: id } },
          body: { status: newStatus },
        });
        toast.success(
          newStatus === "active"
            ? "Salary template activated."
            : "Salary template archived.",
        );
      } catch (error) {
        toast.error(
          extractApiError(
            error,
            "Could not update salary template status. Please try again.",
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
            onClick={() => setSorting(SALARY_TEMPLATE_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Name
            <SortIcon
              direction={
                queryState.sortBy === SALARY_TEMPLATE_LIST_SORT_FIELDS.NAME
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
      columnHelper.accessor("description", {
        header: "Description",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.description || "-"}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      }),
      columnHelper.accessor("createdAt", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(SALARY_TEMPLATE_LIST_SORT_FIELDS.CREATED_AT)
            }
            type="button"
          >
            Created
            <SortIcon
              direction={
                queryState.sortBy ===
                SALARY_TEMPLATE_LIST_SORT_FIELDS.CREATED_AT
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
              new Date(row.original.createdAt),
            )}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const template = row.original;

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
                    <Link to={buildSalaryTemplateDetailRoute(template.id)}>
                      <IconEye className="mr-2 size-4" />
                      View detail
                    </Link>
                  </DropdownMenuItem>
                  {canManagePayroll ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link
                          to={appendSearch(
                            `/payroll/salary-templates/${template.id}/edit`,
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
                          void handleToggleStatus(template.id, template.status)
                        }
                      >
                        {template.status === "active" ? (
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
      handleToggleStatus,
      location.search,
      queryState.sortBy,
      queryState.sortOrder,
      setSorting,
    ],
  );

  const table = useServerDataTable({
    columns,
    data: templates,
    page: queryState.page,
    pageCount: templatesData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: templatesData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (templatesQuery.error as Error | null | undefined)
    ?.message;

  return (
    <EntityListPage
      title={SALARY_TEMPLATES_PAGE_COPY.TITLE}
      description={SALARY_TEMPLATES_PAGE_COPY.DESCRIPTION}
      actions={
        canManagePayroll ? (
          <EntityPagePrimaryAction asChild>
            <Link to={ERP_ROUTES.PAYROLL_SALARY_TEMPLATE_CREATE}>
              <IconPlus className="size-4" />
              New template
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
              placeholder={SALARY_TEMPLATES_PAGE_COPY.SEARCH_PLACEHOLDER}
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
              <Link to={ERP_ROUTES.PAYROLL_SALARY_TEMPLATE_CREATE}>
                <IconPlus className="size-4" />
                New template
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No salary templates match your search."
            : SALARY_TEMPLATES_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching templates"
            : SALARY_TEMPLATES_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load salary templates"
        isLoading={templatesQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={SALARY_TEMPLATES_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={templatesData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
