import { useCallback, useMemo, useState } from "react";
import { PERMISSIONS } from "@repo/contracts";
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
import { buildClassEditRoute, ERP_ROUTES } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import {
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useClassesQuery,
  useDeleteClassMutation,
  useSetClassStatusMutation,
} from "@/features/classes/api/use-classes";
import {
  CLASS_LIST_SORT_FIELDS,
  CLASSES_PAGE_COPY,
} from "@/features/classes/model/class-list.constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

type ClassRow = {
  id: string;
  name: string;
  status: "active" | "inactive" | "deleted";
  campusName: string;
  sections: Array<{ id: string; name: string; displayOrder: number }>;
};

const columnHelper = createColumnHelper<ClassRow>();
const VALID_CLASS_SORT_FIELDS = [
  CLASS_LIST_SORT_FIELDS.NAME,
  CLASS_LIST_SORT_FIELDS.STATUS,
  CLASS_LIST_SORT_FIELDS.CAMPUS,
] as const;

export function ClassesPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const canQueryClasses =
    isStaffContext(session) &&
    hasPermission(session, PERMISSIONS.ACADEMICS_READ) &&
    Boolean(institutionId);
  const setStatusMutation = useSetClassStatusMutation();
  const deleteMutation = useDeleteClassMutation();
  const [deleteTarget, setDeleteTarget] = useState<ClassRow | null>(null);
  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: CLASS_LIST_SORT_FIELDS.NAME,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_CLASS_SORT_FIELDS,
  });

  const classesQuery = useClassesQuery(canQueryClasses, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const classes = useMemo(
    () => (classesQuery.data?.rows ?? []) as ClassRow[],
    [classesQuery.data?.rows],
  );
  const classesError = classesQuery.error as Error | null | undefined;
  const classesErrorMessage = classesError?.message;

  const handleToggleStatus = useCallback(
    async (schoolClass: ClassRow) => {
      if (!institutionId) {
        return;
      }

      const nextStatus =
        schoolClass.status === "active" ? "inactive" : "active";

      await setStatusMutation.mutateAsync({
        params: { path: { classId: schoolClass.id } },
        body: { status: nextStatus },
      });

      toast.success(
        nextStatus === "inactive"
          ? ERP_TOAST_MESSAGES.disabled(ERP_TOAST_SUBJECTS.CLASS)
          : ERP_TOAST_MESSAGES.enabled(ERP_TOAST_SUBJECTS.CLASS),
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
            onClick={() => setSorting(CLASS_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Class
            <SortIcon
              direction={
                queryState.sortBy === CLASS_LIST_SORT_FIELDS.NAME
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
                buildClassEditRoute(row.original.id),
                location.search,
              )}
            >
              {row.original.name}
            </Link>
          </Button>
        ),
      }),
      columnHelper.accessor("campusName", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(CLASS_LIST_SORT_FIELDS.CAMPUS)}
            type="button"
          >
            Campus
            <SortIcon
              direction={
                queryState.sortBy === CLASS_LIST_SORT_FIELDS.CAMPUS
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
            onClick={() => setSorting(CLASS_LIST_SORT_FIELDS.STATUS)}
            type="button"
          >
            Status
            <SortIcon
              direction={
                queryState.sortBy === CLASS_LIST_SORT_FIELDS.STATUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) =>
          getValue() === "active" ? (
            <Badge
              variant="secondary"
              className="text-green-700 dark:text-green-400"
            >
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Inactive
            </Badge>
          ),
      }),
      columnHelper.accessor("sections", {
        header: "Sections",
        cell: ({ getValue }) => {
          const sections = getValue();

          if (sections.length === 0) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }

          return (
            <div className="flex flex-wrap gap-1">
              {sections.map((section) => (
                <Badge key={section.id} variant="outline">
                  {section.name}
                </Badge>
              ))}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const schoolClass = row.original;

          return (
            <div className="flex items-center justify-end gap-1">
              <EntityRowAction asChild>
                <Link
                  to={appendSearch(
                    buildClassEditRoute(schoolClass.id),
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
                  <DropdownMenuItem
                    onSelect={() => void handleToggleStatus(schoolClass)}
                  >
                    <IconPower className="mr-2 size-4" />
                    {schoolClass.status === "active" ? "Disable" : "Enable"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteTarget(schoolClass)}
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
    data: classes,
    columns,
    page: queryState.page,
    pageCount: classesQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: classesQuery.data?.total ?? 0,
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
      params: { path: { classId: deleteTarget.id } },
    });

    toast.success(ERP_TOAST_MESSAGES.archived(ERP_TOAST_SUBJECTS.CLASS));
    setDeleteTarget(null);
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{CLASSES_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage class records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canQueryClasses) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{CLASSES_PAGE_COPY.TITLE}</CardTitle>
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
            <Link to={appendSearch(ERP_ROUTES.CLASS_CREATE, location.search)}>
              <IconPlus className="size-4" />
              New class
            </Link>
          </EntityPagePrimaryAction>
        }
        description={CLASSES_PAGE_COPY.DESCRIPTION}
        title={CLASSES_PAGE_COPY.TITLE}
        toolbar={
          <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[280px] flex-1">
                <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-11 w-full max-w-md rounded-lg border-border/70 bg-background pl-10 shadow-none"
                  placeholder={CLASSES_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  to={appendSearch(ERP_ROUTES.CLASS_CREATE, location.search)}
                >
                  <IconPlus className="size-4" />
                  New class
                </Link>
              </EntityEmptyStateAction>
            ) : null
          }
          emptyDescription={
            isFiltered
              ? CLASSES_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
              : CLASSES_PAGE_COPY.EMPTY_DESCRIPTION
          }
          emptyTitle={
            isFiltered
              ? CLASSES_PAGE_COPY.EMPTY_FILTERED_TITLE
              : CLASSES_PAGE_COPY.EMPTY_TITLE
          }
          errorDescription={classesErrorMessage}
          errorTitle={CLASSES_PAGE_COPY.ERROR_TITLE}
          isError={classesQuery.isError}
          isLoading={classesQuery.isLoading}
          onSearchChange={setSearchInput}
          rowCellClassName={(row) =>
            row.status === "active" ? undefined : "opacity-60"
          }
          searchPlaceholder={CLASSES_PAGE_COPY.SEARCH_PLACEHOLDER}
          searchValue={searchInput}
          showSearch={false}
          table={table}
          totalRows={classesQuery.data?.total ?? 0}
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
        title={`Delete "${deleteTarget?.name ?? "class"}"`}
        description="This permanently removes the class record after confirming no active students or current enrollments still depend on it."
        confirmLabel="Delete class"
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
