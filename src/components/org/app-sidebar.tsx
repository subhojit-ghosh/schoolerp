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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="bg-primary text-primary-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold">
            {institutionName.charAt(0)}
          </div>
          <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
            {institutionName}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groupedItems.map(({ group, label, items }) => (
          <SidebarGroup key={group} className="py-1">
            <SidebarGroupLabel className="text-[0.625rem] uppercase tracking-widest text-sidebar-foreground/50">
              {label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {items.map((item) => {
                  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[item.icon];
                  const isActive = pathname === item.href || (item.href !== ROUTES.ORG.DASHBOARD && pathname.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href as never} />}
                        isActive={isActive}
                        tooltip={item.label}
                        className={isActive ? "border-l-2 border-primary bg-muted/30 rounded-l-none" : ""}
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
              <DropdownMenuTrigger render={<SidebarMenuButton className="h-10" />}>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[0.625rem]">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium leading-none">{userName}</span>
                  <span className="text-muted-foreground text-[0.6875rem]">{userEmail}</span>
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
