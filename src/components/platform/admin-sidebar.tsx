"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, ShieldCheck } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROUTES } from "@/constants";

const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
  { label: "Institutions", href: ROUTES.ADMIN.INSTITUTIONS, icon: Building2 },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-r-0">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="bg-sidebar-primary/15 text-sidebar-primary-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sidebar-primary/20">
            <ShieldCheck className="size-4" />
          </div>
          <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-base font-semibold">Platform Admin</span>
            <span className="truncate text-[0.6875rem] uppercase tracking-[0.18em] text-sidebar-foreground/55">
              System Oversight
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="px-2 text-[0.625rem] uppercase tracking-[0.18em] text-sidebar-foreground/45">
            Core
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={isActive}
                      tooltip={label}
                      className={
                        isActive
                          ? "rounded-xl border border-sidebar-primary/20 bg-sidebar-primary/15 text-sidebar-primary-foreground"
                          : "rounded-xl text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                      }
                    >
                      <Icon className="size-4" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/30 px-2.5 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <Avatar className="size-9 rounded-xl">
            <AvatarFallback className="rounded-xl text-xs font-semibold">
              S
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">Super Admin</p>
            <p className="truncate text-[0.6875rem] text-sidebar-foreground/55">
              Platform owner
            </p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
