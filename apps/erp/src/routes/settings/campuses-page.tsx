import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import {
  createColumnHelper,
  functionalUpdate,
  getCoreRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
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
} from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { SORT_ORDERS } from "@/constants/query";
import { ERP_ROUTES } from "@/constants/routes";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useCampusesQuery } from "@/features/campuses/api/use-campuses";
import {
  CAMPUS_LIST_SORT_FIELDS,
  CAMPUSES_PAGE_COPY,
} from "@/features/campuses/model/campus-list.constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { appendSearch } from "@/lib/routes";

type CampusRow = {
  code: string | null;
  id: string;
  isDefault: boolean;
  name: string;
  slug: string;
  status: string;
};

const columnHelper = createColumnHelper<CampusRow>();
const VALID_SORT_FIELDS = [
  CAMPUS_LIST_SORT_FIELDS.DEFAULT,
  CAMPUS_LIST_SORT_FIELDS.NAME,
  CAMPUS_LIST_SORT_FIELDS.SLUG,
  CAMPUS_LIST_SORT_FIELDS.STATUS,
] as const;

export function CampusesPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const activeCampusId = session?.activeCampus?.id;
  const canManageCampuses = isStaffContext(session);
  const managedInstitutionId = canManageCampuses ? institutionId : undefined;
  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: CAMPUS_LIST_SORT_FIELDS.NAME,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const campusesQuery = useCampusesQuery(managedInstitutionId, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const rows = useMemo(
    () => (campusesQuery.data?.rows ?? []) as CampusRow[],
    [campusesQuery.data?.rows],
  );
  const error = campusesQuery.error as Error | null | undefined;

  const sortingState = useMemo<SortingState>(() => {
    return [
      {
        id: queryState.sortBy,
        desc: queryState.sortOrder === SORT_ORDERS.DESC,
      },
    ];
  }, [queryState.sortBy, queryState.sortOrder]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(CAMPUS_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Campus
            <SortIcon
              direction={
                queryState.sortBy === CAMPUS_LIST_SORT_FIELDS.NAME
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{row.original.name}</span>
              {row.original.isDefault ? <Badge>Default</Badge> : null}
              {row.original.id === activeCampusId ? (
                <Badge variant="secondary">Current session</Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Slug `{row.original.slug}`
              {row.original.code ? ` • Code ${row.original.code}` : ""}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("slug", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(CAMPUS_LIST_SORT_FIELDS.SLUG)}
            type="button"
          >
            Slug
            <SortIcon
              direction={
                queryState.sortBy === CAMPUS_LIST_SORT_FIELDS.SLUG
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
      }),
      columnHelper.accessor("status", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(CAMPUS_LIST_SORT_FIELDS.STATUS)}
            type="button"
          >
            Status
            <SortIcon
              direction={
                queryState.sortBy === CAMPUS_LIST_SORT_FIELDS.STATUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => (
          <Badge variant="outline" className="capitalize text-muted-foreground">
            {getValue()}
          </Badge>
        ),
      }),
    ],
    [activeCampusId, queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    onPaginationChange: (updater) => {
      const nextPagination = functionalUpdate<PaginationState>(updater, {
        pageIndex: queryState.page - 1,
        pageSize: queryState.pageSize,
      });

      if (nextPagination.pageSize !== queryState.pageSize) {
        setPageSize(nextPagination.pageSize);
        return;
      }

      setPage(nextPagination.pageIndex + 1);
    },
    pageCount: campusesQuery.data?.pageCount ?? 1,
    rowCount: campusesQuery.data?.total ?? 0,
    state: {
      pagination: {
        pageIndex: queryState.page - 1,
        pageSize: queryState.pageSize,
      },
      sorting: sortingState,
    },
  });

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{CAMPUSES_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage campuses.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageCampuses) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{CAMPUSES_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Campus management is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
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
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                ERP_ROUTES.SETTINGS_CAMPUSES_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New campus
            </Link>
          </EntityPagePrimaryAction>
        }
        description={CAMPUSES_PAGE_COPY.DESCRIPTION}
        title={CAMPUSES_PAGE_COPY.TITLE}
        toolbar={
          <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[280px] flex-1">
                <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-11 w-full max-w-md rounded-lg border-border/70 bg-background pl-10 shadow-none"
                  placeholder={CAMPUSES_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                    ERP_ROUTES.SETTINGS_CAMPUSES_CREATE,
                    location.search,
                  )}
                >
                  <IconPlus className="size-4" />
                  New campus
                </Link>
              </EntityEmptyStateAction>
            ) : undefined
          }
          emptyDescription={
            isFiltered
              ? CAMPUSES_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
              : CAMPUSES_PAGE_COPY.EMPTY_DESCRIPTION
          }
          emptyTitle={
            isFiltered
              ? CAMPUSES_PAGE_COPY.EMPTY_FILTERED_TITLE
              : CAMPUSES_PAGE_COPY.EMPTY_TITLE
          }
          errorDescription={error?.message}
          errorTitle={CAMPUSES_PAGE_COPY.ERROR_TITLE}
          isError={campusesQuery.isError}
          isLoading={campusesQuery.isLoading}
          onSearchChange={setSearchInput}
          searchPlaceholder={CAMPUSES_PAGE_COPY.SEARCH_PLACEHOLDER}
          searchValue={searchInput}
          showSearch={false}
          table={table}
          totalRows={campusesQuery.data?.total ?? 0}
        />
      </EntityListPage>

      <Outlet />
    </>
  );
}
