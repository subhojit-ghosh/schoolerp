import { PERMISSIONS, NAV_GROUPS, ROUTES, type NavGroup } from "@/constants";

export type NavItem = {
  label: string;
  href: string;
  permission: string;
  icon: string; // lucide icon name
  group: NavGroup;
};

export const NAV_ITEMS: NavItem[] = [
  // Academics
  { label: "Attendance",  href: ROUTES.ORG.ATTENDANCE, permission: PERMISSIONS.ATTENDANCE.READ, icon: "CalendarCheck",  group: NAV_GROUPS.ACADEMICS },
  { label: "Grades",      href: ROUTES.ORG.GRADES,     permission: PERMISSIONS.GRADES.READ,     icon: "GraduationCap",  group: NAV_GROUPS.ACADEMICS },
  { label: "Students",    href: ROUTES.ORG.STUDENTS,   permission: PERMISSIONS.STUDENTS.READ,   icon: "Users",          group: NAV_GROUPS.ACADEMICS },
  // Finance
  { label: "Fees",        href: ROUTES.ORG.FEES,       permission: PERMISSIONS.FEES.READ,       icon: "CreditCard",     group: NAV_GROUPS.FINANCE },
  { label: "Reports",     href: ROUTES.ORG.REPORTS,    permission: PERMISSIONS.REPORTS.EXPORT,  icon: "BarChart2",      group: NAV_GROUPS.FINANCE },
  // Admin
  { label: "Members",     href: ROUTES.ORG.MEMBERS,    permission: PERMISSIONS.MEMBERS.INVITE,  icon: "UserPlus",       group: NAV_GROUPS.ADMIN },
  { label: "Roles",       href: ROUTES.ORG.ROLES,      permission: PERMISSIONS.ROLES.MANAGE,    icon: "Shield",         group: NAV_GROUPS.ADMIN },
  { label: "Admissions",  href: ROUTES.ORG.ADMISSIONS, permission: PERMISSIONS.ADMISSIONS.READ, icon: "ClipboardList",  group: NAV_GROUPS.ADMIN },
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
  return items.filter((item) => permissionSet.has(item.permission));
}
