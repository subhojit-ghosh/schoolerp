import {
  IconAlertCircle,
  IconBellRinging2,
  IconCalendarStats,
  IconCertificate,
  IconCurrencyRupee,
  IconFileDescription,
  IconMoodCheck,
  IconSpeakerphone,
  IconUsersGroup,
  type Icon,
} from "@tabler/icons-react";
import { ERP_ROUTES } from "@/constants/routes";

export const NOTIFICATION_FILTERS = {
  ALL: "all",
  UNREAD: "unread",
  ACTION_REQUIRED: "action_required",
} as const;

export const NOTIFICATION_TONES = {
  CRITICAL: "critical",
  INFO: "info",
  POSITIVE: "positive",
  WARNING: "warning",
} as const;

export const NOTIFICATION_CHANNELS = {
  SYSTEM: "System",
  ACADEMICS: "Academics",
  OPERATIONS: "Operations",
  FINANCE: "Finance",
  COMMUNITY: "Community",
} as const;

type NotificationFilter =
  (typeof NOTIFICATION_FILTERS)[keyof typeof NOTIFICATION_FILTERS];
type NotificationTone =
  (typeof NOTIFICATION_TONES)[keyof typeof NOTIFICATION_TONES];

export type NotificationAction = {
  href: string;
  label: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  campus: string;
  timestamp: string;
  relativeTime: string;
  sender: string;
  senderInitials: string;
  audience: string;
  channel: string;
  tone: NotificationTone;
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

export const NOTIFICATIONS_PAGE_COPY = {
  DESCRIPTION:
    "Track broadcasts, approvals, and campus operations without leaving the ERP shell.",
  TITLE: "Notifications",
} as const;

export const NOTIFICATION_SECTIONS: readonly NotificationSection[] = [
  {
    id: "today",
    label: "Today",
    summary:
      "Priority items that still need attention before the school day closes.",
    items: [
      {
        id: "attendance-freeze",
        title: "Attendance freeze pending for Class IX B",
        message:
          "Naihati campus has 6 students without final attendance confirmation for period 1 and period 2.",
        campus: "Naihati",
        timestamp: "Today, 8:45 AM",
        relativeTime: "12 min ago",
        sender: "Attendance Desk",
        senderInitials: "AD",
        audience: "Staff operations",
        channel: NOTIFICATION_CHANNELS.OPERATIONS,
        tone: NOTIFICATION_TONES.WARNING,
        unread: true,
        actionRequired: true,
        actions: [
          { href: ERP_ROUTES.ATTENDANCE, label: "Review attendance" },
          { href: ERP_ROUTES.STAFF, label: "Contact class staff" },
        ],
        Icon: IconCalendarStats,
      },
      {
        id: "exam-hall-ticket",
        title: "Hall-ticket approval queued for 18 students",
        message:
          "Mid-term exam credentials are blocked until fee exceptions are confirmed by the exam office.",
        campus: "Naihati",
        timestamp: "Today, 8:10 AM",
        relativeTime: "47 min ago",
        sender: "Exam Cell",
        senderInitials: "EC",
        audience: "Institution admin",
        channel: NOTIFICATION_CHANNELS.ACADEMICS,
        tone: NOTIFICATION_TONES.CRITICAL,
        unread: true,
        actionRequired: true,
        actions: [
          { href: ERP_ROUTES.EXAMS, label: "Open exam queue" },
          { href: ERP_ROUTES.FEES, label: "Review fee holds" },
        ],
        Icon: IconCertificate,
      },
      {
        id: "admission-broadcast",
        title: "Admission follow-up broadcast delivered",
        message:
          "The admissions team message reached 124 guardians with a 92% delivery rate across SMS and email.",
        campus: "All campuses",
        timestamp: "Today, 7:20 AM",
        relativeTime: "1 hr ago",
        sender: "Communications",
        senderInitials: "CM",
        audience: "Admissions team",
        channel: NOTIFICATION_CHANNELS.COMMUNITY,
        tone: NOTIFICATION_TONES.POSITIVE,
        unread: true,
        actionRequired: false,
        actions: [
          { href: ERP_ROUTES.DASHBOARD, label: "View campaign summary" },
        ],
        Icon: IconSpeakerphone,
      },
    ],
  },
  {
    id: "this-week",
    label: "Earlier this week",
    summary: "Operational updates, parent communication, and finance alerts.",
    items: [
      {
        id: "fee-follow-up",
        title: "Fee collection follow-up needed for 23 families",
        message:
          "Outstanding transport fee reminders are still pending for the March cycle at Naihati campus.",
        campus: "Naihati",
        timestamp: "Thursday, 4:30 PM",
        relativeTime: "2 days ago",
        sender: "Accounts Office",
        senderInitials: "AO",
        audience: "Finance staff",
        channel: NOTIFICATION_CHANNELS.FINANCE,
        tone: NOTIFICATION_TONES.WARNING,
        unread: false,
        actionRequired: true,
        actions: [{ href: ERP_ROUTES.FEES, label: "Open dues list" }],
        Icon: IconCurrencyRupee,
      },
      {
        id: "guardian-documents",
        title: "Guardian documents verified for new admissions",
        message:
          "All KYC files for the latest admission batch were verified and marked ready for enrollment.",
        campus: "Barasat",
        timestamp: "Wednesday, 1:05 PM",
        relativeTime: "4 days ago",
        sender: "Admissions Desk",
        senderInitials: "AM",
        audience: "Front office",
        channel: NOTIFICATION_CHANNELS.ACADEMICS,
        tone: NOTIFICATION_TONES.POSITIVE,
        unread: false,
        actionRequired: false,
        actions: [{ href: ERP_ROUTES.STUDENTS, label: "Review students" }],
        Icon: IconFileDescription,
      },
      {
        id: "roles-audit",
        title: "Staff role audit completed",
        message:
          "Three legacy staff accounts were moved out of admin scope after the weekly access review.",
        campus: "All campuses",
        timestamp: "Tuesday, 5:40 PM",
        relativeTime: "5 days ago",
        sender: "Security Review",
        senderInitials: "SR",
        audience: "Institution admin",
        channel: NOTIFICATION_CHANNELS.SYSTEM,
        tone: NOTIFICATION_TONES.INFO,
        unread: false,
        actionRequired: false,
        actions: [{ href: ERP_ROUTES.SETTINGS_ROLES, label: "Inspect roles" }],
        Icon: IconUsersGroup,
      },
      {
        id: "wellbeing-note",
        title: "Student wellbeing note acknowledged",
        message:
          "Class teacher follow-up for the submitted guardian concern has been logged and shared with the counselor.",
        campus: "Naihati",
        timestamp: "Monday, 9:15 AM",
        relativeTime: "6 days ago",
        sender: "Student Support",
        senderInitials: "SS",
        audience: "Class teachers",
        channel: NOTIFICATION_CHANNELS.COMMUNITY,
        tone: NOTIFICATION_TONES.INFO,
        unread: false,
        actionRequired: false,
        actions: [{ href: ERP_ROUTES.STUDENTS, label: "Open student file" }],
        Icon: IconMoodCheck,
      },
    ],
  },
] as const;

export const NOTIFICATION_TOTAL_COUNT = NOTIFICATION_SECTIONS.reduce(
  (count, section) => count + section.items.length,
  0,
);

export const NOTIFICATION_UNREAD_COUNT = NOTIFICATION_SECTIONS.reduce(
  (count, section) =>
    count + section.items.filter((item) => item.unread).length,
  0,
);

export const NOTIFICATION_ACTION_REQUIRED_COUNT = NOTIFICATION_SECTIONS.reduce(
  (count, section) =>
    count + section.items.filter((item) => item.actionRequired).length,
  0,
);

export const NOTIFICATION_UNREAD_ITEMS = NOTIFICATION_SECTIONS.flatMap(
  (section) => section.items,
).filter((item) => item.unread);

export const NOTIFICATION_FILTER_META: Record<
  NotificationFilter,
  { count: number; label: string }
> = {
  [NOTIFICATION_FILTERS.ALL]: {
    count: NOTIFICATION_TOTAL_COUNT,
    label: "All",
  },
  [NOTIFICATION_FILTERS.UNREAD]: {
    count: NOTIFICATION_UNREAD_COUNT,
    label: "Unread",
  },
  [NOTIFICATION_FILTERS.ACTION_REQUIRED]: {
    count: NOTIFICATION_ACTION_REQUIRED_COUNT,
    label: "Needs action",
  },
};

export const NOTIFICATION_HIGHLIGHTS = [
  {
    id: "unread",
    label: "Unread",
    value: `${NOTIFICATION_UNREAD_COUNT}`,
    caption: "Fresh updates since your last check-in",
    Icon: IconBellRinging2,
  },
  {
    id: "action",
    label: "Needs action",
    value: `${NOTIFICATION_ACTION_REQUIRED_COUNT}`,
    caption: "Items that block a follow-up or approval",
    Icon: IconAlertCircle,
  },
  {
    id: "campuses",
    label: "Campus coverage",
    value: "2 campuses",
    caption: "Naihati and Barasat updates are represented",
    Icon: IconUsersGroup,
  },
] as const;
