export const GUARDIAN_LIST_SORT_FIELDS = {
  CAMPUS: "campus",
  NAME: "name",
  STATUS: "status",
} as const;

export const GUARDIANS_PAGE_COPY = {
  DESCRIPTION: "Review guardian contact records and move into student-link management from dedicated detail pages.",
  EMPTY_DESCRIPTION:
    "Guardians are created through the student workflow. Create a student first, then manage the guardian from here.",
  EMPTY_FILTERED_DESCRIPTION: "Try adjusting your search.",
  EMPTY_FILTERED_TITLE: "No guardians match your search",
  EMPTY_TITLE: "No guardians yet",
  ERROR_TITLE: "Failed to load guardians",
  SEARCH_PLACEHOLDER: "Search guardians…",
  TITLE: "Guardians",
} as const;
