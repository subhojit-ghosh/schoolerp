"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import {
  ArrowUp,
  ArrowDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QUERY_PARAMS, SORT_ORDERS, TABLE_PAGE_SIZES } from "@/constants";

type PaginationInfo = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination: PaginationInfo;
  searchKey?: string;
  searchPlaceholder?: string;
};

const TABLE_QUERY_STATE = {
  search: parseAsString.withOptions({ history: "push", shallow: false }),
  page: parseAsInteger.withOptions({ history: "push", shallow: false }),
  limit: parseAsInteger.withOptions({ history: "push", shallow: false }),
  sort: parseAsString.withOptions({ history: "push", shallow: false }),
  order: parseAsStringLiteral([
    SORT_ORDERS.ASC,
    SORT_ORDERS.DESC,
  ]).withOptions({ history: "push", shallow: false }),
} as const;

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  searchKey,
  searchPlaceholder = "Search...",
}: DataTableProps<TData, TValue>) {
  const [queryState, setQueryState] = useQueryStates({
    [QUERY_PARAMS.SEARCH]: TABLE_QUERY_STATE.search,
    [QUERY_PARAMS.PAGE]: TABLE_QUERY_STATE.page,
    [QUERY_PARAMS.LIMIT]: TABLE_QUERY_STATE.limit,
    [QUERY_PARAMS.SORT]: TABLE_QUERY_STATE.sort,
    [QUERY_PARAMS.ORDER]: TABLE_QUERY_STATE.order,
  });

  const currentSort = queryState[QUERY_PARAMS.SORT] ?? "";
  const currentOrder = queryState[QUERY_PARAMS.ORDER] ?? SORT_ORDERS.DESC;
  const currentSearch = queryState[QUERY_PARAMS.SEARCH] ?? "";

  function handleSort(columnId: string) {
    if (currentSort === columnId) {
      void setQueryState({
        [QUERY_PARAMS.SORT]: columnId,
        [QUERY_PARAMS.ORDER]:
          currentOrder === SORT_ORDERS.ASC
            ? SORT_ORDERS.DESC
            : SORT_ORDERS.ASC,
        [QUERY_PARAMS.PAGE]: null,
      });
    } else {
      void setQueryState({
        [QUERY_PARAMS.SORT]: columnId,
        [QUERY_PARAMS.ORDER]: SORT_ORDERS.ASC,
        [QUERY_PARAMS.PAGE]: null,
      });
    }
  }

  const [searchValue, setSearchValue] = React.useState(currentSearch);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  function handleSearch(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void setQueryState(
        {
          [QUERY_PARAMS.SEARCH]: value || null,
          [QUERY_PARAMS.PAGE]: null,
        },
        { history: "replace" },
      );
    }, 300);
  }

  React.useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: pagination.pageCount,
    meta: { sort: handleSort, currentSort, currentOrder },
  });

  return (
    <div className="w-full space-y-3">
      {searchKey && (
        <div>
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-8 max-w-xs text-sm"
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => {
              void setQueryState({
                [QUERY_PARAMS.LIMIT]: Number(value),
                [QUERY_PARAMS.PAGE]: null,
              });
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TABLE_PAGE_SIZES.map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-sm">Rows per page</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">
            Page {pagination.page} of {pagination.pageCount}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => {
                void setQueryState({ [QUERY_PARAMS.PAGE]: 1 });
              }}
              disabled={pagination.page <= 1}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => {
                void setQueryState({
                  [QUERY_PARAMS.PAGE]: pagination.page - 1,
                });
              }}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => {
                void setQueryState({
                  [QUERY_PARAMS.PAGE]: pagination.page + 1,
                });
              }}
              disabled={pagination.page >= pagination.pageCount}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => {
                void setQueryState({
                  [QUERY_PARAMS.PAGE]: pagination.pageCount,
                });
              }}
              disabled={pagination.page >= pagination.pageCount}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper for sortable column headers
export function SortableHeader({
  columnId,
  label,
  sort,
  currentSort,
  currentOrder,
}: {
  columnId: string;
  label: string;
  sort: (id: string) => void;
  currentSort: string;
  currentOrder: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
}) {
  const isActive = currentSort === columnId;
  return (
    <Button
      variant="ghost"
      className="-ml-3 h-8"
      onClick={() => sort(columnId)}
    >
      {label}
      {isActive ? (
        currentOrder === SORT_ORDERS.ASC ? (
          <ArrowUp className="ml-1 size-3.5" />
        ) : (
          <ArrowDown className="ml-1 size-3.5" />
        )
      ) : (
        <ArrowDown className="ml-1 size-3.5 opacity-0" />
      )}
    </Button>
  );
}
