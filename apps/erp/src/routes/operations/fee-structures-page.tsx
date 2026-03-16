import { useCallback, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { toast } from "sonner";
import {
  IconCopy,
  IconDotsVertical,
  IconArchive,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  IconRestore,
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
  buildFeeStructureEditRoute,
  ERP_ROUTES,
} from "@/constants/routes";
import { SORT_ORDERS } from "@/constants/query";
import { isStaffContext } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useDeleteFeeStructureMutation,
  useDuplicateFeeStructureMutation,
  useFeeStructuresQuery,
  useSetFeeStructureStatusMutation,
} from "@/features/fees/api/use-fees";
import { formatFeeDate, formatRupees } from "@/features/fees/model/fee-formatters";
import {
  FEE_STRUCTURE_LIST_SORT_FIELDS,
  FEE_STRUCTURES_PAGE_COPY,
} from "@/features/fees/model/fee-structure-list.constants";
import { useEntityListQueryState } from "@/hooks/use-entity-list-query-state";
import { useServerDataTable } from "@/hooks/use-server-data-table";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

type FeeStructureRow = {
  id: string;
  name: string;
  scope: string;
  status: "active" | "archived" | "deleted";
  academicYearName: string;
  campusName: string | null;
  amountInPaise: number;
  dueDate: string;
};

const columnHelper = createColumnHelper<FeeStructureRow>();

const VALID_SORT_FIELDS = [
  FEE_STRUCTURE_LIST_SORT_FIELDS.NAME,
  FEE_STRUCTURE_LIST_SORT_FIELDS.DUE_DATE,
  FEE_STRUCTURE_LIST_SORT_FIELDS.AMOUNT,
  FEE_STRUCTURE_LIST_SORT_FIELDS.ACADEMIC_YEAR,
] as const;

