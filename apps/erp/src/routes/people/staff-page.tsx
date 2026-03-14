import { useMemo } from "react";
import { Link, useLocation } from "react-router";
import { IconArrowRight, IconPlus, IconSearch } from "@tabler/icons-react";
import {
  createColumnHelper,
  functionalUpdate,
  getCoreRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
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
import { ServerDataTable, SortIcon } from "@/components/data-display/server-data-table";
import { SORT_ORDERS } from "@/constants/query";
import { buildStaffDetailRoute, ERP_ROUTES } from "@/constants/routes";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useStaffQuery } from "@/features/staff/api/use-staff";
import {
  STAFF_LIST_SORT_FIELDS,
  STAFF_PAGE_COPY,
} from "@/features/staff/model/staff-list.constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { appendSearch } from "@/lib/routes";

type StaffRow = {
  id: string;
  campusName: string;
  email: string | null;
  memberType: string;
  mobile: string;
  name: string;
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
  STAFF_LIST_SORT_FIELDS.NAME,
  STAFF_LIST_SORT_FIELDS.STATUS,
] as const;

export function StaffPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageStaff = isStaffContext(session);
  const managedInstitutionId = canManageStaff ? institutionId : undefined;
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

  const staffQuery = useStaffQuery(managedInstitutionId, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const rows = useMemo(
    () => (staffQuery.data?.rows ?? []) as StaffRow[],
    [staffQuery.data?.rows],
  );
  const error = staffQuery.error as Error | null | undefined;

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
            onClick={() => setSorting(STAFF_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Staff
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
              {row.original.mobile}
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
      columnHelper.accessor("role", {
        header: "Role",
        cell: ({ getValue, row }) => (
          <div className="flex flex-wrap gap-1">
            {getValue() ? (
              <Badge variant="outline">{getValue()?.name}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">No role</span>
            )}
            <Badge variant="outline" className="capitalize">
              {row.original.memberType}
            </Badge>
          </div>
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
            variant={getValue() === "active" ? "secondary" : "outline"}
            className="capitalize"
          >
            {getValue()}
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
                  buildStaffDetailRoute(row.original.id),
                  location.search,
                )}
              >
                Open record
                <IconArrowRight className="size-3" />
              </Link>
            </EntityRowAction>
          </div>
        ),
      }),
    ],
    [location.search, queryState.sortBy, queryState.sortOrder, setSorting],
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
    pageCount: staffQuery.data?.pageCount ?? 1,
    rowCount: staffQuery.data?.total ?? 0,
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
          <CardTitle>{STAFF_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session before managing staff
            records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageStaff) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{STAFF_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Staff management is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
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
          <Link to={appendSearch(ERP_ROUTES.STAFF_CREATE, location.search)}>
            <IconPlus className="size-4" />
            Add staff
          </Link>
        </EntityPagePrimaryAction>
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
                placeholder={STAFF_PAGE_COPY.SEARCH_PLACEHOLDER}
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
              <Link to={appendSearch(ERP_ROUTES.STAFF_CREATE, location.search)}>
                <IconPlus className="size-4" />
                Add first staff
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
        searchPlaceholder={STAFF_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        showSearch={false}
        table={table}
        totalRows={staffQuery.data?.total ?? 0}
      />
    </EntityListPage>
  );
}
