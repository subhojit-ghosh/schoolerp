import { useMemo } from "react";
import { Link, useLocation } from "react-router";
import { IconArrowRight, IconSearch } from "@tabler/icons-react";
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
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  EntityRowAction,
  EntityToolbarSecondaryAction,
} from "@/components/entities/entity-actions";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { SORT_ORDERS } from "@/constants/query";
import { buildGuardianDetailRoute, ERP_ROUTES } from "@/constants/routes";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useGuardiansQuery } from "@/features/guardians/api/use-guardians";
import {
  GUARDIAN_LIST_SORT_FIELDS,
  GUARDIANS_PAGE_COPY,
} from "@/features/guardians/model/guardian-list.constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type GuardianRow = {
  campusName: string;
  email: string | null;
  id: string;
  linkedStudents: Array<{ studentId: string }>;
  mobile: string;
  name: string;
  status: string;
};

const columnHelper = createColumnHelper<GuardianRow>();
const VALID_SORT_FIELDS = [
  GUARDIAN_LIST_SORT_FIELDS.CAMPUS,
  GUARDIAN_LIST_SORT_FIELDS.NAME,
  GUARDIAN_LIST_SORT_FIELDS.STATUS,
] as const;

export function GuardiansPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageGuardians = isStaffContext(session);
  const managedInstitutionId = canManageGuardians ? institutionId : undefined;
  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: GUARDIAN_LIST_SORT_FIELDS.NAME,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const guardiansQuery = useGuardiansQuery(managedInstitutionId, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const rows = useMemo(
    () => (guardiansQuery.data?.rows ?? []) as GuardianRow[],
    [guardiansQuery.data?.rows],
  );
  const error = guardiansQuery.error as Error | null | undefined;

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(GUARDIAN_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Guardian
            <SortIcon
              direction={
                queryState.sortBy === GUARDIAN_LIST_SORT_FIELDS.NAME
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
                  buildGuardianDetailRoute(row.original.id),
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
            onClick={() => setSorting(GUARDIAN_LIST_SORT_FIELDS.CAMPUS)}
            type="button"
          >
            Campus
            <SortIcon
              direction={
                queryState.sortBy === GUARDIAN_LIST_SORT_FIELDS.CAMPUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
      }),
      columnHelper.accessor("linkedStudents", {
        header: "Linked students",
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getValue().length} linked
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(GUARDIAN_LIST_SORT_FIELDS.STATUS)}
            type="button"
          >
            Status
            <SortIcon
              direction={
                queryState.sortBy === GUARDIAN_LIST_SORT_FIELDS.STATUS
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
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <EntityRowAction asChild>
              <Link
                to={appendSearch(
                  buildGuardianDetailRoute(row.original.id),
                  location.search,
                )}
              >
                Open
                <IconArrowRight className="size-3" />
              </Link>
            </EntityRowAction>
          </div>
        ),
      }),
    ],
    [location.search, queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: rows,
    page: queryState.page,
    pageCount: guardiansQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: guardiansQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{GUARDIANS_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session before managing guardian
            records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageGuardians) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{GUARDIANS_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Guardian management is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isFiltered = Boolean(queryState.search);

  return (
    <EntityListPage
      description={GUARDIANS_PAGE_COPY.DESCRIPTION}
      title={GUARDIANS_PAGE_COPY.TITLE}
      toolbar={
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] flex-1">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 w-full max-w-md rounded-lg border-border/70 bg-background pl-10 shadow-none"
                placeholder={GUARDIANS_PAGE_COPY.SEARCH_PLACEHOLDER}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <EntityToolbarSecondaryAction asChild>
              <Link to={ERP_ROUTES.STUDENTS}>Go to students</Link>
            </EntityToolbarSecondaryAction>
          </div>
        </div>
      }
    >
      <ServerDataTable
        emptyAction={
          !isFiltered ? (
            <EntityToolbarSecondaryAction asChild>
              <Link to={ERP_ROUTES.STUDENTS}>Go to students</Link>
            </EntityToolbarSecondaryAction>
          ) : undefined
        }
        emptyDescription={
          isFiltered
            ? GUARDIANS_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
            : GUARDIANS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          isFiltered
            ? GUARDIANS_PAGE_COPY.EMPTY_FILTERED_TITLE
            : GUARDIANS_PAGE_COPY.EMPTY_TITLE
        }
        errorDescription={error?.message}
        errorTitle={GUARDIANS_PAGE_COPY.ERROR_TITLE}
        isError={guardiansQuery.isError}
        isLoading={guardiansQuery.isLoading}
        onSearchChange={setSearchInput}
        searchPlaceholder={GUARDIANS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        showSearch={false}
        table={table}
        totalRows={guardiansQuery.data?.total ?? 0}
      />
    </EntityListPage>
  );
}
