import { useMemo } from "react";
import { PERMISSIONS } from "@repo/contracts";
import { Link, Outlet, useLocation } from "react-router";
import { IconPencil, IconPlus, IconSearch } from "@tabler/icons-react";
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
import { buildAdmissionEnquiryEditRoute, ERP_ROUTES } from "@/constants/routes";
import { useAdmissionEnquiriesQuery } from "@/features/admissions/api/use-admissions";
import {
  ADMISSION_ENQUIRIES_PAGE_COPY,
  ADMISSION_ENQUIRY_LIST_SORT_FIELDS,
} from "@/features/admissions/model/admission-list.constants";
import {
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type AdmissionEnquiryRow = {
  id: string;
  studentName: string;
  guardianName: string;
  mobile: string;
  campusName: string;
  status: string;
  createdAt: string;
};

const columnHelper = createColumnHelper<AdmissionEnquiryRow>();
const VALID_SORT_FIELDS = [
  ADMISSION_ENQUIRY_LIST_SORT_FIELDS.CAMPUS,
  ADMISSION_ENQUIRY_LIST_SORT_FIELDS.CREATED_AT,
  ADMISSION_ENQUIRY_LIST_SORT_FIELDS.STATUS,
  ADMISSION_ENQUIRY_LIST_SORT_FIELDS.STUDENT_NAME,
] as const;

function toTitleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdmissionEnquiriesPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const managedInstitutionId =
    isStaffContext(session) &&
    hasPermission(session, PERMISSIONS.ADMISSIONS_READ)
      ? institutionId
      : undefined;
  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: ADMISSION_ENQUIRY_LIST_SORT_FIELDS.CREATED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const enquiriesQuery = useAdmissionEnquiriesQuery(managedInstitutionId, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const rows = useMemo(
    () => (enquiriesQuery.data?.rows ?? []) as AdmissionEnquiryRow[],
    [enquiriesQuery.data?.rows],
  );
  const error = enquiriesQuery.error as Error | null | undefined;

  const columns = useMemo(
    () => [
      columnHelper.accessor("studentName", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(ADMISSION_ENQUIRY_LIST_SORT_FIELDS.STUDENT_NAME)
            }
            type="button"
          >
            Student
            <SortIcon
              direction={
                queryState.sortBy ===
                ADMISSION_ENQUIRY_LIST_SORT_FIELDS.STUDENT_NAME
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium">{row.original.studentName}</p>
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
              setSorting(ADMISSION_ENQUIRY_LIST_SORT_FIELDS.CAMPUS)
            }
            type="button"
          >
            Campus
            <SortIcon
              direction={
                queryState.sortBy === ADMISSION_ENQUIRY_LIST_SORT_FIELDS.CAMPUS
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
            onClick={() =>
              setSorting(ADMISSION_ENQUIRY_LIST_SORT_FIELDS.STATUS)
            }
            type="button"
          >
            Status
            <SortIcon
              direction={
                queryState.sortBy === ADMISSION_ENQUIRY_LIST_SORT_FIELDS.STATUS
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
          <div className="flex justify-end">
            <EntityRowAction asChild>
              <Link
                to={appendSearch(
                  buildAdmissionEnquiryEditRoute(row.original.id),
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
    pageCount: enquiriesQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: enquiriesQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{ADMISSION_ENQUIRIES_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage admission
            enquiries.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!managedInstitutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{ADMISSION_ENQUIRIES_PAGE_COPY.TITLE}</CardTitle>
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
                ERP_ROUTES.ADMISSIONS_ENQUIRY_CREATE,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New admission enquiry
            </Link>
          </EntityPagePrimaryAction>
        }
        description={ADMISSION_ENQUIRIES_PAGE_COPY.DESCRIPTION}
        title={ADMISSION_ENQUIRIES_PAGE_COPY.TITLE}
        toolbar={
          <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[280px] flex-1">
                <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-11 w-full max-w-md rounded-lg border-border/70 bg-background pl-10 shadow-none"
                  placeholder={ADMISSION_ENQUIRIES_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                    ERP_ROUTES.ADMISSIONS_ENQUIRY_CREATE,
                    location.search,
                  )}
                >
                  <IconPlus className="size-4" />
                  New admission enquiry
                </Link>
              </EntityEmptyStateAction>
            ) : undefined
          }
          emptyDescription={
            isFiltered
              ? ADMISSION_ENQUIRIES_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
              : ADMISSION_ENQUIRIES_PAGE_COPY.EMPTY_DESCRIPTION
          }
          emptyTitle={
            isFiltered
              ? ADMISSION_ENQUIRIES_PAGE_COPY.EMPTY_FILTERED_TITLE
              : ADMISSION_ENQUIRIES_PAGE_COPY.EMPTY_TITLE
          }
          errorDescription={error?.message}
          errorTitle={ADMISSION_ENQUIRIES_PAGE_COPY.ERROR_TITLE}
          isError={enquiriesQuery.isError}
          isLoading={enquiriesQuery.isLoading}
          onSearchChange={setSearchInput}
          searchPlaceholder={ADMISSION_ENQUIRIES_PAGE_COPY.SEARCH_PLACEHOLDER}
          searchValue={searchInput}
          showSearch={false}
          table={table}
          totalRows={enquiriesQuery.data?.total ?? 0}
        />
      </EntityListPage>

      <Outlet />
    </>
  );
}
