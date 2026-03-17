export const CALENDAR_LIST_SORT_FIELDS = {
  DATE: "date",
  TITLE: "title",
  STATUS: "status",
  TYPE: "type",
} as const;

export const CALENDAR_PAGE_COPY = {
  DESCRIPTION: "Track holidays, exams, and institution events.",
  EMPTY_DESCRIPTION: "Add your first calendar event.",
  EMPTY_FILTERED_DESCRIPTION: "Try adjusting your search.",
  EMPTY_FILTERED_TITLE: "No calendar events match your search",
  EMPTY_TITLE: "No calendar events yet",
  ERROR_TITLE: "Failed to load calendar events",
  SEARCH_PLACEHOLDER: "Search events…",
  TITLE: "Calendar",
} as const;

export const CALENDAR_EVENT_TYPE_OPTIONS = [
  { label: "Event", value: "event" },
  { label: "Holiday", value: "holiday" },
  { label: "Exam", value: "exam" },
  { label: "Deadline", value: "deadline" },
] as const;
