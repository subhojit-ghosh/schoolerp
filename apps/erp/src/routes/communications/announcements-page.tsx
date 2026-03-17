import { useCallback, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import {
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconSearch,
  IconSend,
} from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  buildAnnouncementEditRoute,
} from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useAnnouncementsQuery,
  usePublishAnnouncementMutation,
  useSetAnnouncementStatusMutation,
} from "@/features/communications/api/use-communications";
import {
  ANNOUNCEMENTS_PAGE_COPY,
  ANNOUNCEMENT_LIST_SORT_FIELDS,
} from "@/features/communications/model/announcement-list.constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type AnnouncementRow = {
  id: string;
  title: string;
  summary?: string | null;
  audience: "all" | "staff" | "guardians" | "students";
  status: "draft" | "published" | "archived" | "deleted";
  publishedAt?: string | null;
  campusName?: string | null;
};

const columnHelper = createColumnHelper<AnnouncementRow>();
const VALID_ANNOUNCEMENT_SORT_FIELDS = [
  ANNOUNCEMENT_LIST_SORT_FIELDS.PUBLISHED_AT,
  ANNOUNCEMENT_LIST_SORT_FIELDS.STATUS,
  ANNOUNCEMENT_LIST_SORT_FIELDS.TITLE,
  ANNOUNCEMENT_LIST_SORT_FIELDS.AUDIENCE,
] as const;

function formatAudience(audience: AnnouncementRow["audience"]) {
  switch (audience) {
    case "guardians":
      return "Guardians";
    case "staff":
      return "Staff";
    case "students":
      return "Students";
    case "all":
    default:
      return "Everyone";
  }
}

export function AnnouncementsPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canReadAnnouncements = hasPermission(
    session,
    PERMISSIONS.COMMUNICATION_READ,
  );
  const canManageAnnouncements = hasPermission(
    session,
    PERMISSIONS.COMMUNICATION_MANAGE,
  );
  const publishAnnouncementMutation = usePublishAnnouncementMutation();
  const setAnnouncementStatusMutation = useSetAnnouncementStatusMutation();

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: ANNOUNCEMENT_LIST_SORT_FIELDS.PUBLISHED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_ANNOUNCEMENT_SORT_FIELDS,
  });

  const announcementsQuery = useAnnouncementsQuery(canReadAnnouncements, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const announcements = useMemo(
    () => (announcementsQuery.data?.rows ?? []) as AnnouncementRow[],
    [announcementsQuery.data?.rows],
  );

  const handlePublish = useCallback(
    async (announcementId: string) => {
      await publishAnnouncementMutation.mutateAsync({
        params: {
          path: {
            announcementId,
          },
        },
      });
      toast.success("Announcement published.");
    },
    [publishAnnouncementMutation],
  );

  const handleArchiveToggle = useCallback(
    async (announcement: AnnouncementRow) => {
      const status = announcement.status === "archived" ? "draft" : "archived";

      await setAnnouncementStatusMutation.mutateAsync({
        params: {
          path: {
            announcementId: announcement.id,
          },
        },
        body: {
          status,
        },
      });

      toast.success(
        status === "archived"
          ? "Announcement archived."
          : "Announcement moved back to draft.",
      );
    },
    [setAnnouncementStatusMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(ANNOUNCEMENT_LIST_SORT_FIELDS.TITLE)}
            type="button"
          >
            Announcement
            <SortIcon
              direction={
                queryState.sortBy === ANNOUNCEMENT_LIST_SORT_FIELDS.TITLE
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
                  buildAnnouncementEditRoute(row.original.id),
                  location.search,
                )}
              >
                {row.original.title}
              </Link>
            </Button>
            {row.original.summary ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {row.original.summary}
              </p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor("audience", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(ANNOUNCEMENT_LIST_SORT_FIELDS.AUDIENCE)}
            type="button"
          >
            Audience
            <SortIcon
              direction={
                queryState.sortBy === ANNOUNCEMENT_LIST_SORT_FIELDS.AUDIENCE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge variant="outline">{formatAudience(row.original.audience)}</Badge>
            <p className="text-xs text-muted-foreground">
              {row.original.campusName ?? "All campuses"}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(ANNOUNCEMENT_LIST_SORT_FIELDS.STATUS)}
            type="button"
          >
            Status
            <SortIcon
              direction={
                queryState.sortBy === ANNOUNCEMENT_LIST_SORT_FIELDS.STATUS
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

          if (row.original.status === "archived") {
            return <Badge variant="outline">Archived</Badge>;
          }

          return <Badge variant="secondary">Draft</Badge>;
        },
      }),
      columnHelper.accessor("publishedAt", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(ANNOUNCEMENT_LIST_SORT_FIELDS.PUBLISHED_AT)}
            type="button"
          >
            Published
            <SortIcon
              direction={
                queryState.sortBy === ANNOUNCEMENT_LIST_SORT_FIELDS.PUBLISHED_AT
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) =>
          row.original.publishedAt ? (
            <span className="text-sm text-muted-foreground">
              {new Intl.DateTimeFormat("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(row.original.publishedAt))}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Not published</span>
          ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const announcement = row.original;

          return (
            <div className="flex items-center justify-end gap-1">
              <EntityRowAction asChild>
                <Link
                  to={appendSearch(
                    buildAnnouncementEditRoute(announcement.id),
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
                <DropdownMenuContent align="end" className="w-48">
                  {announcement.status !== "published" ? (
                    <DropdownMenuItem
                      onSelect={() => void handlePublish(announcement.id)}
                    >
                      <IconSend className="mr-2 size-4" />
                      Publish
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    onSelect={() => void handleArchiveToggle(announcement)}
                  >
                    <IconPencil className="mr-2 size-4" />
                    {announcement.status === "archived"
                      ? "Move to draft"
                      : "Archive"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [
      handleArchiveToggle,
      handlePublish,
      location.search,
      queryState.sortBy,
      queryState.sortOrder,
      setSorting,
    ],
  );

  const table = useServerDataTable({
    columns,
    data: announcements,
    page: queryState.page,
    pageCount: announcementsQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: announcementsQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (announcementsQuery.error as Error | null | undefined)?.message;

  return (
    <EntityListPage
      title={ANNOUNCEMENTS_PAGE_COPY.TITLE}
      description={ANNOUNCEMENTS_PAGE_COPY.DESCRIPTION}
      actions={
        canManageAnnouncements ? (
          <EntityPagePrimaryAction asChild>
            <Link to={appendSearch(ERP_ROUTES.ANNOUNCEMENT_CREATE, location.search)}>
              <IconPlus className="size-4" />
              New announcement
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
              placeholder={ANNOUNCEMENTS_PAGE_COPY.SEARCH_PLACEHOLDER}
              value={searchInput}
            />
          </div>
        </div>
      }
    >
      <ServerDataTable
        emptyAction={
          !queryState.search && canManageAnnouncements ? (
            <EntityEmptyStateAction asChild>
              <Link
                to={appendSearch(ERP_ROUTES.ANNOUNCEMENT_CREATE, location.search)}
              >
                <IconPlus className="size-4" />
                New announcement
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? ANNOUNCEMENTS_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
            : ANNOUNCEMENTS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? ANNOUNCEMENTS_PAGE_COPY.EMPTY_FILTERED_TITLE
            : ANNOUNCEMENTS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle={ANNOUNCEMENTS_PAGE_COPY.ERROR_TITLE}
        isLoading={announcementsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={ANNOUNCEMENTS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={announcementsQuery.data?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
