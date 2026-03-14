import { useEffect, useMemo, useState } from "react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import {
  DEFAULT_TABLE_PAGE_SIZE,
  QUERY_PARAMS,
  SORT_ORDERS,
} from "@/constants/query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type SortOrder = (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

type UseEntityListQueryStateOptions<TSort extends string> = {
  defaultSortBy: TSort;
  defaultSortOrder?: SortOrder;
  searchDebounceMs?: number;
  validSorts: readonly TSort[];
};

export function useEntityListQueryState<TSort extends string>({
  defaultSortBy,
  defaultSortOrder = SORT_ORDERS.ASC,
  searchDebounceMs = 250,
  validSorts,
}: UseEntityListQueryStateOptions<TSort>) {
  const [params, setParams] = useQueryStates({
    [QUERY_PARAMS.SEARCH]: parseAsString.withDefault(""),
    [QUERY_PARAMS.PAGE]: parseAsInteger.withDefault(1),
    [QUERY_PARAMS.LIMIT]: parseAsInteger.withDefault(DEFAULT_TABLE_PAGE_SIZE),
    [QUERY_PARAMS.SORT]: parseAsString.withDefault(defaultSortBy),
    [QUERY_PARAMS.ORDER]: parseAsString.withDefault(defaultSortOrder),
  });

  const [searchInput, setSearchInput] = useState(params.q);
  const debouncedSearch = useDebouncedValue(searchInput, searchDebounceMs);

  useEffect(() => {
    setSearchInput(params.q);
  }, [params.q]);

  useEffect(() => {
    if (debouncedSearch === params.q) {
      return;
    }

    void setParams({
      [QUERY_PARAMS.SEARCH]: debouncedSearch,
      [QUERY_PARAMS.PAGE]: 1,
    });
  }, [debouncedSearch, params.q, setParams]);

  const sortBy = useMemo(() => {
    return validSorts.includes(params.sort as TSort)
      ? (params.sort as TSort)
      : defaultSortBy;
  }, [defaultSortBy, params.sort, validSorts]);

  const sortOrder = params.order === SORT_ORDERS.DESC
    ? SORT_ORDERS.DESC
    : SORT_ORDERS.ASC;

  const page = Math.max(1, params.page);
  const pageSize = params.limit;

  return {
    searchInput,
    queryState: {
      page,
      pageSize,
      search: params.q,
      sortBy,
      sortOrder,
    },
    setPage(pageValue: number) {
      void setParams({ [QUERY_PARAMS.PAGE]: Math.max(1, pageValue) });
    },
    setPageSize(nextPageSize: number) {
      void setParams({
        [QUERY_PARAMS.LIMIT]: nextPageSize,
        [QUERY_PARAMS.PAGE]: 1,
      });
    },
    setSearchInput,
    setSorting(nextSortBy: TSort) {
      const nextSortOrder =
        sortBy === nextSortBy && sortOrder === SORT_ORDERS.ASC
          ? SORT_ORDERS.DESC
          : SORT_ORDERS.ASC;

      void setParams({
        [QUERY_PARAMS.SORT]: nextSortBy,
        [QUERY_PARAMS.ORDER]: nextSortOrder,
        [QUERY_PARAMS.PAGE]: 1,
      });
    },
  };
}
