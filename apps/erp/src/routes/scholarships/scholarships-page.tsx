import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Input } from "@repo/ui/components/ui/input";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  EntityEmptyStateAction,
  EntityPagePrimaryAction,
} from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useScholarshipsQuery } from "@/features/scholarships/api/use-scholarships";
import {
  SCHOLARSHIP_LIST_SORT_FIELDS,
  SCHOLARSHIPS_PAGE_COPY,
  SCHOLARSHIP_TYPE_LABELS,
} from "@/features/scholarships/model/scholarship-constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";

type ScholarshipRow = {
  id: string;
  name: string;
  scholarshipType: string;
  amountInPaise: number | null;
  maxRecipients: number | null;
  status: string;
  createdAt: string;
};

const columnHelper = createColumnHelper<ScholarshipRow>();
const VALID_SORT_FIELDS = [
  SCHOLARSHIP_LIST_SORT_FIELDS.NAME,
  SCHOLARSHIP_LIST_SORT_FIELDS.CREATED_AT,
] as const;

export function ScholarshipsPage() {
  useDocumentTitle("Scholarships");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.SCHOLARSHIPS_READ);
  const canManage = hasPermission(session, PERMISSIONS.SCHOLARSHIPS_MANAGE);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: SCHOLARSHIP_LIST_SORT_FIELDS.NAME,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const scholarshipsQuery = useScholarshipsQuery(canRead, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const scholarshipsData = scholarshipsQuery.data;
  const scholarships = useMemo(
    () => (scholarshipsData?.rows ?? []) as ScholarshipRow[],
    [scholarshipsData?.rows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(SCHOLARSHIP_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Name
            <SortIcon
              direction={
                queryState.sortBy === SCHOLARSHIP_LIST_SORT_FIELDS.NAME
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.name}</span>
        ),
      }),
      columnHelper.accessor("scholarshipType", {
        header: "Type",
        cell: ({ row }) => (
          <span className="text-sm">
            {SCHOLARSHIP_TYPE_LABELS[row.original.scholarshipType] ??
              row.original.scholarshipType}
          </span>
        ),
      }),
      columnHelper.accessor("amountInPaise", {
        header: "Amount",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.amountInPaise != null
              ? new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(row.original.amountInPaise / 100)
              : "-"}
          </span>
        ),
      }),
      columnHelper.accessor("maxRecipients", {
        header: "Max Recipients",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.maxRecipients ?? "Unlimited"}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      }),
    ],
    [queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: scholarships,
    page: queryState.page,
    pageCount: scholarshipsData?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: scholarshipsData?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const errorMessage = (scholarshipsQuery.error as Error | null | undefined)
    ?.message;

  return (
    <EntityListPage
      title={SCHOLARSHIPS_PAGE_COPY.TITLE}
      description={SCHOLARSHIPS_PAGE_COPY.DESCRIPTION}
      actions={
        canManage ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(ERP_ROUTES.SCHOLARSHIP_CREATE, location.search)}
            >
              <IconPlus className="size-4" />
              New scholarship
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
              placeholder={SCHOLARSHIPS_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                  ERP_ROUTES.SCHOLARSHIP_CREATE,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New scholarship
              </Link>
            </EntityEmptyStateAction>
          ) : undefined
        }
        emptyDescription={
          queryState.search
            ? "No scholarships match your search."
            : SCHOLARSHIPS_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          queryState.search
            ? "No matching scholarships"
            : SCHOLARSHIPS_PAGE_COPY.EMPTY_TITLE
        }
        errorTitle="Failed to load scholarships"
        isLoading={scholarshipsQuery.isLoading}
        isError={Boolean(errorMessage)}
        errorDescription={errorMessage}
        onSearchChange={setSearchInput}
        searchPlaceholder={SCHOLARSHIPS_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        table={table}
        totalRows={scholarshipsData?.total ?? 0}
        showSearch={false}
      />
      <Outlet />
    </EntityListPage>
  );
}
