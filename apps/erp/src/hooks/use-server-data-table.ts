import { useMemo } from "react";
import {
  functionalUpdate,
  getCoreRowModel,
  type PaginationState,
  type RowData,
  type TableOptions,
  useReactTable,
} from "@tanstack/react-table";
import { SORT_ORDERS } from "@/constants/query";

type UseServerDataTableOptions<TData extends RowData> = Pick<
  TableOptions<TData>,
  "columns" | "data"
> & {
  page: number;
  pageCount: number;
  pageSize: number;
  rowCount: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  sortBy: string;
  sortOrder: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
};

export function useServerDataTable<TData extends RowData>({
  columns,
  data,
  page,
  pageCount,
  pageSize,
  rowCount,
  setPage,
  setPageSize,
  sortBy,
  sortOrder,
}: UseServerDataTableOptions<TData>) {
  const sorting = useMemo(
    () => [
      {
        id: sortBy,
        desc: sortOrder === SORT_ORDERS.DESC,
      },
    ],
    [sortBy, sortOrder],
  );

  return useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    onPaginationChange: (updater) => {
      const nextPagination = functionalUpdate<PaginationState>(updater, {
        pageIndex: page - 1,
        pageSize,
      });

      if (nextPagination.pageSize !== pageSize) {
        setPageSize(nextPagination.pageSize);
        return;
      }

      setPage(nextPagination.pageIndex + 1);
    },
    pageCount,
    rowCount,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
      sorting,
    },
  });
}
