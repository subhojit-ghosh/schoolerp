import { useMemo } from "react";
import { PERMISSIONS } from "@repo/contracts";
import { Link, Outlet, useLocation } from "react-router";
import { IconPencil, IconPlus, IconSearch } from "@tabler/icons-react";
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
  EntityEmptyStateAction,
  EntityPagePrimaryAction,
  EntityRowAction,
} from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { buildAcademicYearEditRoute, ERP_ROUTES } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import {
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import {
  ACADEMIC_YEAR_LIST_SORT_FIELDS,
  ACADEMIC_YEARS_PAGE_COPY,
} from "@/features/academic-years/model/academic-year-list.constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type AcademicYearRow = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: string;
};

const columnHelper = createColumnHelper<AcademicYearRow>();
const VALID_SORT_FIELDS = [
  ACADEMIC_YEAR_LIST_SORT_FIELDS.CURRENT,
  ACADEMIC_YEAR_LIST_SORT_FIELDS.END_DATE,
  ACADEMIC_YEAR_LIST_SORT_FIELDS.NAME,
  ACADEMIC_YEAR_LIST_SORT_FIELDS.START_DATE,
] as const;

function formatDateRange(startDate: string, endDate: string) {
  return `${startDate} to ${endDate}`;
}

export function AcademicYearsPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const managedInstitutionId = isStaffContext(session) && hasPermission(session, PERMISSIONS.ACADEMICS_READ) ? institutionId : undefined;
  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: ACADEMIC_YEAR_LIST_SORT_FIELDS.START_DATE,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const academicYearsQuery = useAcademicYearsQuery(managedInstitutionId, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const rows = useMemo(
    () => (academicYearsQuery.data?.rows ?? []) as AcademicYearRow[],
    [academicYearsQuery.data?.rows],
  );
  const error = academicYearsQuery.error as Error | null | undefined;

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(ACADEMIC_YEAR_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Academic year
            <SortIcon
              direction={
                queryState.sortBy === ACADEMIC_YEAR_LIST_SORT_FIELDS.NAME
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
                  buildAcademicYearEditRoute(row.original.id),
                  location.search,
                )}
              >
                {row.original.name}
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              {formatDateRange(row.original.startDate, row.original.endDate)}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("startDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(ACADEMIC_YEAR_LIST_SORT_FIELDS.START_DATE)
            }
            type="button"
          >
            Start
            <SortIcon
              direction={
                queryState.sortBy === ACADEMIC_YEAR_LIST_SORT_FIELDS.START_DATE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
      }),
      columnHelper.accessor("endDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(ACADEMIC_YEAR_LIST_SORT_FIELDS.END_DATE)}
            type="button"
          >
            End
            <SortIcon
              direction={
                queryState.sortBy === ACADEMIC_YEAR_LIST_SORT_FIELDS.END_DATE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
      }),
      columnHelper.accessor("isCurrent", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(ACADEMIC_YEAR_LIST_SORT_FIELDS.CURRENT)}
            type="button"
          >
            Current
            <SortIcon
              direction={
                queryState.sortBy === ACADEMIC_YEAR_LIST_SORT_FIELDS.CURRENT
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) =>
          row.original.isCurrent ? (
            <Badge>Current</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Archived
            </Badge>
          ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => (
          <Badge variant="outline" className="capitalize text-muted-foreground">
            {getValue().toLowerCase()}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <EntityRowAction asChild>
              <Link
                to={appendSearch(
                  buildAcademicYearEditRoute(row.original.id),
                  location.search,
                )}
              >
                <IconPencil className="size-3" />
                Edit
              </Link>
            </EntityRowAction>
          </div>
        ),
      }),
    ],
    [location.search, queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    data: rows,
    columns,
    page: queryState.page,
    pageCount: academicYearsQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: academicYearsQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{ACADEMIC_YEARS_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage academic years.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!managedInstitutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{ACADEMIC_YEARS_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            You don't have access to this section.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isFiltered = Boolean(queryState.search);

  return (
    <EntityListPage
      actions={
        <EntityPagePrimaryAction asChild>
          <Link
            to={appendSearch(ERP_ROUTES.ACADEMIC_YEAR_CREATE, location.search)}
          >
            <IconPlus className="size-4" />
            New academic year
          </Link>
        </EntityPagePrimaryAction>
      }
      description={ACADEMIC_YEARS_PAGE_COPY.DESCRIPTION}
      title={ACADEMIC_YEARS_PAGE_COPY.TITLE}
      toolbar={
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] flex-1">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 w-full max-w-md rounded-lg border-border/70 bg-background pl-10 shadow-none"
                placeholder={ACADEMIC_YEARS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  ERP_ROUTES.ACADEMIC_YEAR_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New academic year
              </Link>
            </EntityEmptyStateAction>
          ) : null
        }
        emptyDescription={
          isFiltered
            ? ACADEMIC_YEARS_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
            : ACADEMIC_YEARS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          isFiltered
            ? ACADEMIC_YEARS_PAGE_COPY.EMPTY_FILTERED_TITLE
            : ACADEMIC_YEARS_PAGE_COPY.EMPTY_TITLE
        }
        errorDescription={error?.message}
        errorTitle={ACADEMIC_YEARS_PAGE_COPY.ERROR_TITLE}
        isError={academicYearsQuery.isError}
        isLoading={academicYearsQuery.isLoading}
        onSearchChange={setSearchInput}
        searchPlaceholder={ACADEMIC_YEARS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        showSearch={false}
        table={table}
        totalRows={academicYearsQuery.data?.total ?? 0}
      />
      <Outlet />
    </EntityListPage>
  );
}
