import type { Icon } from "@tabler/icons-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@repo/ui/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/ui/sidebar";

export function NavMain({
  items,
  label,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    disabled?: boolean;
  }[];
  label?: string;
}) {
  const location = useLocation();

  return (
    <SidebarGroup>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild={!item.disabled}
                isActive={location.pathname === item.url}
                tooltip={item.title}
                className={cn(
                  "data-[active=true]:bg-primary/10 data-[active=true]:text-primary",
                  item.disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : undefined,
                )}
              >
                {item.disabled ? (
                  <span className="flex items-center gap-2">
                    {item.icon ? <item.icon /> : null}
                    <span>{item.title}</span>
                  </span>
                ) : (
                  <NavLink to={item.url}>
                    {item.icon ? <item.icon /> : null}
                    <span>{item.title}</span>
                  </NavLink>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
