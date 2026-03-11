"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Shield, ScrollText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ROUTES } from "@/constants";

const CORE_NAV = [
  { label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
];

const OPS_NAV = [
  { label: "Institutions", href: ROUTES.ADMIN.INSTITUTIONS, icon: Building2 },
  { label: "Governance", href: null, icon: Shield },
  { label: "Audit trail", href: null, icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      panelStyle={{
        background: "linear-gradient(180deg, #123D4A 0%, #082E37 100%)",
      }}
    >
      <SidebarHeader className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#6F7350] bg-[#314C50] font-cap text-lg font-medium text-[#F0CC74]">
            E
          </div>
          <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-[1.7rem] font-medium text-[#F0CC74]">
              Platform Admin
            </span>
            <span className="font-cap text-[0.6875rem] tracking-[0.18em] text-[#A7B4B5]">
              SYSTEM OVERSIGHT
            </span>
          </div>
        </div>
      </SidebarHeader>

      <div className="mx-4 h-px bg-[#20424a]" />

      <SidebarContent>
        <NavGroup label="Core" items={CORE_NAV} pathname={pathname} />
        <NavGroup label="Operations" items={OPS_NAV} pathname={pathname} />
      </SidebarContent>

      <div className="mx-4 h-px bg-[#20424a]" />

      <SidebarFooter className="px-4 py-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1E8C9] text-lg font-medium text-[#17353E]">
            S
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium text-[#F0CC74]">
              Super Admin
            </p>
            <p className="text-[0.6875rem] text-[#A7B4B5]">
              super@admin.com
            </p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { label: string; href: string | null; icon: React.ComponentType<{ className?: string }> }[];
  pathname: string;
}) {
  return (
    <SidebarGroup className="px-4 py-2">
      <SidebarGroupLabel className="mb-2 px-2 font-cap text-[0.6875rem] tracking-[0.18em] text-[#f2ede4]/58">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map(({ label: itemLabel, href, icon: Icon }) => {
            const isActive = href !== null && pathname.startsWith(href);
            const isDisabled = href === null;

            if (isDisabled) {
              return (
                <SidebarMenuItem key={itemLabel}>
                  <SidebarMenuButton
                    size="lg"
                    disabled
                    tooltip={itemLabel}
                    className="h-10 rounded-2xl px-3 text-[0.925rem] text-[#f2ede4]/48"
                  >
                    <Icon className="size-4" />
                    <span>{itemLabel}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={href + itemLabel}>
                <SidebarMenuButton
                  render={<Link href={href as never} />}
                  isActive={isActive}
                  tooltip={itemLabel}
                  size="lg"
                  className={
                    isActive
                      ? "h-11 rounded-2xl border border-[#d7b273] bg-[#16343b] px-3 text-[0.925rem] font-medium text-sidebar-foreground"
                      : "h-10 rounded-2xl px-3 text-[0.925rem] text-[#f2ede4]/72 hover:bg-[#1a4450] hover:text-[#F0CC74]"
                  }
                >
                  {isActive && (
                    <span className="mr-1 size-2.5 shrink-0 rounded-full bg-[#F0CC74]" />
                  )}
                  <Icon className="size-4" />
                  <span>{itemLabel}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
