import * as React from "react";
import { AUTH_CONTEXT_KEYS, type AuthContextKey } from "@repo/contracts";
import {
  IconBook2,
  IconBooks,
  IconBuildingEstate,
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
  IconLayoutGrid,
  IconPalette,
  IconReportMoney,
  IconSchool,
  IconShieldLock,
  IconSpeakerphone,
  IconUserHeart,
  IconUserSearch,
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
import { useSelectContextMutation } from "@/features/auth/api/use-auth";
import {
  getActiveContext,
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

const CONTEXT_SWITCHER_WIDTH_CLASS = "w-[220px]";
const CONTEXT_SWITCHER_ITEM_CLASS =
  "group flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const CONTEXT_SWITCHER_ACTIVE_ITEM_CLASS =
  "border-transparent bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]";
const CONTEXT_SWITCHER_INACTIVE_ITEM_CLASS =
  "border-border/70 bg-card text-foreground hover:border-primary/20 hover:bg-muted/40";

const NAV_OVERVIEW = [
  { icon: IconDashboard, title: "Dashboard", url: ERP_ROUTES.DASHBOARD },
] as const;

const NAV_ADMISSIONS = [
  {
    disabled: true,
    icon: IconUserSearch,
    title: "Enquiries",
    url: ERP_ROUTES.ADMISSIONS_ENQUIRIES,
  },
  {
    disabled: true,
    icon: IconFileDescription,
    title: "Applications",
    url: ERP_ROUTES.ADMISSIONS_APPLICATIONS,
  },
] as const;

const NAV_PEOPLE = [
  { icon: IconUsers, title: "Students", url: ERP_ROUTES.STUDENTS },
  { icon: IconUsers, title: "Guardians", url: ERP_ROUTES.GUARDIANS },
  { icon: IconUsersGroup, title: "Staff", url: ERP_ROUTES.STAFF },
] as const;

const NAV_ACADEMICS = [
  { icon: IconBook2, title: "Academic Years", url: ERP_ROUTES.ACADEMIC_YEARS },
  { icon: IconBook2, title: "Classes", url: ERP_ROUTES.CLASSES },
  {
    disabled: true,
    icon: IconBooks,
    title: "Subjects",
    url: ERP_ROUTES.SUBJECTS,
  },
  {
    disabled: true,
    icon: IconLayoutGrid,
    title: "Timetable",
    url: ERP_ROUTES.TIMETABLE,
  },
  {
    disabled: true,
    icon: IconCalendar,
    title: "Calendar",
    url: ERP_ROUTES.CALENDAR,
  },
  { icon: IconCalendarStats, title: "Attendance", url: ERP_ROUTES.ATTENDANCE },
  { icon: IconCertificate, title: "Exams", url: ERP_ROUTES.EXAMS },
] as const;

const NAV_FINANCE = [
  { icon: IconCurrencyRupee, title: "Fees", url: ERP_ROUTES.FEES },
] as const;

const NAV_REPORTS = [
  {
    disabled: true,
    icon: IconCalendarStats,
    title: "Attendance",
    url: ERP_ROUTES.REPORTS_ATTENDANCE,
  },
  {
    disabled: true,
    icon: IconChartBar,
    title: "Exams",
    url: ERP_ROUTES.REPORTS_EXAMS,
  },
  {
    disabled: true,
    icon: IconReportMoney,
    title: "Fees",
    url: ERP_ROUTES.REPORTS_FEES,
  },
] as const;

const NAV_COMMUNICATION = [
  {
    disabled: true,
    icon: IconSpeakerphone,
    title: "Announcements",
    url: ERP_ROUTES.ANNOUNCEMENTS,
  },
] as const;

const NAV_SETTINGS = [
  {
    icon: IconBuildingEstate,
    title: "Campuses",
    url: ERP_ROUTES.SETTINGS_CAMPUSES,
  },
  { icon: IconPalette, title: "Branding", url: ERP_ROUTES.SETTINGS_BRANDING },
  {
    icon: IconShieldLock,
    title: "Roles",
    url: ERP_ROUTES.SETTINGS_ROLES,
  },
] as const;

const NAV_FAMILY = [
  {
    icon: IconUsers,
    title: "Children",
    url: ERP_ROUTES.DASHBOARD,
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
  const [isContextSwitcherOpen, setIsContextSwitcherOpen] = React.useState(false);
  const branding = readCachedTenantBranding();
  const institutionName =
    branding?.institutionName ??
    session?.activeOrganization?.name ??
    "School ERP";
  const logoUrl = branding?.logoUrl ?? null;
  const initial = (branding?.shortName ?? institutionName)
    .charAt(0)
    .toUpperCase();

  const logoProps = { logoUrl, institutionName, initial };
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
          {activeContext?.label ?? "Workspace"}
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
                            ? "border-transparent bg-[var(--primary)] text-primary-foreground"
                            : "border-border/70 bg-muted/50 text-[var(--primary)]",
                        )}
                      >
                        <meta.Icon className="size-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold tracking-[-0.01em]">
                          {contextOption.label}
                        </span>
                      </span>
                      {isActive ? (
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/95 text-[var(--primary)]">
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
        <NavMain items={[...NAV_OVERVIEW]} />
        {showStaffNavigation ? (
          <>
            <NavMain items={[...NAV_ADMISSIONS]} label="Admissions" />
            <NavMain items={[...NAV_PEOPLE]} label="People" />
            <NavMain items={[...NAV_ACADEMICS]} label="Academics" />
            <NavMain items={[...NAV_FINANCE]} label="Finance" />
            <NavMain items={[...NAV_REPORTS]} label="Reports" />
            <NavMain items={[...NAV_COMMUNICATION]} label="Communication" />
            <NavMain items={[...NAV_SETTINGS]} label="Settings" />
          </>
        ) : activeContext?.key === AUTH_CONTEXT_KEYS.PARENT ? (
          <NavMain items={[...NAV_FAMILY]} label="Family" />
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