export function FeeStructuresPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const canManageFees = isStaffContext(session);
  const canQueryFees = canManageFees && Boolean(institutionId);

  const deleteMutation = useDeleteFeeStructureMutation();
  const duplicateMutation = useDuplicateFeeStructureMutation();
  const setStatusMutation = useSetFeeStructureStatusMutation();
  const [deleteTarget, setDeleteTarget] = useState<FeeStructureRow | null>(null);

  const {
    queryState,
    searchInput,
    setPage,
    setPageSize,
    setSearchInput,
    setSorting,
  } = useEntityListQueryState({
    defaultSortBy: FEE_STRUCTURE_LIST_SORT_FIELDS.ACADEMIC_YEAR,
    defaultSortOrder: SORT_ORDERS.ASC,
    validSorts: VALID_SORT_FIELDS,
  });

  const structuresQuery = useFeeStructuresQuery(canQueryFees, {
    limit: queryState.pageSize,
    order: queryState.sortOrder,
    page: queryState.page,
    q: queryState.search || undefined,
    sort: queryState.sortBy,
  });

  const structures = useMemo(
    () => (structuresQuery.data?.rows ?? []) as FeeStructureRow[],
    [structuresQuery.data?.rows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(FEE_STRUCTURE_LIST_SORT_FIELDS.NAME)}
            type="button"
          >
            Name
            <SortIcon
              direction={
                queryState.sortBy === FEE_STRUCTURE_LIST_SORT_FIELDS.NAME
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
                buildFeeStructureEditRoute(row.original.id),
                location.search,
              )}
            >
              {row.original.name}
            </Link>
          </Button>
        ),
      }),
      columnHelper.accessor("academicYearName", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(FEE_STRUCTURE_LIST_SORT_FIELDS.ACADEMIC_YEAR)}
            type="button"
          >
            Academic Year
            <SortIcon
              direction={
                queryState.sortBy === FEE_STRUCTURE_LIST_SORT_FIELDS.ACADEMIC_YEAR
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
      }),
      columnHelper.accessor("scope", {
        header: "Scope",
        cell: ({ row }) => {
          const { scope, campusName } = row.original;

          return scope === "campus" && campusName ? campusName : "Institution";
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => (
          <Badge variant={getValue() === "active" ? "default" : "secondary"}>
            {getValue().charAt(0).toUpperCase() + getValue().slice(1)}
          </Badge>
        ),
      }),
      columnHelper.accessor("amountInPaise", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(FEE_STRUCTURE_LIST_SORT_FIELDS.AMOUNT)}
            type="button"
          >
            Amount
            <SortIcon
              direction={
                queryState.sortBy === FEE_STRUCTURE_LIST_SORT_FIELDS.AMOUNT
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => formatRupees(getValue()),
      }),
      columnHelper.accessor("dueDate", {
        header: () => (
          <button
            className="flex items-center font-medium hover:text-foreground"
            onClick={() => setSorting(FEE_STRUCTURE_LIST_SORT_FIELDS.DUE_DATE)}
            type="button"
          >
            Due Date
            <SortIcon
              direction={
                queryState.sortBy === FEE_STRUCTURE_LIST_SORT_FIELDS.DUE_DATE
                  ? queryState.sortOrder
                  : false
              }
            />
          </button>
        ),
        cell: ({ getValue }) => formatFeeDate(getValue()),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const structure = row.original;

          return (
            <div className="flex items-center justify-end gap-1">
              <EntityRowAction asChild>
                <Link
                  to={appendSearch(
                    buildFeeStructureEditRoute(structure.id),
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
                    onSelect={() => handleDuplicate(structure.id)}
                  >
                    <IconCopy className="mr-2 size-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      void handleStatusChange(
                        structure.id,
                        structure.status === "active" ? "archived" : "active",
                      )
                    }
                  >
                    {structure.status === "active" ? (
                      <IconArchive className="mr-2 size-4" />
                    ) : (
                      <IconRestore className="mr-2 size-4" />
                    )}
                    {structure.status === "active" ? "Archive" : "Restore"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteTarget(structure)}
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
    [location.search, queryState.sortBy, queryState.sortOrder, setSorting],
  );

  const table = useServerDataTable({
    data: structures,
    columns,
    page: queryState.page,
    pageCount: structuresQuery.data?.pageCount ?? 1,
    pageSize: queryState.pageSize,
    rowCount: structuresQuery.data?.total ?? 0,
    setPage,
    setPageSize,
    sortBy: queryState.sortBy,
    sortOrder: queryState.sortOrder,
  });

  const handleDuplicate = useCallback(async (structureId: string) => {
    await duplicateMutation.mutateAsync({
      params: { path: { feeStructureId: structureId } },
    });
    toast.success(ERP_TOAST_MESSAGES.created(`${ERP_TOAST_SUBJECTS.FEE_STRUCTURE} copy`));
  }, [duplicateMutation]);

  const handleStatusChange = useCallback(
    async (feeStructureId: string, status: "active" | "archived") => {
      await setStatusMutation.mutateAsync({
        params: { path: { feeStructureId } },
        body: { status },
      });
      toast.success(
        status === "archived"
          ? ERP_TOAST_MESSAGES.archived(ERP_TOAST_SUBJECTS.FEE_STRUCTURE)
          : ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.FEE_STRUCTURE),
      );
    },
    [setStatusMutation],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    await deleteMutation.mutateAsync({
      params: { path: { feeStructureId: deleteTarget.id } },
    });

    toast.success(ERP_TOAST_MESSAGES.deleted(ERP_TOAST_SUBJECTS.FEE_STRUCTURE));
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{FEE_STRUCTURES_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage fee structures.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageFees) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{FEE_STRUCTURES_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Fee management is available in Staff view.
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
            <Link to={appendSearch(ERP_ROUTES.FEE_STRUCTURE_CREATE, location.search)}>
              <IconPlus className="size-4" />
              New fee structure
            </Link>
          </EntityPagePrimaryAction>
        }
        description={FEE_STRUCTURES_PAGE_COPY.DESCRIPTION}
        title={FEE_STRUCTURES_PAGE_COPY.TITLE}
        toolbar={
          <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[280px] flex-1">
                <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-11 w-full max-w-md rounded-lg border-border/70 bg-background pl-10 shadow-none"
                  placeholder={FEE_STRUCTURES_PAGE_COPY.SEARCH_PLACEHOLDER}
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
                <Link to={appendSearch(ERP_ROUTES.FEE_STRUCTURE_CREATE, location.search)}>
                  <IconPlus className="size-4" />
                  New fee structure
                </Link>
              </EntityEmptyStateAction>
            ) : null
          }
          emptyDescription={
            isFiltered
              ? FEE_STRUCTURES_PAGE_COPY.EMPTY_FILTERED_DESCRIPTION
              : FEE_STRUCTURES_PAGE_COPY.EMPTY_DESCRIPTION
          }
          emptyTitle={
            isFiltered
              ? FEE_STRUCTURES_PAGE_COPY.EMPTY_FILTERED_TITLE
              : FEE_STRUCTURES_PAGE_COPY.EMPTY_TITLE
          }
          errorDescription={
            (structuresQuery.error as Error | null | undefined)?.message
          }
          errorTitle={FEE_STRUCTURES_PAGE_COPY.ERROR_TITLE}
          isError={structuresQuery.isError}
          isLoading={structuresQuery.isLoading}
          onSearchChange={setSearchInput}
          searchPlaceholder={FEE_STRUCTURES_PAGE_COPY.SEARCH_PLACEHOLDER}
          searchValue={searchInput}
          showSearch={false}
          table={table}
          totalRows={structuresQuery.data?.total ?? 0}
        />
      </EntityListPage>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete "${deleteTarget?.name ?? "fee structure"}"`}
        description="This permanently removes the fee structure. It can only be deleted if no active fee assignments exist for it."
        confirmLabel="Delete fee structure"
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
