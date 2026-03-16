export const FEE_STRUCTURE_LIST_SORT_FIELDS = {
  NAME: "name",
  DUE_DATE: "dueDate",
  AMOUNT: "amount",
  ACADEMIC_YEAR: "academicYear",
} as const;

export const FEE_STRUCTURES_PAGE_COPY = {
  TITLE: "Fee Structures",
  DESCRIPTION: "Define fee categories by academic year. Assign them to students to track collection.",
  SEARCH_PLACEHOLDER: "Search fee structures...",
  EMPTY_TITLE: "No fee structures yet",
  EMPTY_DESCRIPTION: "Create a fee structure to start assigning fees to students.",
  EMPTY_FILTERED_TITLE: "No matching fee structures",
  EMPTY_FILTERED_DESCRIPTION: "Try a different search term or clear the filter.",
  ERROR_TITLE: "Could not load fee structures",
} as const;
