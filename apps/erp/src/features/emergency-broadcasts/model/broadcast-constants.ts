export const BROADCAST_LIST_SORT_FIELDS = {
  CREATED_AT: "createdAt",
} as const;

export const BROADCASTS_PAGE_COPY = {
  TITLE: "Emergency Broadcasts",
  DESCRIPTION: "Send urgent multi-channel alerts with delivery confirmation.",
  EMPTY_TITLE: "No broadcasts yet",
  EMPTY_DESCRIPTION:
    "Create an emergency broadcast to send urgent alerts to parents and staff.",
  SEARCH_PLACEHOLDER: "Search broadcasts...",
} as const;

export const BROADCAST_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sending: "Sending",
  sent: "Sent",
  failed: "Failed",
} as const;
