import * as React from "react";
import {
  AUTH_CONTEXT_KEYS,
  type AuthContextKey,
  type PermissionSlug,
} from "@repo/contracts";
import {
  IconAdjustments,
  IconBook2,
  IconBooks,
  IconCalendar,
  IconCalendarStats,
  IconCertificate,
  IconCheck,
  IconChartBar,
  IconChevronDown,
  IconChevronRight,
  IconCurrencyRupee,
  IconDashboard,
  IconFileDescription,
  IconFolder,
  IconHome,
  IconLayoutGrid,
  IconMessageCircle,
  IconNotebook,
  IconPackage,
  IconSchool,
  IconSpeakerphone,
  IconTruck,
  IconUserHeart,
  IconUserStar,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { cn } from "@repo/ui/lib/utils";
import { NavMain } from "@/components/navigation/nav-main";
import { NavUser } from "@/components/navigation/nav-user";
import {
  getActionableNavItems,
  NAV_HOME,
  NAV_PEOPLE,
  NAV_ADMISSIONS,
  NAV_TEACHING,
  NAV_ACADEMIC_SETUP,
  NAV_LIBRARY,
  NAV_TRANSPORT,
  NAV_RECORDS,
  NAV_FINANCE,
  NAV_COMMUNICATION,
  NAV_SERVICES,
  NAV_INVENTORY,
  NAV_HR,
  NAV_REPORTS,
  NAV_SETTINGS,
} from "@/components/navigation/nav-items";
import { useSelectContextMutation } from "@/features/auth/api/use-auth";
import {
  getContextSecondaryLabel,
  getActiveRoleDisplayLabel,
  getActiveContext,
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { readCachedTenantBranding } from "@/lib/tenant-branding";
import { ERP_ROUTES } from "@/constants/routes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@repo/ui/components/ui/sidebar";

const CONTEXT_META: Record<
  AuthContextKey,
  { order: number; Icon: typeof IconSchool }
> = {
  [AUTH_CONTEXT_KEYS.STAFF]: {
    order: 1,
    Icon: IconSchool,
  },
  [AUTH_CONTEXT_KEYS.PARENT]: {
    order: 2,
    Icon: IconUserHeart,
  },
  [AUTH_CONTEXT_KEYS.STUDENT]: {
    order: 3,
    Icon: IconUserStar,
  },
};

const CONTEXT_SWITCHER_WIDTH_CLASS = "w-(--radix-dropdown-menu-trigger-width)";
const CONTEXT_SWITCHER_ITEM_CLASS =
  "group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const CONTEXT_SWITCHER_ACTIVE_ITEM_CLASS =
  "border-transparent bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]";
const CONTEXT_SWITCHER_INACTIVE_ITEM_CLASS =
  "border-border/70 bg-card text-foreground hover:border-primary/20 hover:bg-muted/40";
const STAFF_NAV_GROUP_LABELS = {
  DIRECTORY: "Directory",
  ADMISSIONS: "Admissions",
  TEACHING: "Teaching",
  ACADEMIC_SETUP: "Academic Setup",
  RECORDS: "Records",
  FINANCE: "Finance",
  COMMUNICATION: "Communication",
  LIBRARY: "Library",
  TRANSPORT: "Transport",
  SERVICES: "Services",
  INVENTORY: "Inventory",
  HR: "HR & Payroll",
  REPORTS: "Reports",
  SETTINGS: "Settings",
} as const;

const NAV_FAMILY = [
  {
    icon: IconUsers,
    title: "Children",
    url: ERP_ROUTES.FAMILY_CHILDREN,
  },
  {
    icon: IconCalendarStats,
    title: "Attendance",
    url: ERP_ROUTES.FAMILY_ATTENDANCE,
  },
  {
    icon: IconLayoutGrid,
    title: "Timetable",
    url: ERP_ROUTES.FAMILY_TIMETABLE,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconNotebook,
    title: "Homework",
    url: ERP_ROUTES.FAMILY_HOMEWORK,
  },
  {
    icon: IconCertificate,
    title: "Exams",
    url: ERP_ROUTES.FAMILY_EXAMS,
  },
  {
    icon: IconCurrencyRupee,
    title: "Fees",
    url: ERP_ROUTES.FAMILY_FEES,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconFolder,
    title: "Documents",
    url: ERP_ROUTES.FAMILY_DOCUMENTS,
  },
] as const;

const NAV_FAMILY_COMMUNICATION = [
  {
    icon: IconSpeakerphone,
    title: "Announcements",
    url: ERP_ROUTES.FAMILY_ANNOUNCEMENTS,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconMessageCircle,
    title: "Messages",
    url: ERP_ROUTES.FAMILY_MESSAGES,
  },
  {
    icon: IconCalendar,
    title: "Calendar",
    url: ERP_ROUTES.FAMILY_CALENDAR,
  },
] as const;

const NAV_FAMILY_SERVICES = [
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconTruck,
    title: "Transport",
    url: ERP_ROUTES.FAMILY_TRANSPORT,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconBooks,
    title: "Library",
    url: ERP_ROUTES.FAMILY_LIBRARY,
  },
] as const;

const NAV_STUDENT_ACADEMICS = [
  {
    icon: IconLayoutGrid,
    title: "Timetable",
    url: ERP_ROUTES.STUDENT_TIMETABLE,
  },
  {
    icon: IconCalendarStats,
    title: "Attendance",
    url: ERP_ROUTES.STUDENT_ATTENDANCE,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconNotebook,
    title: "Homework",
    url: ERP_ROUTES.STUDENT_HOMEWORK,
  },
  {
    icon: IconCertificate,
    title: "Exams",
    url: ERP_ROUTES.STUDENT_EXAMS,
  },
  {
    icon: IconChartBar,
    title: "Results",
    url: ERP_ROUTES.STUDENT_RESULTS,
  },
  {
    icon: IconCalendar,
    title: "Calendar",
    url: ERP_ROUTES.STUDENT_CALENDAR,
  },
] as const;

const NAV_STUDENT_COMMUNICATION = [
  {
    icon: IconSpeakerphone,
    title: "Announcements",
    url: ERP_ROUTES.STUDENT_ANNOUNCEMENTS,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconMessageCircle,
    title: "Messages",
    url: ERP_ROUTES.STUDENT_MESSAGES,
  },
] as const;

const NAV_STUDENT_SERVICES = [
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconBooks,
    title: "Library",
    url: ERP_ROUTES.STUDENT_LIBRARY,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconTruck,
    title: "Transport",
    url: ERP_ROUTES.STUDENT_TRANSPORT,
  },
  {
    badgeLabel: "Later",
    disabled: true,
    icon: IconHome,
    title: "Hostel",
    url: ERP_ROUTES.STUDENT_HOSTEL,
  },
] as const;

