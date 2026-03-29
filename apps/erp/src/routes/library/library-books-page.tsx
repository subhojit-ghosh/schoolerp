import { useCallback, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  IconBook,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { useDocumentTitle } from "@/hooks/use-document-title";
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
import { StatusBadge } from "@/components/data-display/status-badge";
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES, buildLibraryBookEditRoute } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useLibraryBooksQuery,
  useUpdateBookMutation,
} from "@/features/library/api/use-library";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";

type BookRow = {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  genre: string | null;
  totalCopies: number;
  availableCopies: number;
  status: "active" | "inactive";
  createdAt: string;
};

const columnHelper = createColumnHelper<BookRow>();
const VALID_SORT_FIELDS = [
  "title",
  "author",
  "createdAt",
  "availableCopies",
] as const;

export function LibraryBooksPage() {
  useDocumentTitle("Library Books");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.LIBRARY_READ);
  const canManage = hasPermission(session, PERMISSIONS.LIBRARY_MANAGE);

  const updateMutation = useUpdateBookMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: "createdAt",
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_SORT_FIELDS,
  });

  const booksQuery = useLibraryBooksQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy as LibraryBooksQuery["sort"],
  });

  const books = useMemo(
    () => (booksQuery.data?.rows ?? []) as BookRow[],
    [booksQuery.data?.rows],
  );

  const handleToggleStatus = useCallback(
    async (book: BookRow) => {
      const newStatus = book.status === "active" ? "inactive" : "active";
      try {
        await updateMutation.mutateAsync({
          params: { path: { bookId: book.id } },
          body: { status: newStatus },
        });
        toast.success(
          newStatus === "active" ? "Book activated." : "Book deactivated.",
        );
      } catch (error) {
        toast.error(
          extractApiError(
            error,
            "Could not update book status. Please try again.",
          ),
        );
      }
    },
    [updateMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("title")}
            type="button"
          >
            Book
            <SortIcon
              direction={
                queryState.sortBy === "title" ? queryState.sortOrder : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium">{row.original.title}</p>
            {row.original.author ? (
              <p className="text-xs text-muted-foreground">
                {row.original.author}
              </p>
            ) : null}
            {row.original.isbn ? (
              <p className="text-xs text-muted-foreground">
                ISBN: {row.original.isbn}
              </p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor("genre", {
        header: "Genre",
        cell: ({ row }) =>
          row.original.genre ? (
            <Badge variant="outline">{row.original.genre}</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      }),
      columnHelper.accessor("availableCopies", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting("availableCopies")}
            type="button"
          >
            Copies
            <SortIcon
              direction={
                queryState.sortBy === "availableCopies"
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            <span
              className={
                row.original.availableCopies === 0
                  ? "text-destructive font-medium"
                  : "text-foreground"
              }
            >
              {row.original.availableCopies}
            </span>
            <span className="text-muted-foreground">
              {" "}
              / {row.original.totalCopies}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <EntityRowAction aria-label="Actions">
                  <IconDotsVertical className="size-4" />
                </EntityRowAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    to={appendSearch(
                      buildLibraryBookEditRoute(row.original.id),
                      location.search,
                    )}
                  >
                    <IconPencil className="size-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void handleToggleStatus(row.original)}
                >
                  {row.original.status === "active" ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null,
      }),
    ],
    [
      canManage,
      handleToggleStatus,
      location.search,
      queryState.sortBy,
      queryState.sortOrder,
      setSorting,
    ],
  );

  const table = useServerDataTable({
    columns,
    data: books,
    page: queryState.page,
    pageCount: booksQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: booksQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (booksQuery.error as Error | null | undefined)?.message;

  return (
    <>
      <EntityListPage
        title="Library Books"
        description="Manage the library book catalog."
        actions={
          canManage ? (
            <EntityPagePrimaryAction asChild>
              <Link
                to={appendSearch(
                  ERP_ROUTES.LIBRARY_BOOKS_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New book
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
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, author, ISBN..."
                value={searchInput}
              />
            </div>
          </div>
        }
      >
        <ServerDataTable
          emptyAction={
            !queryState.search && canManage ? (
              <EntityEmptyStateAction asChild>
                <Link
                  to={appendSearch(
                    ERP_ROUTES.LIBRARY_BOOKS_CREATE,
                    location.search,
                  )}
                >
                  <IconBook className="size-5" />
                  New book
                </Link>
              </EntityEmptyStateAction>
            ) : undefined
          }
          emptyDescription={
            queryState.search
              ? "No books match your search."
              : "Add books to the library catalog."
          }
          emptyTitle={
            queryState.search ? "No books found" : "No books in catalog"
          }
          errorTitle="Failed to load books"
          isLoading={booksQuery.isLoading}
          isError={Boolean(errorMessage)}
          errorDescription={errorMessage}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search by title, author, ISBN..."
          searchValue={searchInput}
          table={table}
          totalRows={booksQuery.data?.total ?? 0}
          showSearch={false}
        />
        <Outlet />
      </EntityListPage>
    </>
  );
}

type LibraryBooksQuery = {
  sort?: "title" | "author" | "createdAt" | "availableCopies";
};
