import { useCallback, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import {
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconPower,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
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
import {
  buildSubjectEditRoute,
  ERP_ROUTES,
} from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useDeleteSubjectMutation,
  useSetSubjectStatusMutation,
  useSubjectsQuery,
} from "@/features/subjects/api/use-subjects";
import {
  SUBJECT_LIST_SORT_FIELDS,
  SUBJECTS_PAGE_COPY,
} from "@/features/subjects/model/subject-list.constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

type SubjectRow = {
  id: string;
  name: string;
  code?: string | null;
  status: "active" | "inactive" | "deleted";
};

const columnHelper = createColumnHelper<SubjectRow>();
const VALID_SUBJECT_SORT_FIELDS = [
  SUBJECT_LIST_SORT_FIELDS.NAME,
  SUBJECT_LIST_SORT_FIELDS.CODE,
  SUBJECT_LIST_SORT_FIELDS.STATUS,
] as const;

export function SubjectsPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageSubjects = isStaffContext(session);
  const canQuerySubjects = canManageSubjects && Boolean(institutionId);
  const setStatusMutation = useSetSubjectStatusMutation();
  const deleteMutation = useDeleteSubjectMutation();
  const [deleteTarget, setDeleteTarget] = useState<SubjectRow | null>(null);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: SUBJECT_LIST_SORT_FIELDS.NAME,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SUBJECT_SORT_FIELDS,
  });

  const subjectsQuery = useSubjectsQuery(canQuerySubjects, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const subjects = useMemo(
    () => (subjectsQuery.data?.rows ?? []) as SubjectRow[],
    [subjectsQuery.data?.rows],
  );

  const subjectsError = subjectsQuery.error as Error | null | undefined;
  const subjectsErrorMessage = subjectsError?.message;

  const handleToggleStatus = useCallback(
    async (subject: SubjectRow) => {
      if (!institutionId) {
        return;
      }

      const nextStatus = subject.status === "active" ? "inactive" : "active";

      await setStatusMutation.mutateAsync({
        params: {
          path: {
            subjectId: subject.id,
          },
        },
        body: {
          status: nextStatus,
        },
      });

      toast.success(
        nextStatus === "inactive"
          ? ERP_TOAST_MESSAGES.disabled(ERP_TOAST_SUBJECTS.SUBJECT)
          : ERP_TOAST_MESSAGES.enabled(ERP_TOAST_SUBJECTS.SUBJECT),
      );
    },
    [institutionId, setStatusMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(SUBJECT_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Subject
            <SortIcon
              direction={
                queryState.sortBy === SUBJECT_LIST_SORT_FIELDS.NAME
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <Button asChild className="h-auto px-0 text-left" variant="link">
            <Link
              to={appendSearch(
                buildSubjectEditRoute(row.original.id),
                location.search,
              )}
            >
              {row.original.name}
            </Link>
          </Button>
        ),
      }),
      columnHelper.accessor("code", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(SUBJECT_LIST_SORT_FIELDS.CODE)}
            type="button"
          >
            Code
            <SortIcon
              direction={
                queryState.sortBy === SUBJECT_LIST_SORT_FIELDS.CODE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue() || "—"}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(SUBJECT_LIST_SORT_FIELDS.STATUS)}
            type="button"
          >
            Status
            <SortIcon
              direction={
                queryState.sortBy === SUBJECT_LIST_SORT_FIELDS.STATUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) =>
          getValue() === "active" ? (
            <Badge variant="secondary" className="text-green-700 dark:text-green-400">
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Inactive
            </Badge>
          ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const subject = row.original;

          return (
            <div className="flex items-center justify-end gap-1">
              <EntityRowAction asChild>
                <Link
                  to={appendSearch(
                    buildSubjectEditRoute(subject.id),
                    location.search,
                  )}
                >
                  <IconPencil className="size-3" />
                  Edit
                </Link>
              </EntityRowAction>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="size-8 text-muted-foreground data-[state=open]:bg-muted"
                    size="icon"
                    variant="ghost"
                  >
                    <IconDotsVertical className="size-4" />
                    <span className="sr-only">Row actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onSelect={() => void handleToggleStatus(subject)}>
                    <IconPower className="mr-2 size-4" />
                    {subject.status === "active" ? "Disable" : "Enable"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteTarget(subject)}
                  >
                    <IconTrash className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [
      handleToggleStatus,
      location.search,
      queryState.sortBy,
      queryState.sortOrder,
      setSorting,
    ],
  );

  const table = useServerDataTable({
    data: subjects,
    columns,
    page: queryState.page,
    pageCount: subjectsQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: subjectsQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  async function handleDelete() {
    if (!institutionId || !deleteTarget) {
      return;
    }

    await deleteMutation.mutateAsync({
      params: {
        path: {
          subjectId: deleteTarget.id,
        },
      },
    });

    toast.success(ERP_TOAST_MESSAGES.archived(ERP_TOAST_SUBJECTS.SUBJECT));
    setDeleteTarget(null);
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{SUBJECTS_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage subject records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageSubjects) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{SUBJECTS_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Subject administration is available in Staff view. You are currently in{" "}
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
            <Link to={appendSearch(ERP_ROUTES.SUBJECT_CREATE, location.search)}>
              <IconPlus className="size-4" />
              New subject
            </Link>
          </EntityPagePrimaryAction>
        }
        description={SUBJECTS_PAGE_COPY.DESCRIPTION}
        title={SUBJECTS_PAGE_COPY.TITLE}
        toolbar={
          <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[280px] flex-1">
                <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-11 w-full max-w-md rounded-lg border-border/70 bg-background pl-10 shadow-none"
                  placeholder={SUBJECTS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                <Link to={appendSearch(ERP_ROUTES.SUBJECT_CREATE, location.search)}>
                  <IconPlus className="size-4" />
                  New subject
                </Link>
              </EntityEmptyStateAction>
            ) : null
          }
          emptyDescription={
            isFiltered
              ? SUBJECTS_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
              : SUBJECTS_PAGE_COPY.EMPTY_DESCRIPTION
          }
          emptyTitle={
            isFiltered
              ? SUBJECTS_PAGE_COPY.EMPTY_FILTERED_TITLE
              : SUBJECTS_PAGE_COPY.EMPTY_TITLE
          }
          errorDescription={subjectsErrorMessage}
          errorTitle={SUBJECTS_PAGE_COPY.ERROR_TITLE}
          isError={subjectsQuery.isError}
          isLoading={subjectsQuery.isLoading}
          onSearchChange={setSearchInput}
          rowCellClassName={(row) =>
            row.status === "active" ? undefined : "opacity-60"
          }
          searchPlaceholder={SUBJECTS_PAGE_COPY.SEARCH_PLACEHOLDER}
          searchValue={searchInput}
          showSearch={false}
          table={table}
          totalRows={subjectsQuery.data?.total ?? 0}
        />
        <Outlet />
      </EntityListPage>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={`Delete "${deleteTarget?.name ?? "subject"}"`}
        description="This permanently removes the subject record after confirming no active timetable entries still depend on it."
        confirmLabel="Delete subject"
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
