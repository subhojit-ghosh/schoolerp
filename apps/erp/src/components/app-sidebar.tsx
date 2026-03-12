import * as React from "react";
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
import { useAuthStore } from "@/features/auth/model/auth-store";
import { readCachedTenantBranding } from "@/lib/tenant-branding";
import { ERP_ROUTES } from "@/constants/routes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
  { icon: IconCurrencyRupee, title: "Fees", url: ERP_ROUTES.FEES, disabled: true },
] as const;

const NAV_SETTINGS = [
  { icon: IconPalette, title: "Branding", url: ERP_ROUTES.SETTINGS_BRANDING },
] as const;


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = useAuthStore((store) => store.session);
  const branding = readCachedTenantBranding();
  const institutionName =
    branding?.institutionName ?? session?.activeOrganization?.name ?? "School ERP";
  const logoUrl = branding?.logoUrl ?? null;
  const initial = (branding?.shortName ?? institutionName).charAt(0).toUpperCase();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5! h-auto"
            >
              <Link to="/dashboard">
                {logoUrl ? (
                  <img
                    alt={institutionName}
                    className="size-6 shrink-0 rounded object-contain"
                    src={logoUrl}
                  />
                ) : (
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                    style={{ background: "var(--primary, #8a5a44)" }}
                  >
                    {initial}
                  </span>
                )}
                <span className="text-sm font-semibold truncate">{institutionName}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={[...NAV_OVERVIEW]} />
        <NavMain items={[...NAV_PEOPLE]} label="People" />
        <NavMain items={[...NAV_ACADEMICS]} label="Academics" />
        <NavMain items={[...NAV_FINANCE]} label="Finance" />
        <NavMain items={[...NAV_SETTINGS]} label="Settings" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
