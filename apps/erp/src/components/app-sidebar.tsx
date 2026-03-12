import * as React from "react";
import { IconBuilding, IconDashboard, IconUsers } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/ui/sidebar";

const NAV_ITEMS = [
  {
    icon: IconDashboard,
    title: "Dashboard",
    url: "/dashboard",
  },
  {
    icon: IconUsers,
    title: "Students",
    url: "/students",
  },
] as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = useAuthStore((store) => store.session);
  const institutionName = session?.activeOrganization?.name ?? "Academic Platform";

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/dashboard">
                <IconBuilding className="size-5!" />
                <span className="text-base font-semibold">{institutionName}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={[...NAV_ITEMS]} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
