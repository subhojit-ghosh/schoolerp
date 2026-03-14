import { useState } from "react";
import { toast } from "sonner";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronUp,
  IconChevronDown,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconPower,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Input } from "@repo/ui/components/ui/input";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EntitySheet } from "@/components/entity-sheet";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useClassesQuery,
  useCreateClassMutation,
  useDeleteClassMutation,
  useSetClassStatusMutation,
  useUpdateClassMutation,
} from "@/features/classes/api/use-classes";
import { ClassForm } from "@/features/classes/ui/class-form";
import type { ClassFormValues } from "@/features/classes/model/class-form-schema";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

type ClassRow = {
  id: string;
  name: string;
  isActive: boolean;
  sections: Array<{ id: string; name: string; displayOrder: number }>;
};

const PAGE_SIZE = 20;
const columnHelper = createColumnHelper<ClassRow>();

const DEFAULT_VALUES: ClassFormValues = {
  name: "",
  sections: [{ name: "" }],
};

function SortIcon({
  direction,
}: {
  direction: false | "asc" | "desc";
}) {
  if (direction === "asc") return <IconChevronUp className="ml-1 inline size-3.5" />;
  if (direction === "desc") return <IconChevronDown className="ml-1 inline size-3.5" />;
  return null;
}

export function ClassesPage() {
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const activeCampusId = session?.activeCampus?.id;
  const canManageClasses = isStaffContext(session);
  const canQueryClasses = canManageClasses && Boolean(institutionId);

  const classesQuery = useClassesQuery(canQueryClasses, activeCampusId);
  const createMutation = useCreateClassMutation();
  const updateMutation = useUpdateClassMutation();
  const setStatusMutation = useSetClassStatusMutation();
  const deleteMutation = useDeleteClassMutation();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassRow | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const classes = (classesQuery.data ?? []) as ClassRow[];

  const columns = [
    columnHelper.accessor("name", {
      header: ({ column }) => (
        <button
          className="flex items-center font-medium hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Class
          <SortIcon direction={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <button
          className="flex items-center gap-2 text-left"
          onClick={() => {
            setEditingClass(row.original);
            setSheetOpen(true);
          }}
        >
          <span className="font-medium hover:underline">
            {row.original.name}
          </span>
        </button>
      ),
    }),
    columnHelper.accessor("isActive", {
      header: "Status",
      cell: ({ getValue }) =>
        getValue() ? (
          <Badge variant="secondary" className="text-green-700 dark:text-green-400">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Disabled
          </Badge>
        ),
    }),
    columnHelper.accessor("sections", {
      header: "Sections",
      enableSorting: false,
      cell: ({ getValue }) => {
        const sections = getValue();
        if (sections.length === 0) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {sections.map((s) => (
              <Badge key={s.id} variant="outline">
                {s.name}
              </Badge>
            ))}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => {
        const cls = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              className="h-7 px-2.5 text-xs"
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingClass(cls);
                setSheetOpen(true);
              }}
            >
              <IconPencil className="size-3" />
              Edit
            </Button>
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
                  onSelect={() => handleToggleStatus(cls)}
                >
                  <IconPower className="mr-2 size-4" />
                  {cls.isActive ? "Disable" : "Enable"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteTarget(cls)}
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
  ];

  const table = useReactTable({
    data: classes,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  async function handleCreate(values: ClassFormValues) {
    if (!institutionId || !activeCampusId) return;
    await createMutation.mutateAsync({
      body: { ...values, campusId: activeCampusId },
    });
    toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.CLASS));
    setSheetOpen(false);
  }

  async function handleUpdate(values: ClassFormValues) {
    if (!institutionId || !editingClass || !activeCampusId) return;
    await updateMutation.mutateAsync({
      params: { path: { classId: editingClass.id } },
      body: { ...values, campusId: activeCampusId },
    });
    toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.CLASS));
    setSheetOpen(false);
    setEditingClass(null);
  }

  async function handleToggleStatus(cls: ClassRow) {
    if (!institutionId) return;
    await setStatusMutation.mutateAsync({
      params: { path: { classId: cls.id } },
      body: { isActive: !cls.isActive },
    });
    toast.success(
      cls.isActive
        ? ERP_TOAST_MESSAGES.disabled(ERP_TOAST_SUBJECTS.CLASS)
        : ERP_TOAST_MESSAGES.enabled(ERP_TOAST_SUBJECTS.CLASS),
    );
  }

  async function handleDelete() {
    if (!institutionId || !deleteTarget) return;
    await deleteMutation.mutateAsync({
      params: { path: { classId: deleteTarget.id } },
    });
    toast.success(ERP_TOAST_MESSAGES.deleted(ERP_TOAST_SUBJECTS.CLASS));
    setDeleteTarget(null);
  }

  function openAddSheet() {
    setEditingClass(null);
    setSheetOpen(true);
  }

  const createError = createMutation.error as Error | null | undefined;
  const updateError = updateMutation.error as Error | null | undefined;

  if (!institutionId) {
    return (
      <div className="rounded-lg border p-6">
        <p className="font-medium">Classes</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in with an institution-backed session to manage class records.
        </p>
      </div>
    );
  }

  if (!canManageClasses) {
    return (
      <div className="rounded-lg border p-6">
        <p className="font-medium">Classes</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Class administration is available in Staff view. You are currently in{" "}
          {activeContext?.label ?? "another"} view.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
            <p className="text-sm text-muted-foreground">
              Assign each class to a campus and define its sections.
            </p>
          </div>
          <Button onClick={openAddSheet}>
            <IconPlus className="size-4" />
            Add class
          </Button>
        </div>


        {/* Table */}
        <div className="overflow-hidden rounded-lg border">
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
            <div className="relative flex-1">
              <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 w-full max-w-xs pl-8"
                placeholder="Search classes…"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>
          </div>

          <div>
            {classesQuery.isError ? (
              <div className="flex min-h-56 flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm font-medium">Failed to load classes</p>
                <p className="text-sm text-muted-foreground">
                  {(classesQuery.error as Error)?.message ?? "Something went wrong. Try refreshing the page."}
                </p>
              </div>
            ) : classesQuery.isLoading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            ) : table.getRowModel().rows.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm font-medium">
                  {classes.length === 0
                    ? "No classes yet"
                    : "No classes match your search"}
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {classes.length === 0
                    ? "Add your first class to get started."
                    : "Try adjusting your search or campus filter."}
                </p>
                {classes.length === 0 ? (
                  <Button size="sm" onClick={openAddSheet}>
                    <IconPlus className="size-4" />
                    Add first class
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="hover:bg-transparent">
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="text-xs font-medium text-muted-foreground">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="group"
                          data-state={row.original.isActive ? undefined : "muted"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className={
                                row.original.isActive
                                  ? undefined
                                  : "opacity-60"
                              }
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {table.getPageCount() > 1 ? (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      Page {table.getState().pagination.pageIndex + 1} of{" "}
                      {table.getPageCount()} &middot;{" "}
                      {table.getFilteredRowModel().rows.length} results
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-8"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                      >
                        <IconChevronsLeft className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-8"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        <IconChevronLeft className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-8"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      >
                        <IconChevronRight className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-8"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                      >
                        <IconChevronsRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit sheet */}
      <EntitySheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingClass(null);
        }}
        title={editingClass ? "Edit class" : "Add class"}
        description={
          editingClass
            ? "Update the name or sections."
            : "Add a class and define the sections available for admissions and roster views."
        }
      >
        <ClassForm
          defaultValues={
            editingClass
              ? {
                  name: editingClass.name,
                  sections: editingClass.sections.map((s) => ({
                    id: s.id,
                    name: s.name,
                  })),
                }
              : DEFAULT_VALUES
          }
          errorMessage={
            editingClass ? updateError?.message : createError?.message
          }
          isPending={
            editingClass ? updateMutation.isPending : createMutation.isPending
          }
          onCancel={() => {
            setSheetOpen(false);
            setEditingClass(null);
          }}
          onSubmit={editingClass ? handleUpdate : handleCreate}
          submitLabel={editingClass ? "Save changes" : "Create class"}
        />
      </EntitySheet>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete "${deleteTarget?.name ?? "class"}"`}
        description="This will permanently remove the class and all its sections. This cannot be undone."
        confirmLabel="Delete class"
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
