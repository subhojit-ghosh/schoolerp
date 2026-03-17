import {
  IconCalendarStats,
  IconCertificate,
  IconCurrencyRupee,
  IconSpeakerphone,
  IconUsersGroup,
  type Icon,
} from "@tabler/icons-react";
import { ERP_ROUTES, buildAnnouncementEditRoute } from "@/constants/routes";

export const NOTIFICATION_FILTERS = {
  ALL: "all",
  UNREAD: "unread",
  ACTION_REQUIRED: "action_required",
} as const;

export const NOTIFICATIONS_PAGE_COPY = {
  DESCRIPTION:
    "Track broadcasts, approvals, and campus operations without leaving the ERP shell.",
  TITLE: "Notifications",
} as const;

export type NotificationFilter =
  (typeof NOTIFICATION_FILTERS)[keyof typeof NOTIFICATION_FILTERS];

export type NotificationAction = {
  href: string;
  label: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  campus: string;
  createdAt: string;
  timestamp: string;
  relativeTime: string;
  sender: string;
  audience: string;
  channel: string;
  tone: "critical" | "info" | "positive" | "warning";
  unread: boolean;
  actionRequired: boolean;
  actions: readonly NotificationAction[];
  Icon: Icon;
};

export type NotificationSection = {
  id: string;
  label: string;
  summary: string;
  items: readonly NotificationItem[];
};

const CHANNEL_LABELS = {
  academics: "Academics",
  community: "Community",
  finance: "Finance",
  operations: "Operations",
  system: "System",
} as const;

const AUDIENCE_LABELS = {
  all: "Everyone",
  guardians: "Guardians",
  staff: "Staff",
  students: "Students",
} as const;

const SECTION_META = {
  earlier: {
    label: "Earlier",
    summary: "Published communication and backend-driven operational updates.",
  },
  today: {
    label: "Today",
    summary: "Recent items that still need attention or acknowledgement.",
  },
} as const;

function getNotificationIcon(channel: keyof typeof CHANNEL_LABELS) {
  switch (channel) {
    case "academics":
      return IconCertificate;
    case "finance":
      return IconCurrencyRupee;
    case "operations":
      return IconCalendarStats;
    case "system":
      return IconUsersGroup;
    case "community":
    default:
      return IconSpeakerphone;
  }
}

function getSectionKey(dateString: string) {
  const createdAt = new Date(dateString);
  const now = new Date();
  const sameDay =
    createdAt.getFullYear() === now.getFullYear() &&
    createdAt.getMonth() === now.getMonth() &&
    createdAt.getDate() === now.getDate();

  return sameDay ? "today" : "earlier";
}

function formatAbsoluteDate(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function formatRelativeDate(dateString: string) {
  const diffMs = new Date(dateString).getTime() - Date.now();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffHours) < 24) {
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    return formatter.format(diffMinutes, "minute");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}

export function resolveNotificationActions(item: {
  actionHref?: string | null;
  actionLabel?: string | null;
  announcementId?: string | null;
}) {
  if (item.actionHref && item.actionLabel) {
    return [{ href: item.actionHref, label: item.actionLabel }] as const;
  }

  if (item.announcementId) {
    return [
      {
        href: buildAnnouncementEditRoute(item.announcementId),
        label: "Open announcement",
      },
    ] as const;
  }

  return [{ href: ERP_ROUTES.DASHBOARD, label: "Open dashboard" }] as const;
}

export function mapNotificationRecordToItem(record: {
  id: string;
  title: string;
  message: string;
  campusName?: string | null;
  createdAt: string;
  senderLabel: string;
  audience: "all" | "staff" | "guardians" | "students";
  channel: "system" | "academics" | "operations" | "finance" | "community";
  tone: "critical" | "info" | "positive" | "warning";
  unread: boolean;
  actionRequired: boolean;
  actionHref?: string | null;
  actionLabel?: string | null;
  announcementId?: string | null;
}): NotificationItem {
  return {
    id: record.id,
    title: record.title,
    message: record.message,
    campus: record.campusName ?? "All campuses",
    createdAt: record.createdAt,
    timestamp: formatAbsoluteDate(record.createdAt),
    relativeTime: formatRelativeDate(record.createdAt),
    sender: record.senderLabel,
    audience: AUDIENCE_LABELS[record.audience],
    channel: CHANNEL_LABELS[record.channel],
    tone: record.tone,
    unread: record.unread,
    actionRequired: record.actionRequired,
    actions: resolveNotificationActions(record),
    Icon: getNotificationIcon(record.channel),
  };
}

export function getNotificationFilterMeta(items: readonly NotificationItem[]) {
  return {
    [NOTIFICATION_FILTERS.ALL]: {
      count: items.length,
      label: "All",
    },
    [NOTIFICATION_FILTERS.UNREAD]: {
      count: items.filter((item) => item.unread).length,
      label: "Unread",
    },
    [NOTIFICATION_FILTERS.ACTION_REQUIRED]: {
      count: items.filter((item) => item.actionRequired).length,
      label: "Action required",
    },
  } as const;
}

export function groupNotificationSections(items: readonly NotificationItem[]) {
  const grouped = new Map<string, NotificationItem[]>();

  for (const item of items) {
    const key = getSectionKey(item.createdAt);
    const sectionItems = grouped.get(key) ?? [];
    sectionItems.push(item);
    grouped.set(key, sectionItems);
  }

  return Array.from(grouped.entries()).map(([key, sectionItems]) => ({
    id: key,
    label: SECTION_META[key as keyof typeof SECTION_META].label,
    summary: SECTION_META[key as keyof typeof SECTION_META].summary,
    items: sectionItems,
  })) as NotificationSection[];
}
