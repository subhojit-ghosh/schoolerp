import * as React from "react";
import { AUTH_CONTEXT_KEYS } from "@repo/contracts";
import {
  IconBook2,
  IconCalendarStats,
  IconCertificate,
  IconCurrencyRupee,
  IconDashboard,
  IconPalette,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { getActiveContext, isStaffContext } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { readCachedTenantBranding } from "@/lib/tenant-branding";
import { ERP_ROUTES } from "@/constants/routes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@repo/ui/components/ui/sidebar";

const NAV_OVERVIEW = [
  { icon: IconDashboard, title: "Dashboard", url: ERP_ROUTES.DASHBOARD },
] as const;

const NAV_PEOPLE = [
  { icon: IconUsers,      title: "Students",   url: ERP_ROUTES.STUDENTS },
  { icon: IconUsersGroup, title: "Staff",       url: ERP_ROUTES.STAFF,    disabled: true },
] as const;

const NAV_ACADEMICS = [
  { icon: IconBook2,         title: "Academic Years", url: ERP_ROUTES.ACADEMIC_YEARS },
  { icon: IconBook2,         title: "Classes",    url: ERP_ROUTES.CLASSES,    disabled: true },
  { icon: IconCalendarStats, title: "Attendance", url: ERP_ROUTES.ATTENDANCE, disabled: true },
  { icon: IconCertificate,   title: "Exams",      url: ERP_ROUTES.EXAMS,      disabled: true },
] as const;

const NAV_FINANCE = [
  { icon: IconCurrencyRupee, title: "Fees", url: ERP_ROUTES.FEES },
] as const;

const NAV_SETTINGS = [
  { icon: IconPalette, title: "Branding", url: ERP_ROUTES.SETTINGS_BRANDING },
] as const;

const NAV_FAMILY = [
  {
    icon: IconUsers,
    title: "Children",
    url: ERP_ROUTES.DASHBOARD,
  },
] as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const showStaffNavigation = isStaffContext(session);
  const branding = readCachedTenantBranding();
  const institutionName =
    branding?.institutionName ?? session?.activeOrganization?.name ?? "School ERP";
  const logoUrl = branding?.logoUrl ?? null;
  const initial = (branding?.shortName ?? institutionName).charAt(0).toUpperCase();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="overflow-hidden">
        <Link
          to="/dashboard"
          className="flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/8 bg-white/4 px-3 py-3 transition-[width,height,padding] hover:bg-white/8 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2"
        >
          {logoUrl ? (
            <img
              alt={institutionName}
              className="size-6 shrink-0 rounded object-contain"
              src={logoUrl}
            />
          ) : (
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
              style={{ background: "var(--primary, #8a5a44)" }}
            >
              {initial}
            </span>
          )}
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold tracking-tight">
              {institutionName}
            </p>
            <p className="truncate text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/55">
              {activeContext?.label ?? "Workspace"}
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={[...NAV_OVERVIEW]} />
        {showStaffNavigation ? (
          <>
            <NavMain items={[...NAV_PEOPLE]} label="People" />
            <NavMain items={[...NAV_ACADEMICS]} label="Academics" />
            <NavMain items={[...NAV_FINANCE]} label="Finance" />
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
