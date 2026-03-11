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
      className="border-r-0"
      style={{
        background: "linear-gradient(180deg, #123D4A 0%, #082E37 100%)",
      }}
    >
      {/* Brand header */}
      <SidebarHeader className="px-8 pt-7 pb-5">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#6F7350] bg-[#314C50] font-cap text-xl font-medium text-[#F0CC74]">
            E
          </div>
          <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-2xl font-medium text-[#F0CC74]">
              Platform Admin
            </span>
            <span className="font-cap text-xs tracking-[0.15em] text-[#A7B4B5]">
              SYSTEM OVERSIGHT
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Divider */}
      <div className="mx-5 h-px bg-[#20424a]" />

      <SidebarContent>
        <NavGroup label="Core" items={CORE_NAV} pathname={pathname} />
        <NavGroup label="Operations" items={OPS_NAV} pathname={pathname} />
      </SidebarContent>

      {/* Divider */}
      <div className="mx-5 h-px bg-[#20424a]" />

      {/* Profile footer */}
      <SidebarFooter className="px-8 py-5">
        <div className="flex items-center gap-3.5 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1E8C9] text-lg font-medium text-[#17353E]">
            S
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-base font-medium text-[#F0CC74]">
              Super Admin
            </p>
            <p className="text-xs text-[#A7B4B5]">
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
    <SidebarGroup className="px-5 py-2">
      <SidebarGroupLabel className="mb-2 px-3 font-cap text-xs tracking-[0.18em] text-[#f2ede4]/70">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1.5">
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
                    className="h-12 rounded-2xl text-base text-[#f2ede4]/60"
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
                      ? "h-[54px] rounded-2xl border border-[#d7b273] bg-[#16343b] text-base font-medium text-sidebar-foreground"
                      : "h-12 rounded-2xl bg-[#183942] text-base text-[#F0CC74] hover:bg-[#1a4450]"
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
