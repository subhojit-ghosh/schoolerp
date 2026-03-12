export const QUERY_PARAMS = {
  SEARCH: "q",
  PAGE: "page",
  LIMIT: "limit",
  SORT: "sort",
  ORDER: "order",
  TENANT: "tenant",
  HOST: "host",
} as const;

export const SORT_ORDERS = {
  ASC: "asc",
  DESC: "desc",
} as const;

export const TABLE_PAGE_SIZES = [10, 20, 50] as const;
