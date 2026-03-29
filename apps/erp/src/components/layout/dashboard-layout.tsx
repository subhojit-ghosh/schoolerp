import { useState } from "react";
import { Outlet } from "react-router";
import {
  IconUsers,
  IconUsersGroup,
  IconUserSearch,
  IconFileDescription,
  IconBook2,
  IconBooks,
  IconCurrencyRupee,
  IconReportMoney,
  IconSpeakerphone,
  IconCalendar,
  IconLayoutGrid,
} from "@tabler/icons-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { KeyboardShortcutsDialog } from "@/components/feedback/keyboard-shortcuts-dialog";
import { useKeyboardShortcutsDialog } from "@/hooks/use-keyboard-shortcuts-dialog";
import { SessionExpiryWarning } from "@/components/feedback/session-expiry-warning";
import { SiteHeader } from "@/components/layout/site-header";
import { NavSearch } from "@/components/navigation/nav-search";
import {
  getActionableNavItems,
  NAV_HOME,
  NAV_PEOPLE,
  NAV_ADMISSIONS,
  NAV_TEACHING,
  NAV_ACADEMIC_SETUP,
  NAV_RECORDS,
  NAV_FINANCE,
  NAV_COMMUNICATION,
  NAV_REPORTS,
  NAV_SETTINGS,
} from "@/components/navigation/nav-items";
import { PERMISSIONS } from "@repo/contracts";
import {
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { SidebarInset, SidebarProvider } from "@repo/ui/components/ui/sidebar";
import { useIsTablet } from "@repo/ui/hooks/use-mobile";
import { ERP_ROUTES } from "@/constants/routes";

const ALL_QUICK_ACTIONS = [
  {
    icon: IconUsers,
    title: "New student",
    url: ERP_ROUTES.STUDENT_CREATE,
    permission: PERMISSIONS.STUDENTS_MANAGE,
  },
  {
    icon: IconUsersGroup,
    title: "New staff",
    url: ERP_ROUTES.STAFF_CREATE,
    permission: PERMISSIONS.STAFF_MANAGE,
  },
  {
    icon: IconUserSearch,
    title: "New enquiry",
    url: ERP_ROUTES.ADMISSIONS_ENQUIRY_CREATE,
    permission: PERMISSIONS.ADMISSIONS_MANAGE,
  },
  {
    icon: IconFileDescription,
    title: "New application",
    url: ERP_ROUTES.ADMISSIONS_APPLICATION_CREATE,
    permission: PERMISSIONS.ADMISSIONS_MANAGE,
  },
  {
    icon: IconBook2,
    title: "New academic year",
    url: ERP_ROUTES.ACADEMIC_YEAR_CREATE,
    permission: PERMISSIONS.ACADEMICS_MANAGE,
  },
  {
    icon: IconBooks,
    title: "New class",
    url: ERP_ROUTES.CLASS_CREATE,
    permission: PERMISSIONS.ACADEMICS_MANAGE,
  },
  {
    icon: IconCurrencyRupee,
    title: "New fee structure",
    url: ERP_ROUTES.FEE_STRUCTURE_CREATE,
    permission: PERMISSIONS.FEES_MANAGE,
  },
  {
    icon: IconReportMoney,
    title: "New fee assignment",
    url: ERP_ROUTES.FEE_ASSIGNMENT_CREATE,
    permission: PERMISSIONS.FEES_MANAGE,
  },
  {
    icon: IconSpeakerphone,
    title: "New announcement",
    url: ERP_ROUTES.ANNOUNCEMENT_CREATE,
    permission: PERMISSIONS.COMMUNICATION_MANAGE,
  },
  {
    icon: IconCalendar,
    title: "New calendar event",
    url: ERP_ROUTES.CALENDAR_EVENT_CREATE,
    permission: PERMISSIONS.ACADEMICS_MANAGE,
  },
  {
    icon: IconLayoutGrid,
    title: "New subject",
    url: ERP_ROUTES.SUBJECT_CREATE,
    permission: PERMISSIONS.ACADEMICS_MANAGE,
  },
];

export function DashboardLayout() {
  const [commandOpen, setCommandOpen] = useState(false);
  const shortcutsDialog = useKeyboardShortcutsDialog();
  const session = useAuthStore((store) => store.session);
  const showStaffNav = isStaffContext(session);
  const isTablet = useIsTablet();

  function filterByPermission(items: ReturnType<typeof getActionableNavItems>) {
    return items.filter(
      (item) => !item.permission || hasPermission(session, item.permission),
    );
  }

  const staffNavGroups = showStaffNav
    ? [
        {
          label: "Home",
          items: filterByPermission(getActionableNavItems(NAV_HOME)),
        },
        {
          label: "Directory",
          items: filterByPermission(getActionableNavItems(NAV_PEOPLE)),
        },
        {
          label: "Admissions",
          items: filterByPermission(getActionableNavItems(NAV_ADMISSIONS)),
        },
        {
          label: "Teaching",
          items: filterByPermission(getActionableNavItems(NAV_TEACHING)),
        },
        {
          label: "Academic Setup",
          items: filterByPermission(getActionableNavItems(NAV_ACADEMIC_SETUP)),
        },
        {
          label: "Finance",
          items: filterByPermission(getActionableNavItems(NAV_FINANCE)),
        },
        {
          label: "Communication",
          items: filterByPermission(getActionableNavItems(NAV_COMMUNICATION)),
        },
        {
          label: "Reports",
          items: filterByPermission(getActionableNavItems(NAV_REPORTS)),
        },
        {
          label: "Records",
          items: filterByPermission(getActionableNavItems(NAV_RECORDS)),
        },
        {
          label: "Settings",
          items: filterByPermission(getActionableNavItems(NAV_SETTINGS)),
        },
      ].filter((g) => g.items.length > 0)
    : [];

  const quickActions = ALL_QUICK_ACTIONS.filter((item) =>
    hasPermission(session, item.permission),
  );

  const commandGroups = [
    ...(quickActions.length > 0
      ? [{ label: "Quick Actions", items: quickActions }]
      : []),
    ...staffNavGroups,
  ];

  return (
    <SidebarProvider
      className="[--header-height:calc(var(--spacing)*12)]"
      defaultOpen={!isTablet}
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader onOpenSearch={() => setCommandOpen(true)} />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6 @container/main">
          <Outlet />
        </div>
      </SidebarInset>
      <NavSearch
        groups={commandGroups}
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />
      <KeyboardShortcutsDialog
        open={shortcutsDialog.open}
        onOpenChange={shortcutsDialog.onOpenChange}
      />
      <SessionExpiryWarning />
    </SidebarProvider>
  );
}
