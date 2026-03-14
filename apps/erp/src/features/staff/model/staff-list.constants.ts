export const STAFF_LIST_SORT_FIELDS = {
  CAMPUS: "campus",
  NAME: "name",
  STATUS: "status",
} as const;

export const STAFF_PAGE_COPY = {
  DESCRIPTION: "Manage institution staff memberships, campus ownership, and role assignment.",
  EMPTY_DESCRIPTION: "Add the first staff member to establish campus ownership and role assignment.",
  EMPTY_FILTERED_DESCRIPTION: "Try adjusting your search.",
  EMPTY_FILTERED_TITLE: "No staff match your search",
  EMPTY_TITLE: "No staff yet",
  ERROR_TITLE: "Failed to load staff",
  SEARCH_PLACEHOLDER: "Search staff…",
  TITLE: "Staff",
} as const;
