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
  IconLock,
  IconMailForward,
  IconMap,
  IconMapPin,
  IconMessageCircle,
  IconNotebook,
  IconPackage,
  IconPalette,
  IconReportMoney,
  IconShieldLock,
  IconSpeakerphone,
  IconTruck,
  IconUserSearch,
  IconUsers,
  IconUsersGroup,
  IconAlertTriangle,
  IconArrowsExchange,
  IconUsersPlus,
  IconSteeringWheel,
  IconTool,
  IconShoppingCart,
  IconBuildingWarehouse,
  IconTransfer,
  IconChartPie,
  IconReceipt,
  IconAward,
  IconUrgent,
  IconCoin,
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

export const NAV_PTM: readonly NavItem[] = [
  {
    icon: IconUsersPlus,
    permission: PERMISSIONS.ACADEMICS_READ,
    title: "PTM Sessions",
    url: ERP_ROUTES.PTM_SESSIONS,
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
    badgeLabel: "Now",
    icon: IconAlertTriangle,
    permission: PERMISSIONS.FEES_READ,
    title: "Fee Defaulters",
    url: ERP_ROUTES.FEE_DEFAULTERS,
  },
  {
    badgeLabel: "Later",
    disabled: true,
    icon: IconFileText,
    title: "Ledger",
    url: ERP_ROUTES.FEE_LEDGER,
  },
  {
    icon: IconFolder,
    permission: PERMISSIONS.EXPENSES_READ,
    title: "Expense Categories",
    url: ERP_ROUTES.EXPENSE_CATEGORIES,
  },
  {
    icon: IconReceipt,
    permission: PERMISSIONS.EXPENSES_READ,
    title: "Expenses",
    url: ERP_ROUTES.EXPENSES,
  },
  {
    icon: IconCoin,
    permission: PERMISSIONS.INCOME_READ,
    title: "Income",
    url: ERP_ROUTES.INCOME_RECORDS,
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
    badgeLabel: "Now",
    icon: IconUsers,
    permission: PERMISSIONS.STUDENTS_READ,
    title: "Student Strength",
    url: ERP_ROUTES.REPORTS_STUDENT_STRENGTH,
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
  {
    icon: IconUrgent,
    permission: PERMISSIONS.EMERGENCY_BROADCAST_SEND,
    title: "Emergency Broadcasts",
    url: ERP_ROUTES.EMERGENCY_BROADCASTS,
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
  {
    icon: IconClockHour4,
    permission: PERMISSIONS.LIBRARY_READ,
    title: "Reservations",
    url: ERP_ROUTES.LIBRARY_RESERVATIONS,
  },
  {
    icon: IconChartPie,
    permission: PERMISSIONS.LIBRARY_READ,
    title: "Dashboard",
    url: ERP_ROUTES.LIBRARY_DASHBOARD,
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
  {
    icon: IconSteeringWheel,
    permission: PERMISSIONS.TRANSPORT_READ,
    title: "Drivers",
    url: ERP_ROUTES.TRANSPORT_DRIVERS,
  },
  {
    icon: IconTool,
    permission: PERMISSIONS.TRANSPORT_READ,
    title: "Maintenance",
    url: ERP_ROUTES.TRANSPORT_MAINTENANCE,
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
    icon: IconBuildingEstate,
    permission: PERMISSIONS.HOSTEL_READ,
    title: "Hostel Buildings",
    url: ERP_ROUTES.HOSTEL_BUILDINGS,
  },
  {
    icon: IconBuildingEstate,
    permission: PERMISSIONS.HOSTEL_READ,
    title: "Hostel Rooms",
    url: ERP_ROUTES.HOSTEL_ROOMS,
  },
  {
    icon: IconBuildingEstate,
    permission: PERMISSIONS.HOSTEL_READ,
    title: "Bed Allocations",
    url: ERP_ROUTES.HOSTEL_ALLOCATIONS,
  },
  {
    icon: IconBuildingEstate,
    permission: PERMISSIONS.HOSTEL_READ,
    title: "Mess Plans",
    url: ERP_ROUTES.HOSTEL_MESS_PLANS,
  },
  {
    icon: IconClipboardList,
    permission: PERMISSIONS.HOSTEL_READ,
    title: "Mess Assignments",
    url: ERP_ROUTES.HOSTEL_MESS_ASSIGNMENTS,
  },
  {
    icon: IconTransfer,
    permission: PERMISSIONS.HOSTEL_READ,
    title: "Room Transfers",
    url: ERP_ROUTES.HOSTEL_ROOM_TRANSFERS,
  },
  {
    icon: IconChartPie,
    permission: PERMISSIONS.HOSTEL_READ,
    title: "Occupancy",
    url: ERP_ROUTES.HOSTEL_OCCUPANCY,
  },
];

export const NAV_INVENTORY: readonly NavItem[] = [
  {
    icon: IconFolder,
    permission: PERMISSIONS.INVENTORY_READ,
    title: "Categories",
    url: ERP_ROUTES.INVENTORY_CATEGORIES,
  },
  {
    icon: IconPackage,
    permission: PERMISSIONS.INVENTORY_READ,
    title: "Items",
    url: ERP_ROUTES.INVENTORY_ITEMS,
  },
  {
    icon: IconArrowsExchange,
    permission: PERMISSIONS.INVENTORY_READ,
    title: "Stock Transactions",
    url: ERP_ROUTES.INVENTORY_TRANSACTIONS,
  },
  {
    icon: IconAlertTriangle,
    permission: PERMISSIONS.INVENTORY_READ,
    title: "Low Stock",
    url: ERP_ROUTES.INVENTORY_LOW_STOCK,
  },
  {
    icon: IconBuildingWarehouse,
    permission: PERMISSIONS.INVENTORY_READ,
    title: "Vendors",
    url: ERP_ROUTES.INVENTORY_VENDORS,
  },
  {
    icon: IconShoppingCart,
    permission: PERMISSIONS.INVENTORY_READ,
    title: "Purchase Orders",
    url: ERP_ROUTES.INVENTORY_PURCHASE_ORDERS,
  },
];

export const NAV_HR: readonly NavItem[] = [
  {
    icon: IconCalendarStats,
    permission: PERMISSIONS.STAFF_ATTENDANCE_READ,
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
    icon: IconCalendar,
    permission: PERMISSIONS.LEAVE_READ,
    title: "Leave Balances",
    url: ERP_ROUTES.LEAVE_BALANCES,
  },
  {
    icon: IconCalendar,
    permission: PERMISSIONS.LEAVE_READ,
    title: "Team Calendar",
    url: ERP_ROUTES.LEAVE_TEAM_CALENDAR,
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

export const NAV_SCHOLARSHIPS: readonly NavItem[] = [
  {
    icon: IconAward,
    permission: PERMISSIONS.SCHOLARSHIPS_READ,
    title: "Scholarships",
    url: ERP_ROUTES.SCHOLARSHIPS,
  },
  {
    icon: IconFileDescription,
    permission: PERMISSIONS.SCHOLARSHIPS_READ,
    title: "Applications",
    url: ERP_ROUTES.SCHOLARSHIP_APPLICATIONS,
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
    icon: IconFileDescription,
    permission: PERMISSIONS.INSTITUTION_SETTINGS_MANAGE,
    title: "Documents",
    url: ERP_ROUTES.SETTINGS_DOCUMENTS,
  },
  {
    icon: IconClipboardList,
    permission: PERMISSIONS.AUDIT_READ,
    title: "Audit Trail",
    url: ERP_ROUTES.SETTINGS_AUDIT,
  },
  {
    icon: IconLock,
    permission: PERMISSIONS.DPDPA_MANAGE,
    title: "DPDPA Compliance",
    url: ERP_ROUTES.SETTINGS_DPDPA,
  },
];

/**
 * All staff nav items aggregated from every group. Used to look up nav items
 * by URL for features like sidebar favorites.
 */
const ALL_STAFF_NAV_ITEMS: readonly NavItem[] = [
  ...NAV_HOME,
  ...NAV_PEOPLE,
  ...NAV_ADMISSIONS,
  ...NAV_PTM,
  ...NAV_TEACHING,
  ...NAV_ACADEMIC_SETUP,
  ...NAV_RECORDS,
  ...NAV_FINANCE,
  ...NAV_REPORTS,
  ...NAV_COMMUNICATION,
  ...NAV_LIBRARY,
  ...NAV_TRANSPORT,
  ...NAV_SERVICES,
  ...NAV_INVENTORY,
  ...NAV_HR,
  ...NAV_SCHOLARSHIPS,
  ...NAV_SETTINGS,
];

const NAV_ITEMS_BY_URL = new Map<string, NavItem>(
  ALL_STAFF_NAV_ITEMS.map((item) => [item.url, item]),
);

export function findNavItemByUrl(url: string): NavItem | undefined {
  return NAV_ITEMS_BY_URL.get(url);
}
