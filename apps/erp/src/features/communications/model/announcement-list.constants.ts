export const ANNOUNCEMENT_LIST_SORT_FIELDS = {
  PUBLISHED_AT: "publishedAt",
  STATUS: "status",
  TITLE: "title",
  AUDIENCE: "audience",
} as const;

export const ANNOUNCEMENTS_PAGE_COPY = {
  TITLE: "Announcements",
  DESCRIPTION: "Broadcast school-wide updates and keep communication inside the ERP.",
  SEARCH_PLACEHOLDER: "Search announcements…",
  EMPTY_TITLE: "No announcements yet",
  EMPTY_DESCRIPTION: "Create the first announcement for your institution.",
  EMPTY_FILTERED_TITLE: "No announcements match your search",
  EMPTY_FILTERED_DESCRIPTION: "Try adjusting your search or filters.",
  ERROR_TITLE: "Failed to load announcements",
} as const;
