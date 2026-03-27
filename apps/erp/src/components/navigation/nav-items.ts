import {
  IconBook2,
  IconBooks,
  IconClockHour4,
  IconBuildingEstate,
  IconCalendar,
  IconCalendarStats,
  IconCertificate,
  IconChartBar,
  IconChevronsUp,
  IconClipboardList,
  IconCurrencyRupee,
  IconDashboard,
  IconFileDescription,
  IconFileText,
  IconFolder,
  IconLayoutGrid,
  IconCreditCard,
  IconMailForward,
  IconMap,
  IconMapPin,
  IconMessageCircle,
  IconNotebook,
  IconPalette,
  IconReportMoney,
  IconShieldLock,
  IconSpeakerphone,
  IconTruck,
  IconUserSearch,
  IconUsers,
  IconUsersGroup,
  type Icon,
} from "@tabler/icons-react";
import { PERMISSIONS } from "@repo/contracts";
import type { PermissionSlug } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";

export type NavItem = {
  badgeLabel?: string;
  disabled?: boolean;
  icon?: Icon;
  permission?: PermissionSlug;
  title: string;
  url: string;
};

export function getActionableNavItems(items: readonly NavItem[]): NavItem[] {
  return items.filter((item) => !item.disabled);
}

export const NAV_HOME: readonly NavItem[] = [
  { icon: IconDashboard, title: "Dashboard", url: ERP_ROUTES.DASHBOARD },
  { icon: IconCalendar, title: "Calendar", url: ERP_ROUTES.CALENDAR },
];

export const NAV_PEOPLE: readonly NavItem[] = [
  {
    icon: IconUsers,
    permission: PERMISSIONS.STUDENTS_READ,
    title: "Students",
    url: ERP_ROUTES.STUDENTS,
  },
  {
    icon: IconUserSearch,
    permission: PERMISSIONS.GUARDIANS_READ,
    title: "Guardians",
    url: ERP_ROUTES.GUARDIANS,
  },
  {
    icon: IconUsersGroup,
    permission: PERMISSIONS.STAFF_READ,
    title: "Staff",
    url: ERP_ROUTES.STAFF,
  },
];

export const NAV_ADMISSIONS: readonly NavItem[] = [
  {
    icon: IconUserSearch,
    permission: PERMISSIONS.ADMISSIONS_READ,
    title: "Enquiries",
    url: ERP_ROUTES.ADMISSIONS_ENQUIRIES,
  },
  {
    icon: IconFileDescription,
    permission: PERMISSIONS.ADMISSIONS_READ,
    title: "Applications",
    url: ERP_ROUTES.ADMISSIONS_APPLICATIONS,
  },
];

export const NAV_TEACHING: readonly NavItem[] = [
  {
    icon: IconCalendarStats,
    permission: PERMISSIONS.ATTENDANCE_READ,
    title: "Attendance",
    url: ERP_ROUTES.ATTENDANCE,
  },
  {
    icon: IconLayoutGrid,
    permission: PERMISSIONS.ACADEMICS_READ,
    title: "Timetable",
    url: ERP_ROUTES.TIMETABLE,
  },
  {
    icon: IconUsersGroup,
    permission: PERMISSIONS.ACADEMICS_READ,
    title: "Teacher Schedule",
    url: ERP_ROUTES.TIMETABLE_TEACHER,
  },
  {
    icon: IconCertificate,
    permission: PERMISSIONS.EXAMS_READ,
    title: "Exams",
    url: ERP_ROUTES.EXAMS,
  },
  {
    icon: IconNotebook,
    permission: PERMISSIONS.HOMEWORK_READ,
    title: "Homework",
    url: ERP_ROUTES.HOMEWORK,
  },
];

