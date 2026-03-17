import { useMemo } from "react";
import { parseAsString, useQueryStates } from "nuqs";
import { IconSearch } from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { PERMISSIONS } from "@repo/contracts";
import {
  ServerDataTable,
  SortIcon,
} from "@/components/data-display/server-data-table";
import { EntityListPage } from "@/components/entities/entity-list-page";
import { SORT_ORDERS } from "@/constants/query";
import {
  getActiveContext,
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useAuditLogsQuery } from "@/features/audit/api/use-audit";
import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_ENTITY_OPTIONS,
  AUDIT_FILTER_QUERY_PARAMS,
  AUDIT_LIST_SORT_FIELDS,
  AUDIT_PAGE_COPY,
  formatAuditActionLabel,
  formatAuditEntityLabel,
} from "@/features/audit/model/audit-list.constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";

type AuditActionFilter =
  | "create"
  | "update"
  | "delete"
  | "mark"
  | "replace"
  | "reverse"
  | "execute";
type AuditEntityFilter =
  | "role"
  | "attendance_day"
  | "exam_marks"
  | "fee_payment"
  | "student_rollover";

type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityLabel?: string | null;
  summary: string;
  createdAt: string;
  actor: {
    userId: string;
    name: string;
    mobile: string;
    campusId?: string | null;
    contextKey?: string | null;
  };
};

const columnHelper = createColumnHelper<AuditRow>();
const VALID_AUDIT_SORT_FIELDS = [
  AUDIT_LIST_SORT_FIELDS.CREATED_AT,
  AUDIT_LIST_SORT_FIELDS.ACTION,
  AUDIT_LIST_SORT_FIELDS.ENTITY_TYPE,
  AUDIT_LIST_SORT_FIELDS.ACTOR,
] as const;

function formatAuditTimestamp(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getActionBadgeVariant(action: string) {
  if (action === "delete" || action === "reverse") {
    return "destructive" as const;
  }

  if (action === "create" || action === "execute") {
    return "default" as const;
  }

  return "outline" as const;
}

export function AuditPage() {
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canReadAudit =
    isStaffContext(session) && hasPermission(session, PERMISSIONS.AUDIT_READ);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: AUDIT_LIST_SORT_FIELDS.CREATED_AT,
    defaultSortOrder: SORT_ORDERS.DESC,
    validSorts: VALID_AUDIT_SORT_FIELDS,
  });

  const [filters, setFilters] = useQueryStates({
    [AUDIT_FILTER_QUERY_PARAMS.ACTION]: parseAsString.withDefault("all"),
    [AUDIT_FILTER_QUERY_PARAMS.ENTITY_TYPE]: parseAsString.withDefault("all"),
  });

  const auditQuery = useAuditLogsQuery(Boolean(institutionId) && canReadAudit, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
    action:
      filters.action === "all"
        ? undefined
        : (filters.action as AuditActionFilter),
    entityType:
      filters.entityType === "all"
        ? undefined
        : (filters.entityType as AuditEntityFilter),
  });

  const rows = useMemo(
    () => (auditQuery.data?.rows ?? []) as AuditRow[],
    [auditQuery.data?.rows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("createdAt", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(AUDIT_LIST_SORT_FIELDS.CREATED_AT)}
            type="button"
          >
            Time
            <SortIcon
              direction={
                queryState.sortBy === AUDIT_LIST_SORT_FIELDS.CREATED_AT
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => (
          <div className="min-w-[150px] text-sm text-muted-foreground">
            {formatAuditTimestamp(getValue())}
          </div>
        ),
      }),
      columnHelper.accessor("summary", {
        header: "Activity",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
            <p className="font-medium">{row.original.summary}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{row.original.actor.name}</span>
              <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
              <span>{row.original.actor.mobile}</span>
              {row.original.actor.contextKey ? (
                <>
                  <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
                  <span className="capitalize">{row.original.actor.contextKey}</span>
                </>
              ) : null}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("action", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(AUDIT_LIST_SORT_FIELDS.ACTION)}
            type="button"
          >
            Action
            <SortIcon
              direction={
                queryState.sortBy === AUDIT_LIST_SORT_FIELDS.ACTION
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => (
          <Badge variant={getActionBadgeVariant(getValue())}>
            {formatAuditActionLabel(getValue())}
          </Badge>
        ),
      }),
      columnHelper.accessor("entityType", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(AUDIT_LIST_SORT_FIELDS.ENTITY_TYPE)}
            type="button"
          >
            Entity
            <SortIcon
              direction={
                queryState.sortBy === AUDIT_LIST_SORT_FIELDS.ENTITY_TYPE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge variant="outline">
              {formatAuditEntityLabel(row.original.entityType)}
            </Badge>
            {row.original.entityLabel ? (
              <p className="text-xs text-muted-foreground">
                {row.original.entityLabel}
              </p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor("actor.name", {
        id: "actor",
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(AUDIT_LIST_SORT_FIELDS.ACTOR)}
            type="button"
          >
            Actor
            <SortIcon
              direction={
                queryState.sortBy === AUDIT_LIST_SORT_FIELDS.ACTOR
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium">{row.original.actor.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.actor.mobile}
            </p>
          </div>
        ),
      }),
    ],
    [queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    columns,
    data: rows,
    page: queryState.page,
    pageCount: auditQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: auditQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{AUDIT_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to review the audit trail.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canReadAudit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{AUDIT_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            {isStaffContext(session)
              ? "You do not have permission to review the audit trail for this institution."
              : `Audit trail access is available in Staff view. You are currently in ${activeContext?.label ?? "another"} view.`}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isFiltered =
    Boolean(queryState.search) ||
    filters.action !== "all" ||
    filters.entityType !== "all";

  return (
    <EntityListPage
      title={AUDIT_PAGE_COPY.TITLE}
      description={AUDIT_PAGE_COPY.DESCRIPTION}
      toolbar={
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] flex-1">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 w-full rounded-lg border-border/70 bg-background pl-10 shadow-none"
                placeholder={AUDIT_PAGE_COPY.SEARCH_PLACEHOLDER}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>

            <Select
              value={filters.action}
              onValueChange={(value) =>
                void setFilters({
                  [AUDIT_FILTER_QUERY_PARAMS.ACTION]: value,
                })
              }
            >
              <SelectTrigger className="h-11 w-[180px] rounded-lg">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {AUDIT_ACTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.entityType}
              onValueChange={(value) =>
                void setFilters({
                  [AUDIT_FILTER_QUERY_PARAMS.ENTITY_TYPE]: value,
                })
              }
            >
              <SelectTrigger className="h-11 w-[200px] rounded-lg">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                {AUDIT_ENTITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      }
    >
      <ServerDataTable
        emptyDescription={
          isFiltered
            ? AUDIT_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
            : AUDIT_PAGE_COPY.EMPTY_DESCRIPTION
        }
        emptyTitle={
          isFiltered
            ? AUDIT_PAGE_COPY.EMPTY_FILTERED_TITLE
            : AUDIT_PAGE_COPY.EMPTY_TITLE
        }
        errorDescription={(auditQuery.error as Error | null | undefined)?.message}
        errorTitle={AUDIT_PAGE_COPY.ERROR_TITLE}
        isError={auditQuery.isError}
        isLoading={auditQuery.isLoading}
        onSearchChange={setSearchInput}
        searchPlaceholder={AUDIT_PAGE_COPY.SEARCH_PLACEHOLDER}
        searchValue={searchInput}
        showSearch={false}
        table={table}
        totalRows={auditQuery.data?.total ?? 0}
      />
    </EntityListPage>
  );
}
