"use client";

import Link from "next/link";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import * as Icons from "lucide-react";
import type { NavItem } from "@/lib/nav";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { ROUTES, NAV_GROUP_LABELS, NAV_GROUP_ORDER } from "@/constants";

type Props = {
  institutionName: string;
  userName: string;
  userEmail: string;
  navItems: NavItem[];
};

export function AppSidebar({ institutionName, userName, userEmail, navItems }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const groupedItems = NAV_GROUP_ORDER.map((group) => ({
    group,
    label: NAV_GROUP_LABELS[group],
    items: navItems.filter((item) => item.group === group),
  })).filter((g) => g.items.length > 0);

  async function handleSignOut() {
    await authClient.signOut();
    router.push(ROUTES.AUTH.SIGN_IN);
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="bg-primary/15 text-primary-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 text-sm font-bold">
            {institutionName.charAt(0)}
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold">{institutionName}</p>
            <p className="truncate text-[0.6875rem] uppercase tracking-[0.18em] text-sidebar-foreground/55">
              Institution Workspace
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groupedItems.map(({ group, label, items }) => (
          <SidebarGroup key={group} className="py-1">
            <SidebarGroupLabel className="px-2 text-[0.625rem] uppercase tracking-[0.18em] text-sidebar-foreground/45">
              {label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {items.map((item) => {
                  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[item.icon];
                  const isActive = pathname === item.href || (item.href !== ROUTES.ORG.DASHBOARD && pathname.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href as never} />}
                        isActive={isActive}
                        tooltip={item.label}
                        className={
                          isActive
                            ? "rounded-xl border border-sidebar-primary/20 bg-sidebar-primary/15 text-sidebar-primary-foreground"
                            : "rounded-xl text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                        }
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton className="h-12 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/30" />}>
                <Avatar className="h-8 w-8 rounded-xl">
                  <AvatarFallback className="rounded-xl text-[0.6875rem]">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium leading-none">{userName}</span>
                  <span className="text-[0.6875rem] text-sidebar-foreground/55">{userEmail}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
