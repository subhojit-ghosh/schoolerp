export const HOMEWORK_LIST_SORT_FIELDS = {
  DUE_DATE: "dueDate",
  TITLE: "title",
  STATUS: "status",
  CREATED_AT: "createdAt",
} as const;

export const HOMEWORK_PAGE_COPY = {
  TITLE: "Homework",
  DESCRIPTION: "Manage homework assignments for classes and sections.",
  SEARCH_PLACEHOLDER: "Search homework…",
  EMPTY_TITLE: "No homework yet",
  EMPTY_DESCRIPTION: "Create the first homework assignment for a class.",
  EMPTY_FILTERED_TITLE: "No homework matches your search",
  EMPTY_FILTERED_DESCRIPTION: "Try adjusting your search or filters.",
  ERROR_TITLE: "Failed to load homework",
} as const;
