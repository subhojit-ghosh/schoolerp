import { useCallback, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import {
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconSearch,
  IconSend,
  IconTrash,
} from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
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
import { PERMISSIONS } from "@repo/contracts";
import {
  ERP_ROUTES,
  buildHomeworkEditRoute,
} from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useHomeworkQuery,
  usePublishHomeworkMutation,
  useDeleteHomeworkMutation,
} from "@/features/homework/api/use-homework";
import {
  HOMEWORK_PAGE_COPY,
  HOMEWORK_LIST_SORT_FIELDS,
} from "@/features/homework/model/homework-list.constants";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";

type HomeworkRow = {
  id: string;
  title: string;
  className: string;
  sectionName: string;
  subjectName: string;
  dueDate: string;
  status: "draft" | "published";
  publishedAt?: string | null;
};

const columnHelper = createColumnHelper<HomeworkRow>();
const VALID_HOMEWORK_SORT_FIELDS = [
  HOMEWORK_LIST_SORT_FIELDS.DUE_DATE,
  HOMEWORK_LIST_SORT_FIELDS.TITLE,
  HOMEWORK_LIST_SORT_FIELDS.STATUS,
  HOMEWORK_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function HomeworkPage() {
  useDocumentTitle("Homework");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canReadHomework = hasPermission(session, PERMISSIONS.HOMEWORK_READ);
  const canManageHomework = hasPermission(session, PERMISSIONS.HOMEWORK_MANAGE);

  const publishMutation = usePublishHomeworkMutation();
  const deleteMutation = useDeleteHomeworkMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: HOMEWORK_LIST_SORT_FIELDS.DUE_DATE,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_HOMEWORK_SORT_FIELDS,
  });

  const homeworkQuery = useHomeworkQuery(canReadHomework, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const homeworkList = useMemo(
    () => (homeworkQuery.data?.rows ?? []) as HomeworkRow[],
    [homeworkQuery.data?.rows],
  );

  const handlePublish = useCallback(
    async (homeworkId: string) => {
      try {
        await publishMutation.mutateAsync({
          params: { path: { homeworkId } },
        });
        toast.success("Homework published.");
      } catch (error) {
        toast.error(
          extractApiError(error, "Could not publish homework. Please try again."),
        );
      }
    },
    [publishMutation],
  );

  const handleDelete = useCallback(
    async (homeworkId: string) => {
      try {
        await deleteMutation.mutateAsync({
          params: { path: { homeworkId } },
        });
        toast.success("Homework deleted.");
      } catch (error) {
        toast.error(
          extractApiError(error, "Could not delete homework. Please try again."),
        );
      }
    },
    [deleteMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(HOMEWORK_LIST_SORT_FIELDS.TITLE)}
            type="button"
          >
            Title
            <SortIcon
              direction={
                queryState.sortBy === HOMEWORK_LIST_SORT_FIELDS.TITLE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
            <Button asChild className="h-auto px-0 text-left" variant="link">
              <Link
                to={appendSearch(
                  buildHomeworkEditRoute(row.original.id),
                  location.search,
                )}
              >
                {row.original.title}
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              {row.original.className} · {row.original.sectionName}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("subjectName", {
        header: "Subject",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.subjectName}</span>
        ),
      }),
      columnHelper.accessor("dueDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(HOMEWORK_LIST_SORT_FIELDS.DUE_DATE)}
            type="button"
          >
            Due date
            <SortIcon
              direction={
                queryState.sortBy === HOMEWORK_LIST_SORT_FIELDS.DUE_DATE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat("en-IN", {
              dateStyle: "medium",
            }).format(new Date(row.original.dueDate))}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(HOMEWORK_LIST_SORT_FIELDS.STATUS)}
            type="button"
          >
            Status
            <SortIcon
              direction={
                queryState.sortBy === HOMEWORK_LIST_SORT_FIELDS.STATUS
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => {
          if (row.original.status === "published") {
            return <Badge>Published</Badge>;
          }
          return <Badge variant="secondary">Draft</Badge>;
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const homework = row.original;

          return (
            <div className="flex items-center justify-end gap-1">
              <EntityRowAction asChild>
                <Link
                  to={appendSearch(
                    buildHomeworkEditRoute(homework.id),
                    location.search,
                  )}
                >
                  <IconPencil className="size-3" />
                  Edit
                </Link>
              </EntityRowAction>
              {canManageHomework ? (
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
                  <DropdownMenuContent align="end" className="w-48">
                    {homework.status !== "published" ? (
                      <DropdownMenuItem
                        onSelect={() => void handlePublish(homework.id)}
                      >
                        <IconSend className="mr-2 size-4" />
                        Publish
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => void handleDelete(homework.id)}
                    >
                      <IconTrash className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          );
        },
      }),
    ],
    [
      canManageHomework,
      handleDelete,
      handlePublish,
      location.search,
      queryState.sortBy,
      queryState.sortOrder,
      setSorting,
    ],
  );

  const table = useServerDataTable({
    columns,
    data: homeworkList,
    page: queryState.page,
    pageCount: homeworkQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: homeworkQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (homeworkQuery.error as Error | null | undefined)
    ?.message;

  return (
    <EntityListPage
      title={HOMEWORK_PAGE_COPY.TITLE}
      description={HOMEWORK_PAGE_COPY.DESCRIPTION}
      actions={
        canManageHomework ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(ERP_ROUTES.HOMEWORK_CREATE, location.search)}
            >
              <IconPlus className="size-4" />
              New homework
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
              placeholder={HOMEWORK_PAGE_COPY.SEARCH_PLACEHOLDER}
              value={searchInput}
            />
          </div>
        </div>
      }
    >
      <ServerDataTable
        emptyAction={
          !queryState.search && canManageHomework ? (
            <EntityEmptyStateAction asChild>
              <Link
                to={appendSearch(ERP_ROUTES.HOMEWORK_CREATE, location.search)}
              >
                <IconPlus className="size-4" />
                New homework
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? HOMEWORK_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
            : HOMEWORK_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? HOMEWORK_PAGE_COPY.EMPTY_FILTERED_TITLE
            : HOMEWORK_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle={HOMEWORK_PAGE_COPY.ERROR_TITLE}
        isLoading={homeworkQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={HOMEWORK_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={homeworkQuery.data?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
