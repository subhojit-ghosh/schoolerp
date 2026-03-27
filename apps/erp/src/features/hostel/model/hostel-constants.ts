export const BUILDING_LIST_SORT_FIELDS = {
  NAME: "name",
  CREATED_AT: "createdAt",
} as const;

export const ROOM_LIST_SORT_FIELDS = {
  ROOM_NUMBER: "roomNumber",
  FLOOR: "floor",
  CREATED_AT: "createdAt",
} as const;

export const ALLOCATION_LIST_SORT_FIELDS = {
  BED_NUMBER: "bedNumber",
  START_DATE: "startDate",
  CREATED_AT: "createdAt",
} as const;

export const MESS_PLAN_LIST_SORT_FIELDS = {
  NAME: "name",
  CREATED_AT: "createdAt",
} as const;

export const BUILDINGS_PAGE_COPY = {
  TITLE: "Hostel Buildings",
  DESCRIPTION: "Manage hostel buildings and their details.",
  EMPTY_TITLE: "No buildings yet",
  EMPTY_DESCRIPTION: "Create a hostel building to get started.",
  SEARCH_PLACEHOLDER: "Search buildings...",
} as const;

export const ROOMS_PAGE_COPY = {
  TITLE: "Hostel Rooms",
  DESCRIPTION: "Manage rooms across hostel buildings.",
  EMPTY_TITLE: "No rooms yet",
  EMPTY_DESCRIPTION: "Create a room in a hostel building.",
  SEARCH_PLACEHOLDER: "Search rooms...",
} as const;

export const ALLOCATIONS_PAGE_COPY = {
  TITLE: "Bed Allocations",
  DESCRIPTION: "Assign students to hostel beds and manage vacations.",
  EMPTY_TITLE: "No allocations yet",
  EMPTY_DESCRIPTION: "Allocate a bed to a student to get started.",
  SEARCH_PLACEHOLDER: "Search allocations...",
} as const;

export const MESS_PLANS_PAGE_COPY = {
  TITLE: "Mess Plans",
  DESCRIPTION: "Configure mess plans and monthly fees.",
  EMPTY_TITLE: "No mess plans yet",
  EMPTY_DESCRIPTION: "Create a mess plan to get started.",
  SEARCH_PLACEHOLDER: "Search mess plans...",
} as const;

export const HOSTEL_BUILDING_TYPE_LABELS: Record<string, string> = {
  boys: "Boys",
  girls: "Girls",
  co_ed: "Co-Ed",
} as const;

export const HOSTEL_ROOM_TYPE_LABELS: Record<string, string> = {
  single: "Single",
  double: "Double",
  dormitory: "Dormitory",
} as const;

export const BED_ALLOCATION_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  vacated: "Vacated",
} as const;
