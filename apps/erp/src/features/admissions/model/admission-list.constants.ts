export const ADMISSION_ENQUIRY_LIST_SORT_FIELDS = {
  CAMPUS: "campus",
  CREATED_AT: "createdAt",
  STATUS: "status",
  STUDENT_NAME: "studentName",
} as const;

export const ADMISSION_APPLICATION_LIST_SORT_FIELDS = {
  CAMPUS: "campus",
  CREATED_AT: "createdAt",
  STATUS: "status",
  STUDENT_NAME: "studentName",
} as const;

export const ADMISSION_ENQUIRIES_PAGE_COPY = {
  DESCRIPTION: "Track new admission enquiries and follow-up progress.",
  EMPTY_DESCRIPTION: "Add the first enquiry to start your admissions pipeline.",
  EMPTY_FILTERED_DESCRIPTION: "Try adjusting your search.",
  EMPTY_FILTERED_TITLE: "No enquiries match your search",
  EMPTY_TITLE: "No enquiries yet",
  ERROR_TITLE: "Failed to load admission enquiries",
  SEARCH_PLACEHOLDER: "Search enquiries…",
  TITLE: "Admission Enquiries",
} as const;

export const ADMISSION_APPLICATIONS_PAGE_COPY = {
  DESCRIPTION: "Manage admission applications from submission to decision.",
  EMPTY_DESCRIPTION: "Add the first application to start reviewing candidates.",
  EMPTY_FILTERED_DESCRIPTION: "Try adjusting your search.",
  EMPTY_FILTERED_TITLE: "No applications match your search",
  EMPTY_TITLE: "No applications yet",
  ERROR_TITLE: "Failed to load admission applications",
  SEARCH_PLACEHOLDER: "Search applications…",
  TITLE: "Admission Applications",
} as const;