const HEADER_CLASS =
  "flex w-full items-center gap-3 overflow-hidden rounded-xl border border-white/8 bg-white/4 px-3 py-3 text-left transition-[width,height,padding] hover:bg-white/8 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2";

type SidebarNavItem = {
  badgeLabel?: string;
  disabled?: boolean;
  title: string;
  url: string;
};

function matchesPath(pathname: string, itemUrl: string) {
  return (
    pathname === itemUrl ||
    (itemUrl !== "/" && pathname.startsWith(`${itemUrl}/`))
  );
}

function getActiveGroupLabel(
  pathname: string,
  groups: Array<{ items: SidebarNavItem[]; label: string }>,
) {
  const matchingGroup = groups.find((group) =>
    group.items.some((item) => matchesPath(pathname, item.url)),
  );

  return matchingGroup?.label ?? null;
}

function InstitutionLogo({
  logoUrl,
  institutionName,
  initial,
}: {
  logoUrl: string | null;
  institutionName: string;
  initial: string;
}) {
  if (logoUrl) {
    return (
      <img
        alt={institutionName}
        className="size-6 shrink-0 rounded object-contain"
        src={logoUrl}
      />
    );
  }

  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
      style={{ background: "var(--primary, #8a5a44)" }}
    >
      {initial}
    </span>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const availableContexts = session?.availableContexts ?? [];
  const showStaffNavigation = isStaffContext(session);
  const selectContextMutation = useSelectContextMutation();
  const [isContextSwitcherOpen, setIsContextSwitcherOpen] =
    React.useState(false);
  const branding = readCachedTenantBranding();
  const institutionName =
    branding?.institutionName ??
    session?.activeOrganization?.name ??
    "School ERP";
  const activeRoleLabel = getActiveRoleDisplayLabel(session);
  const logoUrl = branding?.logoUrl ?? null;
  const initial = (branding?.shortName ?? institutionName)
    .charAt(0)
    .toUpperCase();

  const logoProps = { logoUrl, institutionName, initial };
  function filterByPermission<T extends { permission?: PermissionSlug }>(
    items: T[],
  ): T[] {
    return items.filter(
      (item) => !item.permission || hasPermission(session, item.permission),
    );
  }

  const homeItems = getActionableNavItems(NAV_HOME);
  const peopleItems = filterByPermission(getActionableNavItems(NAV_PEOPLE));
  const admissionsItems = filterByPermission(
    getActionableNavItems(NAV_ADMISSIONS),
  );
  const teachingItems = filterByPermission(getActionableNavItems(NAV_TEACHING));
  const academicSetupItems = filterByPermission(
    getActionableNavItems(NAV_ACADEMIC_SETUP),
  );
  const recordItems = getActionableNavItems(NAV_RECORDS);
  const financeItems = filterByPermission(getActionableNavItems(NAV_FINANCE));
  const communicationItems = filterByPermission(
    getActionableNavItems(NAV_COMMUNICATION),
  );
  const libraryItems = filterByPermission(getActionableNavItems(NAV_LIBRARY));
  const transportItems = filterByPermission(getActionableNavItems(NAV_TRANSPORT));
  const servicesItems = filterByPermission(getActionableNavItems(NAV_SERVICES));
  const inventoryNavItems = filterByPermission(getActionableNavItems(NAV_INVENTORY));
  const hrItems = getActionableNavItems(NAV_HR);
  const reportItems = filterByPermission(getActionableNavItems(NAV_REPORTS));
  const settingsItems = filterByPermission(getActionableNavItems(NAV_SETTINGS));
  const familyHomeItems = [
    {
      icon: IconDashboard,
      title: "Dashboard",
      url: ERP_ROUTES.DASHBOARD,
    },
  ];
  const familyItems = React.useMemo(() => [...NAV_FAMILY], []);
  const familyCommunicationItems = React.useMemo(
    () => [...NAV_FAMILY_COMMUNICATION],
    [],
  );
  const familyServicesItems = React.useMemo(() => [...NAV_FAMILY_SERVICES], []);
  const studentAcademicItems = getActionableNavItems(NAV_STUDENT_ACADEMICS);
  const studentCommunicationItems = getActionableNavItems(
    NAV_STUDENT_COMMUNICATION,
  );
  const studentServicesItems = getActionableNavItems(NAV_STUDENT_SERVICES);
  const sortedContexts = [...availableContexts].sort(
    (left, right) =>
      CONTEXT_META[left.key].order - CONTEXT_META[right.key].order,
  );

  const activeGroupLabel = React.useMemo(() => {
    if (showStaffNavigation) {
      return getActiveGroupLabel(location.pathname, [
        { items: peopleItems, label: STAFF_NAV_GROUP_LABELS.DIRECTORY },
        { items: admissionsItems, label: STAFF_NAV_GROUP_LABELS.ADMISSIONS },
        {
          items: teachingItems,
          label: STAFF_NAV_GROUP_LABELS.TEACHING,
        },
        {
          items: academicSetupItems,
          label: STAFF_NAV_GROUP_LABELS.ACADEMIC_SETUP,
        },
        { items: financeItems, label: STAFF_NAV_GROUP_LABELS.FINANCE },
        { items: libraryItems, label: STAFF_NAV_GROUP_LABELS.LIBRARY },
        { items: transportItems, label: STAFF_NAV_GROUP_LABELS.TRANSPORT },
        { items: servicesItems, label: STAFF_NAV_GROUP_LABELS.SERVICES },
        { items: inventoryNavItems, label: STAFF_NAV_GROUP_LABELS.INVENTORY },
        { items: hrItems, label: STAFF_NAV_GROUP_LABELS.HR },
        { items: reportItems, label: STAFF_NAV_GROUP_LABELS.REPORTS },
        { items: recordItems, label: STAFF_NAV_GROUP_LABELS.RECORDS },
        { items: settingsItems, label: STAFF_NAV_GROUP_LABELS.SETTINGS },
      ]);
    }

    if (activeContext?.key === AUTH_CONTEXT_KEYS.PARENT) {
      return getActiveGroupLabel(location.pathname, [
        { items: familyItems, label: "Family" },
        { items: familyCommunicationItems, label: "Communication" },
        { items: familyServicesItems, label: "Services" },
      ]);
    }

    if (activeContext?.key === AUTH_CONTEXT_KEYS.STUDENT) {
      return getActiveGroupLabel(location.pathname, [
        { items: studentAcademicItems, label: "Academics" },
        { items: studentCommunicationItems, label: "Communication" },
        { items: studentServicesItems, label: "Services" },
      ]);
    }

    return null;
  }, [
    activeContext?.key,
    admissionsItems,
    teachingItems,
    academicSetupItems,
    familyCommunicationItems,
    familyItems,
    familyServicesItems,
    financeItems,
    libraryItems,
    transportItems,
    hrItems,
    inventoryNavItems,
    location.pathname,
    peopleItems,
    recordItems,
    reportItems,
    servicesItems,
    settingsItems,
    showStaffNavigation,
    studentAcademicItems,
    studentCommunicationItems,
    studentServicesItems,
  ]);
  const [openGroupLabel, setOpenGroupLabel] = React.useState<string | null>(
    activeGroupLabel,
  );

  React.useEffect(() => {
    setOpenGroupLabel(activeGroupLabel);
  }, [activeGroupLabel]);

  const headerInner = (
    <>
      <InstitutionLogo {...logoProps} />
      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
        <p className="truncate text-sm font-semibold tracking-tight">
          {institutionName}
        </p>
        <p className="truncate text-[11px] tracking-wide text-sidebar-foreground/55">
          {activeRoleLabel ?? "Workspace"}
        </p>
      </div>
    </>
  );

  function renderStandaloneTopLevelItems(
    items: {
      badgeLabel?: string;
      title: string;
      url: string;
      icon?: React.ComponentProps<typeof NavMain>["icon"];
      disabled?: boolean;
    }[],
  ) {
    return items.map((item) => <NavMain key={item.title} items={[item]} />);
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="overflow-hidden pb-4">
        {availableContexts.length > 1 && activeContext ? (
          <DropdownMenu
            onOpenChange={setIsContextSwitcherOpen}
            open={isContextSwitcherOpen}
          >
            <DropdownMenuTrigger asChild>
              <button className={HEADER_CLASS}>
                {headerInner}
                <IconChevronDown className="ml-auto size-3.5 shrink-0 text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className={cn(
                CONTEXT_SWITCHER_WIDTH_CLASS,
                "rounded-xl border border-border/70 bg-popover p-1 text-popover-foreground shadow-xl",
              )}
              side="bottom"
              sideOffset={8}
            >
              <div className="space-y-1">
                {sortedContexts.map((contextOption) => {
                  const meta = CONTEXT_META[contextOption.key];
                  const isActive = activeContext.key === contextOption.key;
                  const contextSecondaryLabel = getContextSecondaryLabel(
                    session,
                    contextOption.key,
                  );

                  return (
                    <button
                      key={contextOption.key}
                      className={cn(
                        CONTEXT_SWITCHER_ITEM_CLASS,
                        isActive
                          ? CONTEXT_SWITCHER_ACTIVE_ITEM_CLASS
                          : CONTEXT_SWITCHER_INACTIVE_ITEM_CLASS,
                      )}
                      disabled={selectContextMutation.isPending || isActive}
                      onClick={() => {
                        setIsContextSwitcherOpen(false);
                        selectContextMutation.mutate(
                          {
                            body: { contextKey: contextOption.key },
                          },
                          {
                            onSuccess: () => {
                              void navigate(ERP_ROUTES.DASHBOARD);
                            },
                          },
                        );
                      }}
                      type="button"
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-xl border",
                          isActive
                            ? "border-transparent bg-primary text-primary-foreground"
                            : "border-border/70 bg-muted/50 text-primary",
                        )}
                      >
                        <meta.Icon className="size-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold tracking-[-0.01em]">
                          {contextOption.label}
                        </span>
                        {contextSecondaryLabel ? (
                          <span className="mt-0.5 block truncate font-mono text-[10.5px] font-medium tracking-[0.04em] text-muted-foreground/80">
                            {contextSecondaryLabel}
                          </span>
                        ) : null}
                      </span>
                      {isActive ? (
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/95 text-primary">
                          <IconCheck className="size-3.5" />
                        </span>
                      ) : (
                        <IconChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground/70" />
                      )}
                    </button>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to={ERP_ROUTES.DASHBOARD} className={HEADER_CLASS}>
            {headerInner}
          </Link>
        )}
      </SidebarHeader>

      <div className="px-4">
        <SidebarSeparator className="mx-0 w-full bg-white/8" />
      </div>

      <SidebarContent className="pt-3">
        {showStaffNavigation ? (
          <>
            {renderStandaloneTopLevelItems(homeItems)}
            {peopleItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconUsers}
                items={peopleItems}
                label={STAFF_NAV_GROUP_LABELS.DIRECTORY}
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {admissionsItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconFileDescription}
                items={admissionsItems}
                label={STAFF_NAV_GROUP_LABELS.ADMISSIONS}
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {teachingItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconCalendarStats}
                items={teachingItems}
                label={STAFF_NAV_GROUP_LABELS.TEACHING}
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {financeItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconCurrencyRupee}
                items={financeItems}
                label={STAFF_NAV_GROUP_LABELS.FINANCE}
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {communicationItems.length > 0
              ? renderStandaloneTopLevelItems(communicationItems)
              : null}
            {libraryItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconBooks}
                items={libraryItems}
                label={STAFF_NAV_GROUP_LABELS.LIBRARY}
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {transportItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconTruck}
                items={transportItems}
                label={STAFF_NAV_GROUP_LABELS.TRANSPORT}
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {servicesItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconLayoutGrid}
                items={servicesItems}
                label={STAFF_NAV_GROUP_LABELS.SERVICES}
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {inventoryNavItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconPackage}
                items={inventoryNavItems}
                label={STAFF_NAV_GROUP_LABELS.INVENTORY}
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {hrItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconUsersGroup}
                items={hrItems}
                label={STAFF_NAV_GROUP_LABELS.HR}
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {reportItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconChartBar}
                items={reportItems}
                label={STAFF_NAV_GROUP_LABELS.REPORTS}
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {recordItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconFolder}
                items={recordItems}
                label={STAFF_NAV_GROUP_LABELS.RECORDS}
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {academicSetupItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconBook2}
                items={academicSetupItems}
                label={STAFF_NAV_GROUP_LABELS.ACADEMIC_SETUP}
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {settingsItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconAdjustments}
                items={settingsItems}
                label={STAFF_NAV_GROUP_LABELS.SETTINGS}
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
          </>
        ) : activeContext?.key === AUTH_CONTEXT_KEYS.PARENT ? (
          <>
            {renderStandaloneTopLevelItems(familyHomeItems)}
            {familyItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconUserHeart}
                items={familyItems}
                label="Family"
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {familyCommunicationItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconSpeakerphone}
                items={familyCommunicationItems}
                label="Communication"
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {familyServicesItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconLayoutGrid}
                items={familyServicesItems}
                label="Services"
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
          </>
        ) : activeContext?.key === AUTH_CONTEXT_KEYS.STUDENT ? (
          <>
            {renderStandaloneTopLevelItems(homeItems)}
            {studentAcademicItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconBook2}
                items={studentAcademicItems}
                label="Academics"
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {studentCommunicationItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconSpeakerphone}
                items={studentCommunicationItems}
                label="Communication"
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
            {studentServicesItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconLayoutGrid}
                items={studentServicesItems}
                label="Services"
                onOpenGroupChange={setOpenGroupLabel}
                openGroupLabel={openGroupLabel}
              />
            ) : null}
          </>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