export const NAV_ACADEMIC_SETUP: readonly NavItem[] = [
  {
    icon: IconBook2,
    permission: PERMISSIONS.ACADEMICS_READ,
    title: "Academic Years",
    url: ERP_ROUTES.ACADEMIC_YEARS,
  },
  {
    icon: IconBook2,
    permission: PERMISSIONS.ACADEMICS_READ,
    title: "Classes",
    url: ERP_ROUTES.CLASSES,
  },
  {
    icon: IconBooks,
    permission: PERMISSIONS.ACADEMICS_READ,
    title: "Subjects",
    url: ERP_ROUTES.SUBJECTS,
  },
  {
    icon: IconClockHour4,
    permission: PERMISSIONS.ACADEMICS_READ,
    title: "Bell Schedules",
    url: ERP_ROUTES.BELL_SCHEDULES,
  },
  {
    icon: IconChevronsUp,
    permission: PERMISSIONS.ACADEMICS_MANAGE,
    title: "Rollover",
    url: ERP_ROUTES.STUDENT_ROLLOVER,
  },
];

export const NAV_RECORDS: readonly NavItem[] = [
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconFolder,
    title: "Documents",
    url: ERP_ROUTES.DOCUMENTS,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconCertificate,
    title: "Certificates",
    url: ERP_ROUTES.CERTIFICATES,
  },
  {
    badgeLabel: "Later",
    disabled: true,
    icon: IconClipboardList,
    title: "Discipline",
    url: ERP_ROUTES.DISCIPLINE,
  },
];

export const NAV_FINANCE: readonly NavItem[] = [
  {
    icon: IconCurrencyRupee,
    permission: PERMISSIONS.FEES_READ,
    title: "Fee Structures",
    url: ERP_ROUTES.FEE_STRUCTURES,
  },
  {
    icon: IconReportMoney,
    permission: PERMISSIONS.FEES_READ,
    title: "Fee Assignments",
    url: ERP_ROUTES.FEE_ASSIGNMENTS,
  },
  {
    icon: IconReportMoney,
    permission: PERMISSIONS.FEES_READ,
    title: "Fee Dues",
    url: ERP_ROUTES.FEE_DUES,
  },
  {
    badgeLabel: "Later",
    disabled: true,
    icon: IconFileText,
    title: "Ledger",
    url: ERP_ROUTES.FEE_LEDGER,
  },
];

export const NAV_REPORTS: readonly NavItem[] = [
  {
    badgeLabel: "Now",
    icon: IconCalendarStats,
    permission: PERMISSIONS.ATTENDANCE_READ,
    title: "Attendance",
    url: ERP_ROUTES.REPORTS_ATTENDANCE,
  },
  {
    badgeLabel: "Next",
    disabled: true,
    icon: IconChartBar,
    title: "Exams",
    url: ERP_ROUTES.REPORTS_EXAMS,
  },
  {
    badgeLabel: "Now",
    icon: IconReportMoney,
    permission: PERMISSIONS.FEES_READ,
    title: "Fees",
    url: ERP_ROUTES.FEE_REPORTS,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconFileDescription,
    title: "Admissions",
    url: ERP_ROUTES.REPORTS_ADMISSIONS,
  },
  {
    badgeLabel: "Later",
    disabled: true,
    icon: IconUsers,
    title: "Students",
    url: ERP_ROUTES.REPORTS_STUDENTS,
  },
];

export const NAV_COMMUNICATION: readonly NavItem[] = [
  {
    badgeLabel: "Now",
    icon: IconSpeakerphone,
    permission: PERMISSIONS.COMMUNICATION_READ,
    title: "Announcements",
    url: ERP_ROUTES.ANNOUNCEMENTS,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconMessageCircle,
    title: "Messages",
    url: ERP_ROUTES.MESSAGES,
  },
];

export const NAV_LIBRARY: readonly NavItem[] = [
  {
    icon: IconBooks,
    permission: PERMISSIONS.LIBRARY_READ,
    title: "Books",
    url: ERP_ROUTES.LIBRARY_BOOKS,
  },
  {
    icon: IconBook2,
    permission: PERMISSIONS.LIBRARY_READ,
    title: "Transactions",
    url: ERP_ROUTES.LIBRARY_TRANSACTIONS,
  },
];

