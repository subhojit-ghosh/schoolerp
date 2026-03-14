export const ACADEMIC_YEAR_LIST_SORT_FIELDS = {
  CURRENT: "current",
  END_DATE: "endDate",
  NAME: "name",
  START_DATE: "startDate",
} as const;

export const ACADEMIC_YEARS_PAGE_COPY = {
  DESCRIPTION:
    "Manage the institution timeline and keep one current academic year configured.",
  EMPTY_DESCRIPTION:
    "Create the first academic year to establish the institution timeline.",
  EMPTY_FILTERED_DESCRIPTION: "Try adjusting your search.",
  EMPTY_FILTERED_TITLE: "No academic years match your search",
  EMPTY_TITLE: "No academic years yet",
  ERROR_TITLE: "Failed to load academic years",
  SEARCH_PLACEHOLDER: "Search academic years…",
  TITLE: "Academic years",
} as const;
