export const LEAVE_APPLICATION_SORT_FIELDS = {
  FROM_DATE: "fromDate",
  CREATED_AT: "createdAt",
  STATUS: "status",
} as const;

export const LEAVE_APPLICATIONS_PAGE_COPY = {
  TITLE: "Leave Applications",
  DESCRIPTION: "Review and manage staff leave requests.",
  SEARCH_PLACEHOLDER: "Search by staff name or leave type…",
  EMPTY_TITLE: "No leave applications",
  EMPTY_DESCRIPTION: "Leave requests submitted by staff will appear here.",
  EMPTY_FILTERED_TITLE: "No applications match your search",
  EMPTY_FILTERED_DESCRIPTION: "Try adjusting your search or filters.",
  ERROR_TITLE: "Failed to load leave applications",
} as const;

export const LEAVE_TYPES_PAGE_COPY = {
  TITLE: "Leave Types",
  DESCRIPTION: "Define leave categories available to staff.",
  EMPTY_TITLE: "No leave types",
  EMPTY_DESCRIPTION: "Add leave types such as Casual Leave, Sick Leave, etc.",
  ERROR_TITLE: "Failed to load leave types",
} as const;
