export type NavItem = {
  label: string;
  href: string;
  permission: string;
  icon: string; // lucide icon name
  group: "academics" | "finance" | "admin";
};

export const NAV_ITEMS: NavItem[] = [
  // Academics
  { label: "Attendance",  href: "/dashboard/attendance", permission: "attendance:read",  icon: "CalendarCheck",  group: "academics" },
  { label: "Grades",      href: "/dashboard/grades",     permission: "grades:read",      icon: "GraduationCap",  group: "academics" },
  { label: "Students",    href: "/dashboard/students",   permission: "students:read",    icon: "Users",          group: "academics" },
  // Finance
  { label: "Fees",        href: "/dashboard/fees",       permission: "fees:read",        icon: "CreditCard",     group: "finance" },
  { label: "Reports",     href: "/dashboard/reports",    permission: "reports:export",   icon: "BarChart2",      group: "finance" },
  // Admin
  { label: "Members",     href: "/dashboard/members",    permission: "members:invite",   icon: "UserPlus",       group: "admin" },
  { label: "Roles",       href: "/dashboard/roles",      permission: "roles:manage",     icon: "Shield",         group: "admin" },
  { label: "Admissions",  href: "/dashboard/admissions", permission: "admissions:read",  icon: "ClipboardList",  group: "admin" },
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