export const NAV_TRANSPORT: readonly NavItem[] = [
  {
    icon: IconMap,
    permission: PERMISSIONS.TRANSPORT_READ,
    title: "Routes",
    url: ERP_ROUTES.TRANSPORT_ROUTES,
  },
  {
    icon: IconTruck,
    permission: PERMISSIONS.TRANSPORT_READ,
    title: "Vehicles",
    url: ERP_ROUTES.TRANSPORT_VEHICLES,
  },
  {
    icon: IconMapPin,
    permission: PERMISSIONS.TRANSPORT_READ,
    title: "Assignments",
    url: ERP_ROUTES.TRANSPORT_ASSIGNMENTS,
  },
];

export const NAV_SERVICES: readonly NavItem[] = [
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconBooks,
    title: "Library",
    url: ERP_ROUTES.LIBRARY,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconTruck,
    title: "Transport",
    url: ERP_ROUTES.TRANSPORT,
  },
  {
    badgeLabel: "Later",
    disabled: true,
    icon: IconLayoutGrid,
    title: "Inventory",
    url: ERP_ROUTES.INVENTORY,
  },
  {
    badgeLabel: "Later",
    disabled: true,
    icon: IconBuildingEstate,
    title: "Hostel",
    url: ERP_ROUTES.HOSTEL,
  },
];

export const NAV_HR: readonly NavItem[] = [
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconCalendarStats,
    title: "Staff Attendance",
    url: ERP_ROUTES.STAFF_ATTENDANCE,
  },
  {
    icon: IconCalendar,
    permission: PERMISSIONS.LEAVE_READ,
    title: "Staff Leave",
    url: ERP_ROUTES.LEAVE_APPLICATIONS,
  },
  {
    icon: IconCurrencyRupee,
    permission: PERMISSIONS.PAYROLL_READ,
    title: "Salary Components",
    url: ERP_ROUTES.PAYROLL_SALARY_COMPONENTS,
  },
  {
    icon: IconFileText,
    permission: PERMISSIONS.PAYROLL_READ,
    title: "Salary Templates",
    url: ERP_ROUTES.PAYROLL_SALARY_TEMPLATES,
  },
  {
    icon: IconUsersGroup,
    permission: PERMISSIONS.PAYROLL_READ,
    title: "Salary Assignments",
    url: ERP_ROUTES.PAYROLL_SALARY_ASSIGNMENTS,
  },
  {
    icon: IconReportMoney,
    permission: PERMISSIONS.PAYROLL_READ,
    title: "Payroll Runs",
    url: ERP_ROUTES.PAYROLL_RUNS,
  },
];

export const NAV_SETTINGS: readonly (NavItem & {
  permission: PermissionSlug;
})[] = [
  {
    icon: IconBuildingEstate,
    permission: PERMISSIONS.CAMPUS_MANAGE,
    title: "Campuses",
    url: ERP_ROUTES.SETTINGS_CAMPUSES,
  },
  {
    icon: IconPalette,
    permission: PERMISSIONS.INSTITUTION_SETTINGS_MANAGE,
    title: "Branding",
    url: ERP_ROUTES.SETTINGS_BRANDING,
  },
  {
    icon: IconClipboardList,
    permission: PERMISSIONS.ADMISSIONS_MANAGE,
    title: "Admission Fields",
    url: ERP_ROUTES.SETTINGS_ADMISSION_FIELDS,
  },
  {
    icon: IconShieldLock,
    permission: PERMISSIONS.INSTITUTION_ROLES_MANAGE,
    title: "Roles",
    url: ERP_ROUTES.SETTINGS_ROLES,
  },
  {
    icon: IconMailForward,
    permission: PERMISSIONS.INSTITUTION_DELIVERY_MANAGE,
    title: "Delivery",
    url: ERP_ROUTES.SETTINGS_DELIVERY,
  },
  {
    icon: IconCreditCard,
    permission: PERMISSIONS.INSTITUTION_PAYMENT_MANAGE,
    title: "Payment",
    url: ERP_ROUTES.SETTINGS_PAYMENT,
  },
  {
    icon: IconClipboardList,
    permission: PERMISSIONS.AUDIT_READ,
    title: "Audit Trail",
    url: ERP_ROUTES.SETTINGS_AUDIT,
  },
];
