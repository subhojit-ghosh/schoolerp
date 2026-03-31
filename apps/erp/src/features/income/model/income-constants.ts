export const INCOME_LIST_SORT_FIELDS = {
  DATE: "incomeDate",
  AMOUNT: "amountInPaise",
  CREATED_AT: "createdAt",
} as const;

export const INCOME_RECORDS_PAGE_COPY = {
  TITLE: "Income",
  DESCRIPTION:
    "Track non-fee income such as donations, grants, government aid, and other revenue.",
  EMPTY_TITLE: "No income records yet",
  EMPTY_DESCRIPTION: "Create an income record to start tracking revenue.",
  SEARCH_PLACEHOLDER: "Search income records...",
} as const;
