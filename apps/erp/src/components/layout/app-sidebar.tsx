import * as React from "react";
import { AUTH_CONTEXT_KEYS, type AuthContextKey } from "@repo/contracts";
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
  IconFileDescription,
  IconFolder,
  IconHome,
  IconLayoutGrid,
  IconMessageCircle,
  IconNotebook,
  IconSchool,
  IconSpeakerphone,
  IconTruck,
  IconUserHeart,
  IconUserStar,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import { Link, useNavigate } from "react-router";
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
  NAV_CORE,
  NAV_ADMISSIONS,
  NAV_ACADEMIC_MANAGEMENT,
  NAV_RECORDS,
  NAV_FINANCE,
  NAV_COMMUNICATION,
  NAV_SERVICES,
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
  "group flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const CONTEXT_SWITCHER_ACTIVE_ITEM_CLASS =
  "border-transparent bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]";
const CONTEXT_SWITCHER_INACTIVE_ITEM_CLASS =
  "border-border/70 bg-card text-foreground hover:border-primary/20 hover:bg-muted/40";

const NAV_FAMILY = [
  {
    icon: IconUsers,
    title: "Children",
    url: ERP_ROUTES.FAMILY_CHILDREN,
    disabled: true,
    badgeLabel: "Planned",
  },
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconCalendarStats,
    title: "Attendance",
    url: ERP_ROUTES.FAMILY_ATTENDANCE,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
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
    badgeLabel: "Planned",
    disabled: true,
    icon: IconCertificate,
    title: "Exams",
    url: ERP_ROUTES.FAMILY_EXAMS,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
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
    badgeLabel: "Planned",
    disabled: true,
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
    badgeLabel: "Planned",
    disabled: true,
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
    badgeLabel: "Planned",
    disabled: true,
    icon: IconLayoutGrid,
    title: "Timetable",
    url: ERP_ROUTES.STUDENT_TIMETABLE,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
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
    badgeLabel: "Planned",
    disabled: true,
    icon: IconCertificate,
    title: "Exams",
    url: ERP_ROUTES.STUDENT_EXAMS,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconChartBar,
    title: "Results",
    url: ERP_ROUTES.STUDENT_RESULTS,
  },
  {
    badgeLabel: "Planned",
    disabled: true,
    icon: IconCalendar,
    title: "Calendar",
    url: ERP_ROUTES.STUDENT_CALENDAR,
  },
] as const;

