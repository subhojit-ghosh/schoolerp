"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PaginationInfo = {
  page: number;
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

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  searchKey,
  searchPlaceholder = "Search...",
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "";
  const currentOrder = searchParams.get("order") ?? "desc";
  const currentSearch = searchParams.get("q") ?? "";

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`${pathname}?${params.toString()}` as never);
  }

  function handleSort(columnId: string) {
    if (currentSort === columnId) {
      updateParams({
        sort: columnId,
        order: currentOrder === "asc" ? "desc" : "asc",
        page: null,
      });
    } else {
      updateParams({ sort: columnId, order: "asc", page: null });
    }
  }

  const [searchValue, setSearchValue] = React.useState(currentSearch);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  function handleSearch(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ q: value, page: null });
    }, 300);
  }

  // Sync search input when URL changes externally
  React.useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

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
    <div className="w-full">
      {searchKey && (
        <div className="pb-3">
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-9 max-w-sm"
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

      <div className="flex items-center justify-between pt-3">
        <div className="text-muted-foreground text-sm">
          Page {pagination.page} of {pagination.pageCount} ({pagination.total}{" "}
          rows)
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              updateParams({ page: String(pagination.page - 1) })
            }
            disabled={pagination.page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              updateParams({ page: String(pagination.page + 1) })
            }
            disabled={pagination.page >= pagination.pageCount}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper component for sortable column headers
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
  currentOrder: string;
}) {
  const isActive = currentSort === columnId;
  return (
    <Button
      variant="ghost"
      className="-ml-3"
      onClick={() => sort(columnId)}
    >
      {label}
      {isActive ? (
        currentOrder === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-50" />
      )}
    </Button>
  );
}
