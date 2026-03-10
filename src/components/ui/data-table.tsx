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
  Search,
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
  toolbarContent?: React.ReactNode;
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
  toolbarContent,
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
    <div className="w-full space-y-4">
      {searchKey && (
        <div className="flex flex-col gap-3 rounded-[28px] border border-border/60 bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-12 rounded-2xl border-border/60 bg-background pr-4 pl-11 text-sm shadow-none"
            />
          </div>
          {toolbarContent ? (
            <div className="flex flex-wrap items-center gap-2">{toolbarContent}</div>
          ) : null}
        </div>
      )}

      <div className="overflow-hidden rounded-[30px] border border-border/60 bg-card shadow-[0_18px_40px_-32px_rgba(15,45,53,0.55)]">
        <Table className="[&_td]:px-4 [&_td]:py-4 [&_th]:px-4 [&_th]:py-3">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border/60 bg-muted/40 hover:bg-muted/40">
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
                <TableRow
                  key={row.id}
                  className="border-border/60 bg-card hover:bg-background/60"
                >
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

      <div className="flex items-center justify-between rounded-[24px] border border-border/60 bg-card px-4 py-3">
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
            <SelectTrigger className="h-9 w-[76px] rounded-xl border-border/60 bg-background">
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
          <span className="text-sm text-muted-foreground">Rows per page</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {pagination.page} of {pagination.pageCount}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-xl border-border/60 bg-background"
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
              className="size-9 rounded-xl border-border/60 bg-background"
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
              className="size-9 rounded-xl border-border/60 bg-background"
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
              className="size-9 rounded-xl border-border/60 bg-background"
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