const NAV_STUDENT_COMMUNICATION = [
  {
    badgeLabel: "Planned",
    disabled: true,
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
  "flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/8 bg-white/4 px-3 py-3 text-left transition-[width,height,padding] hover:bg-white/8 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2";

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
  const homeItems = getActionableNavItems(NAV_HOME);
  const coreItems = getActionableNavItems(NAV_CORE);
  const admissionsItems = getActionableNavItems(NAV_ADMISSIONS);
  const academicManagementItems = getActionableNavItems(
    NAV_ACADEMIC_MANAGEMENT,
  );
  const recordItems = getActionableNavItems(NAV_RECORDS);
  const financeItems = getActionableNavItems(NAV_FINANCE);
  const communicationItems = getActionableNavItems(NAV_COMMUNICATION).filter(
    (item) => {
      if (!item.permission) {
        return true;
      }

      return hasPermission(session, item.permission);
    },
  );
  const servicesItems = getActionableNavItems(NAV_SERVICES);
  const hrItems = getActionableNavItems(NAV_HR);
  const reportItems = getActionableNavItems(NAV_REPORTS);
  const settingsItems = getActionableNavItems(NAV_SETTINGS).filter(
    (item) => item.permission && hasPermission(session, item.permission),
  );
  const familyItems = getActionableNavItems(NAV_FAMILY);
  const familyCommunicationItems = getActionableNavItems(
    NAV_FAMILY_COMMUNICATION,
  );
  const familyServicesItems = getActionableNavItems(NAV_FAMILY_SERVICES);
  const studentAcademicItems = getActionableNavItems(NAV_STUDENT_ACADEMICS);
  const studentCommunicationItems = getActionableNavItems(
    NAV_STUDENT_COMMUNICATION,
  );
  const studentServicesItems = getActionableNavItems(NAV_STUDENT_SERVICES);
  const sortedContexts = [...availableContexts].sort(
    (left, right) =>
      CONTEXT_META[left.key].order - CONTEXT_META[right.key].order,
  );

  const headerInner = (
    <>
      <InstitutionLogo {...logoProps} />
      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
        <p className="truncate text-sm font-semibold tracking-tight">
          {institutionName}
        </p>
        <p className="truncate text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/55">
          {activeRoleLabel ?? "Workspace"}
        </p>
      </div>
    </>
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="overflow-hidden">
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
                "rounded-[20px] border border-border/70 bg-popover p-1 text-popover-foreground shadow-xl",
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
                          "flex size-8 shrink-0 items-center justify-center rounded-2xl border",
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

      <SidebarContent>
        {showStaffNavigation ? (
          <>
            <NavMain items={homeItems} />
            {coreItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconUsers}
                items={coreItems}
                label="People"
              />
            ) : null}
            {admissionsItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconFileDescription}
                items={admissionsItems}
                label="Admissions"
              />
            ) : null}
            {academicManagementItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconBook2}
                items={academicManagementItems}
                label="Academics"
              />
            ) : null}
            {recordItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconFolder}
                items={recordItems}
                label="Records"
              />
            ) : null}
            {financeItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconCurrencyRupee}
                items={financeItems}
                label="Finance"
              />
            ) : null}
            {communicationItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconSpeakerphone}
                items={communicationItems}
                label="Communication"
              />
            ) : null}
            {servicesItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconLayoutGrid}
                items={servicesItems}
                label="Services"
              />
            ) : null}
            {hrItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconUsersGroup}
                items={hrItems}
                label="HR & Payroll"
              />
            ) : null}
            {reportItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconChartBar}
                items={reportItems}
                label="Reports"
              />
            ) : null}
            {settingsItems.length > 0 ? (
              <NavMain
                collapsible
                icon={IconAdjustments}
                items={settingsItems}
                label="Settings"
              />
            ) : null}
          </>
        ) : activeContext?.key === AUTH_CONTEXT_KEYS.PARENT ? (
          <>
            <NavMain items={homeItems} />
            {familyItems.length > 0 ? (
              <NavMain
                collapsible
                defaultExpanded
                icon={IconUserHeart}
                items={familyItems}
                label="Family"
              />
            ) : null}
            {familyCommunicationItems.length > 0 ? (
              <NavMain
                collapsible
                defaultExpanded
                icon={IconSpeakerphone}
                items={familyCommunicationItems}
                label="Communication"
              />
            ) : null}
            {familyServicesItems.length > 0 ? (
              <NavMain
                collapsible
                defaultExpanded
                icon={IconLayoutGrid}
                items={familyServicesItems}
                label="Services"
              />
            ) : null}
          </>
        ) : activeContext?.key === AUTH_CONTEXT_KEYS.STUDENT ? (
          <>
            <NavMain items={homeItems} />
            {studentAcademicItems.length > 0 ? (
              <NavMain
                collapsible
                defaultExpanded
                icon={IconBook2}
                items={studentAcademicItems}
                label="Academics"
              />
            ) : null}
            {studentCommunicationItems.length > 0 ? (
              <NavMain
                collapsible
                defaultExpanded
                icon={IconSpeakerphone}
                items={studentCommunicationItems}
                label="Communication"
              />
            ) : null}
            {studentServicesItems.length > 0 ? (
              <NavMain
                collapsible
                defaultExpanded
                icon={IconLayoutGrid}
                items={studentServicesItems}
                label="Services"
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
