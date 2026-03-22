import { useMemo } from "react";
import { PERMISSIONS } from "@repo/contracts";
import { Link, Outlet, useLocation } from "react-router";
import {
  IconPencil,
  IconPlus,
  IconPrinter,
  IconSearch,
} from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
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
  EntityRowAction,
} from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { SORT_ORDERS } from "@/constants/query";
import {
  buildAdmissionApplicationAcknowledgementRoute,
  buildAdmissionApplicationEditRoute,
  ERP_ROUTES,
} from "@/constants/routes";
import { useAdmissionApplicationsQuery } from "@/features/admissions/api/use-admissions";
import {
  ADMISSION_APPLICATION_LIST_SORT_FIELDS,
  ADMISSION_APPLICATIONS_PAGE_COPY,
} from "@/features/admissions/model/admission-list.constants";
import {
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type AdmissionApplicationRow = {
  id: string;
  studentFirstName: string;
  studentLastName: string | null;
  guardianName: string;
  mobile: string;
  campusName: string;
  status: string;
  desiredClassName: string | null;
  desiredSectionName: string | null;
};

const columnHelper = createColumnHelper<AdmissionApplicationRow>();
const VALID_SORT_FIELDS = [
  ADMISSION_APPLICATION_LIST_SORT_FIELDS.CAMPUS,
  ADMISSION_APPLICATION_LIST_SORT_FIELDS.CREATED_AT,
  ADMISSION_APPLICATION_LIST_SORT_FIELDS.STATUS,
  ADMISSION_APPLICATION_LIST_SORT_FIELDS.STUDENT_NAME,
] as const;

function toTitleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdmissionApplicationsPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const managedInstitutionId = isStaffContext(session) && hasPermission(session, PERMISSIONS.ADMISSIONS_READ) ? institutionId : undefined;
  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: ADMISSION_APPLICATION_LIST_SORT_FIELDS.CREATED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const applicationsQuery = useAdmissionApplicationsQuery(
    managedInstitutionId,
    {
      limit: queryState.pageSize,
      order: queryState.sortOrder,
      page: queryState.page,
      q: queryState.search || undefined,
      sort: queryState.sortBy,
    },
  );

  const rows = useMemo(
    () => (applicationsQuery.data?.rows ?? []) as AdmissionApplicationRow[],
    [applicationsQuery.data?.rows],
  );
  const error = applicationsQuery.error as Error | null | undefined;

  const columns = useMemo(
    () => [
      columnHelper.accessor("studentFirstName", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(ADMISSION_APPLICATION_LIST_SORT_FIELDS.STUDENT_NAME)
            }
            type="button"
          >
            Student
            <SortIcon
              direction={
                queryState.sortBy ===
                ADMISSION_APPLICATION_LIST_SORT_FIELDS.STUDENT_NAME
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium">
              {[row.original.studentFirstName, row.original.studentLastName]
                .filter(Boolean)
                .join(" ")}
            </p>
            <p className="text-sm text-muted-foreground">
              Guardian: {row.original.guardianName}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("mobile", {
        header: "Contact",
      }),
      columnHelper.accessor("campusName", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(ADMISSION_APPLICATION_LIST_SORT_FIELDS.CAMPUS)
            }
            type="button"
          >
            Campus
            <SortIcon
              direction={
                queryState.sortBy ===
                ADMISSION_APPLICATION_LIST_SORT_FIELDS.CAMPUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
      }),
      columnHelper.accessor("desiredClassName", {
        header: "Desired class",
        cell: ({ row }) => {
          const className = row.original.desiredClassName;
          const sectionName = row.original.desiredSectionName;

          if (!className && !sectionName) {
            return <span className="text-muted-foreground">Not specified</span>;
          }

          return (
            <span>{[className, sectionName].filter(Boolean).join(" ")}</span>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(ADMISSION_APPLICATION_LIST_SORT_FIELDS.STATUS)
            }
            type="button"
          >
            Status
            <SortIcon
              direction={
                queryState.sortBy ===
                ADMISSION_APPLICATION_LIST_SORT_FIELDS.STATUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => (
          <Badge variant="outline" className="capitalize">
            {toTitleCase(getValue())}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <EntityRowAction asChild>
              <Link
                target="_blank"
                to={buildAdmissionApplicationAcknowledgementRoute(
                  row.original.id,
                )}
              >
                <IconPrinter className="size-3" />
                Acknowledgement
              </Link>
            </EntityRowAction>
            <EntityRowAction asChild>
              <Link
                to={appendSearch(
                  buildAdmissionApplicationEditRoute(row.original.id),
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
    columns,
    data: rows,
    page: queryState.page,
    pageCount: applicationsQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: applicationsQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{ADMISSION_APPLICATIONS_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage admission
            applications.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!managedInstitutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{ADMISSION_APPLICATIONS_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            You don't have access to this section.
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
                ERP_ROUTES.ADMISSIONS_APPLICATION_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New admission application
            </Link>
          </EntityPagePrimaryAction>
        }
        description={ADMISSION_APPLICATIONS_PAGE_COPY.DESCRIPTION}
        title={ADMISSION_APPLICATIONS_PAGE_COPY.TITLE}
        toolbar={
          <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[280px] flex-1">
                <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-11 w-full max-w-md rounded-lg border-border/70 bg-background pl-10 shadow-none"
                  placeholder={
                    ADMISSION_APPLICATIONS_PAGE_COPY.SEARCH_PLACEHOLDER
                  }
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
                    ERP_ROUTES.ADMISSIONS_APPLICATION_CREATE,
                    location.search,
                  )}
                >
                  <IconPlus className="size-4" />
                  New admission application
                </Link>
              </EntityEmptyStateAction>
            ) : undefined
          }
          emptyDescription={
            isFiltered
              ? ADMISSION_APPLICATIONS_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
              : ADMISSION_APPLICATIONS_PAGE_COPY.EMPTY_DESCRIPTION
          }
          emptyTitle={
            isFiltered
              ? ADMISSION_APPLICATIONS_PAGE_COPY.EMPTY_FILTERED_TITLE
              : ADMISSION_APPLICATIONS_PAGE_COPY.EMPTY_TITLE
          }
          errorDescription={error?.message}
          errorTitle={ADMISSION_APPLICATIONS_PAGE_COPY.ERROR_TITLE}
          isError={applicationsQuery.isError}
          isLoading={applicationsQuery.isLoading}
          onSearchChange={setSearchInput}
          searchPlaceholder={
            ADMISSION_APPLICATIONS_PAGE_COPY.SEARCH_PLACEHOLDER
          }
          searchValue={searchInput}
          showSearch={false}
          table={table}
          totalRows={applicationsQuery.data?.total ?? 0}
        />
      </EntityListPage>

      <Outlet />
    </>
  );
}
