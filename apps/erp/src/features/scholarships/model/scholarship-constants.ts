export const SCHOLARSHIP_LIST_SORT_FIELDS = {
  NAME: "name",
  CREATED_AT: "createdAt",
} as const;

export const SCHOLARSHIP_APPLICATION_LIST_SORT_FIELDS = {
  CREATED_AT: "createdAt",
} as const;

export const SCHOLARSHIPS_PAGE_COPY = {
  TITLE: "Scholarships",
  DESCRIPTION: "Define scholarship types and manage availability.",
  EMPTY_TITLE: "No scholarships yet",
  EMPTY_DESCRIPTION: "Create a scholarship to start accepting applications.",
  SEARCH_PLACEHOLDER: "Search scholarships...",
} as const;

export const SCHOLARSHIP_APPLICATIONS_PAGE_COPY = {
  TITLE: "Scholarship Applications",
  DESCRIPTION: "Review and manage student scholarship applications.",
  EMPTY_TITLE: "No applications yet",
  EMPTY_DESCRIPTION:
    "Scholarship applications will appear here once students apply.",
  SEARCH_PLACEHOLDER: "Search applications...",
} as const;

export const SCHOLARSHIP_TYPE_LABELS: Record<string, string> = {
  merit: "Merit",
  need_based: "Need-Based",
  sports: "Sports",
  government_pre_matric: "Government Pre-Matric",
  government_post_matric: "Government Post-Matric",
  minority: "Minority",
  sc_st: "SC/ST",
  other: "Other",
} as const;

export const SCHOLARSHIP_APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
} as const;
