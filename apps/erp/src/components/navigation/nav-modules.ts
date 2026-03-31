/**
 * Module-based navigation structure for the icon rail + flyout sidebar.
 *
 * Each module represents a top-level icon in the rail. Clicking a module
 * opens a flyout panel showing its sections and items.
 */
import {
  IconBook2,
  IconBuildingEstate,
  IconCalendar,
  IconChartBar,
  IconCurrencyRupee,
  IconDashboard,
  IconMessageCircle,
  IconSettings,
  IconUsers,
  IconUsersGroup,
  IconUserHeart,
  IconSchool,
  type Icon,
} from "@tabler/icons-react";
import type { PermissionSlug } from "@repo/contracts";
import {
  NAV_HOME,
  NAV_PEOPLE,
  NAV_ADMISSIONS,
  NAV_TEACHING,
  NAV_ACADEMIC_SETUP,
  NAV_FINANCE,
  NAV_COMMUNICATION,
  NAV_LIBRARY,
  NAV_TRANSPORT,
  NAV_SERVICES,
  NAV_INVENTORY,
  NAV_HR,
  NAV_REPORTS,
  NAV_SETTINGS,
  NAV_PTM,
  NAV_SCHOLARSHIPS,
  type NavItem,
  getActionableNavItems,
  findNavItemByUrl,
} from "@/components/navigation/nav-items";
import { ERP_ROUTES } from "@/constants/routes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModuleSection = {
  label?: string;
  items: NavItem[];
};

export type NavModule = {
  key: string;
  label: string;
  icon: Icon;
  /** Direct-navigate URL. If set, clicking the rail icon navigates directly
   *  instead of opening a flyout. */
  directUrl?: string;
  sections: ModuleSection[];
};

// ---------------------------------------------------------------------------
// Staff modules — the 9 mega-categories
// ---------------------------------------------------------------------------

