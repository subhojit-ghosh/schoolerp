import { type ReactNode, useCallback, useRef } from "react";
import {
  IconArrowsSort,
  IconBaselineDensityLarge,
  IconBaselineDensityMedium,
  IconBaselineDensitySmall,
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
  ToggleGroup,
  ToggleGroupItem,
} from "@repo/ui/components/ui/toggle-group";
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
import { cn } from "@repo/ui/lib/utils";
import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZES } from "@/constants/query";
import {
  useTableDensity,
  type TableDensity,
} from "@/hooks/use-table-density";

const ROW_HOVER_DELAY_MS = 150;

const DENSITY_CONFIG: Record<
  TableDensity,
  { icon: typeof IconBaselineDensitySmall; label: string; cellClassName: string; skeletonClassName: string }
> = {
  compact: {
    icon: IconBaselineDensitySmall,
    label: "Compact",
    cellClassName: "py-1.5 text-xs",
    skeletonClassName: "py-1.5",
  },
  comfortable: {
    icon: IconBaselineDensityMedium,
    label: "Comfortable",
    cellClassName: "",
    skeletonClassName: "py-3",
  },
  spacious: {
    icon: IconBaselineDensityLarge,
    label: "Spacious",
    cellClassName: "py-4",
    skeletonClassName: "py-4",
  },
};

function DensityToggle(): ReactNode {
  const { density, setDensity } = useTableDensity();

  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={density}
      onValueChange={(value) => {
        if (value) setDensity(value as TableDensity);
      }}
    >
      {(Object.entries(DENSITY_CONFIG) as [TableDensity, (typeof DENSITY_CONFIG)[TableDensity]][]).map(
        ([key, { icon: Icon, label }]) => (
          <ToggleGroupItem
            key={key}
            value={key}
            aria-label={label}
            className="h-7 w-7 p-0"
          >
            <Icon className="size-3.5" />
          </ToggleGroupItem>
        ),
      )}
    </ToggleGroup>
  );
}

function SortIcon({
  direction,
  sortable = true,
}: {
  direction: false | "asc" | "desc";
  sortable?: boolean;
}) {
  if (direction === "asc") {
    return <IconChevronUp className="ml-1 inline size-3.5" />;
  }

  if (direction === "desc") {
    return <IconChevronDown className="ml-1 inline size-3.5" />;
  }

  if (sortable) {
    return (
      <IconArrowsSort className="ml-1 inline size-3.5 opacity-0 transition-opacity group-hover:opacity-40" />
    );
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
  onRowHover?: (row: TData) => void;
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
  onRowHover,
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
  const { density } = useTableDensity();
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRowMouseEnter = useCallback(
    function handleRowMouseEnter(rowData: TData) {
      if (!onRowHover) return;
      hoverTimerRef.current = setTimeout(() => {
        onRowHover(rowData);
      }, ROW_HOVER_DELAY_MS);
    },
    [onRowHover],
  );

  const handleRowMouseLeave = useCallback(
    function handleRowMouseLeave() {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    },
    [],
  );
  const densityCell = DENSITY_CONFIG[density].cellClassName;
  const densitySkeleton = DENSITY_CONFIG[density].skeletonClassName;

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize =
    table.getState().pagination.pageSize || DEFAULT_TABLE_PAGE_SIZE;
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
            <p className="text-sm text-muted-foreground">{totalRows} results</p>
            <DensityToggle />
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
              {errorDescription ??
                "Something went wrong. Try refreshing the page."}
            </p>
          </div>
        ) : isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-4 px-4",
                  densitySkeleton,
                )}
              >
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        ) : !hasRows ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 text-center">
            {searchValue ? (
              <>
                <p className="text-sm font-medium">
                  No matches for &ldquo;{searchValue}&rdquo;
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Try a different search term or clear the filter.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">{emptyTitle}</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {emptyDescription}
                </p>
                {emptyAction}
              </>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="hover:bg-transparent"
                    >
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
                      onMouseEnter={() => handleRowMouseEnter(row.original)}
                      onMouseLeave={handleRowMouseLeave}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            densityCell,
                            rowCellClassName?.(row.original),
                          )}
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
