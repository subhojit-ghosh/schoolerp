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
import { SiteHeader } from "@/components/layout/site-header";
import { NavSearch } from "@/components/navigation/nav-search";
import {
  getActionableNavItems,
  NAV_HOME,
  NAV_CORE,
  NAV_ADMISSIONS,
  NAV_ACADEMIC_MANAGEMENT,
  NAV_RECORDS,
  NAV_FINANCE,
  NAV_COMMUNICATION,
  NAV_REPORTS,
  NAV_SETTINGS,
} from "@/components/navigation/nav-items";
import {
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { SidebarInset, SidebarProvider } from "@repo/ui/components/ui/sidebar";
import { ERP_ROUTES } from "@/constants/routes";

const QUICK_ACTIONS = [
  { icon: IconUsers, title: "New student", url: ERP_ROUTES.STUDENT_CREATE },
  { icon: IconUsersGroup, title: "New staff", url: ERP_ROUTES.STAFF_CREATE },
  {
    icon: IconUserSearch,
    title: "New enquiry",
    url: ERP_ROUTES.ADMISSIONS_ENQUIRY_CREATE,
  },
  {
    icon: IconFileDescription,
    title: "New application",
    url: ERP_ROUTES.ADMISSIONS_APPLICATION_CREATE,
  },
  {
    icon: IconBook2,
    title: "New academic year",
    url: ERP_ROUTES.ACADEMIC_YEAR_CREATE,
  },
  {
    icon: IconBooks,
    title: "New class",
    url: ERP_ROUTES.CLASS_CREATE,
  },
  {
    icon: IconCurrencyRupee,
    title: "New fee structure",
    url: ERP_ROUTES.FEE_STRUCTURE_CREATE,
  },
  {
    icon: IconReportMoney,
    title: "New fee assignment",
    url: ERP_ROUTES.FEE_ASSIGNMENT_CREATE,
  },
  {
    icon: IconSpeakerphone,
    title: "New announcement",
    url: ERP_ROUTES.ANNOUNCEMENT_CREATE,
  },
  {
    icon: IconCalendar,
    title: "New calendar event",
    url: ERP_ROUTES.CALENDAR_EVENT_CREATE,
  },
  {
    icon: IconLayoutGrid,
    title: "New subject",
    url: ERP_ROUTES.SUBJECT_CREATE,
  },
];

export function DashboardLayout() {
  const [commandOpen, setCommandOpen] = useState(false);
  const session = useAuthStore((store) => store.session);
  const showStaffNav = isStaffContext(session);

  const communicationItems = getActionableNavItems(NAV_COMMUNICATION).filter(
    (item) => !item.permission || hasPermission(session, item.permission),
  );
  const settingsItems = getActionableNavItems(NAV_SETTINGS).filter(
    (item) => item.permission && hasPermission(session, item.permission),
  );

  const staffNavGroups = showStaffNav
    ? [
        { label: "Home", items: getActionableNavItems(NAV_HOME) },
        { label: "Core", items: getActionableNavItems(NAV_CORE) },
        { label: "Admissions", items: getActionableNavItems(NAV_ADMISSIONS) },
        {
          label: "Academic Management",
          items: getActionableNavItems(NAV_ACADEMIC_MANAGEMENT),
        },
        { label: "Records", items: getActionableNavItems(NAV_RECORDS) },
        { label: "Finance", items: getActionableNavItems(NAV_FINANCE) },
        { label: "Communication", items: communicationItems },
        { label: "Reports", items: getActionableNavItems(NAV_REPORTS) },
        { label: "Settings", items: settingsItems },
      ].filter((g) => g.items.length > 0)
    : [];

  const commandGroups = [
    { label: "Quick Actions", items: QUICK_ACTIONS },
    ...staffNavGroups,
  ];

  return (
    <SidebarProvider
      className="[--header-height:calc(var(--spacing)*12)]"
      defaultOpen
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
    </SidebarProvider>
  );
}
