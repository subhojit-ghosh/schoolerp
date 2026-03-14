import * as React from "react";
import { AUTH_CONTEXT_KEYS, type AuthContextKey } from "@repo/contracts";
import {
  IconBook2,
  IconBooks,
  IconBuildingEstate,
  IconCalendar,
  IconCalendarStats,
  IconCertificate,
  IconChartBar,
  IconChevronDown,
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
import { Link } from "react-router";
import { Badge } from "@repo/ui/components/ui/badge";
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
  { eyebrow: string; detail: string; Icon: typeof IconSchool }
> = {
  [AUTH_CONTEXT_KEYS.STAFF]: {
    eyebrow: "Operations",
    detail: "Manage records, academics, and administration",
    Icon: IconSchool,
  },
  [AUTH_CONTEXT_KEYS.PARENT]: {
    eyebrow: "Family",
    detail: "Track children, notices, and school touchpoints",
    Icon: IconUserHeart,
  },
  [AUTH_CONTEXT_KEYS.STUDENT]: {
    eyebrow: "Learner",
    detail: "Follow classes, attendance, and outcomes",
    Icon: IconUserStar,
  },
};

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
    disabled: true,
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
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const availableContexts = session?.availableContexts ?? [];
  const showStaffNavigation = isStaffContext(session);
  const selectContextMutation = useSelectContextMutation();
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={HEADER_CLASS}>
                {headerInner}
                <IconChevronDown className="ml-auto size-3.5 shrink-0 text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[300px] rounded-2xl border-border/70 p-2"
              side="bottom"
              sideOffset={8}
            >
              <div className="space-y-2">
                {availableContexts.map((contextOption) => {
                  const meta = CONTEXT_META[contextOption.key];
                  const isActive = activeContext.key === contextOption.key;

                  return (
                    <button
                      key={contextOption.key}
                      className={cn(
                        "group relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "border-transparent text-white shadow-lg"
                          : "border-border/70 bg-card text-foreground hover:border-primary/30 hover:bg-muted/20",
                      )}
                      disabled={selectContextMutation.isPending || isActive}
                      onClick={() =>
                        void selectContextMutation.mutate({
                          body: { contextKey: contextOption.key },
                        })
                      }
                      type="button"
                    >
                      <div
                        className={cn(
                          "absolute inset-0 transition-opacity",
                          isActive
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100",
                        )}
                        style={{
                          background:
                            "linear-gradient(135deg, color-mix(in srgb, var(--primary) 92%, black 8%), color-mix(in srgb, var(--sidebar-primary, var(--primary)) 76%, black 24%))",
                        }}
                      />
                      <div className="relative flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p
                            className={cn(
                              "text-[11px] font-semibold uppercase tracking-[0.22em]",
                              isActive
                                ? "text-white/70"
                                : "text-muted-foreground/80",
                            )}
                          >
                            {meta.eyebrow}
                          </p>
                          <div className="flex items-center gap-2">
                            <meta.Icon
                              className={cn(
                                "size-4",
                                isActive
                                  ? "text-white"
                                  : "text-[var(--primary)]",
                              )}
                            />
                            <p className="text-base font-semibold tracking-tight">
                              {contextOption.label}
                            </p>
                          </div>
                          <p
                            className={cn(
                              "text-xs leading-relaxed",
                              isActive ? "text-white/80" : "text-muted-foreground",
                            )}
                          >
                            {meta.detail}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]",
                            isActive
                              ? "border-white/20 bg-white/12 text-white"
                              : "border-border/70 bg-background/80 text-muted-foreground",
                          )}
                          variant="outline"
                        >
                          {isActive ? "Current" : "Switch"}
                        </Badge>
                      </div>
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