export const STAFF_MODULES: readonly NavModule[] = [
  {
    key: "home",
    label: "Home",
    icon: IconDashboard,
    directUrl: ERP_ROUTES.DASHBOARD,
    sections: [{ items: [...NAV_HOME] }],
  },
  {
    key: "people",
    label: "People",
    icon: IconUsers,
    sections: [
      { label: "Directory", items: [...NAV_PEOPLE] },
      { label: "Admissions", items: [...NAV_ADMISSIONS] },
      { label: "Scholarships", items: [...NAV_SCHOLARSHIPS] },
    ],
  },
  {
    key: "academics",
    label: "Academics",
    icon: IconBook2,
    sections: [
      { label: "Teaching", items: [...NAV_TEACHING, ...NAV_PTM] },
      { label: "Setup", items: [...NAV_ACADEMIC_SETUP] },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    icon: IconCurrencyRupee,
    sections: [{ items: [...NAV_FINANCE] }],
  },
  {
    key: "hr",
    label: "HR",
    icon: IconUsersGroup,
    sections: [{ items: [...NAV_HR] }],
  },
  {
    key: "communication",
    label: "Comms",
    icon: IconMessageCircle,
    sections: [{ items: [...NAV_COMMUNICATION] }],
  },
  {
    key: "facilities",
    label: "Facilities",
    icon: IconBuildingEstate,
    sections: [
      { label: "Library", items: [...NAV_LIBRARY] },
      { label: "Transport", items: [...NAV_TRANSPORT] },
      {
        label: "Hostel",
        items: NAV_SERVICES.filter((item) => item.url.startsWith("/hostel")),
      },
      { label: "Inventory", items: [...NAV_INVENTORY] },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    icon: IconChartBar,
    sections: [{ items: [...NAV_REPORTS] }],
  },
  {
    key: "admin",
    label: "Admin",
    icon: IconSettings,
    sections: [{ items: [...NAV_SETTINGS] }],
  },
];

// ---------------------------------------------------------------------------
// Parent modules
// ---------------------------------------------------------------------------

const NAV_FAMILY_ITEMS: NavItem[] = [
  { icon: IconUsers, title: "Children", url: ERP_ROUTES.FAMILY_CHILDREN },
  {
    icon: IconCalendar,
    title: "Attendance",
    url: ERP_ROUTES.FAMILY_ATTENDANCE,
  },
  { icon: IconBook2, title: "Timetable", url: ERP_ROUTES.FAMILY_TIMETABLE },
  {
    icon: IconBook2,
    title: "Homework",
    url: ERP_ROUTES.FAMILY_HOMEWORK,
    disabled: true,
    badgeLabel: "Planned",
  },
  { icon: IconBook2, title: "Exams", url: ERP_ROUTES.FAMILY_EXAMS },
  {
    icon: IconCurrencyRupee,
    title: "Fees",
    url: ERP_ROUTES.FAMILY_FEES,
  },
  {
    icon: IconBook2,
    title: "Documents",
    url: ERP_ROUTES.FAMILY_DOCUMENTS,
    disabled: true,
    badgeLabel: "Planned",
  },
];

const NAV_FAMILY_COMMUNICATION_ITEMS: NavItem[] = [
  {
    icon: IconMessageCircle,
    title: "Announcements",
    url: ERP_ROUTES.FAMILY_ANNOUNCEMENTS,
  },
  {
    icon: IconMessageCircle,
    title: "Messages",
    url: ERP_ROUTES.FAMILY_MESSAGES,
    disabled: true,
    badgeLabel: "Planned",
  },
  { icon: IconCalendar, title: "Calendar", url: ERP_ROUTES.FAMILY_CALENDAR },
];

export const PARENT_MODULES: readonly NavModule[] = [
  {
    key: "home",
    label: "Home",
    icon: IconDashboard,
    directUrl: ERP_ROUTES.DASHBOARD,
    sections: [
      { items: [{ icon: IconDashboard, title: "Dashboard", url: ERP_ROUTES.DASHBOARD }] },
    ],
  },
  {
    key: "family",
    label: "Family",
    icon: IconUserHeart,
    sections: [{ items: NAV_FAMILY_ITEMS }],
  },
  {
    key: "communication",
    label: "Comms",
    icon: IconMessageCircle,
    sections: [{ items: NAV_FAMILY_COMMUNICATION_ITEMS }],
  },
];

// ---------------------------------------------------------------------------
// Student modules
// ---------------------------------------------------------------------------

const NAV_STUDENT_ACADEMIC_ITEMS: NavItem[] = [
  { icon: IconBook2, title: "Timetable", url: ERP_ROUTES.STUDENT_TIMETABLE },
  {
    icon: IconCalendar,
    title: "Attendance",
    url: ERP_ROUTES.STUDENT_ATTENDANCE,
  },
  {
    icon: IconBook2,
    title: "Homework",
    url: ERP_ROUTES.STUDENT_HOMEWORK,
    disabled: true,
    badgeLabel: "Planned",
  },
  { icon: IconBook2, title: "Exams", url: ERP_ROUTES.STUDENT_EXAMS },
  { icon: IconChartBar, title: "Results", url: ERP_ROUTES.STUDENT_RESULTS },
  { icon: IconCalendar, title: "Calendar", url: ERP_ROUTES.STUDENT_CALENDAR },
];

const NAV_STUDENT_COMMUNICATION_ITEMS: NavItem[] = [
  {
    icon: IconMessageCircle,
    title: "Announcements",
    url: ERP_ROUTES.STUDENT_ANNOUNCEMENTS,
  },
  {
    icon: IconMessageCircle,
    title: "Messages",
    url: ERP_ROUTES.STUDENT_MESSAGES,
    disabled: true,
    badgeLabel: "Planned",
  },
];

export const STUDENT_MODULES: readonly NavModule[] = [
  {
    key: "home",
    label: "Home",
    icon: IconDashboard,
    directUrl: ERP_ROUTES.DASHBOARD,
    sections: [
      {
        items: [
          { icon: IconDashboard, title: "Dashboard", url: ERP_ROUTES.DASHBOARD },
          { icon: IconCalendar, title: "Calendar", url: ERP_ROUTES.STUDENT_CALENDAR },
        ],
      },
    ],
  },
  {
    key: "academics",
    label: "Academics",
    icon: IconSchool,
    sections: [{ items: NAV_STUDENT_ACADEMIC_ITEMS }],
  },
  {
    key: "communication",
    label: "Comms",
    icon: IconMessageCircle,
    sections: [{ items: NAV_STUDENT_COMMUNICATION_ITEMS }],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find which module contains a URL matching the given pathname. */
export function findActiveModule(
  pathname: string,
  modules: readonly NavModule[],
): NavModule | null {
  let bestMatch: { module: NavModule; length: number } | null = null;

  for (const mod of modules) {
    for (const section of mod.sections) {
      for (const item of section.items) {
        const matches =
          pathname === item.url ||
          (item.url !== "/" && pathname.startsWith(`${item.url}/`));
        if (matches && (!bestMatch || item.url.length > bestMatch.length)) {
          bestMatch = { module: mod, length: item.url.length };
        }
      }
    }
  }

  return bestMatch?.module ?? null;
}

/** Get all items from a module, filtered to actionable (non-disabled) only. */
export function getModuleActionableItems(mod: NavModule): NavItem[] {
  return mod.sections.flatMap((s) => getActionableNavItems(s.items));
}

/**
 * Filter a module's sections by permission, removing empty sections.
 * Returns a new module with filtered sections (does not mutate).
 */
export function filterModuleByPermission(
  mod: NavModule,
  hasPermissionFn: (perm: PermissionSlug) => boolean,
): NavModule {
  const sections = mod.sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !item.permission || item.disabled || hasPermissionFn(item.permission),
      ),
    }))
    .filter((section) => section.items.length > 0);

  return { ...mod, sections };
}

/** Re-export for convenience. */
export { findNavItemByUrl };
