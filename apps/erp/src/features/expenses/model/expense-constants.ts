export const EXPENSE_LIST_SORT_FIELDS = {
  DATE: "expenseDate",
  AMOUNT: "amountInPaise",
  CREATED_AT: "createdAt",
} as const;

export const EXPENSE_CATEGORY_LIST_SORT_FIELDS = {
  NAME: "name",
  CREATED_AT: "createdAt",
} as const;

export const EXPENSES_PAGE_COPY = {
  TITLE: "Expenses",
  DESCRIPTION: "Track and manage school expenses with approval workflows.",
  EMPTY_TITLE: "No expenses yet",
  EMPTY_DESCRIPTION: "Create an expense record to start tracking spending.",
  SEARCH_PLACEHOLDER: "Search expenses...",
} as const;

export const EXPENSE_CATEGORIES_PAGE_COPY = {
  TITLE: "Expense Categories",
  DESCRIPTION: "Organize expenses into categories for better tracking.",
  EMPTY_TITLE: "No categories yet",
  EMPTY_DESCRIPTION: "Create a category to start organizing expenses.",
  SEARCH_PLACEHOLDER: "Search categories...",
} as const;

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
} as const;
