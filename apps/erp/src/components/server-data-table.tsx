import type { ReactNode } from "react";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronUp,
  IconSearch,
} from "@tabler/icons-react";
import {
  flexRender,
  type RowData,
  type Table as ReactTable,
} from "@tanstack/react-table";
import { Button } from "@repo/ui/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  DEFAULT_TABLE_PAGE_SIZE,
  TABLE_PAGE_SIZES,
} from "@/constants/query";

function SortIcon({
  direction,
}: {
  direction: false | "asc" | "desc";
}) {
  if (direction === "asc") {
    return <IconChevronUp className="ml-1 inline size-3.5" />;
  }

  if (direction === "desc") {
    return <IconChevronDown className="ml-1 inline size-3.5" />;
  }

  return null;
}

type ServerDataTableProps<TData extends RowData> = {
  table: ReactTable<TData>;
  isError?: boolean;
  isLoading?: boolean;
  emptyAction?: ReactNode;
  emptyDescription: string;
  emptyTitle: string;
  errorDescription?: string;
  errorTitle: string;
  searchPlaceholder: string;
  searchValue: string;
  selectedCount?: number;
  selectionActions?: ReactNode;
  totalRows: number;
  onSearchChange: (value: string) => void;
  rowClassName?: (row: TData) => string | undefined;
  rowCellClassName?: (row: TData) => string | undefined;
  showSearch?: boolean;
};

export function ServerDataTable<TData extends RowData>({
  table,
  isError = false,
  isLoading = false,
  emptyAction,
  emptyDescription,
  emptyTitle,
  errorDescription,
  errorTitle,
  onSearchChange,
  rowCellClassName,
  rowClassName,
  searchPlaceholder,
  searchValue,
  selectedCount = 0,
  selectionActions,
  totalRows,
  showSearch = true,
}: ServerDataTableProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize || DEFAULT_TABLE_PAGE_SIZE;
  const resultCount = table.getRowCount();
  const pageCount = table.getPageCount();
  const hasRows = resultCount > 0;

  return (
    <>
      {showSearch ? (
        <div className="border-b px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 w-full max-w-sm pl-8"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {totalRows} results
            </p>
          </div>
        </div>
      ) : null}

      {selectedCount > 0 || selectionActions ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {selectedCount} selected
          </p>
          {selectionActions}
        </div>
      ) : null}

      <div>
        {isError ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm font-medium">{errorTitle}</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {errorDescription ?? "Something went wrong. Try refreshing the page."}
            </p>
          </div>
        ) : isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        ) : !hasRows ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm font-medium">{emptyTitle}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {emptyDescription}
            </p>
            {emptyAction}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="h-10 text-xs font-medium text-muted-foreground"
                        >
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
                      className={rowClassName?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={rowCellClassName?.(row.original)}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Page {pageIndex + 1} of {pageCount}
                </span>
                <span>&middot;</span>
                <span>{resultCount} total</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => table.setPageSize(Number(value))}
                  >
                    <SelectTrigger className="h-8 w-[78px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TABLE_PAGE_SIZES.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                    onClick={() => table.setPageIndex(pageCount - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <IconChevronsRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export { SortIcon };
