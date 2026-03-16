export const FEE_ASSIGNMENT_LIST_SORT_FIELDS = {
  STUDENT_NAME: "studentName",
  DUE_DATE: "dueDate",
  STATUS: "status",
  AMOUNT: "amount",
} as const;

export const FEE_ASSIGNMENTS_PAGE_COPY = {
  TITLE: "Fee Assignments",
  DESCRIPTION: "Track fee assignments and collect payments from students.",
  SEARCH_PLACEHOLDER: "Search by student or structure...",
  EMPTY_TITLE: "No fee assignments yet",
  EMPTY_DESCRIPTION: "Assign a fee structure to a student to start tracking payments.",
  EMPTY_FILTERED_TITLE: "No matching assignments",
  EMPTY_FILTERED_DESCRIPTION: "Try a different search term or clear the filter.",
  ERROR_TITLE: "Could not load fee assignments",
} as const;
