import { PERMISSIONS, NAV_GROUPS, ROUTES, type NavGroup } from "@/constants";

export type NavItem = {
  label: string;
  href: string;
  permission: string;
  icon: string; // lucide icon name
  group: NavGroup;
};

export const NAV_ITEMS: NavItem[] = [
  // Core
  { label: "Dashboard",     href: ROUTES.ORG.DASHBOARD,      permission: "",                            icon: "LayoutDashboard", group: NAV_GROUPS.CORE },
  // Academics
  { label: "Students",      href: ROUTES.ORG.STUDENTS,       permission: PERMISSIONS.STUDENTS.READ,     icon: "Users",           group: NAV_GROUPS.ACADEMICS },
  { label: "Classes",       href: ROUTES.ORG.CLASSES,        permission: PERMISSIONS.CLASSES.READ,      icon: "School",          group: NAV_GROUPS.ACADEMICS },
  { label: "Teachers",      href: ROUTES.ORG.TEACHERS,       permission: PERMISSIONS.TEACHERS.READ,     icon: "GraduationCap",   group: NAV_GROUPS.ACADEMICS },
  // Operations
  { label: "Attendance",    href: ROUTES.ORG.ATTENDANCE,     permission: PERMISSIONS.ATTENDANCE.READ,   icon: "CalendarCheck",   group: NAV_GROUPS.OPERATIONS },
  { label: "Exams",         href: ROUTES.ORG.EXAMS,          permission: PERMISSIONS.EXAMS.READ,        icon: "FileText",        group: NAV_GROUPS.OPERATIONS },
  { label: "Admissions",    href: ROUTES.ORG.ADMISSIONS,     permission: PERMISSIONS.ADMISSIONS.READ,   icon: "ClipboardList",   group: NAV_GROUPS.OPERATIONS },
  // Finance
  { label: "Fees",          href: ROUTES.ORG.FEES,           permission: PERMISSIONS.FEES.READ,         icon: "CreditCard",      group: NAV_GROUPS.FINANCE },
  { label: "Invoices",      href: ROUTES.ORG.INVOICES,       permission: PERMISSIONS.INVOICES.READ,     icon: "Receipt",         group: NAV_GROUPS.FINANCE },
  { label: "Reports",       href: ROUTES.ORG.REPORTS,        permission: PERMISSIONS.REPORTS.EXPORT,    icon: "BarChart2",       group: NAV_GROUPS.FINANCE },
  // Communication
  { label: "Messages",      href: ROUTES.ORG.MESSAGES,       permission: PERMISSIONS.COMMUNICATION.READ, icon: "MessageSquare", group: NAV_GROUPS.COMMUNICATION },
  { label: "Announcements", href: ROUTES.ORG.ANNOUNCEMENTS,  permission: PERMISSIONS.COMMUNICATION.READ, icon: "Megaphone",     group: NAV_GROUPS.COMMUNICATION },
  // Administration
  { label: "Members",       href: ROUTES.ORG.MEMBERS,        permission: PERMISSIONS.MEMBERS.INVITE,    icon: "UserPlus",        group: NAV_GROUPS.ADMIN },
  { label: "Roles",         href: ROUTES.ORG.ROLES,          permission: PERMISSIONS.ROLES.MANAGE,      icon: "Shield",          group: NAV_GROUPS.ADMIN },
  { label: "Settings",      href: ROUTES.ORG.SETTINGS,       permission: PERMISSIONS.SETTINGS.READ,     icon: "Settings",        group: NAV_GROUPS.ADMIN },
];

/**
 * Filters nav items by the user's permission set.
 * Super admin sees everything. This is UX filtering only —
 * route handlers must still call assertPermission() independently.
 */
export function filterNavItems(
  items: NavItem[],
  permissionSet: Set<string>,
  isSuperAdmin: boolean,
): NavItem[] {
  if (isSuperAdmin) return items;
  return items.filter((item) => !item.permission || permissionSet.has(item.permission));
}
