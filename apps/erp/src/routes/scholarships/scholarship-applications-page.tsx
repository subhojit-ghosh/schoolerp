import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Input } from "@repo/ui/components/ui/input";
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
import { useScholarshipApplicationsQuery } from "@/features/scholarships/api/use-scholarships";
import {
  SCHOLARSHIP_APPLICATION_LIST_SORT_FIELDS,
  SCHOLARSHIP_APPLICATIONS_PAGE_COPY,
  SCHOLARSHIP_APPLICATION_STATUS_LABELS,
} from "@/features/scholarships/model/scholarship-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type ApplicationRow = {
  id: string;
  studentName: string;
  scholarshipName: string;
  studentAdmissionNumber: string;
  status: string;
  createdAt: string;
};

const columnHelper = createColumnHelper<ApplicationRow>();
const VALID_SORT_FIELDS = [
  SCHOLARSHIP_APPLICATION_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function ScholarshipApplicationsPage() {
  useDocumentTitle("Scholarship Applications");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.SCHOLARSHIPS_READ);
  const canManage = hasPermission(session, PERMISSIONS.SCHOLARSHIPS_MANAGE);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: SCHOLARSHIP_APPLICATION_LIST_SORT_FIELDS.CREATED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const applicationsQuery = useScholarshipApplicationsQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const applicationsData = applicationsQuery.data;
  const applications = useMemo(
    () => (applicationsData?.rows ?? []) as ApplicationRow[],
    [applicationsData?.rows],
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
      columnHelper.accessor("scholarshipName", {
        header: "Scholarship",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.scholarshipName}</span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(SCHOLARSHIP_APPLICATION_LIST_SORT_FIELDS.CREATED_AT)
            }
            type="button"
          >
            Applied
            <SortIcon
              direction={
                queryState.sortBy ===
                SCHOLARSHIP_APPLICATION_LIST_SORT_FIELDS.CREATED_AT
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString("en-IN")}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            label={
              SCHOLARSHIP_APPLICATION_STATUS_LABELS[row.original.status] ??
              row.original.status
            }
          />
        ),
      }),
    ],
    [queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: applications,
    page: queryState.page,
    pageCount: applicationsData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: applicationsData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (applicationsQuery.error as Error | null | undefined)
    ?.message;

  return (
    <EntityListPage
      title={SCHOLARSHIP_APPLICATIONS_PAGE_COPY.TITLE}
      description={SCHOLARSHIP_APPLICATIONS_PAGE_COPY.DESCRIPTION}
      actions={
        canManage ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                `${ERP_ROUTES.SCHOLARSHIP_APPLICATIONS}/${
                  "new" as const
                }`,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New application
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
              placeholder={
                SCHOLARSHIP_APPLICATIONS_PAGE_COPY.SEARCH_PLACEHOLDER
              }
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
                  `${ERP_ROUTES.SCHOLARSHIP_APPLICATIONS}/${"new" as const}`,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New application
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No applications match your search."
            : SCHOLARSHIP_APPLICATIONS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching applications"
            : SCHOLARSHIP_APPLICATIONS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load scholarship applications"
        isLoading={applicationsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={
          SCHOLARSHIP_APPLICATIONS_PAGE_COPY.SEARCH_PLACEHOLDER
        }
        searchValue={searchInput}
        table={table}
        totalRows={applicationsData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
