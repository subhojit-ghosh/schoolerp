import { useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { IconArrowRight, IconPlus, IconSearch } from "@tabler/icons-react";
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
import { SORT_ORDERS } from "@/constants/query";
import { buildStudentDetailRoute, ERP_ROUTES } from "@/constants/routes";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useStudentsQuery } from "@/features/students/api/use-students";
import {
  STUDENT_LIST_SORT_FIELDS,
  STUDENTS_PAGE_COPY,
} from "@/features/students/model/student-list.constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

const ERROR_BOUNDARY_PREVIEW_PARAM = "previewErrorBoundary";
const ERROR_BOUNDARY_PREVIEW_VALUE = "1";
const ERROR_BOUNDARY_PREVIEW_MESSAGE =
  "Intentional crash to preview the ERP error boundary.";

type StudentRow = {
  admissionNumber: string;
  campusName: string;
  className: string;
  currentEnrollment: {
    academicYearId: string;
    academicYearName: string;
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
  } | null;
  fullName: string;
  guardians: Array<{ membershipId: string }>;
  id: string;
  sectionName: string;
  status: string;
};

const columnHelper = createColumnHelper<StudentRow>();
const VALID_SORT_FIELDS = [
  STUDENT_LIST_SORT_FIELDS.ADMISSION_NUMBER,
  STUDENT_LIST_SORT_FIELDS.CAMPUS,
  STUDENT_LIST_SORT_FIELDS.NAME,
] as const;

export function StudentsPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const authSession = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(authSession);
  const institutionId = authSession?.activeOrganization?.id;
  const canManageStudents = isStaffContext(authSession);
  const managedInstitutionId = canManageStudents ? institutionId : undefined;
  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: STUDENT_LIST_SORT_FIELDS.NAME,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const studentsQuery = useStudentsQuery(managedInstitutionId, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const rows = useMemo(
    () => (studentsQuery.data?.rows ?? []) as StudentRow[],
    [studentsQuery.data?.rows],
  );
  const error = studentsQuery.error as Error | null | undefined;

  const columns = useMemo(
    () => [
      columnHelper.accessor("fullName", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(STUDENT_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Student
            <SortIcon
              direction={
                queryState.sortBy === STUDENT_LIST_SORT_FIELDS.NAME
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
                  buildStudentDetailRoute(row.original.id),
                  location.search,
                )}
              >
                {row.original.fullName}
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Admission {row.original.admissionNumber}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("campusName", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(STUDENT_LIST_SORT_FIELDS.CAMPUS)}
            type="button"
          >
            Campus
            <SortIcon
              direction={
                queryState.sortBy === STUDENT_LIST_SORT_FIELDS.CAMPUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
      }),
      columnHelper.accessor("admissionNumber", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() =>
              setSorting(STUDENT_LIST_SORT_FIELDS.ADMISSION_NUMBER)
            }
            type="button"
          >
            Admission
            <SortIcon
              direction={
                queryState.sortBy === STUDENT_LIST_SORT_FIELDS.ADMISSION_NUMBER
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
      }),
      columnHelper.accessor("className", {
        header: "Class",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.className} {row.original.sectionName}
          </span>
        ),
      }),
      columnHelper.accessor("guardians", {
        header: "Guardians",
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getValue().length} linked
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
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
                  buildStudentDetailRoute(row.original.id),
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

  const table = useServerDataTable({
    columns,
    data: rows,
    page: queryState.page,
    pageCount: studentsQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: studentsQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  if (
    searchParams.get(ERROR_BOUNDARY_PREVIEW_PARAM) ===
    ERROR_BOUNDARY_PREVIEW_VALUE
  ) {
    throw new Error(ERROR_BOUNDARY_PREVIEW_MESSAGE);
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{STUDENTS_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session before managing student
            records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageStudents) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{STUDENTS_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Student management is available in Staff view. You are currently in{" "}
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
          <Link to={appendSearch(ERP_ROUTES.STUDENT_CREATE, location.search)}>
            <IconPlus className="size-4" />
            New student
          </Link>
        </EntityPagePrimaryAction>
      }
      description={STUDENTS_PAGE_COPY.DESCRIPTION}
      title={STUDENTS_PAGE_COPY.TITLE}
      toolbar={
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] flex-1">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 w-full max-w-md rounded-lg border-border/70 bg-background pl-10 shadow-none"
                placeholder={STUDENTS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                to={appendSearch(ERP_ROUTES.STUDENT_CREATE, location.search)}
              >
                <IconPlus className="size-4" />
                New student
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          isFiltered
            ? STUDENTS_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
            : STUDENTS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          isFiltered
            ? STUDENTS_PAGE_COPY.EMPTY_FILTERED_TITLE
            : STUDENTS_PAGE_COPY.EMPTY_TITLE
        }
        errorDescription={error?.message}
        errorTitle={STUDENTS_PAGE_COPY.ERROR_TITLE}
        isError={studentsQuery.isError}
        isLoading={studentsQuery.isLoading}
        onSearchChange={setSearchInput}
        searchPlaceholder={STUDENTS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        showSearch={false}
        table={table}
        totalRows={studentsQuery.data?.total ?? 0}
      />
    </EntityListPage>
  );
}
