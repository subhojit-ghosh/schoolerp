export const STUDENT_LIST_SORT_FIELDS = {
  ADMISSION_NUMBER: "admissionNumber",
  CAMPUS: "campus",
  NAME: "name",
} as const;

export const STUDENTS_PAGE_COPY = {
  DESCRIPTION: "Keep the active roster searchable and move into dedicated student detail workflows when records need more depth.",
  EMPTY_DESCRIPTION: "Add the first student to establish the institution roster.",
  EMPTY_FILTERED_DESCRIPTION: "Try adjusting your search.",
  EMPTY_FILTERED_TITLE: "No students match your search",
  EMPTY_TITLE: "No students yet",
  ERROR_TITLE: "Failed to load students",
  SEARCH_PLACEHOLDER: "Search students…",
  TITLE: "Students",
} as const;
